mod capture;
mod clipboard;
mod commands;
mod db;
mod launcher;
mod oauth;
mod system;
mod yuri1;

use std::path::{Path, PathBuf};
use std::sync::Mutex;
use tauri::{Manager, WebviewWindowBuilder};

const DB_FILE: &str = "yuri2.db";
/// Données du navigateur intégré (localStorage, cache) en mode portable.
const WEBVIEW_DIR: &str = "yuri2-webview";

/// Mode portable : dossier de l'exécutable, s'il contient déjà la base ou s'il est
/// accessible en écriture. Sinon (ex. installation dans Program Files) : `None`, et
/// tout reste dans le dossier de données de l'application.
fn portable_dir() -> Option<PathBuf> {
    let dir = std::env::current_exe().ok()?.parent()?.to_path_buf();
    if dir.join(DB_FILE).exists() {
        return Some(dir);
    }
    let probe = dir.join(".yuri2-write-test");
    std::fs::write(&probe, b"").ok()?;
    let _ = std::fs::remove_file(&probe);
    Some(dir)
}

/// Base à côté de l'exécutable en mode portable, sinon dans le dossier de données.
fn db_path(portable: Option<&Path>, app_data_dir: PathBuf) -> PathBuf {
    let legacy = app_data_dir.join(DB_FILE);
    let Some(dir) = portable else {
        return legacy;
    };
    let path = dir.join(DB_FILE);
    // Reprend une fois les données de l'ancien emplacement.
    if !path.exists() && legacy.exists() {
        let _ = std::fs::copy(&legacy, &path);
    }
    path
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_notification::init())
        .manage(oauth::OAuthState::default())
        .setup(|app| {
            let portable = portable_dir();
            let conn = db::open(&db_path(portable.as_deref(), app.path().app_data_dir()?))?;
            app.manage(commands::DbState(Mutex::new(conn)));
            clipboard::start_watcher(app.handle().clone());

            // Fenêtre créée ici (`create: false` dans la config) pour pouvoir placer les
            // données du navigateur intégré à côté de l'exécutable en mode portable.
            let config = app.config().app.windows.first().cloned().ok_or("fenêtre absente de la config")?;
            let mut window = WebviewWindowBuilder::from_config(app.handle(), &config)?;
            if let Some(dir) = &portable {
                window = window.data_directory(dir.join(WEBVIEW_DIR));
            }
            window.build()?;
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            commands::list_workspaces,
            commands::create_workspace,
            commands::update_workspace,
            commands::reorder_workspaces,
            commands::delete_workspace,
            commands::list_groups,
            commands::upsert_group,
            commands::delete_group,
            commands::save_layouts,
            commands::export_data,
            commands::import_data,
            system::save_binary_file,
            system::detect_browsers,
            system::open_url_with,
            capture::list_capture_targets,
            capture::capture_target,
            capture::capture_primary_screen,
            clipboard::clipboard_write_text,
            clipboard::clipboard_write_image,
            launcher::list_start_menu_apps,
            launcher::list_store_apps,
            launcher::app_icons,
            launcher::launch_app,
            oauth::start_oauth_listener,
            oauth::await_oauth_callback,
            yuri1::read_yuri1_db,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
