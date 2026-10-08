//! Persistance SQLite : espaces de travail et composants (groupes).
//!
//! L'état propre à chaque type de composant est stocké tel quel, en JSON, dans
//! `groups.content` : le backend ne l'interprète pas.

use rusqlite::{params, Connection, Result as SqlResult};
use serde::{Deserialize, Serialize};
use std::path::Path;

const DEFAULT_WORKSPACE_NAME: &str = "Accueil";

const SCHEMA: &str = "
PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS workspaces (
    id        TEXT PRIMARY KEY,
    name      TEXT NOT NULL,
    position  INTEGER NOT NULL,
    color     TEXT
);

CREATE TABLE IF NOT EXISTS groups (
    id            TEXT PRIMARY KEY,
    workspace_id  TEXT NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
    kind          TEXT NOT NULL,
    name          TEXT NOT NULL,
    color         TEXT,
    tags          TEXT NOT NULL DEFAULT '[]',
    x             INTEGER NOT NULL,
    y             INTEGER NOT NULL,
    w             INTEGER NOT NULL,
    h             INTEGER NOT NULL,
    minimized     INTEGER NOT NULL DEFAULT 0,
    content       TEXT NOT NULL DEFAULT 'null'
);

CREATE INDEX IF NOT EXISTS idx_groups_workspace ON groups(workspace_id);
";

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct Workspace {
    pub id: String,
    pub name: String,
    pub position: i64,
    pub color: Option<String>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct Group {
    pub id: String,
    pub workspace_id: String,
    pub kind: String,
    pub name: String,
    pub color: Option<String>,
    pub tags: Vec<String>,
    pub x: i64,
    pub y: i64,
    pub w: i64,
    pub h: i64,
    pub minimized: bool,
    /// État du composant, sérialisé en JSON par le frontend.
    pub content: String,
}

#[derive(Debug, Deserialize)]
pub struct LayoutPatch {
    pub id: String,
    pub x: i64,
    pub y: i64,
    pub w: i64,
    pub h: i64,
}

pub fn open(path: &Path) -> SqlResult<Connection> {
    if let Some(parent) = path.parent() {
        let _ = std::fs::create_dir_all(parent);
    }
    let conn = Connection::open(path)?;
    conn.execute_batch(SCHEMA)?;
    let count: i64 = conn.query_row("SELECT COUNT(*) FROM workspaces", [], |r| r.get(0))?;
    if count == 0 {
        conn.execute(
            "INSERT INTO workspaces (id, name, position, color) VALUES (?1, ?2, 0, NULL)",
            params![new_id(), DEFAULT_WORKSPACE_NAME],
        )?;
    }
    Ok(conn)
}

/// Identifiant aléatoire hexadécimal (sans dépendance externe).
pub fn new_id() -> String {
    use std::time::{SystemTime, UNIX_EPOCH};
    let nanos = SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .map(|d| d.as_nanos())
        .unwrap_or(0);
    let stack: u128 = (&nanos as *const _ as usize) as u128;
    format!("{:x}", nanos ^ stack.wrapping_mul(0x9E37_79B9_7F4A_7C15))
}

// ---------------------------------------------------------------------------
// Espaces de travail

pub fn list_workspaces(conn: &Connection) -> SqlResult<Vec<Workspace>> {
    let mut stmt =
        conn.prepare("SELECT id, name, position, color FROM workspaces ORDER BY position")?;
    let rows = stmt.query_map([], |r| {
        Ok(Workspace {
            id: r.get(0)?,
            name: r.get(1)?,
            position: r.get(2)?,
            color: r.get(3)?,
        })
    })?;
    rows.collect()
}

pub fn create_workspace(conn: &Connection, name: &str, color: Option<&str>) -> SqlResult<Workspace> {
    let position: i64 = conn.query_row(
        "SELECT COALESCE(MAX(position) + 1, 0) FROM workspaces",
        [],
        |r| r.get(0),
    )?;
    let ws = Workspace {
        id: new_id(),
        name: name.to_string(),
        position,
        color: color.map(str::to_string),
    };
    conn.execute(
        "INSERT INTO workspaces (id, name, position, color) VALUES (?1, ?2, ?3, ?4)",
        params![ws.id, ws.name, ws.position, ws.color],
    )?;
    Ok(ws)
}

pub fn update_workspace(conn: &Connection, id: &str, name: &str, color: Option<&str>) -> SqlResult<()> {
    conn.execute(
        "UPDATE workspaces SET name = ?2, color = ?3 WHERE id = ?1",
        params![id, name, color],
    )?;
    Ok(())
}

pub fn reorder_workspaces(conn: &mut Connection, ids: &[String]) -> SqlResult<()> {
    let tx = conn.transaction()?;
    for (i, id) in ids.iter().enumerate() {
        tx.execute(
            "UPDATE workspaces SET position = ?2 WHERE id = ?1",
            params![id, i as i64],
        )?;
    }
    tx.commit()
}

/// Supprime l'espace et ses composants (ON DELETE CASCADE).
pub fn delete_workspace(conn: &Connection, id: &str) -> SqlResult<()> {
    conn.execute("DELETE FROM workspaces WHERE id = ?1", params![id])?;
    Ok(())
}

// ---------------------------------------------------------------------------
// Composants

pub fn list_groups(conn: &Connection) -> SqlResult<Vec<Group>> {
    let mut stmt = conn.prepare(
        "SELECT id, workspace_id, kind, name, color, tags, x, y, w, h, minimized, content
         FROM groups ORDER BY rowid",
    )?;
    let rows = stmt.query_map([], |r| {
        let tags: String = r.get(5)?;
        Ok(Group {
            id: r.get(0)?,
            workspace_id: r.get(1)?,
            kind: r.get(2)?,
            name: r.get(3)?,
            color: r.get(4)?,
            tags: serde_json::from_str(&tags).unwrap_or_default(),
            x: r.get(6)?,
            y: r.get(7)?,
            w: r.get(8)?,
            h: r.get(9)?,
            minimized: r.get::<_, i64>(10)? != 0,
            content: r.get(11)?,
        })
    })?;
    rows.collect()
}

pub fn upsert_group(conn: &Connection, g: &Group) -> SqlResult<()> {
    let tags = serde_json::to_string(&g.tags).unwrap_or_else(|_| "[]".into());
    conn.execute(
        "INSERT INTO groups (id, workspace_id, kind, name, color, tags, x, y, w, h, minimized, content)
         VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11, ?12)
         ON CONFLICT(id) DO UPDATE SET
           workspace_id = excluded.workspace_id, kind = excluded.kind, name = excluded.name,
           color = excluded.color, tags = excluded.tags, x = excluded.x, y = excluded.y,
           w = excluded.w, h = excluded.h, minimized = excluded.minimized,
           content = excluded.content",
        params![
            g.id, g.workspace_id, g.kind, g.name, g.color, tags, g.x, g.y, g.w, g.h,
            g.minimized as i64, g.content
        ],
    )?;
    Ok(())
}

