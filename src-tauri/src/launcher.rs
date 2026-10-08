//! Lanceur d'applications : inventaire du menu Démarrer, icônes des fichiers et lancement.
//!
//! L'inventaire réunit les raccourcis des deux dossiers « Programmes » du menu Démarrer
//! (tous les utilisateurs + utilisateur courant) et les applications du Microsoft Store
//! remontées par `Get-StartApps`, lancées via `shell:AppsFolder\<AppID>`. Le lancement passe
//! par `ShellExecuteW`, qui accepte aussi bien un .exe qu'un raccourci, un document, un
//! dossier ou une URI (`ms-settings:`), et l'élévation (verbe `runas`).

use serde::{Deserialize, Serialize};
use std::collections::HashSet;
use std::path::{Path, PathBuf};

#[derive(Debug, Serialize)]
pub struct InstalledApp {
    name: String,
    path: String,
    /// Sous-dossier du menu Démarrer (« Accessories »…) ou « Microsoft Store ».
    folder: String,
}

/// Raccourcis sans intérêt dans un lanceur.
fn is_noise(name: &str) -> bool {
    let n = name.to_lowercase();
    ["uninstall", "désinstaller", "desinstaller", "readme", "lisez-moi", "release notes", "license", "licence"]
        .iter()
        .any(|w| n.contains(w))
}

fn scan_dir(root: &Path, dir: &Path, out: &mut Vec<InstalledApp>) {
    let Ok(entries) = std::fs::read_dir(dir) else { return };
    for entry in entries.flatten() {
        let path = entry.path();
        if path.is_dir() {
            scan_dir(root, &path, out);
            continue;
        }
        let ext = path.extension().and_then(|e| e.to_str()).unwrap_or("").to_lowercase();
        if !matches!(ext.as_str(), "lnk" | "url" | "appref-ms" | "exe") {
            continue;
        }
        let Some(name) = path.file_stem().and_then(|s| s.to_str()) else { continue };
        if is_noise(name) {
            continue;
        }
        let folder = path
            .parent()
            .and_then(|p| p.strip_prefix(root).ok())
            .map(|p| p.to_string_lossy().into_owned())
            .unwrap_or_default();
        out.push(InstalledApp {
            name: name.to_string(),
            path: path.to_string_lossy().into_owned(),
            folder,
        });
    }
}

fn start_menu_roots() -> Vec<PathBuf> {
    let rel = r"Microsoft\Windows\Start Menu\Programs";
    ["ProgramData", "APPDATA"]
        .iter()
        .filter_map(|var| std::env::var_os(var))
        .map(|base| PathBuf::from(base).join(rel))
        .collect()
}

#[derive(Deserialize)]
struct StartApp {
    #[serde(rename = "Name")]
    name: String,
    #[serde(rename = "AppID")]
    app_id: String,
}

/// Applications du Store (identifiant AUMID `Famille!App`), absentes des dossiers de raccourcis.
/// Échec silencieux : la liste des raccourcis suffit à elle seule.
#[cfg(windows)]
fn store_apps() -> Vec<InstalledApp> {
    use std::os::windows::process::CommandExt;
    const CREATE_NO_WINDOW: u32 = 0x0800_0000;
    let script = "[Console]::OutputEncoding=[Text.Encoding]::UTF8; Get-StartApps | ConvertTo-Json -Compress";
    let Ok(output) = std::process::Command::new("powershell.exe")
        .args(["-NoProfile", "-NonInteractive", "-Command", script])
        .creation_flags(CREATE_NO_WINDOW)
        .output()
    else {
        return Vec::new();
    };
    let text = String::from_utf8_lossy(&output.stdout);
    // Un seul résultat est sérialisé en objet, plusieurs en tableau.
    let apps: Vec<StartApp> = serde_json::from_str(text.trim())
        .or_else(|_| serde_json::from_str::<StartApp>(text.trim()).map(|a| vec![a]))
        .unwrap_or_default();
    apps.into_iter()
        .filter(|a| a.app_id.contains('!') && !is_noise(&a.name))
        .map(|a| InstalledApp {
            name: a.name,
            path: format!(r"shell:AppsFolder\{}", a.app_id),
            folder: "Microsoft Store".into(),
        })
        .collect()
}

#[cfg(not(windows))]
fn store_apps() -> Vec<InstalledApp> {
    Vec::new()
}

fn sorted_unique(mut apps: Vec<InstalledApp>) -> Vec<InstalledApp> {
    let mut seen = HashSet::new();
    apps.retain(|a| seen.insert(a.name.to_lowercase()));
    apps.sort_by_key(|a| a.name.to_lowercase());
    apps
}

/// Raccourcis du menu Démarrer, triés par nom, sans doublon de nom (quelques dizaines de ms).
#[tauri::command]
pub async fn list_start_menu_apps() -> Result<Vec<InstalledApp>, String> {
    tauri::async_runtime::spawn_blocking(|| {
        let mut apps = Vec::new();
        for root in start_menu_roots() {
            scan_dir(&root, &root, &mut apps);
        }
        sorted_unique(apps)
    })
    .await
    .map_err(|e| e.to_string())
}

