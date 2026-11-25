//! Composant « Import / Export » : export de bases MariaDB par `mariadb-dump` et
//! restauration par le client `mariadb` (repris et étendu de YuriExport).
//!
//! - Paramètres (outils, applications, environnements, serveurs) : table `settings`,
//!   clé `importExport`, JSON chiffré par `crypto` (champs `password`).
//! - Connecteurs : dans l'état du composant, transmis par le frontend à chaque commande.
//! - Exécutions : thread dédié, événements `ie://progress` et `ie://finished`,
//!   historique dans `ie_runs`.

pub mod engine;
pub mod model;
pub mod store;

use crate::commands::DbState;
use chrono::Local;
use engine::{Outcome, Progress, RunHandle};
use model::{ConnInfo, ConnSpec, Connector, DbInfo, ExportSettings, ImportRequest, Run, Server};
use serde::Serialize;
use std::collections::HashMap;
use std::sync::{Arc, Mutex};
use tauri::{AppHandle, Emitter, Manager, State};

// ---------------------------------------------------------------------------
// État partagé

/// Exécution en cours, visible par un composant remonté (changement d'espace).
#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct LiveRun {
    pub run_id: i64,
    pub group_id: String,
    pub connector_id: String,
    pub kind: String,
    pub progress: Option<Progress>,
}

struct Live {
    handle: Arc<RunHandle>,
    info: LiveRun,
}

#[derive(Default)]
pub struct RunningJobs(Mutex<HashMap<i64, Live>>);

fn lock_err<E: std::fmt::Display>(e: E) -> String {
    e.to_string()
}

/// Paramètres d'import / export, secrets déchiffrés.
pub fn load_settings(state: &DbState) -> Result<ExportSettings, String> {
    let conn = state.conn.lock().map_err(lock_err)?;
    match store::get_setting(&conn, store::SETTINGS_KEY).map_err(lock_err)? {
        None => Ok(ExportSettings::default()),
        Some(raw) => serde_json::from_str(&state.cipher.open(&raw)).map_err(|e| format!("Paramètres illisibles : {e}")),
    }
}

/// Connexion effective et mot de passe : serveur enregistré, ou paramètres saisis.
fn resolve(settings: &ExportSettings, spec: &ConnSpec) -> Result<(ConnInfo, Option<String>, Option<Server>), String> {
    let normalize = |host: &str, port: u16, user: &str, ssl: &str| ConnInfo {
        host: if host.trim().is_empty() { "localhost".into() } else { host.trim().into() },
        port: if port == 0 { 3306 } else { port },
        user: user.trim().into(),
        ssl_mode: if ssl.is_empty() { "default".into() } else { ssl.into() },
    };
    if let Some(sid) = spec.server_id.as_deref().filter(|s| !s.is_empty()) {
        let s = settings
            .servers
            .iter()
            .find(|s| s.id == sid)
            .cloned()
            .ok_or("Serveur du connecteur introuvable (Paramètres › Import / Export)")?;
        let info = normalize(&s.host, s.port, &s.user, &s.ssl_mode);
        let pwd = Some(s.password.clone()).filter(|p| !p.is_empty());
        return Ok((info, pwd, Some(s)));
    }
    let info = normalize(&spec.host, spec.port, &spec.user, &spec.ssl_mode);
    Ok((info, Some(spec.password.clone()).filter(|p| !p.is_empty()), None))
}

/// Noms de l'application et de l'environnement du connecteur.
fn names(settings: &ExportSettings, c: &Connector) -> (String, String) {
    let app = settings.applications.iter().find(|a| a.id == c.application_id).map(|a| a.name.clone());
    let env = settings.environments.iter().find(|e| e.id == c.environment_id).map(|e| e.name.clone());
    (app.unwrap_or_else(|| "app".into()), env.unwrap_or_else(|| "env".into()))
}

fn require_dump(settings: &ExportSettings) -> Result<(), String> {
    if settings.dump_path.trim().is_empty() {
        return Err("Chemin de mariadb-dump non configuré (Paramètres › Import / Export)".into());
    }
    Ok(())
}

