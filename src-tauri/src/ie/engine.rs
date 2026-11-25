//! Lignes de commande `mariadb-dump` / `mariadb` et exécution (repris de YuriExport).
//!
//! Le mot de passe ne figure jamais sur la ligne de commande : il est écrit dans un fichier
//! d'options temporaire (`--defaults-extra-file`, premier argument obligatoire) supprimé à la fin.

use super::model::{ConnInfo, Connector, DbInfo, ExportSettings, ImportRequest};
use chrono::{DateTime, Local};
use flate2::{read::MultiGzDecoder, write::GzEncoder, Compression};
use serde::Serialize;
use std::collections::HashMap;
use std::fmt::Write as _;
use std::fs::{self, File};
use std::io::{BufReader, BufWriter, Read, Write};
use std::path::{Path, PathBuf};
use std::process::{Child, Command, Stdio};
use std::sync::atomic::{AtomicBool, AtomicU64, Ordering};
use std::sync::{Arc, Mutex};
use std::time::{Duration, Instant};

/// Bases système exclues quand on éclate « toutes les bases » en un fichier par base.
const SYSTEM_SCHEMAS: [&str; 3] = ["information_schema", "performance_schema", "sys"];

// ---------------------------------------------------------------------------
// Utilitaires

/// `Command` sans fenêtre console sous Windows.
fn command(program: &str) -> Command {
    #[allow(unused_mut)]
    let mut cmd = Command::new(program);
    #[cfg(windows)]
    {
        use std::os::windows::process::CommandExt;
        const CREATE_NO_WINDOW: u32 = 0x0800_0000;
        cmd.creation_flags(CREATE_NO_WINDOW);
    }
    cmd
}

/// Découpe des arguments libres en respectant les guillemets simples et doubles.
pub fn split_args(s: &str) -> Result<Vec<String>, String> {
    let mut out = Vec::new();
    let mut cur = String::new();
    let mut quote: Option<char> = None;
    let mut has_token = false;
    for ch in s.chars() {
        match quote {
            Some(q) if ch == q => quote = None,
            Some(_) => cur.push(ch),
            None if ch == '"' || ch == '\'' => {
                quote = Some(ch);
                has_token = true;
            }
            None if ch.is_whitespace() => {
                if has_token {
                    out.push(std::mem::take(&mut cur));
                    has_token = false;
                }
            }
            None => {
                cur.push(ch);
                has_token = true;
            }
        }
    }
    if quote.is_some() {
        return Err("Guillemet non fermé dans les arguments supplémentaires".into());
    }
    if has_token {
        out.push(cur);
    }
    Ok(out)
}

