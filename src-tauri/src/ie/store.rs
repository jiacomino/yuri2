//! Tables SQLite de l'import / export : paramètres (`settings`) et historique (`ie_runs`).

use super::model::Run;
use rusqlite::{params, Connection, OptionalExtension, Result as SqlResult};

/// Clé des paramètres d'import / export dans la table `settings`.
pub const SETTINGS_KEY: &str = "importExport";

const SCHEMA: &str = "
CREATE TABLE IF NOT EXISTS settings (
    key    TEXT PRIMARY KEY,
    value  TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS ie_runs (
    id               INTEGER PRIMARY KEY AUTOINCREMENT,
    group_id         TEXT NOT NULL,
    connector_id     TEXT NOT NULL,
    connector_name   TEXT NOT NULL,
    kind             TEXT NOT NULL,
    application_name TEXT NOT NULL,
    environment_name TEXT NOT NULL,
    started_at       TEXT NOT NULL,
    ended_at         TEXT,
    status           TEXT NOT NULL,
    exit_code        INTEGER,
    files            TEXT NOT NULL DEFAULT '[]',
    size_bytes       INTEGER NOT NULL DEFAULT 0,
    command_preview  TEXT NOT NULL DEFAULT '',
    message          TEXT NOT NULL DEFAULT ''
);

CREATE INDEX IF NOT EXISTS idx_ie_runs_group ON ie_runs(group_id, id);
";

/// Crée les tables ; les exécutions restées « en cours » (application fermée) passent en échec.
pub fn init(conn: &Connection) -> SqlResult<()> {
    conn.execute_batch(SCHEMA)?;
    conn.execute(
        "UPDATE ie_runs SET status = 'error', message = 'Interrompu (application fermée pendant l''exécution)'
         WHERE status = 'running'",
        [],
    )?;
    Ok(())
}

// ---------------------------------------------------------------------------
// Paramètres (valeur JSON brute, chiffrée par l'appelant)

pub fn get_setting(conn: &Connection, key: &str) -> SqlResult<Option<String>> {
    conn.query_row("SELECT value FROM settings WHERE key = ?1", [key], |r| r.get(0)).optional()
}

pub fn set_setting(conn: &Connection, key: &str, value: &str) -> SqlResult<()> {
    conn.execute(
        "INSERT INTO settings (key, value) VALUES (?1, ?2)
         ON CONFLICT(key) DO UPDATE SET value = excluded.value",
        params![key, value],
    )?;
    Ok(())
}

pub fn list_settings(conn: &Connection) -> SqlResult<Vec<(String, String)>> {
    let mut stmt = conn.prepare("SELECT key, value FROM settings ORDER BY key")?;
    let rows = stmt.query_map([], |r| Ok((r.get(0)?, r.get(1)?)))?;
    rows.collect()
}

pub fn replace_settings(conn: &Connection, entries: &[(String, String)]) -> SqlResult<()> {
    conn.execute("DELETE FROM settings", [])?;
    for (k, v) in entries {
        set_setting(conn, k, v)?;
    }
    Ok(())
}

// ---------------------------------------------------------------------------
// Historique

pub struct NewRun<'a> {
    pub group_id: &'a str,
    pub connector_id: &'a str,
    pub connector_name: &'a str,
    pub kind: &'a str,
    pub application_name: &'a str,
    pub environment_name: &'a str,
    pub started_at: &'a str,
    pub command_preview: &'a str,
}

pub fn insert_run(conn: &Connection, r: &NewRun) -> SqlResult<i64> {
    conn.execute(
        "INSERT INTO ie_runs (group_id, connector_id, connector_name, kind, application_name,
            environment_name, started_at, status, command_preview)
         VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, 'running', ?8)",
        params![
            r.group_id,
            r.connector_id,
            r.connector_name,
            r.kind,
            r.application_name,
            r.environment_name,
            r.started_at,
            r.command_preview
        ],
    )?;
    Ok(conn.last_insert_rowid())
}

#[allow(clippy::too_many_arguments)]
pub fn finish_run(
    conn: &Connection,
    id: i64,
    ended_at: &str,
    status: &str,
    exit_code: Option<i32>,
    files: &[String],
    size: i64,
    message: &str,
) -> SqlResult<()> {
    let files = serde_json::to_string(files).unwrap_or_else(|_| "[]".into());
    conn.execute(
        "UPDATE ie_runs SET ended_at = ?2, status = ?3, exit_code = ?4, files = ?5, size_bytes = ?6, message = ?7
         WHERE id = ?1",
        params![id, ended_at, status, exit_code, files, size, message],
    )?;
    Ok(())
}

const RUN_COLUMNS: &str = "id, group_id, connector_id, connector_name, kind, application_name, environment_name,
    started_at, ended_at, status, exit_code, files, size_bytes, command_preview, message";

fn map_run(r: &rusqlite::Row) -> SqlResult<Run> {
    let files: String = r.get(11)?;
    Ok(Run {
        id: r.get(0)?,
        group_id: r.get(1)?,
        connector_id: r.get(2)?,
        connector_name: r.get(3)?,
        kind: r.get(4)?,
        application_name: r.get(5)?,
        environment_name: r.get(6)?,
        started_at: r.get(7)?,
        ended_at: r.get(8)?,
        status: r.get(9)?,
        exit_code: r.get(10)?,
        files: serde_json::from_str(&files).unwrap_or_default(),
        size_bytes: r.get(12)?,
        command_preview: r.get(13)?,
        message: r.get(14)?,
    })
}

pub fn get_run(conn: &Connection, id: i64) -> SqlResult<Run> {
    conn.query_row(&format!("SELECT {RUN_COLUMNS} FROM ie_runs WHERE id = ?1"), [id], map_run)
}

/// Exécutions d'un composant, les plus récentes d'abord.
pub fn list_runs(conn: &Connection, group_id: &str, limit: i64) -> SqlResult<Vec<Run>> {
    let mut stmt = conn.prepare(&format!(
        "SELECT {RUN_COLUMNS} FROM ie_runs WHERE group_id = ?1 ORDER BY id DESC LIMIT ?2"
    ))?;
    let rows = stmt.query_map(params![group_id, limit], map_run)?;
    rows.collect()
}

/// Vide l'historique d'un composant (exécutions en cours conservées).
pub fn clear_runs(conn: &Connection, group_id: &str) -> SqlResult<()> {
    conn.execute("DELETE FROM ie_runs WHERE group_id = ?1 AND status <> 'running'", [group_id])?;
    Ok(())
}
