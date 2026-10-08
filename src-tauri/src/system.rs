//! Commandes système : écriture de fichier binaire, détection et lancement de navigateurs.

/// Write raw bytes to `path`. Used to export the annotated image.
#[tauri::command]
pub fn save_binary_file(path: String, data: Vec<u8>) -> Result<(), String> {
    std::fs::write(&path, data).map_err(|e| format!("Écriture impossible : {}", e))?;
    Ok(())
}

#[derive(Debug, serde::Serialize)]
pub struct DetectedBrowser {
    name: String,
    path: String,
}

#[tauri::command]
pub fn detect_browsers() -> Vec<DetectedBrowser> {
    let candidates: &[(&str, &[&str])] = &[
        (
            "Chrome",
            &[
                r"C:\Program Files\Google\Chrome\Application\chrome.exe",
                r"C:\Program Files (x86)\Google\Chrome\Application\chrome.exe",
            ],
        ),
        (
            "Edge",
            &[
                r"C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe",
                r"C:\Program Files\Microsoft\Edge\Application\msedge.exe",
            ],
        ),
        (
            "Firefox",
            &[
                r"C:\Program Files\Mozilla Firefox\firefox.exe",
                r"C:\Program Files (x86)\Mozilla Firefox\firefox.exe",
            ],
        ),
        (
            "Brave",
            &[
                r"C:\Program Files\BraveSoftware\Brave-Browser\Application\brave.exe",
                r"C:\Program Files (x86)\BraveSoftware\Brave-Browser\Application\brave.exe",
            ],
        ),
    ];
    let mut found = Vec::new();
    for (name, paths) in candidates {
        for path in *paths {
            if std::path::Path::new(path).exists() {
                found.push(DetectedBrowser {
                    name: name.to_string(),
                    path: path.to_string(),
                });
                break;
            }
        }
    }
    found
}

#[tauri::command]
pub fn open_url_with(path: String, url: String) -> Result<(), String> {
    std::process::Command::new(&path)
        .arg(&url)
        .spawn()
        .map(|_| ())
        .map_err(|e| format!("Échec du lancement : {}", e))
}
