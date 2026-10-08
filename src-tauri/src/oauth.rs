//! Flux OAuth Google par redirection loopback (127.0.0.1:<port>).

use std::collections::HashMap;
use std::io::{BufRead, BufReader, Read, Write};
use std::net::TcpListener;
use std::sync::Mutex;
use std::time::Duration;

/// Listeners OAuth en attente, indexés par jeton.
#[derive(Default)]
pub struct OAuthState {
    listeners: Mutex<HashMap<String, TcpListener>>,
}

#[derive(Debug, serde::Serialize)]
pub struct OAuthLoopback {
    redirect_uri: String,
    code: String,
    state: String,
}

/// Reserve a loopback redirect URI for a Google OAuth flow.
///
/// Two-step flow because Google's auth URL must include the exact redirect
/// URI BEFORE the browser opens, but the same TCP listener must still be
/// alive when Google redirects back. So the JS side calls this command,
/// gets a port + a token, opens the browser to the constructed auth URL,
/// then calls `await_oauth_callback(token)` which blocks until the
/// browser hits the loopback. We keep the listener in app state keyed by
/// `token` (a random short id) in case multiple flows ever overlap.
#[tauri::command]
pub fn start_oauth_listener(state: tauri::State<OAuthState>) -> Result<OAuthListenerHandle, String> {
    let listener = TcpListener::bind("127.0.0.1:0")
        .map_err(|e| format!("Impossible d'ouvrir le port loopback : {}", e))?;
    let port = listener
        .local_addr()
        .map_err(|e| e.to_string())?
        .port();
    let token: String = format!("{:x}", rand_u128());
    let mut slots = state.listeners.lock().map_err(|e| e.to_string())?;
    slots.insert(token.clone(), listener);
    Ok(OAuthListenerHandle {
        token,
        redirect_uri: format!("http://127.0.0.1:{}/", port),
    })
}

#[derive(Debug, serde::Serialize)]
pub struct OAuthListenerHandle {
    token: String,
    redirect_uri: String,
}

#[tauri::command]
pub fn await_oauth_callback(
    state: tauri::State<OAuthState>,
    token: String,
    expected_state: String,
) -> Result<OAuthLoopback, String> {
    let listener = {
        let mut slots = state.listeners.lock().map_err(|e| e.to_string())?;
        slots.remove(&token).ok_or_else(|| {
            "Aucun listener OAuth associé à ce token (déjà consommé ou inconnu).".to_string()
        })?
    };
    // Hard 5-minute cap so a never-arriving callback can't leak a thread.
    listener
        .set_nonblocking(false)
        .map_err(|e| e.to_string())?;
    let port = listener
        .local_addr()
        .map_err(|e| e.to_string())?
        .port();
    let redirect_uri = format!("http://127.0.0.1:{}/", port);

    let deadline = std::time::Instant::now() + Duration::from_secs(300);
    loop {
        if std::time::Instant::now() >= deadline {
            return Err("Timeout : aucune redirection OAuth reçue (5 min).".to_string());
        }
        listener
            .set_nonblocking(true)
            .map_err(|e| e.to_string())?;
        match listener.accept() {
            Ok((mut stream, _)) => {
                stream
                    .set_read_timeout(Some(Duration::from_secs(5)))
                    .ok();
                // Read the request line (e.g. "GET /?code=...&state=... HTTP/1.1").
                let mut reader = BufReader::new(&stream);
                let mut request_line = String::new();
                reader.read_line(&mut request_line).map_err(|e| e.to_string())?;
                // Drain remaining headers so the client doesn't see a RST.
                let mut buf = [0u8; 1024];
                let _ = (&stream).read(&mut buf);

                let (code, state_param) = parse_oauth_query(&request_line)?;
                if state_param != expected_state {
                    let _ = respond(
                        &mut stream,
                        "Paramètre state invalide. Vous pouvez fermer cet onglet.",
                    );
                    return Err("State OAuth invalide — possible CSRF.".to_string());
                }
                let _ = respond(
                    &mut stream,
                    "Connexion réussie. Vous pouvez fermer cet onglet et revenir dans yuri2.",
                );
                return Ok(OAuthLoopback {
                    redirect_uri,
                    code,
                    state: state_param,
                });
            }
            Err(ref e) if e.kind() == std::io::ErrorKind::WouldBlock => {
                std::thread::sleep(Duration::from_millis(150));
                continue;
            }
            Err(e) => return Err(format!("Erreur accept : {}", e)),
        }
    }
}

fn parse_oauth_query(request_line: &str) -> Result<(String, String), String> {
    // request_line ~= "GET /?code=XXX&state=YYY HTTP/1.1"
    let path = request_line.split_whitespace().nth(1).unwrap_or("");
    let query = path.split_once('?').map(|(_, q)| q).unwrap_or("");
    let mut code = None;
    let mut state = None;
    for pair in query.split('&') {
        if let Some((k, v)) = pair.split_once('=') {
            let decoded = url_decode(v);
            match k {
                "code" => code = Some(decoded),
                "state" => state = Some(decoded),
                "error" => return Err(format!("Google a refusé : {}", decoded)),
                _ => {}
            }
        }
    }
    Ok((
        code.ok_or_else(|| "Paramètre code manquant dans la redirection.".to_string())?,
        state.ok_or_else(|| "Paramètre state manquant dans la redirection.".to_string())?,
    ))
}

fn url_decode(s: &str) -> String {
    let bytes = s.as_bytes();
    let mut out = Vec::with_capacity(bytes.len());
    let mut i = 0;
    while i < bytes.len() {
        match bytes[i] {
            b'+' => {
                out.push(b' ');
                i += 1;
            }
            b'%' if i + 2 < bytes.len() => {
                let hex = std::str::from_utf8(&bytes[i + 1..i + 3]).unwrap_or("00");
                out.push(u8::from_str_radix(hex, 16).unwrap_or(0));
                i += 3;
            }
            c => {
                out.push(c);
                i += 1;
            }
        }
    }
    String::from_utf8_lossy(&out).into_owned()
}

fn respond(stream: &mut std::net::TcpStream, body: &str) -> std::io::Result<()> {
    let html = format!(
        "<!doctype html><html lang=\"fr\"><head><meta charset=\"utf-8\"><title>yuri2</title><style>body{{font-family:system-ui;padding:3rem;text-align:center;color:#1f2937}}</style></head><body><h1>{}</h1></body></html>",
        body
    );
    let res = format!(
        "HTTP/1.1 200 OK\r\nContent-Type: text/html; charset=utf-8\r\nContent-Length: {}\r\nConnection: close\r\n\r\n{}",
        html.len(),
        html
    );
    stream.write_all(res.as_bytes())?;
    stream.flush()?;
    Ok(())
}

fn rand_u128() -> u128 {
    // Combine the system clock with a stack address as a cheap, no-dep
    // entropy source — only used to keep concurrent OAuth flows apart.
    use std::time::{SystemTime, UNIX_EPOCH};
    let nanos = SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .map(|d| d.as_nanos())
        .unwrap_or(0);
    let stack: u128 = (&nanos as *const _ as usize) as u128;
    nanos ^ stack.wrapping_mul(0x9E3779B97F4A7C15)
}