pub fn delete_group(conn: &Connection, id: &str) -> SqlResult<()> {
    conn.execute("DELETE FROM groups WHERE id = ?1", params![id])?;
    Ok(())
}

pub fn save_layouts(conn: &mut Connection, patches: &[LayoutPatch]) -> SqlResult<()> {
    let tx = conn.transaction()?;
    for p in patches {
        tx.execute(
            "UPDATE groups SET x = ?2, y = ?3, w = ?4, h = ?5 WHERE id = ?1",
            params![p.id, p.x, p.y, p.w, p.h],
        )?;
    }
    tx.commit()
}

// ---------------------------------------------------------------------------
// Sauvegarde

/// Remplace toutes les données par celles d'une sauvegarde, en une transaction.
pub fn replace_all(conn: &mut Connection, workspaces: &[Workspace], groups: &[Group]) -> SqlResult<()> {
    let tx = conn.transaction()?;
    tx.execute("DELETE FROM groups", [])?;
    tx.execute("DELETE FROM workspaces", [])?;
    for w in workspaces {
        tx.execute(
            "INSERT INTO workspaces (id, name, position, color) VALUES (?1, ?2, ?3, ?4)",
            params![w.id, w.name, w.position, w.color],
        )?;
    }
    for g in groups {
        upsert_group(&tx, g)?;
    }
    tx.commit()
}