// ---------------------------------------------------------------------------
// Paramètres

#[tauri::command]
pub fn ie_settings_get(state: State<DbState>) -> Result<ExportSettings, String> {
    load_settings(&state)
}

#[tauri::command]
pub fn ie_settings_save(state: State<DbState>, settings: ExportSettings) -> Result<(), String> {
    let json = serde_json::to_string(&settings).map_err(lock_err)?;
    let sealed = state.cipher.seal(&json);
    let conn = state.conn.lock().map_err(lock_err)?;
    store::set_setting(&conn, store::SETTINGS_KEY, &sealed).map_err(lock_err)
}

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
pub struct BinaryCheck {
    version: String,
    /// Client mariadb détecté (test, liste des bases, import), vide sinon.
    client_path: String,
}

#[tauri::command(async)]
pub fn ie_check_binary(dump_path: String, client_path: String) -> Result<BinaryCheck, String> {
    let version = engine::binary_version(&dump_path)?;
    let s = ExportSettings { dump_path, client_path, ..Default::default() };
    Ok(BinaryCheck {
        version,
        client_path: engine::client_path(&s).map(|p| p.display().to_string()).unwrap_or_default(),
    })
}

// ---------------------------------------------------------------------------
// Connexion

#[tauri::command(async)]
pub fn ie_test(state: State<'_, DbState>, conn: ConnSpec) -> Result<String, String> {
    let settings = load_settings(&state)?;
    let (info, password, _) = resolve(&settings, &conn)?;
    engine::test_connection(&settings, &info, password.as_deref())
}

#[tauri::command(async)]
pub fn ie_databases(state: State<'_, DbState>, conn: ConnSpec) -> Result<Vec<DbInfo>, String> {
    let settings = load_settings(&state)?;
    let (info, password, _) = resolve(&settings, &conn)?;
    engine::list_databases_detailed(&settings, &info, password.as_deref())
}

// ---------------------------------------------------------------------------
// Aperçus

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
pub struct Preview {
    commands: Vec<String>,
    files: Vec<String>,
    error: Option<String>,
}

#[tauri::command]
pub fn ie_preview(state: State<DbState>, connector: Connector) -> Result<Preview, String> {
    let settings = load_settings(&state)?;
    let (app, env) = names(&settings, &connector);
    let error = |e: String| Preview { commands: vec![], files: vec![], error: Some(e) };
    let (info, password, _) = match resolve(&settings, &ConnSpec::from(&connector)) {
        Ok(v) => v,
        Err(e) => return Ok(error(e)),
    };
    // Sans interroger le serveur, « toutes les bases » éclaté est illustré par une base fictive.
    let sample = Some(vec!["<base>".to_string()]);
    let exe = if settings.dump_path.is_empty() { "mariadb-dump".into() } else { settings.dump_path.clone() };
    Ok(match engine::plan(&settings, &connector, &info, &app, &env, &Local::now(), sample) {
        Ok(jobs) => Preview {
            commands: jobs.iter().map(|j| engine::command_line(&exe, password.is_some(), &j.args)).collect(),
            files: jobs.iter().map(|j| j.output.display().to_string()).collect(),
            error: None,
        },
        Err(e) => error(e),
    })
}

#[tauri::command]
pub fn ie_import_preview(state: State<DbState>, connector: Connector, request: ImportRequest) -> Result<String, String> {
    let settings = load_settings(&state)?;
    let (info, password, _) = resolve(&settings, &ConnSpec::from(&connector))?;
    engine::import_preview(&settings, &info, password.is_some(), &request)
}

// ---------------------------------------------------------------------------
// Exécution