/// Applications du Microsoft Store (plusieurs secondes : PowerShell est lancé à chaque appel).
#[tauri::command]
pub async fn list_store_apps() -> Result<Vec<InstalledApp>, String> {
    tauri::async_runtime::spawn_blocking(|| sorted_unique(store_apps()))
        .await
        .map_err(|e| e.to_string())
}

/// Remplace les `%VARIABLE%` par leur valeur (laissées telles quelles si inconnues).
fn expand_env(text: &str) -> String {
    let mut out = String::with_capacity(text.len());
    let mut rest = text;
    while let Some(start) = rest.find('%') {
        out.push_str(&rest[..start]);
        let after = &rest[start + 1..];
        match after.find('%') {
            Some(end) if end > 0 => match std::env::var(&after[..end]) {
                Ok(value) => {
                    out.push_str(&value);
                    rest = &after[end + 1..];
                }
                Err(_) => {
                    out.push('%');
                    rest = after;
                }
            },
            _ => {
                out.push('%');
                rest = after;
            }
        }
    }
    out.push_str(rest);
    out
}

#[cfg(windows)]
mod win {
    use super::expand_env;
    use base64::Engine;
    use std::ffi::c_void;
    use std::io::Cursor;
    use std::ptr::{null, null_mut};
    use windows_sys::Win32::Graphics::Gdi::{
        CreateCompatibleDC, DeleteDC, DeleteObject, GetDIBits, GetObjectW, BITMAP, BITMAPINFO, BITMAPINFOHEADER,
        BI_RGB, DIB_RGB_COLORS,
    };
    use windows_sys::Win32::System::Com::{CoInitializeEx, CoTaskMemFree, CoUninitialize, COINIT_APARTMENTTHREADED};
    use windows_sys::Win32::UI::Shell::Common::ITEMIDLIST;
    use windows_sys::Win32::UI::Shell::{
        SHGetFileInfoW, SHParseDisplayName, ShellExecuteW, SHFILEINFOW, SHGFI_ICON, SHGFI_LARGEICON, SHGFI_PIDL,
    };
    use windows_sys::Win32::UI::WindowsAndMessaging::{DestroyIcon, GetIconInfo, HICON, ICONINFO, SW_SHOWNORMAL};
    use xcap::image::{ImageFormat, RgbaImage};

    fn wide(s: &str) -> Vec<u16> {
        s.encode_utf16().chain(std::iter::once(0)).collect()
    }

    /// COM initialisé pour le thread courant le temps de la portée.
    pub struct ComGuard(bool);

    impl ComGuard {
        pub fn new() -> Self {
            // S_OK ou S_FALSE (déjà initialisé) : dans les deux cas, à équilibrer.
            ComGuard(unsafe { CoInitializeEx(null(), COINIT_APARTMENTTHREADED as u32) } >= 0)
        }
    }

    impl Drop for ComGuard {
        fn drop(&mut self) {
            if self.0 {
                unsafe { CoUninitialize() };
            }
        }
    }

    /// Lit les pixels d'un bitmap en BGRA 32 bits, de haut en bas.
    unsafe fn bitmap_bgra(hbm: *mut c_void) -> Option<(u32, u32, Vec<u8>)> {
        let mut bm: BITMAP = std::mem::zeroed();
        if GetObjectW(hbm, std::mem::size_of::<BITMAP>() as i32, &mut bm as *mut _ as *mut c_void) == 0 {
            return None;
        }
        let (w, h) = (bm.bmWidth, bm.bmHeight);
        if w <= 0 || h <= 0 {
            return None;
        }
        let mut info: BITMAPINFO = std::mem::zeroed();
        info.bmiHeader = BITMAPINFOHEADER {
            biSize: std::mem::size_of::<BITMAPINFOHEADER>() as u32,
            biWidth: w,
            biHeight: -h,
            biPlanes: 1,
            biBitCount: 32,
            biCompression: BI_RGB,
            ..std::mem::zeroed()
        };
        let mut buf = vec![0u8; (w * h * 4) as usize];
        let dc = CreateCompatibleDC(null_mut());
        let lines = GetDIBits(dc, hbm, 0, h as u32, buf.as_mut_ptr() as *mut c_void, &mut info, DIB_RGB_COLORS);
        DeleteDC(dc);
        (lines == h).then_some((w as u32, h as u32, buf))
    }

