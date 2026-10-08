export function toDatetimeLocal(iso?: string): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function fromDatetimeLocal(local: string): string | undefined {
  if (!local) return undefined;
  const d = new Date(local);
  if (Number.isNaN(d.getTime())) return undefined;
  return d.toISOString();
}

export function formatRelative(iso: string): string {
  const target = new Date(iso).getTime();
  const diff = target - Date.now();
  const abs = Math.abs(diff);
  const min = Math.round(abs / 60000);
  if (min < 1) return diff > 0 ? "dans qq sec" : "à l'instant";
  if (min < 60) return diff > 0 ? `dans ${min} min` : `il y a ${min} min`;
  const h = Math.round(min / 60);
  if (h < 24) return diff > 0 ? `dans ${h} h` : `il y a ${h} h`;
  const d = Math.round(h / 24);
  return diff > 0 ? `dans ${d} j` : `il y a ${d} j`;
}

/** Son système Windows joué par le toast (noms reconnus par `tauri-winrt-notification`). */
const SYSTEM_SOUND = "Reminder";

/**
 * Notification système via le plugin Tauri (vrai toast Windows, même app en arrière-plan).
 * Avec `sound`, c'est Windows qui joue le son du toast : il reste audible fenêtre réduite,
 * contrairement à l'audio de la WebView. Sans `sound`, le toast est muet (comportement de
 * `notify-rust` quand aucun son n'est fourni). Repli sur l'API Web `Notification` + carillon
 * Web Audio si le plugin est indisponible (aperçu navigateur) ou refusé.
 */
export async function fireAlarmNotification(
  title: string,
  body: string,
  { sound = false }: { sound?: boolean } = {},
): Promise<void> {
  try {
    const mod = await import("@tauri-apps/plugin-notification");
    let granted = await mod.isPermissionGranted();
    if (!granted) {
      const perm = await mod.requestPermission();
      granted = perm === "granted";
    }
    if (granted) {
      // Await so any failure inside the plugin propagates into the catch
      // below instead of becoming a silent unhandled rejection.
      await mod.sendNotification({ title, body, ...(sound ? { sound: SYSTEM_SOUND } : {}) });
      return;
    }
    console.warn(
      "[alarm] Tauri notification permission denied, falling back to Web API",
    );
  } catch (err) {
    console.warn("[alarm] Tauri notification failed:", err);
  }

  if (sound) playAlarmSound();
  try {
    if ("Notification" in window) {
      if (Notification.permission === "granted") {
        new Notification(title, { body, silent: true });
      } else if (Notification.permission !== "denied") {
        Notification.requestPermission().then((p) => {
          if (p === "granted") new Notification(title, { body, silent: true });
        });
      } else {
        console.warn("[alarm] Web Notification permission denied");
      }
    } else {
      console.warn("[alarm] No notification API available in this runtime");
    }
  } catch (err) {
    console.warn("[alarm] Web notification fallback failed:", err);
  }
}

/** Best-effort permission warm-up so notifications work when the alarm fires. */
export async function requestNotificationPermission(): Promise<void> {
  try {
    const mod = await import("@tauri-apps/plugin-notification");
    const granted = await mod.isPermissionGranted();
    if (!granted) await mod.requestPermission();
    return;
  } catch {
    // Fallback: Web API.
  }
  if (
    "Notification" in window &&
    Notification.permission === "default"
  ) {
    Notification.requestPermission().catch(() => {});
  }
}

/**
 * Play a short two-note chime via the Web Audio API. No asset file needed —
 * the tones are synthesized at runtime so the alarm is audible even in a
 * fresh build. Best-effort: stays silent if the audio context fails (e.g.
 * autoplay policy before any user gesture, which shouldn't happen here
 * since the user has interacted with the app).
 */
export function playAlarmSound(): void {
  type Win = Window & {
    webkitAudioContext?: typeof AudioContext;
  };
  const w = window as Win;
  const Ctx = window.AudioContext ?? w.webkitAudioContext;
  if (!Ctx) return;

  let ctx: AudioContext;
  try {
    ctx = new Ctx();
  } catch {
    return;
  }

  function tone(freq: number, startOffset: number, durationMs: number) {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "sine";
    osc.frequency.value = freq;
    const start = ctx.currentTime + startOffset;
    const stop = start + durationMs / 1000;
    gain.gain.setValueAtTime(0, start);
    // Quick attack, smooth decay — avoids the click of a hard-cut envelope.
    gain.gain.linearRampToValueAtTime(0.25, start + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, stop);
    osc.connect(gain).connect(ctx.destination);
    osc.start(start);
    osc.stop(stop);
  }

  try {
    // Two-note chime: high then a touch lower, ~600ms total.
    tone(880, 0, 220);
    tone(660, 0.18, 320);
  } catch {
    // ignore
  }

  // Close the context after the chime finishes so we don't leak audio nodes.
  window.setTimeout(() => {
    ctx.close().catch(() => {});
  }, 800);
}