/// Message d'un export réussi : contenu détecté (tables / INSERT) et alerte si aucune donnée.
fn export_message(outcome: &Outcome, no_data: bool) -> String {
    if outcome.status != "success" {
        return outcome.message.clone();
    }
    let s = outcome.stats;
    let line = if no_data {
        format!("Structure seule (--no-data) : {} table(s).", s.tables)
    } else if s.tables > 0 && s.inserts == 0 {
        format!(
            "⚠ Aucune donnée exportée : {} table(s) mais aucun INSERT. Tables vides sur ce serveur, mauvaise base ou mauvais serveur ?",
            s.tables
        )
    } else {
        format!("Contenu : {} table(s), {} instruction(s) INSERT.", s.tables, s.inserts)
    };
    if outcome.message.is_empty() {
        line
    } else {
        format!("{line}\n{}", outcome.message)
    }
}

/// Refuse un second lancement pour le même connecteur du même composant.
fn ensure_idle(running: &RunningJobs, group_id: &str, connector_id: &str) -> Result<(), String> {
    let map = running.0.lock().map_err(lock_err)?;
    if map.values().any(|l| l.info.group_id == group_id && l.info.connector_id == connector_id) {
        return Err("Ce connecteur est déjà en cours d'exécution".into());
    }
    Ok(())
}

/// Inscrit l'exécution, puis lance `work` dans un thread ; émet progression et fin.
fn launch<F>(app: AppHandle, running: &RunningJobs, info: LiveRun, work: F) -> Result<(), String>
where
    F: FnOnce(&RunHandle, &mut dyn FnMut(Progress)) -> (Outcome, String) + Send + 'static,
{
    let handle = Arc::new(RunHandle::default());
    running.0.lock().map_err(lock_err)?.insert(info.run_id, Live { handle: handle.clone(), info: info.clone() });

    std::thread::spawn(move || {
        let run_id = info.run_id;
        let emitter = app.clone();
        let mut on_progress = |p: Progress| {
            if let Ok(mut map) = emitter.state::<RunningJobs>().0.lock() {
                if let Some(live) = map.get_mut(&run_id) {
                    live.info.progress = Some(p.clone());
                }
            }
            let _ = emitter.emit("ie://progress", p);
        };
        let (outcome, message) = work(&handle, &mut on_progress);

        let db = app.state::<DbState>();
        let run = db.conn.lock().ok().and_then(|conn| {
            store::finish_run(
                &conn,
                run_id,
                &Local::now().to_rfc3339(),
                outcome.status,
                outcome.exit_code,
                &outcome.files,
                outcome.size,
                &message,
            )
            .ok()?;
            store::get_run(&conn, run_id).ok()
        });
        if let Ok(mut map) = app.state::<RunningJobs>().0.lock() {
            map.remove(&run_id);
        }
        let _ = app.emit("ie://finished", run);
    });
    Ok(())
}

fn progress_base(info: &LiveRun) -> Progress {
    Progress {
        run_id: info.run_id,
        group_id: info.group_id.clone(),
        connector_id: info.connector_id.clone(),
        kind: info.kind.clone(),
        ..Default::default()
    }
}

#[tauri::command(async)]
pub fn ie_export(
    app: AppHandle,
    state: State<'_, DbState>,
    running: State<'_, RunningJobs>,
    group_id: String,
    connector: Connector,
) -> Result<i64, String> {
    let settings = load_settings(&state)?;
    require_dump(&settings)?;
    ensure_idle(&running, &group_id, &connector.id)?;
    let (app_name, env_name) = names(&settings, &connector);
    let (info, password, _) = resolve(&settings, &ConnSpec::from(&connector))?;
    let now = Local::now();

    // La liste des bases n'est nécessaire que pour « toutes les bases », un fichier par base.
    let all_dbs = if connector.all_databases && connector.split_per_database {
        Some(engine::list_databases(&settings, &info, password.as_deref())?)
    } else {
        None
    };
    let jobs = engine::plan(&settings, &connector, &info, &app_name, &env_name, &now, all_dbs)?;
    let preview = jobs
        .iter()
        .map(|j| engine::command_line(&settings.dump_path, password.is_some(), &j.args))
        .collect::<Vec<_>>()
        .join("\n");

    let run_id = {
        let conn = state.conn.lock().map_err(lock_err)?;
        store::insert_run(
            &conn,
            &store::NewRun {
                group_id: &group_id,
                connector_id: &connector.id,
                connector_name: &connector.name,
                kind: "export",
                application_name: &app_name,
                environment_name: &env_name,
                started_at: &now.to_rfc3339(),
                command_preview: &preview,
            },
        )
        .map_err(lock_err)?
    };
    let live = LiveRun { run_id, group_id, connector_id: connector.id.clone(), kind: "export".into(), progress: None };
    let base = progress_base(&live);
    launch(app, &running, live, move |handle, on_progress| {
        let outcome = engine::execute(
            &settings.dump_path,
            password.as_deref(),
            &jobs,
            &connector.on_exists,
            connector.compress == "gzip",
            handle,
            base,
            on_progress,
        );
        let message = export_message(&outcome, connector.options.no_data);
        (outcome, message)
    })?;
    Ok(run_id)
}