/// Remplace les caractères interdits dans un nom de fichier Windows.
fn sanitize(s: &str) -> String {
    s.chars()
        .map(|c| if c.is_control() || r#"<>:"/\|?*"#.contains(c) { '_' } else { c })
        .collect()
}

/// Rend un modèle : `{app}`, `{env}`, `{connector}`, `{db}`, `{host}`, `{date}`, `{date:%Y%m%d}`.
pub fn render_pattern(pattern: &str, vars: &HashMap<&str, String>, now: &DateTime<Local>) -> Result<String, String> {
    let mut out = String::new();
    let mut rest = pattern;
    while let Some(start) = rest.find('{') {
        out.push_str(&rest[..start]);
        let after = &rest[start + 1..];
        let end = after.find('}').ok_or_else(|| format!("Accolade non fermée dans « {pattern} »"))?;
        let token = &after[..end];
        let (name, arg) = match token.split_once(':') {
            Some((n, a)) => (n, Some(a)),
            None => (token, None),
        };
        match name {
            "date" => {
                let fmt = arg.unwrap_or("%Y%m%d_%H%M%S");
                let mut s = String::new();
                write!(s, "{}", now.format(fmt)).map_err(|_| format!("Format de date invalide : « {fmt} »"))?;
                out.push_str(&sanitize(&s));
            }
            _ => match vars.get(name) {
                Some(v) => out.push_str(&sanitize(v)),
                None => return Err(format!("Variable inconnue : {{{name}}}")),
            },
        }
        rest = &after[end + 1..];
    }
    out.push_str(rest);
    Ok(out)
}

/// Client `mariadb.exe` : celui des paramètres, sinon le voisin de `mariadb-dump.exe`.
pub fn client_path(settings: &ExportSettings) -> Option<PathBuf> {
    if !settings.client_path.trim().is_empty() {
        let p = PathBuf::from(settings.client_path.trim());
        return p.is_file().then_some(p);
    }
    let dir = Path::new(settings.dump_path.trim()).parent()?;
    ["mariadb.exe", "mysql.exe", "mariadb", "mysql"].iter().map(|n| dir.join(n)).find(|p| p.is_file())
}

fn require_client(settings: &ExportSettings) -> Result<PathBuf, String> {
    client_path(settings).ok_or_else(|| {
        "Client mariadb.exe introuvable (à placer à côté de mariadb-dump ou à renseigner dans Paramètres › Import / Export)".into()
    })
}

/// Fichier d'options temporaire contenant le mot de passe ; supprimé au `drop`.
pub struct DefaultsFile(PathBuf);

impl DefaultsFile {
    pub fn create(password: &str) -> Result<Self, String> {
        let name = format!(
            "yuri2-ie-{}-{}.cnf",
            std::process::id(),
            Local::now().timestamp_nanos_opt().unwrap_or_default()
        );
        let path = std::env::temp_dir().join(name);
        let escaped = password.replace('\\', "\\\\").replace('"', "\\\"");
        fs::write(&path, format!("[client]\npassword=\"{escaped}\"\n"))
            .map_err(|e| format!("Fichier d'options temporaire : {e}"))?;
        Ok(Self(path))
    }

    pub fn arg(&self) -> String {
        format!("--defaults-extra-file={}", self.0.display())
    }
}

impl Drop for DefaultsFile {
    fn drop(&mut self) {
        let _ = fs::remove_file(&self.0);
    }
}

fn defaults_for(password: Option<&str>) -> Result<Option<DefaultsFile>, String> {
    password.filter(|p| !p.is_empty()).map(DefaultsFile::create).transpose()
}

/// Arguments de connexion communs (hors fichier d'options), SSL compris.
fn connection_args(conn: &ConnInfo) -> Vec<String> {
    let mut args = vec![format!("--host={}", conn.host.trim()), format!("--port={}", conn.port)];
    if !conn.user.trim().is_empty() {
        args.push(format!("--user={}", conn.user.trim()));
    }
    match conn.ssl_mode.as_str() {
        // Clients MariaDB récents : SSL exigé par défaut, refusé par les serveurs sans TLS.
        "disabled" => args.push("--skip-ssl".into()),
        "required" => args.push("--ssl".into()),
        "verify" => {
            args.push("--ssl".into());
            args.push("--ssl-verify-server-cert".into());
        }
        _ => {}
    }
    args
}

/// Message d'erreur du client, complété d'une piste quand c'est un problème connu.
pub fn explain_error(stderr: &str) -> String {
    let msg = stderr.trim().to_string();
    if msg.contains("TLS/SSL") || msg.contains("SSL is required") {
        format!("{msg}\n→ Le serveur n'accepte pas SSL : réglez « SSL » sur « Désactivé » (serveur ou connecteur).")
    } else if msg.contains("Access denied") {
        format!("{msg}\n→ Vérifiez l'utilisateur et le mot de passe.")
    } else if msg.contains("Can't connect") || msg.contains("Unknown server host") {
        format!("{msg}\n→ Vérifiez l'hôte, le port et l'accès réseau au serveur.")
    } else {
        msg
    }
}

/// Lance le client `mariadb` avec une requête et renvoie les lignes de résultat.
fn client_query(settings: &ExportSettings, conn: &ConnInfo, password: Option<&str>, sql: &str) -> Result<Vec<String>, String> {
    let client = require_client(settings)?;
    let defaults = defaults_for(password)?;
    let mut cmd = command(&client.to_string_lossy());
    if let Some(d) = &defaults {
        cmd.arg(d.arg());
    }
    let out = cmd
        .args(connection_args(conn))
        .args(["--batch", "--skip-column-names", "--connect-timeout=10", "-e", sql])
        .stdin(Stdio::null())
        .output()
        .map_err(|e| format!("Lancement de {} : {e}", client.display()))?;
    if !out.status.success() {
        return Err(explain_error(&String::from_utf8_lossy(&out.stderr)));
    }
    Ok(String::from_utf8_lossy(&out.stdout)
        .lines()
        .map(|l| l.trim().to_string())
        .filter(|l| !l.is_empty())
        .collect())
}

/// Liste des bases visibles par l'utilisateur.
pub fn list_databases(settings: &ExportSettings, conn: &ConnInfo, password: Option<&str>) -> Result<Vec<String>, String> {
    client_query(settings, conn, password, "SHOW DATABASES")
}

/// Bases avec nombre de tables, lignes estimées et taille (information_schema).
pub fn list_databases_detailed(settings: &ExportSettings, conn: &ConnInfo, password: Option<&str>) -> Result<Vec<DbInfo>, String> {
    let sql = "SELECT s.SCHEMA_NAME, COUNT(t.TABLE_NAME), COALESCE(SUM(t.TABLE_ROWS), 0),
                COALESCE(SUM(t.DATA_LENGTH + t.INDEX_LENGTH), 0)
               FROM information_schema.SCHEMATA s
               LEFT JOIN information_schema.TABLES t
                 ON t.TABLE_SCHEMA = s.SCHEMA_NAME AND t.TABLE_TYPE = 'BASE TABLE'
               GROUP BY s.SCHEMA_NAME ORDER BY s.SCHEMA_NAME";
    let num = |s: Option<&str>| s.and_then(|v| v.trim().parse::<f64>().ok()).unwrap_or(0.0) as i64;
    Ok(client_query(settings, conn, password, sql)?
        .into_iter()
        .map(|line| {
            let mut cols = line.split('\t');
            DbInfo {
                name: cols.next().unwrap_or_default().to_string(),
                tables: num(cols.next()),
                rows: num(cols.next()),
                size: num(cols.next()),
            }
        })
        .collect())
}

/// Version renvoyée par `<exe> --version`.
pub fn binary_version(path: &str) -> Result<String, String> {
    let p = Path::new(path.trim());
    if !p.is_file() {
        return Err(format!("Fichier introuvable : {}", p.display()));
    }
    let out = command(&p.to_string_lossy())
        .arg("--version")
        .stdin(Stdio::null())
        .output()
        .map_err(|e| e.to_string())?;
    let text = String::from_utf8_lossy(&out.stdout).trim().to_string();
    if !out.status.success() || text.is_empty() {
        return Err(String::from_utf8_lossy(&out.stderr).trim().to_string());
    }
    Ok(text)
}

/// Teste la connexion : via le client s'il existe, sinon via un dump vide.
pub fn test_connection(settings: &ExportSettings, conn: &ConnInfo, password: Option<&str>) -> Result<String, String> {
    if client_path(settings).is_some() {
        let v = client_query(settings, conn, password, "SELECT VERSION()")?;
        let dbs = list_databases(settings, conn, password)?;
        return Ok(format!(
            "Connexion réussie — serveur {} — {} base(s) visible(s)",
            v.first().cloned().unwrap_or_default(),
            dbs.len()
        ));
    }
    if settings.dump_path.trim().is_empty() {
        return Err("Ni mariadb.exe ni mariadb-dump.exe configurés (Paramètres › Import / Export)".into());
    }
    let defaults = defaults_for(password)?;
    let mut cmd = command(settings.dump_path.trim());
    if let Some(d) = &defaults {
        cmd.arg(d.arg());
    }
    let out = cmd
        .args(connection_args(conn))
        .args(["--no-data", "--no-create-info", "--skip-triggers", "--skip-comments", "--databases", "information_schema"])
        .stdin(Stdio::null())
        .output()
        .map_err(|e| e.to_string())?;
    if out.status.success() {
        Ok("Connexion réussie".into())
    } else {
        Err(explain_error(&String::from_utf8_lossy(&out.stderr)))
    }
}

// ---------------------------------------------------------------------------
// Planification de l'export

/// Un appel à `mariadb-dump` produisant un fichier.
#[derive(Debug, Clone)]
pub struct Job {
    /// Libellé de la cible (base, liste de bases ou « all »).
    pub label: String,
    /// Arguments hors fichier d'options.
    pub args: Vec<String>,
    /// Fichier final.
    pub output: PathBuf,
}

fn option_args(c: &Connector) -> Vec<String> {
    let o = &c.options;
    let mut a: Vec<String> = Vec::new();
    let mut flag = |on: bool, yes: &str, no: Option<&str>| {
        if on {
            a.push(yes.into());
        } else if let Some(n) = no {
            a.push(n.into());
        }
    };
    flag(o.single_transaction, "--single-transaction", None);
    flag(o.quick, "--quick", Some("--skip-quick"));
    flag(o.lock_tables, "--lock-tables", Some("--skip-lock-tables"));
    flag(o.routines, "--routines", None);
    flag(o.triggers, "--triggers", Some("--skip-triggers"));
    flag(o.events, "--events", None);
    flag(o.no_data, "--no-data", None);
    flag(o.no_create_info, "--no-create-info", None);
    flag(o.add_drop_table, "--add-drop-table", Some("--skip-add-drop-table"));
    flag(o.add_drop_database, "--add-drop-database", None);
    flag(o.complete_insert, "--complete-insert", None);
    flag(o.extended_insert, "--extended-insert", Some("--skip-extended-insert"));
    flag(o.hex_blob, "--hex-blob", None);
    flag(o.skip_comments, "--skip-comments", None);
    if !o.default_character_set.trim().is_empty() {
        a.push(format!("--default-character-set={}", o.default_character_set.trim()));
    }
    a
}

fn ignore_args(c: &Connector, dbs: &[String]) -> Vec<String> {
    let mut a = Vec::new();
    for t in c.tables_exclude.iter().map(|t| t.trim()).filter(|t| !t.is_empty()) {
        if t.contains('.') {
            a.push(format!("--ignore-table={t}"));
        } else {
            for db in dbs {
                a.push(format!("--ignore-table={db}.{t}"));
            }
        }
    }
    a
}

/// Ajoute un suffixe `_1`, `_2`… avant l'extension (`.sql` / `.sql.gz`).
fn with_suffix(path: &Path, n: u32) -> PathBuf {
    let name = path.file_name().map(|s| s.to_string_lossy().to_string()).unwrap_or_default();
    let (stem, ext) = match name.find(".sql") {
        Some(i) => (&name[..i], &name[i..]),
        None => (name.as_str(), ""),
    };
    path.with_file_name(format!("{stem}_{n}{ext}"))
}

/// Calcule la liste des fichiers à produire et leurs arguments.
///
/// `all_dbs` : liste des bases du serveur, requise seulement pour « toutes les bases » éclaté.
pub fn plan(
    settings: &ExportSettings,
    c: &Connector,
    conn: &ConnInfo,
    app: &str,
    env: &str,
    now: &DateTime<Local>,
    all_dbs: Option<Vec<String>>,
) -> Result<Vec<Job>, String> {
    let dir_pattern = if c.output_dir.trim().is_empty() { settings.default_output_dir.trim() } else { c.output_dir.trim() };
    if dir_pattern.is_empty() {
        return Err("Aucun répertoire de sortie (connecteur ou paramètres)".into());
    }
    if c.file_pattern.trim().is_empty() {
        return Err("Le modèle de nom de fichier est vide".into());
    }

    let mut base_args = connection_args(conn);
    base_args.extend(option_args(c));
    base_args.extend(split_args(&c.extra_args)?);

    let dbs: Vec<String> = c.databases.iter().map(|d| d.trim().to_string()).filter(|d| !d.is_empty()).collect();
    let tables: Vec<String> = c.tables_include.iter().map(|t| t.trim().to_string()).filter(|t| !t.is_empty()).collect();

    // (libellé, bases concernées, arguments de cible)
    let mut targets: Vec<(String, Vec<String>, Vec<String>)> = Vec::new();
    if c.all_databases {
        if c.split_per_database {
            let list = all_dbs.ok_or("Liste des bases du serveur indisponible")?;
            for db in list.into_iter().filter(|d| !SYSTEM_SCHEMAS.contains(&d.as_str())) {
                targets.push((db.clone(), vec![db.clone()], vec!["--databases".into(), db]));
            }
            if targets.is_empty() {
                return Err("Aucune base trouvée sur le serveur".into());
            }
        } else {
            targets.push(("all".into(), vec![], vec!["--all-databases".into()]));
        }
    } else {
        if dbs.is_empty() {
            return Err("Aucune base sélectionnée".into());
        }
        if !tables.is_empty() && dbs.len() != 1 {
            return Err("La liste de tables à inclure n'est possible qu'avec une seule base".into());
        }
        if dbs.len() == 1 || c.split_per_database {
            for db in &dbs {
                let mut t = Vec::new();
                if !tables.is_empty() {
                    t.push(db.clone());
                    t.extend(tables.iter().cloned());
                } else if c.options.create_database {
                    t.push("--databases".into());
                    t.push(db.clone());
                } else {
                    t.push(db.clone());
                }
                targets.push((db.clone(), vec![db.clone()], t));
            }
        } else {
            let mut t = vec!["--databases".to_string()];
            t.extend(dbs.iter().cloned());
            targets.push((dbs.join("-"), dbs.clone(), t));
        }
    }

    let mut jobs = Vec::new();
    for (label, db_list, target_args) in targets {
        let vars: HashMap<&str, String> = HashMap::from([
            ("app", app.to_string()),
            ("env", env.to_string()),
            ("connector", c.name.clone()),
            ("db", label.clone()),
            ("host", conn.host.trim().to_string()),
        ]);
        let dir = PathBuf::from(render_pattern(dir_pattern, &vars, now)?);
        let mut name = render_pattern(c.file_pattern.trim(), &vars, now)?.replace(['/', '\\'], "_");
        if !name.to_lowercase().ends_with(".sql") {
            name.push_str(".sql");
        }
        if c.compress == "gzip" {
            name.push_str(".gz");
        }
        let mut args = base_args.clone();
        args.extend(ignore_args(c, &db_list));
        args.extend(target_args);
        jobs.push(Job { label, args, output: dir.join(name) });
    }

    // Deux cibles ne doivent pas écrire dans le même fichier.
    let mut seen = std::collections::HashSet::new();
    for j in &jobs {
        if !seen.insert(j.output.clone()) {
            return Err(format!(
                "Plusieurs bases produisent le même fichier ({}) : ajoutez {{db}} au modèle",
                j.output.display()
            ));
        }
    }
    Ok(jobs)
}

/// Rend une commande lisible (aperçu, historique).
pub fn command_line(exe: &str, has_password: bool, args: &[String]) -> String {
    let quote = |s: &str| if s.is_empty() || s.contains(char::is_whitespace) { format!("\"{s}\"") } else { s.to_string() };
    let mut parts = vec![quote(exe.trim())];
    if has_password {
        parts.push("--defaults-extra-file=<mot de passe>".into());
    }
    parts.extend(args.iter().map(|a| quote(a)));
    parts.join(" ")
}

// ---------------------------------------------------------------------------
// Exécution

/// Exécution en cours, annulable.
#[derive(Default)]
pub struct RunHandle {
    cancelled: AtomicBool,
    child: Mutex<Option<Child>>,
}

impl RunHandle {
    pub fn cancel(&self) {
        self.cancelled.store(true, Ordering::SeqCst);
        if let Ok(mut c) = self.child.lock() {
            if let Some(child) = c.as_mut() {
                let _ = child.kill();
            }
        }
    }

    fn is_cancelled(&self) -> bool {
        self.cancelled.load(Ordering::SeqCst)
    }

    /// Enregistre le processus ; le tue aussitôt si l'annulation est déjà demandée.
    fn attach(&self, child: Child) {
        *self.child.lock().unwrap() = Some(child);
        if self.is_cancelled() {
            self.cancel();
        }
    }
}

/// Avancement d'une exécution, émis environ quatre fois par seconde.
#[derive(Debug, Clone, Serialize, Default)]
#[serde(rename_all = "camelCase")]
pub struct Progress {
    pub run_id: i64,
    pub group_id: String,
    pub connector_id: String,
    pub kind: String,
    pub job_index: usize,
    pub job_count: usize,
    pub label: String,
    /// Export : octets SQL produits pour le fichier en cours. Import : octets lus du fichier.
    pub bytes: u64,
    /// Export : octets cumulés. Import : taille du fichier source.
    pub total_bytes: u64,
    pub elapsed_ms: u64,
}

pub struct Outcome {
    pub status: &'static str,
    pub exit_code: Option<i32>,
    pub files: Vec<String>,
    pub size: i64,
    pub message: String,
    pub stats: DumpStats,
}

impl Outcome {
    fn fail(status: &'static str, code: Option<i32>, message: String, files: Vec<String>, size: i64) -> Self {
        Self { status, exit_code: code, files, size, message, stats: DumpStats::default() }
    }
}

/// Contenu détecté dans la sortie SQL (diagnostic « structure sans données »).
#[derive(Debug, Default, Clone, Copy)]
pub struct DumpStats {
    pub tables: u64,
    pub inserts: u64,
}

/// Compte `CREATE TABLE` et `INSERT INTO` dans un flux découpé en morceaux.
#[derive(Default)]
struct StatsCounter {
    stats: DumpStats,
    tail: Vec<u8>,
}

impl StatsCounter {
    const KEEP: usize = 16;

    fn feed(&mut self, chunk: &[u8]) {
        let mut data = std::mem::take(&mut self.tail);
        let carried = data.len();
        data.extend_from_slice(chunk);
        let count = |needle: &[u8]| {
            data.windows(needle.len())
                .enumerate()
                .filter(|(i, w)| *w == needle && i + needle.len() > carried)
                .count() as u64
        };
        self.stats.tables += count(b"CREATE TABLE");
        self.stats.inserts += count(b"INSERT INTO");
        let keep = data.len().min(Self::KEEP);
        self.tail = data[data.len() - keep..].to_vec();
    }
}

enum Sink {
    Plain(BufWriter<File>),
    Gzip(GzEncoder<BufWriter<File>>),
}

impl Sink {
    fn write_all(&mut self, buf: &[u8]) -> std::io::Result<()> {
        match self {
            Sink::Plain(w) => w.write_all(buf),
            Sink::Gzip(w) => w.write_all(buf),
        }
    }

    fn finish(self) -> std::io::Result<()> {
        match self {
            Sink::Plain(mut w) => w.flush(),
            Sink::Gzip(w) => w.finish()?.flush(),
        }
    }
}

/// Résout le chemin final selon la politique « fichier existant ».
fn resolve_output(path: &Path, on_exists: &str) -> Result<PathBuf, String> {
    if !path.exists() {
        return Ok(path.to_path_buf());
    }
    match on_exists {
        "overwrite" => Ok(path.to_path_buf()),
        "fail" => Err(format!("Le fichier existe déjà : {}", path.display())),
        _ => (1..10_000)
            .map(|n| with_suffix(path, n))
            .find(|p| !p.exists())
            .ok_or_else(|| "Impossible de trouver un nom de fichier libre".into()),
    }
}

/// Exécute les jobs d'export l'un après l'autre. Bloquant : à appeler depuis un thread dédié.
pub fn execute(
    dump_path: &str,
    password: Option<&str>,
    jobs: &[Job],
    on_exists: &str,
    gzip: bool,
    handle: &RunHandle,
    base: Progress,
    mut on_progress: impl FnMut(Progress),
) -> Outcome {
    let start = Instant::now();
    let mut files = Vec::new();
    let mut size: i64 = 0;
    let mut total_bytes: u64 = 0;
    let mut warnings = Vec::new();
    let mut counter = StatsCounter::default();

    let defaults = match defaults_for(password) {
        Ok(d) => d,
        Err(e) => return Outcome::fail("error", None, e, files, size),
    };

    for (index, job) in jobs.iter().enumerate() {
        if handle.is_cancelled() {
            return Outcome::fail("cancelled", None, "Annulé".into(), files, size);
        }
        let final_path = match resolve_output(&job.output, on_exists) {
            Ok(p) => p,
            Err(e) => return Outcome::fail("error", None, e, files, size),
        };
        if let Some(dir) = final_path.parent() {
            if let Err(e) = fs::create_dir_all(dir) {
                return Outcome::fail("error", None, format!("Création de {} : {e}", dir.display()), files, size);
            }
        }
        let part = PathBuf::from(format!("{}.part", final_path.display()));
        let file = match File::create(&part) {
            Ok(f) => BufWriter::with_capacity(1 << 20, f),
            Err(e) => return Outcome::fail("error", None, format!("Création de {} : {e}", part.display()), files, size),
        };
        let mut sink = if gzip { Sink::Gzip(GzEncoder::new(file, Compression::default())) } else { Sink::Plain(file) };

        let mut cmd = command(dump_path.trim());
        if let Some(d) = &defaults {
            cmd.arg(d.arg());
        }
        cmd.args(&job.args).stdin(Stdio::null()).stdout(Stdio::piped()).stderr(Stdio::piped());
        let mut child = match cmd.spawn() {
            Ok(c) => c,
            Err(e) => {
                let _ = fs::remove_file(&part);
                return Outcome::fail("error", None, format!("Lancement de mariadb-dump : {e}"), files, size);
            }
        };
        let mut stdout = child.stdout.take().expect("stdout piped");
        let stderr_thread = collect_stderr(&mut child);
        handle.attach(child);

        let mut bytes: u64 = 0;
        let mut buf = vec![0u8; 256 * 1024];
        let mut last_emit = Instant::now() - Duration::from_secs(1);
        let mut io_error: Option<String> = None;
        let progress = |bytes: u64, total_bytes: u64| Progress {
            job_index: index,
            job_count: jobs.len(),
            label: job.label.clone(),
            bytes,
            total_bytes,
            elapsed_ms: start.elapsed().as_millis() as u64,
            ..base.clone()
        };
        loop {
            match stdout.read(&mut buf) {
                Ok(0) => break,
                Ok(n) => {
                    counter.feed(&buf[..n]);
                    if let Err(e) = sink.write_all(&buf[..n]) {
                        io_error = Some(format!("Écriture de {} : {e}", part.display()));
                        handle.cancel();
                        break;
                    }
                    bytes += n as u64;
                    total_bytes += n as u64;
                    if last_emit.elapsed() >= Duration::from_millis(250) {
                        last_emit = Instant::now();
                        on_progress(progress(bytes, total_bytes));
                    }
                }
                Err(e) if e.kind() == std::io::ErrorKind::Interrupted => continue,
                Err(e) => {
                    io_error = Some(format!("Lecture de la sortie : {e}"));
                    break;
                }
            }
        }

        let (code, ok) = wait_child(handle);
        let stderr_text = stderr_thread.join().unwrap_or_default();

        if handle.is_cancelled() || io_error.is_some() || !ok {
            drop(sink);
            let _ = fs::remove_file(&part);
            if let Some(e) = io_error {
                return Outcome::fail("error", code, e, files, size);
            }
            if handle.is_cancelled() {
                return Outcome::fail("cancelled", code, "Annulé".into(), files, size);
            }
            let msg = if stderr_text.is_empty() {
                format!("mariadb-dump a échoué (code {})", code.map_or("?".into(), |c| c.to_string()))
            } else {
                explain_error(&stderr_text)
            };
            return Outcome::fail("error", code, format!("[{}] {msg}", job.label), files, size);
        }

        if let Err(e) = sink.finish() {
            let _ = fs::remove_file(&part);
            return Outcome::fail("error", code, format!("Finalisation de {} : {e}", part.display()), files, size);
        }
        if final_path.exists() {
            let _ = fs::remove_file(&final_path);
        }
        if let Err(e) = fs::rename(&part, &final_path) {
            return Outcome::fail("error", code, format!("Renommage en {} : {e}", final_path.display()), files, size);
        }
        size += fs::metadata(&final_path).map(|m| m.len() as i64).unwrap_or(0);
        files.push(final_path.display().to_string());
        if !stderr_text.is_empty() {
            warnings.push(format!("[{}] {stderr_text}", job.label));
        }
        on_progress(progress(bytes, total_bytes));
    }

    Outcome { status: "success", exit_code: Some(0), files, size, message: warnings.join("\n"), stats: counter.stats }
}

/// Lit stderr dans un thread (évite le blocage si le tampon se remplit).
fn collect_stderr(child: &mut Child) -> std::thread::JoinHandle<String> {
    let mut stderr = child.stderr.take().expect("stderr piped");
    std::thread::spawn(move || {
        let mut buf = Vec::new();
        let _ = stderr.read_to_end(&mut buf);
        String::from_utf8_lossy(&buf).trim().to_string()
    })
}

/// Attend la fin du processus enregistré : (code retour, succès).
fn wait_child(handle: &RunHandle) -> (Option<i32>, bool) {
    let child = handle.child.lock().unwrap().take();
    let status = child.map(|mut c| c.wait());
    let code = status.as_ref().and_then(|s| s.as_ref().ok()).and_then(|s| s.code());
    (code, matches!(&status, Some(Ok(s)) if s.success()))
}

// ---------------------------------------------------------------------------
// Import (restauration d'un dump)

/// Le fichier commence-t-il par l'en-tête gzip ?
fn is_gzip(path: &Path) -> std::io::Result<bool> {
    let mut magic = [0u8; 2];
    let n = File::open(path)?.read(&mut magic)?;
    Ok(n == 2 && magic == [0x1f, 0x8b])
}

/// Lecteur qui compte les octets lus (progression sur le fichier compressé).
struct Counting<R> {
    inner: R,
    count: Arc<AtomicU64>,
}

impl<R: Read> Read for Counting<R> {
    fn read(&mut self, buf: &mut [u8]) -> std::io::Result<usize> {
        let n = self.inner.read(buf)?;
        self.count.fetch_add(n as u64, Ordering::Relaxed);
        Ok(n)
    }
}

/// Nom de base sûr pour `CREATE DATABASE` (backticks doublés).
fn quote_ident(name: &str) -> String {
    format!("`{}`", name.replace('`', "``"))
}

/// Arguments du client `mariadb` pour un import (hors fichier d'options).
pub fn import_args(conn: &ConnInfo, req: &ImportRequest) -> Result<Vec<String>, String> {
    let mut args = connection_args(conn);
    if !req.default_character_set.trim().is_empty() {
        args.push(format!("--default-character-set={}", req.default_character_set.trim()));
    }
    if req.force {
        args.push("--force".into());
    }
    args.extend(split_args(&req.extra_args)?);
    if !req.database.trim().is_empty() {
        args.push(req.database.trim().to_string());
    }
    Ok(args)
}

/// Commande d'import lisible (confirmation, historique).
pub fn import_preview(settings: &ExportSettings, conn: &ConnInfo, password: bool, req: &ImportRequest) -> Result<String, String> {
    let client = client_path(settings).map(|p| p.display().to_string()).unwrap_or_else(|| "mariadb".into());
    let mut line = command_line(&client, password, &import_args(conn, req)?);
    let file = req.file.trim();
    line.push_str(&format!(" < \"{file}\""));
    if is_gzip(Path::new(file)).unwrap_or(false) {
        line.push_str("  (décompressé à la volée)");
    }
    Ok(line)
}

/// Rejoue un fichier SQL (ou SQL gzip) dans le serveur. Bloquant : thread dédié.
pub fn execute_import(
    settings: &ExportSettings,
    conn: &ConnInfo,
    password: Option<&str>,
    req: &ImportRequest,
    handle: &RunHandle,
    base: Progress,
    mut on_progress: impl FnMut(Progress),
) -> Outcome {
    let start = Instant::now();
    let path = PathBuf::from(req.file.trim());
    let files = vec![path.display().to_string()];
    let size = fs::metadata(&path).map(|m| m.len()).unwrap_or(0);
    let fail = |status, code, msg: String| Outcome::fail(status, code, msg, files.clone(), size as i64);

    let client = match require_client(settings) {
        Ok(c) => c,
        Err(e) => return fail("error", None, e),
    };
    if !path.is_file() {
        return fail("error", None, format!("Fichier introuvable : {}", path.display()));
    }
    let args = match import_args(conn, req) {
        Ok(a) => a,
        Err(e) => return fail("error", None, e),
    };
    if req.create_database && !req.database.trim().is_empty() {
        let sql = format!("CREATE DATABASE IF NOT EXISTS {}", quote_ident(req.database.trim()));
        if let Err(e) = client_query(settings, conn, password, &sql) {
            return fail("error", None, format!("Création de la base : {e}"));
        }
    }
    let gz = match is_gzip(&path) {
        Ok(g) => g,
        Err(e) => return fail("error", None, format!("Lecture de {} : {e}", path.display())),
    };
    let count = Arc::new(AtomicU64::new(0));
    let raw = match File::open(&path) {
        Ok(f) => Counting { inner: BufReader::with_capacity(1 << 20, f), count: count.clone() },
        Err(e) => return fail("error", None, format!("Lecture de {} : {e}", path.display())),
    };
    let mut reader: Box<dyn Read> = if gz { Box::new(MultiGzDecoder::new(raw)) } else { Box::new(raw) };

    let defaults = match defaults_for(password) {
        Ok(d) => d,
        Err(e) => return fail("error", None, e),
    };
    let mut cmd = command(&client.to_string_lossy());
    if let Some(d) = &defaults {
        cmd.arg(d.arg());
    }
    cmd.args(&args).stdin(Stdio::piped()).stdout(Stdio::null()).stderr(Stdio::piped());
    let mut child = match cmd.spawn() {
        Ok(c) => c,
        Err(e) => return fail("error", None, format!("Lancement de {} : {e}", client.display())),
    };
    let mut stdin = child.stdin.take().expect("stdin piped");
    let stderr_thread = collect_stderr(&mut child);
    handle.attach(child);

    let label = path.file_name().map(|n| n.to_string_lossy().to_string()).unwrap_or_default();
    let progress = |bytes: u64| Progress {
        job_index: 0,
        job_count: 1,
        label: label.clone(),
        bytes,
        total_bytes: size,
        elapsed_ms: start.elapsed().as_millis() as u64,
        ..base.clone()
    };
    let mut buf = vec![0u8; 256 * 1024];
    let mut last_emit = Instant::now() - Duration::from_secs(1);
    let mut io_error: Option<String> = None;
    loop {
        if handle.is_cancelled() {
            break;
        }
        match reader.read(&mut buf) {
            Ok(0) => break,
            Ok(n) => {
                // Écriture refusée = le client s'est arrêté (erreur SQL ou annulation) : son
                // code retour et son stderr disent pourquoi.
                if stdin.write_all(&buf[..n]).is_err() {
                    break;
                }
                if last_emit.elapsed() >= Duration::from_millis(250) {
                    last_emit = Instant::now();
                    on_progress(progress(count.load(Ordering::Relaxed)));
                }
            }
            Err(e) if e.kind() == std::io::ErrorKind::Interrupted => continue,
            Err(e) => {
                io_error = Some(format!("Lecture de {} : {e}", path.display()));
                handle.cancel();
                break;
            }
        }
    }
    drop(stdin); // fin de flux : le client termine.

    let (code, ok) = wait_child(handle);
    let stderr_text = stderr_thread.join().unwrap_or_default();
    on_progress(progress(count.load(Ordering::Relaxed)));

    if let Some(e) = io_error {
        return fail("error", code, e);
    }
    if handle.is_cancelled() {
        return fail("cancelled", code, "Annulé (les instructions déjà exécutées ne sont pas annulées)".into());
    }
    if !ok {
        let msg = if stderr_text.is_empty() {
            format!("mariadb a échoué (code {})", code.map_or("?".into(), |c| c.to_string()))
        } else {
            explain_error(&stderr_text)
        };
        return fail("error", code, msg);
    }
    Outcome {
        status: "success",
        exit_code: code,
        files: files.clone(),
        size: size as i64,
        message: stderr_text,
        stats: DumpStats::default(),
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn splits_quoted_args() {
        assert_eq!(
            split_args(r#"--where="id > 5" --max_allowed_packet=1G 'a b'"#).unwrap(),
            vec!["--where=id > 5", "--max_allowed_packet=1G", "a b"]
        );
        assert!(split_args("\"oops").is_err());
        assert_eq!(split_args("  ").unwrap(), Vec::<String>::new());
    }

    #[test]
    fn renders_pattern() {
        let now = Local::now();
        let vars = HashMap::from([("app", "Mon:App".to_string()), ("db", "x".to_string())]);
        let s = render_pattern("{app}_{db}_{date:%Y}", &vars, &now).unwrap();
        assert_eq!(s, format!("Mon_App_x_{}", now.format("%Y")));
        assert!(render_pattern("{nope}", &vars, &now).is_err());
        assert!(render_pattern("{app", &vars, &now).is_err());
    }

    #[test]
    fn counts_statements_across_chunks() {
        let mut c = StatsCounter::default();
        c.feed(b"CREATE TABLE a; INSERT IN");
        c.feed(b"TO a VALUES (1); CREATE TA");
        c.feed(b"BLE b;");
        assert_eq!((c.stats.tables, c.stats.inserts), (2, 1));
    }

    #[test]
    fn suffix_before_extension() {
        assert_eq!(with_suffix(Path::new("d/a.sql.gz"), 2), PathBuf::from("d/a_2.sql.gz"));
        assert_eq!(with_suffix(Path::new("d/a.sql"), 1), PathBuf::from("d/a_1.sql"));
    }

    fn sample_conn() -> ConnInfo {
        ConnInfo { host: "db.local".into(), port: 3307, user: "root".into(), ssl_mode: "disabled".into() }
    }

    fn sample_connector() -> Connector {
        Connector {
            name: "main".into(),
            databases: vec!["shop".into(), "crm".into()],
            split_per_database: true,
            tables_exclude: vec!["logs".into(), "crm.audit".into()],
            extra_args: "--max-allowed-packet=1G".into(),
            output_dir: r"D:\dumps\{app}".into(),
            file_pattern: "{app}_{env}_{db}".into(),
            compress: "gzip".into(),
            on_exists: "suffix".into(),
            ..Default::default()
        }
    }

    #[test]
    fn plans_one_job_per_database() {
        let s = ExportSettings::default();
        let jobs = plan(&s, &sample_connector(), &sample_conn(), "Yuri", "PROD", &Local::now(), None).unwrap();
        assert_eq!(jobs.len(), 2);
        let a = &jobs[0].args;
        assert_eq!(&a[..4], ["--host=db.local", "--port=3307", "--user=root", "--skip-ssl"]);
        assert!(a.contains(&"--single-transaction".to_string()));
        assert!(a.contains(&"--max-allowed-packet=1G".to_string()));
        assert!(a.contains(&"--ignore-table=shop.logs".to_string()));
        assert!(a.contains(&"--ignore-table=crm.audit".to_string()));
        assert_eq!(a.last().unwrap(), "shop");
        assert_eq!(jobs[0].output, PathBuf::from(r"D:\dumps\Yuri\Yuri_PROD_shop.sql.gz"));
    }

    #[test]
    fn plans_single_file_and_detects_collisions() {
        let s = ExportSettings::default();
        let mut c = sample_connector();
        c.split_per_database = false;
        let jobs = plan(&s, &c, &sample_conn(), "Yuri", "PROD", &Local::now(), None).unwrap();
        assert_eq!(jobs.len(), 1);
        assert!(jobs[0].args.ends_with(&["--databases".into(), "shop".into(), "crm".into()]));

        c.split_per_database = true;
        c.file_pattern = "{app}".into();
        assert!(plan(&s, &c, &sample_conn(), "Yuri", "PROD", &Local::now(), None).is_err());

        c.output_dir.clear();
        assert!(plan(&s, &c, &sample_conn(), "Yuri", "PROD", &Local::now(), None).unwrap_err().contains("répertoire"));
    }

    #[test]
    fn builds_import_args() {
        let req = ImportRequest {
            file: "x.sql".into(),
            database: "shop".into(),
            force: true,
            default_character_set: "utf8mb4".into(),
            extra_args: "--max-allowed-packet=1G".into(),
            ..Default::default()
        };
        let a = import_args(&sample_conn(), &req).unwrap();
        assert!(a.contains(&"--force".to_string()));
        assert!(a.contains(&"--default-character-set=utf8mb4".to_string()));
        assert_eq!(a.last().unwrap(), "shop");
        assert_eq!(quote_ident("a`b"), "`a``b`");
    }

    #[cfg(windows)]
    #[test]
    fn executes_pipeline_with_fake_binary() {
        let dir = std::env::temp_dir().join(format!("yuri2-ie-test-{}", std::process::id()));
        let _ = fs::remove_dir_all(&dir);
        let job = |name: &str, cmd: &str| Job { label: "db".into(), args: vec!["/C".into(), cmd.into()], output: dir.join(name) };
        let h = RunHandle::default();
        let run = |j: Job, on_exists: &str, gz: bool| execute("cmd", None, &[j], on_exists, gz, &h, Progress::default(), |_| {});

        let o = run(job("a.sql", "echo -- dump"), "suffix", false);
        assert_eq!(o.status, "success", "{}", o.message);
        assert!(fs::read_to_string(dir.join("a.sql")).unwrap().contains("-- dump"));

        let o = run(job("a.sql", "echo x"), "suffix", false);
        assert_eq!(o.files, vec![dir.join("a_1.sql").display().to_string()]);

        assert_eq!(run(job("a.sql", "echo x"), "fail", false).status, "error");

        let o = run(job("b.sql.gz", "echo zipped"), "suffix", true);
        assert_eq!(o.status, "success");
        assert!(is_gzip(&dir.join("b.sql.gz")).unwrap());
        let mut text = String::new();
        MultiGzDecoder::new(File::open(dir.join("b.sql.gz")).unwrap()).read_to_string(&mut text).unwrap();
        assert!(text.contains("zipped"));

        let o = run(job("c.sql", "echo boom 1>&2 & exit 2"), "suffix", false);
        assert_eq!(o.status, "error");
        assert_eq!(o.exit_code, Some(2));
        assert!(o.message.contains("boom"), "{}", o.message);
        assert!(!dir.join("c.sql").exists() && !dir.join("c.sql.part").exists());

        let _ = fs::remove_dir_all(&dir);
    }
}