    /// Convertit une icône en PNG (data URL). Les icônes anciennes sans couche alpha
    /// prennent leur transparence dans le masque.
    unsafe fn icon_to_png(icon: HICON) -> Option<String> {
        let mut ii: ICONINFO = std::mem::zeroed();
        if GetIconInfo(icon, &mut ii) == 0 {
            return None;
        }
        let color = if ii.hbmColor.is_null() { None } else { bitmap_bgra(ii.hbmColor) };
        let mask = if ii.hbmMask.is_null() { None } else { bitmap_bgra(ii.hbmMask) };
        if !ii.hbmColor.is_null() {
            DeleteObject(ii.hbmColor);
        }
        if !ii.hbmMask.is_null() {
            DeleteObject(ii.hbmMask);
        }
        let (w, h, mut px) = color?;
        let has_alpha = px.chunks_exact(4).any(|p| p[3] != 0);
        for (i, p) in px.chunks_exact_mut(4).enumerate() {
            p.swap(0, 2);
            if !has_alpha {
                // Masque : blanc = transparent.
                let transparent = mask.as_ref().map_or(false, |(_, _, m)| m.get(i * 4).map_or(false, |&v| v != 0));
                p[3] = if transparent { 0 } else { 255 };
            }
        }
        let image = RgbaImage::from_raw(w, h, px)?;
        let mut png = Vec::new();
        image.write_to(&mut Cursor::new(&mut png), ImageFormat::Png).ok()?;
        Some(format!("data:image/png;base64,{}", base64::engine::general_purpose::STANDARD.encode(png)))
    }

    /// Icône 32 px d'un fichier, dossier ou élément `shell:` (applications du Store).
    pub fn icon_of(path: &str) -> Option<String> {
        let path = expand_env(path.trim());
        if path.is_empty() {
            return None;
        }
        unsafe {
            let mut pidl: *mut ITEMIDLIST = null_mut();
            if SHParseDisplayName(wide(&path).as_ptr(), null_mut(), &mut pidl, 0, null_mut()) < 0 || pidl.is_null() {
                return None;
            }
            let mut info: SHFILEINFOW = std::mem::zeroed();
            let ok = SHGetFileInfoW(
                pidl as *const u16,
                0,
                &mut info,
                std::mem::size_of::<SHFILEINFOW>() as u32,
                SHGFI_PIDL | SHGFI_ICON | SHGFI_LARGEICON,
            );
            CoTaskMemFree(pidl as *const c_void);
            if ok == 0 || info.hIcon.is_null() {
                return None;
            }
            let png = icon_to_png(info.hIcon);
            DestroyIcon(info.hIcon);
            png
        }
    }

    fn shell_error(code: usize) -> String {
        match code {
            0 | 8 => "mémoire insuffisante".into(),
            2 => "fichier introuvable".into(),
            3 => "chemin introuvable".into(),
            5 => "accès refusé ou élévation annulée".into(),
            26 => "violation de partage".into(),
            27 | 31 => "aucune application associée à ce type de fichier".into(),
            32 => "bibliothèque introuvable".into(),
            _ => format!("erreur {}", code),
        }
    }

    pub fn launch(path: &str, args: &str, cwd: &str, admin: bool) -> Result<(), String> {
        let file = wide(&expand_env(path.trim()));
        let params = wide(&expand_env(args.trim()));
        let dir = wide(&expand_env(cwd.trim()));
        let verb = wide("runas");
        let code = unsafe {
            ShellExecuteW(
                null_mut(),
                if admin { verb.as_ptr() } else { null() },
                file.as_ptr(),
                if args.trim().is_empty() { null() } else { params.as_ptr() },
                if cwd.trim().is_empty() { null() } else { dir.as_ptr() },
                SW_SHOWNORMAL,
            )
        } as usize;
        if code > 32 {
            Ok(())
        } else {
            Err(format!("Lancement impossible : {}.", shell_error(code)))
        }
    }
}

/// Icônes (data URL PNG) des chemins demandés, `None` quand Windows n'en fournit pas.
#[tauri::command]
pub async fn app_icons(paths: Vec<String>) -> Result<Vec<Option<String>>, String> {
    tauri::async_runtime::spawn_blocking(move || {
        #[cfg(windows)]
        {
            let _com = win::ComGuard::new();
            paths.iter().map(|p| win::icon_of(p)).collect()
        }
        #[cfg(not(windows))]
        {
            paths.iter().map(|_| None).collect()
        }
    })
    .await
    .map_err(|e| e.to_string())
}

/// Lance un programme, raccourci, document, dossier ou URI, éventuellement en administrateur.
#[tauri::command]
pub async fn launch_app(path: String, args: String, cwd: String, admin: bool) -> Result<(), String> {
    if path.trim().is_empty() {
        return Err("Aucun chemin à lancer.".into());
    }
    tauri::async_runtime::spawn_blocking(move || {
        #[cfg(windows)]
        {
            let _com = win::ComGuard::new();
            win::launch(&path, &args, &cwd, admin)
        }
        #[cfg(not(windows))]
        {
            let _ = (cwd, admin);
            std::process::Command::new(&path)
                .args(args.split_whitespace())
                .spawn()
                .map(|_| ())
                .map_err(|e| format!("Lancement impossible : {}", e))
        }
    })
    .await
    .map_err(|e| e.to_string())?
}