#[tauri::command(async)]
pub fn ie_import(
    app: AppHandle,
    state: State<'_, DbState>,
    running: State<'_, RunningJobs>,
    group_id: String,
    connector: Connector,
    request: ImportRequest,
) -> Result<i64, String> {
    let settings = load_settings(&state)?;
    if engine::client_path(&settings).is_none() {
        return Err("Client mariadb.exe introuvable (Paramètres › Import / Export)".into());
    }
    if request.file.trim().is_empty() {
        return Err("Aucun fichier à importer".into());
    }
    ensure_idle(&running, &group_id, &connector.id)?;
    let (app_name, env_name) = names(&settings, &connector);
    let (info, password, _) = resolve(&settings, &ConnSpec::from(&connector))?;
    let preview = engine::import_preview(&settings, &info, password.is_some(), &request)?;
    let now = Local::now();

    let run_id = {
        let conn = state.conn.lock().map_err(lock_err)?;
        store::insert_run(
            &conn,
            &store::NewRun {
                group_id: &group_id,
                connector_id: &connector.id,
                connector_name: &connector.name,
                kind: "import",
                application_name: &app_name,
                environment_name: &env_name,
                started_at: &now.to_rfc3339(),
                command_preview: &preview,
            },
        )
        .map_err(lock_err)?
    };
    let live = LiveRun { run_id, group_id, connector_id: connector.id.clone(), kind: "import".into(), progress: None };
    let base = progress_base(&live);
    launch(app, &running, live, move |handle, on_progress| {
        let outcome = engine::execute_import(&settings, &info, password.as_deref(), &request, handle, base, on_progress);
        let message = if outcome.status == "success" && outcome.message.is_empty() {
            match request.database.trim() {
                "" => "Import terminé.".to_string(),
                db => format!("Import terminé dans la base « {db} »."),
            }
        } else {
            outcome.message.clone()
        };
        (outcome, message)
    })?;
    Ok(run_id)
}

#[tauri::command]
pub fn ie_cancel(running: State<RunningJobs>, run_id: i64) -> Result<(), String> {
    let map = running.0.lock().map_err(lock_err)?;
    if let Some(live) = map.get(&run_id) {
        live.handle.cancel();
    }
    Ok(())
}

#[tauri::command]
pub fn ie_live(running: State<RunningJobs>) -> Result<Vec<LiveRun>, String> {
    let map = running.0.lock().map_err(lock_err)?;
    Ok(map.values().map(|l| l.info.clone()).collect())
}

#[tauri::command]
pub fn ie_runs(state: State<DbState>, group_id: String, limit: Option<i64>) -> Result<Vec<Run>, String> {
    let conn = state.conn.lock().map_err(lock_err)?;
    store::list_runs(&conn, &group_id, limit.unwrap_or(200)).map_err(lock_err)
}

#[tauri::command]
pub fn ie_runs_clear(state: State<DbState>, group_id: String) -> Result<(), String> {
    let conn = state.conn.lock().map_err(lock_err)?;
    store::clear_runs(&conn, &group_id).map_err(lock_err)
}
