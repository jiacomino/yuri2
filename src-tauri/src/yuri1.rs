//! Lecture (seule) de la base de yuri 1, pour l'import dans yuri2.
//!
//! Les données sont renvoyées brutes : la conversion vers les états de yuri2 se
//! fait côté frontend, type de composant par type de composant.

use rusqlite::{Connection, OpenFlags, Result as SqlResult};
use serde::Serialize;
use std::path::{Path, PathBuf};
use tauri::Manager;

#[derive(Serialize)]
pub struct V1Workspace {
    id: String,
    name: String,
    position: i64,
    color: Option<String>,
}

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
pub struct V1Group {
    id: String,
    workspace_id: String,
    kind: String,
    name: String,
    color: Option<String>,
    tags: String,
    x: i64,
    y: i64,
    w: i64,
    h: i64,
    minimized: bool,
    content: String,
}

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
pub struct V1Tab {
    id: String,
    group_id: String,
    name: String,
}

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
pub struct V1Item {
    id: String,
    tab_id: String,
    name: String,
    url: String,
    kind: String,
}

#[derive(Serialize)]
pub struct V1Data {
    path: String,
    workspaces: Vec<V1Workspace>,
    groups: Vec<V1Group>,
    tabs: Vec<V1Tab>,
    items: Vec<V1Item>,
}

/// Emplacement par défaut : `%APPDATA%\com.yuri.app\yuri.db`.
fn default_path(app: &tauri::AppHandle) -> Option<PathBuf> {
    let data = app.path().app_data_dir().ok()?;
    Some(data.parent()?.join("com.yuri.app").join("yuri.db"))
}

fn read(path: &Path) -> SqlResult<V1Data> {
    let conn = Connection::open_with_flags(path, OpenFlags::SQLITE_OPEN_READ_ONLY)?;

    let workspaces = conn
        .prepare("SELECT id, name, position, color FROM workspaces ORDER BY position")?
        .query_map([], |r| {
            Ok(V1Workspace { id: r.get(0)?, name: r.get(1)?, position: r.get(2)?, color: r.get(3)? })
        })?
        .collect::<SqlResult<_>>()?;

    let groups = conn
        .prepare(
            "SELECT id, workspace_id, kind, name, color, tags, x, y, w, h, minimized, content
             FROM groups ORDER BY position",
        )?
        .query_map([], |r| {
            Ok(V1Group {
                id: r.get(0)?,
                workspace_id: r.get(1)?,
                kind: r.get(2)?,
                name: r.get(3)?,
                color: r.get(4)?,
                tags: r.get(5)?,
                x: r.get(6)?,
                y: r.get(7)?,
                w: r.get(8)?,
                h: r.get(9)?,
                minimized: r.get::<_, i64>(10)? != 0,
                content: r.get(11)?,
            })
        })?
        .collect::<SqlResult<_>>()?;

    let tabs = conn
        .prepare("SELECT id, group_id, name FROM tabs ORDER BY position")?
        .query_map([], |r| Ok(V1Tab { id: r.get(0)?, group_id: r.get(1)?, name: r.get(2)? }))?
        .collect::<SqlResult<_>>()?;

    let items = conn
        .prepare("SELECT id, tab_id, name, url, kind FROM items ORDER BY position")?
        .query_map([], |r| {
            Ok(V1Item { id: r.get(0)?, tab_id: r.get(1)?, name: r.get(2)?, url: r.get(3)?, kind: r.get(4)? })
        })?
        .collect::<SqlResult<_>>()?;

    Ok(V1Data { path: path.display().to_string(), workspaces, groups, tabs, items })
}

/// Lit une base yuri 1 : `path` donné, sinon l'emplacement par défaut.
#[tauri::command]
pub fn read_yuri1_db(app: tauri::AppHandle, path: Option<String>) -> Result<V1Data, String> {
    let path = match path {
        Some(p) => PathBuf::from(p),
        None => default_path(&app).ok_or("Dossier de données introuvable")?,
    };
    if !path.exists() {
        return Err(format!("Base yuri 1 introuvable : {}", path.display()));
    }
    read(&path).map_err(|e| e.to_string())
}
