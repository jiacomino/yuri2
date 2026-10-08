//! Presse-papiers : surveillance en tâche de fond (événement `clipboard-changed` vers le
//! frontend, qui l'ajoute aux composants « Presse-papiers ») et réécriture d'un élément.
//!
//! Le changement est détecté par le numéro de séquence de Windows, sans ouvrir le
//! presse-papiers. Un contenu marqué « ne pas surveiller » (gestionnaires de mots de passe,
//! copie d'un mot de passe depuis yuri2) n'est jamais remonté.

use arboard::{Clipboard, ImageData};
use base64::Engine;
use serde::Serialize;
use std::borrow::Cow;
use std::io::Cursor;
use std::time::Duration;
use tauri::{AppHandle, Emitter};
use xcap::image::{imageops::FilterType, DynamicImage, ImageFormat, RgbaImage};

const POLL_INTERVAL: Duration = Duration::from_millis(500);
/// Taille maximale d'une image conservée dans l'historique (côté le plus long).
const MAX_IMAGE_DIM: u32 = 1280;
/// Texte plus long ignoré : l'historique n'est pas fait pour des fichiers entiers.
const MAX_TEXT_LEN: usize = 100_000;

#[derive(Clone, Serialize)]
#[serde(tag = "kind", rename_all = "lowercase")]
enum Clip {
    Text { text: String },
    Image {
        #[serde(rename = "dataUrl")]
        data_url: String,
        width: u32,
        height: u32,
    },
}

#[cfg(windows)]
mod seq {
    use windows_sys::Win32::System::DataExchange::{
        GetClipboardSequenceNumber, IsClipboardFormatAvailable, RegisterClipboardFormatW,
    };

    pub fn current() -> u32 {
        unsafe { GetClipboardSequenceNumber() }
    }

    /// Convention Windows : ce format signale un contenu à ne pas enregistrer.
    pub fn excluded() -> bool {
        let name: Vec<u16> = "ExcludeClipboardContentFromMonitorProcessing\0".encode_utf16().collect();
        unsafe {
            let format = RegisterClipboardFormatW(name.as_ptr());
            format != 0 && IsClipboardFormatAvailable(format) != 0
        }
    }
}

#[cfg(not(windows))]
mod seq {
    pub fn current() -> u32 {
        0
    }
    pub fn excluded() -> bool {
        false
    }
}

fn to_data_url(image: DynamicImage) -> Option<(String, u32, u32)> {
    let image = if image.width().max(image.height()) > MAX_IMAGE_DIM {
        image.resize(MAX_IMAGE_DIM, MAX_IMAGE_DIM, FilterType::Triangle)
    } else {
        image
    };
    let mut png = Vec::new();
    image.write_to(&mut Cursor::new(&mut png), ImageFormat::Png).ok()?;
    let url = format!("data:image/png;base64,{}", base64::engine::general_purpose::STANDARD.encode(png));
    Some((url, image.width(), image.height()))
}

fn read_clip(clipboard: &mut Clipboard) -> Option<Clip> {
    if let Ok(text) = clipboard.get_text() {
        if !text.trim().is_empty() && text.len() <= MAX_TEXT_LEN {
            return Some(Clip::Text { text });
        }
        return None;
    }
    let data = clipboard.get_image().ok()?;
    let rgba = RgbaImage::from_raw(data.width as u32, data.height as u32, data.bytes.into_owned())?;
    let (data_url, width, height) = to_data_url(DynamicImage::ImageRgba8(rgba))?;
    Some(Clip::Image { data_url, width, height })
}

/// Lance la surveillance (thread dédié). Le contenu présent au démarrage n'est pas repris.
pub fn start_watcher(app: AppHandle) {
    std::thread::spawn(move || {
        let Ok(mut clipboard) = Clipboard::new() else {
            eprintln!("[clipboard] presse-papiers inaccessible, historique désactivé");
            return;
        };
        let mut last = seq::current();
        loop {
            std::thread::sleep(POLL_INTERVAL);
            let now = seq::current();
            if now == last {
                continue;
            }
            last = now;
            if seq::excluded() {
                continue;
            }
            if let Some(clip) = read_clip(&mut clipboard) {
                let _ = app.emit("clipboard-changed", clip);
            }
        }
    });
}

fn err(e: impl std::fmt::Display) -> String {
    format!("Presse-papiers : {}", e)
}

/// Copie un texte. `sensitive` : exclu de l'historique Windows (Win+V), du cloud et des
/// outils de surveillance, dont l'historique de yuri2 lui-même.
#[tauri::command]
pub fn clipboard_write_text(text: String, sensitive: bool) -> Result<(), String> {
    let mut clipboard = Clipboard::new().map_err(err)?;
    if sensitive {
        #[cfg(windows)]
        {
            use arboard::SetExtWindows;
            return clipboard
                .set()
                .exclude_from_monitoring()
                .exclude_from_history()
                .exclude_from_cloud()
                .text(text)
                .map_err(err);
        }
    }
    clipboard.set_text(text).map_err(err)
}

/// Copie une image donnée en data URL (PNG, JPEG…).
#[tauri::command]
pub fn clipboard_write_image(data_url: String) -> Result<(), String> {
    let encoded = data_url.split_once(',').map(|(_, b64)| b64).ok_or("data URL invalide")?;
    let bytes = base64::engine::general_purpose::STANDARD.decode(encoded).map_err(err)?;
    let rgba = xcap::image::load_from_memory(&bytes).map_err(err)?.to_rgba8();
    let image = ImageData {
        width: rgba.width() as usize,
        height: rgba.height() as usize,
        bytes: Cow::Owned(rgba.into_raw()),
    };
    Clipboard::new().map_err(err)?.set_image(image).map_err(err)
}
