//! Types du composant « Import / Export » (sérialisés en camelCase).
//!
//! Les paramètres (outils, applications, environnements, serveurs) sont rangés dans la
//! table `settings` ; les connecteurs vivent dans l'état du composant (`groups.content`)
//! et sont transmis par le frontend à chaque commande. Les champs `password` sont
//! chiffrés en base par `crypto` : ici, ils sont toujours en clair.

use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize, Default)]
#[serde(rename_all = "camelCase", default)]
pub struct ExportSettings {
    /// Chemin complet de `mariadb-dump.exe`.
    pub dump_path: String,
    /// Client `mariadb.exe` (test, liste des bases, import). Vide = déduit de `dump_path`.
    pub client_path: String,
    /// Répertoire de sortie quand le connecteur n'en précise pas.
    pub default_output_dir: String,
    pub applications: Vec<Application>,
    pub environments: Vec<Environment>,
    pub servers: Vec<Server>,
}

#[derive(Debug, Clone, Serialize, Deserialize, Default)]
#[serde(rename_all = "camelCase", default)]
pub struct Application {
    pub id: String,
    pub name: String,
    pub color: String,
    pub notes: String,
}

#[derive(Debug, Clone, Serialize, Deserialize, Default)]
#[serde(rename_all = "camelCase", default)]
pub struct Environment {
    pub id: String,
    pub name: String,
    pub color: String,
    /// Confirmation renforcée avant chaque lancement (PROD…).
    pub confirm: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize, Default)]
#[serde(rename_all = "camelCase", default)]
pub struct Server {
    pub id: String,
    pub name: String,
    pub environment_id: String,
    pub host: String,
    pub port: u16,
    pub user: String,
    pub password: String,
    /// "default" | "disabled" | "required" | "verify"
    pub ssl_mode: String,
    pub notes: String,
}

/// Options de `mariadb-dump` exposées sous forme de cases à cocher.
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase", default)]
pub struct DumpOptions {
    pub single_transaction: bool,
    pub quick: bool,
    pub routines: bool,
    pub triggers: bool,
    pub events: bool,
    pub no_data: bool,
    pub no_create_info: bool,
    pub add_drop_table: bool,
    pub add_drop_database: bool,
    /// Émettre `CREATE DATABASE` / `USE` (option `--databases`) même pour une seule base.
    pub create_database: bool,
    pub complete_insert: bool,
    pub extended_insert: bool,
    pub hex_blob: bool,
    pub skip_comments: bool,
    pub lock_tables: bool,
    pub default_character_set: String,
}

impl Default for DumpOptions {
    fn default() -> Self {
        Self {
            single_transaction: true,
            quick: true,
            routines: true,
            triggers: true,
            events: false,
            no_data: false,
            no_create_info: false,
            add_drop_table: true,
            add_drop_database: false,
            create_database: false,
            complete_insert: false,
            extended_insert: true,
            hex_blob: true,
            skip_comments: false,
            lock_tables: false,
            default_character_set: "utf8mb4".into(),
        }
    }
}

/// Connecteur : connexion (serveur enregistré ou propre) + contenu, options et sortie.
#[derive(Debug, Clone, Serialize, Deserialize, Default)]
#[serde(rename_all = "camelCase", default)]
pub struct Connector {
    pub id: String,
    pub name: String,
    pub application_id: String,
    pub environment_id: String,
    /// Serveur enregistré ; `None` = connexion propre au connecteur.
    pub server_id: Option<String>,
    pub host: String,
    pub port: u16,
    pub user: String,
    pub password: String,
    pub ssl_mode: String,
    pub all_databases: bool,
    pub databases: Vec<String>,
    /// Un fichier par base (sinon un seul fichier pour toutes).
    pub split_per_database: bool,
    pub tables_include: Vec<String>,
    pub tables_exclude: Vec<String>,
    pub options: DumpOptions,
    pub extra_args: String,
    /// Vide = répertoire par défaut des paramètres.
    pub output_dir: String,
    pub file_pattern: String,
    /// "none" | "gzip"
    pub compress: String,
    /// "suffix" | "overwrite" | "fail"
    pub on_exists: String,
}

/// Connexion à tester ou à interroger : serveur enregistré, ou paramètres saisis.
#[derive(Debug, Clone, Deserialize, Default)]
#[serde(rename_all = "camelCase", default)]
pub struct ConnSpec {
    pub server_id: Option<String>,
    pub host: String,
    pub port: u16,
    pub user: String,
    pub password: String,
    pub ssl_mode: String,
}

impl From<&Connector> for ConnSpec {
    fn from(c: &Connector) -> Self {
        Self {
            server_id: c.server_id.clone(),
            host: c.host.clone(),
            port: c.port,
            user: c.user.clone(),
            password: c.password.clone(),
            ssl_mode: c.ssl_mode.clone(),
        }
    }
}

/// Connexion effective (sans mot de passe).
#[derive(Debug, Clone)]
pub struct ConnInfo {
    pub host: String,
    pub port: u16,
    pub user: String,
    pub ssl_mode: String,
}

/// Paramètres d'une restauration (choisis au lancement de l'import).
#[derive(Debug, Clone, Deserialize, Default)]
#[serde(rename_all = "camelCase", default)]
pub struct ImportRequest {
    /// Fichier `.sql` ou `.sql.gz` (détecté par son contenu).
    pub file: String,
    /// Base cible ; vide = celle désignée par le fichier (`USE …`).
    pub database: String,
    /// `CREATE DATABASE IF NOT EXISTS` avant l'import.
    pub create_database: bool,
    /// `--force` : continuer malgré les erreurs SQL.
    pub force: bool,
    pub default_character_set: String,
    pub extra_args: String,
}

/// Base du serveur avec ses statistiques (sélecteur de bases).
#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct DbInfo {
    pub name: String,
    pub tables: i64,
    /// Nombre de lignes estimé (information_schema, approximatif pour InnoDB).
    pub rows: i64,
    pub size: i64,
}

/// Exécution (export ou import) inscrite à l'historique.
#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct Run {
    pub id: i64,
    pub group_id: String,
    pub connector_id: String,
    pub connector_name: String,
    /// "export" | "import"
    pub kind: String,
    pub application_name: String,
    pub environment_name: String,
    pub started_at: String,
    pub ended_at: Option<String>,
    /// "running" | "success" | "error" | "cancelled"
    pub status: String,
    pub exit_code: Option<i32>,
    /// Fichiers produits (export) ou fichier source (import).
    pub files: Vec<String>,
    pub size_bytes: i64,
    pub command_preview: String,
    pub message: String,
}
