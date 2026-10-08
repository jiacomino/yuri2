//! Commandes Tauri de persistance (espaces de travail et composants).

use crate::db::{self, Group, LayoutPatch, Workspace};
use rusqlite::Connection;
use std::sync::Mutex;

pub struct DbState(pub Mutex<Connection>);

fn with_db<T>(
    state: &tauri::State<DbState>,
    f: impl FnOnce(&mut Connection) -> rusqlite::Result<T>,
) -> Result<T, String> {
    let mut conn = state.0.lock().map_err(|e| e.to_string())?;
    f(&mut conn).map_err(|e| e.to_string())
}

#[tauri::command]
pub fn list_workspaces(state: tauri::State<DbState>) -> Result<Vec<Workspace>, String> {
    with_db(&state, |c| db::list_workspaces(c))
}

#[tauri::command]
pub fn create_workspace(
    state: tauri::State<DbState>,
    name: String,
    color: Option<String>,
) -> Result<Workspace, String> {
    with_db(&state, |c| db::create_workspace(c, &name, color.as_deref()))
}

#[tauri::command]
pub fn update_workspace(
    state: tauri::State<DbState>,
    id: String,
    name: String,
    color: Option<String>,
) -> Result<(), String> {
    with_db(&state, |c| db::update_workspace(c, &id, &name, color.as_deref()))
}

#[tauri::command]
pub fn reorder_workspaces(state: tauri::State<DbState>, ids: Vec<String>) -> Result<(), String> {
    with_db(&state, |c| db::reorder_workspaces(c, &ids))
}

#[tauri::command]
pub fn delete_workspace(state: tauri::State<DbState>, id: String) -> Result<(), String> {
    with_db(&state, |c| db::delete_workspace(c, &id))
}

#[tauri::command]
pub fn list_groups(state: tauri::State<DbState>) -> Result<Vec<Group>, String> {
    with_db(&state, |c| db::list_groups(c))
}

#[tauri::command]
pub fn upsert_group(state: tauri::State<DbState>, group: Group) -> Result<(), String> {
    with_db(&state, |c| db::upsert_group(c, &group))
}

#[tauri::command]
pub fn delete_group(state: tauri::State<DbState>, id: String) -> Result<(), String> {
    with_db(&state, |c| db::delete_group(c, &id))
}

#[tauri::command]
pub fn save_layouts(state: tauri::State<DbState>, patches: Vec<LayoutPatch>) -> Result<(), String> {
    with_db(&state, |c| db::save_layouts(c, &patches))
}

// ---------------------------------------------------------------------------
// Sauvegarde (Paramètres → Exporter / Importer)

const BACKUP_FORMAT: &str = "yuri2-backup";

/// Fichier de sauvegarde : JSON lisible, état des composants inclus tel quel.
#[derive(serde::Serialize, serde::Deserialize)]
struct Backup {
    format: String,
    version: u32,
    workspaces: Vec<Workspace>,
    groups: Vec<Group>,
}

#[derive(serde::Serialize)]
pub struct ImportSummary {
    workspaces: usize,
    groups: usize,
}

#[tauri::command]
pub fn export_data(state: tauri::State<DbState>, path: String) -> Result<(), String> {
    let (workspaces, groups) = with_db(&state, |c| Ok((db::list_workspaces(c)?, db::list_groups(c)?)))?;
    let backup = Backup { format: BACKUP_FORMAT.into(), version: 1, workspaces, groups };
    let json = serde_json::to_string_pretty(&backup).map_err(|e| e.to_string())?;
    std::fs::write(&path, json).map_err(|e| format!("Écriture impossible : {}", e))
}

#[tauri::command]
pub fn import_data(state: tauri::State<DbState>, path: String) -> Result<ImportSummary, String> {
    let text = std::fs::read_to_string(&path).map_err(|e| format!("Lecture impossible : {}", e))?;
    let backup: Backup =
        serde_json::from_str(&text).map_err(|e| format!("Fichier de sauvegarde invalide : {}", e))?;
    if backup.format != BACKUP_FORMAT {
        return Err("Ce fichier n'est pas une sauvegarde yuri2.".into());
    }
    if backup.workspaces.is_empty() {
        return Err("Le fichier ne contient aucun espace de travail.".into());
    }
    let known: std::collections::HashSet<&str> = backup.workspaces.iter().map(|w| w.id.as_str()).collect();
    if let Some(g) = backup.groups.iter().find(|g| !known.contains(g.workspace_id.as_str())) {
        return Err(format!("Le composant « {} » pointe vers un espace absent du fichier.", g.name));
    }
    with_db(&state, |c| db::replace_all(c, &backup.workspaces, &backup.groups))?;
    Ok(ImportSummary { workspaces: backup.workspaces.len(), groups: backup.groups.len() })
}
