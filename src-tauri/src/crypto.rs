//! Chiffrement des secrets stockés dans `groups.content`.
//!
//! Les champs sensibles (`password`, `accessToken`, `refreshToken`) sont chiffrés en
//! AES-256-GCM à l'écriture en base et déchiffrés à la lecture : le frontend ne voit
//! que des valeurs en clair, la base ne contient que `enc:v1:<base64(nonce|chiffré)>`.
//!
//! La clé (32 octets aléatoires) est rangée dans un fichier à côté de la base, ce qui
//! garde le mode portable fonctionnel (dossier copiable d'un PC à l'autre). Sans ce
//! fichier, les secrets sont illisibles.

use aes_gcm::aead::{Aead, AeadCore, KeyInit, OsRng};
use aes_gcm::{Aes256Gcm, Key, Nonce};
use base64::engine::general_purpose::STANDARD as B64;
use base64::Engine;
use serde_json::Value;
use std::path::Path;

const PREFIX: &str = "enc:v1:";
const NONCE_LEN: usize = 12;
const SECRET_KEYS: &[&str] = &["password", "accessToken", "refreshToken"];

pub struct Cipher(Aes256Gcm);

impl Cipher {
    /// Lit la clé, ou la crée si le fichier n'existe pas encore.
    pub fn load_or_create(path: &Path) -> Result<Self, String> {
        let key = match std::fs::read(path) {
            Ok(bytes) if bytes.len() == 32 => bytes,
            Ok(_) => return Err(format!("Clé de chiffrement invalide : {}", path.display())),
            Err(e) if e.kind() == std::io::ErrorKind::NotFound => {
                let key = Aes256Gcm::generate_key(OsRng).to_vec();
                std::fs::write(path, &key)
                    .map_err(|e| format!("Écriture de la clé impossible : {}", e))?;
                key
            }
            Err(e) => return Err(format!("Lecture de la clé impossible : {}", e)),
        };
        Ok(Self(Aes256Gcm::new(Key::<Aes256Gcm>::from_slice(&key))))
    }

    fn encrypt(&self, plain: &str) -> Option<String> {
        let nonce = Aes256Gcm::generate_nonce(OsRng);
        let mut out = nonce.to_vec();
        out.extend(self.0.encrypt(&nonce, plain.as_bytes()).ok()?);
        Some(format!("{}{}", PREFIX, B64.encode(out)))
    }

    fn decrypt(&self, sealed: &str) -> Option<String> {
        let raw = B64.decode(sealed.strip_prefix(PREFIX)?).ok()?;
        if raw.len() < NONCE_LEN {
            return None;
        }
        let (nonce, data) = raw.split_at(NONCE_LEN);
        let plain = self.0.decrypt(Nonce::from_slice(nonce), data).ok()?;
        String::from_utf8(plain).ok()
    }

    /// Chiffre les secrets encore en clair. Contenu inchangé s'il n'y a rien à faire.
    pub fn seal(&self, content: &str) -> String {
        self.transform(content, &|s| {
            if s.is_empty() || s.starts_with(PREFIX) {
                None
            } else {
                self.encrypt(s)
            }
        })
    }

    /// Déchiffre les secrets. Une valeur indéchiffrable (clé différente) est laissée
    /// telle quelle : elle sera réécrite à l'identique, sans perte.
    pub fn open(&self, content: &str) -> String {
        self.transform(content, &|s| self.decrypt(s))
    }

    fn transform(&self, content: &str, f: &dyn Fn(&str) -> Option<String>) -> String {
        let Ok(mut value) = serde_json::from_str::<Value>(content) else {
            return content.to_string();
        };
        if walk(&mut value, f) {
            serde_json::to_string(&value).unwrap_or_else(|_| content.to_string())
        } else {
            content.to_string()
        }
    }
}

/// Applique `f` à chaque chaîne rangée sous une clé sensible. Renvoie `true` si modifié.
fn walk(value: &mut Value, f: &dyn Fn(&str) -> Option<String>) -> bool {
    let mut changed = false;
    match value {
        Value::Object(map) => {
            for (k, v) in map.iter_mut() {
                match v {
                    Value::String(s) if SECRET_KEYS.contains(&k.as_str()) => {
                        if let Some(next) = f(s) {
                            *s = next;
                            changed = true;
                        }
                    }
                    _ => changed |= walk(v, f),
                }
            }
        }
        Value::Array(items) => {
            for v in items {
                changed |= walk(v, f);
            }
        }
        _ => {}
    }
    changed
}

#[cfg(test)]
mod tests {
    use super::*;

    fn cipher() -> Cipher {
        Cipher(Aes256Gcm::new(&Aes256Gcm::generate_key(OsRng)))
    }

    #[test]
    fn roundtrip() {
        let c = cipher();
        let content = r#"{"tabs":[{"entries":[{"name":"Box","password":"k8#Pz!w2Qm","username":"admin"}]}],"tokens":{"accessToken":"a","refreshToken":"r"}}"#;
        let sealed = c.seal(content);
        assert!(!sealed.contains("k8#Pz!w2Qm"));
        assert!(sealed.contains("admin"));
        assert_eq!(c.seal(&sealed), sealed, "pas de double chiffrement");
        let opened: Value = serde_json::from_str(&c.open(&sealed)).unwrap();
        assert_eq!(opened, serde_json::from_str::<Value>(content).unwrap());
    }

    #[test]
    fn untouched_without_secrets() {
        let c = cipher();
        let content = r#"{"b":1,"a":"x"}"#;
        assert_eq!(c.seal(content), content);
        assert_eq!(c.open(content), content);
    }

    #[test]
    fn wrong_key_keeps_value() {
        let sealed = cipher().seal(r#"{"password":"secret"}"#);
        assert_eq!(cipher().open(&sealed), sealed);
    }
}
