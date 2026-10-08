//! Capture d'écran (crate `xcap`) pour le composant Image : liste des écrans et fenêtres,
//! capture de l'un d'eux en PNG (data URL), fenêtre de yuri2 masquée pendant la prise.

use base64::Engine;
use serde::{Deserialize, Serialize};
use std::io::Cursor;
use std::time::Duration;
use xcap::image::{imageops::FilterType, DynamicImage, ImageFormat};
use xcap::{Monitor, Window};

/// Même plafond que `MAX_IMAGE_DIM` côté frontend : garde des data URL raisonnables.
const MAX_IMAGE_DIM: u32 = 1600;
/// Laisse au compositeur de Windows le temps d'effacer la fenêtre masquée.
const HIDE_DELAY: Duration = Duration::from_millis(250);
/// Fenêtres plus petites ignorées (barres d'outils, fenêtres techniques).
const MIN_WINDOW_SIZE: u32 = 80;

#[derive(Debug, Clone, Copy, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "lowercase")]
pub enum TargetKind {
    Monitor,
    Window,
}

#[derive(Debug, Serialize)]
pub struct CaptureTarget {
    kind: TargetKind,
    id: u32,
    /// Nom affiché : « Écran 1 (principal) » ou titre de la fenêtre.
    label: String,
    /// Complément : définition de l'écran ou application de la fenêtre.
    detail: String,
}

fn err(e: impl std::fmt::Display) -> String {
    format!("Capture impossible : {}", e)
}

#[tauri::command]
pub fn list_capture_targets() -> Result<Vec<CaptureTarget>, String> {
    let mut targets = Vec::new();

    for (i, m) in Monitor::all().map_err(err)?.iter().enumerate() {
        let primary = m.is_primary().unwrap_or(false);
        targets.push(CaptureTarget {
            kind: TargetKind::Monitor,
            id: m.id().map_err(err)?,
            label: format!("Écran {}{}", i + 1, if primary { " (principal)" } else { "" }),
            detail: format!("{} × {}", m.width().unwrap_or(0), m.height().unwrap_or(0)),
        });
    }

    let own_pid = std::process::id();
    for w in Window::all().map_err(err)? {
        let title = w.title().unwrap_or_default();
        let usable = !title.trim().is_empty()
            && w.pid().map_or(false, |pid| pid != own_pid)
            && !w.is_minimized().unwrap_or(true)
            && w.width().unwrap_or(0) >= MIN_WINDOW_SIZE
            && w.height().unwrap_or(0) >= MIN_WINDOW_SIZE;
        if !usable {
            continue;
        }
        targets.push(CaptureTarget {
            kind: TargetKind::Window,
            id: w.id().map_err(err)?,
            label: title,
            detail: w.app_name().unwrap_or_default(),
        });
    }
    Ok(targets)
}

fn grab(kind: TargetKind, id: u32) -> Result<DynamicImage, String> {
    let image = match kind {
        TargetKind::Monitor => Monitor::all()
            .map_err(err)?
            .into_iter()
            .find(|m| m.id().ok() == Some(id))
            .ok_or("Écran introuvable.")?
            .capture_image(),
        TargetKind::Window => Window::all()
            .map_err(err)?
            .into_iter()
            .find(|w| w.id().ok() == Some(id))
            .ok_or("Fenêtre introuvable : elle a peut-être été fermée.")?
            .capture_image(),
    };
    Ok(DynamicImage::ImageRgba8(image.map_err(err)?))
}

fn grab_primary() -> Result<DynamicImage, String> {
    let monitors = Monitor::all().map_err(err)?;
    let primary = monitors
        .iter()
        .find(|m| m.is_primary().unwrap_or(false))
        .or(monitors.first())
        .ok_or("Aucun écran détecté.")?;
    Ok(DynamicImage::ImageRgba8(primary.capture_image().map_err(err)?))
}

/// Capture l'écran ou la fenêtre demandé et renvoie une data URL PNG, réduite au besoin.
#[tauri::command]
pub async fn capture_target(window: tauri::WebviewWindow, kind: TargetKind, id: u32) -> Result<String, String> {
    capture_hidden(window, move || grab(kind, id)).await
}

/// Capture de l'écran principal entier (bouton « Capture d'écran » de l'en-tête).
#[tauri::command]
pub async fn capture_primary_screen(window: tauri::WebviewWindow) -> Result<String, String> {
    capture_hidden(window, grab_primary).await
}

async fn capture_hidden(
    window: tauri::WebviewWindow,
    grab: impl FnOnce() -> Result<DynamicImage, String> + Send + 'static,
) -> Result<String, String> {
    // yuri2 ne doit pas apparaître sur la capture (ni masquer la fenêtre visée).
    let _ = window.hide();
    pause(HIDE_DELAY).await;
    let shot = tauri::async_runtime::spawn_blocking(grab).await.map_err(err);
    let _ = window.show();
    let _ = window.set_focus();

    let mut image = shot??;
    if image.width().max(image.height()) > MAX_IMAGE_DIM {
        image = image.resize(MAX_IMAGE_DIM, MAX_IMAGE_DIM, FilterType::Triangle);
    }
    let mut png = Vec::new();
    image.write_to(&mut Cursor::new(&mut png), ImageFormat::Png).map_err(err)?;
    Ok(format!("data:image/png;base64,{}", base64::engine::general_purpose::STANDARD.encode(png)))
}

/// Attente sans bloquer le runtime asynchrone.
async fn pause(d: Duration) {
    let _ = tauri::async_runtime::spawn_blocking(move || std::thread::sleep(d)).await;
}
