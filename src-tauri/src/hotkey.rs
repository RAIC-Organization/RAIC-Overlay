use std::sync::atomic::{AtomicU64, Ordering};
use std::time::{SystemTime, UNIX_EPOCH};
use tauri::Emitter;
use tauri_plugin_global_shortcut::{Code, GlobalShortcutExt, Modifiers, Shortcut, ShortcutState};

// T026: Debounce time in milliseconds (updated from 50 to 200 per spec requirement)
const DEBOUNCE_MS: u64 = 200;

// Last press timestamp for debouncing
static LAST_PRESS: AtomicU64 = AtomicU64::new(0);

fn current_time_ms() -> u64 {
    SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .unwrap_or_default()
        .as_millis() as u64
}

/// Build the global shortcut plugin with F3 handler
pub fn build_shortcut_plugin<R: tauri::Runtime>() -> tauri_plugin_global_shortcut::Builder<R> {
    tauri_plugin_global_shortcut::Builder::new().with_handler(
        move |app: &tauri::AppHandle<R>, shortcut: &Shortcut, event| {
            if event.state != ShortcutState::Pressed {
                return;
            }

            // Check if this is F3 without modifiers
            if !shortcut.matches(Modifiers::empty(), Code::F3) {
                return;
            }

            // Debounce rapid presses
            let now = current_time_ms();
            let last = LAST_PRESS.load(Ordering::SeqCst);
            if now - last < DEBOUNCE_MS {
                return;
            }
            LAST_PRESS.store(now, Ordering::SeqCst);

            // Emit toggle event to frontend
            if let Err(e) = app.emit("toggle-overlay", ()) {
                eprintln!("Failed to emit toggle-overlay event: {}", e);
            }
        },
    )
}

/// Register the F3 global shortcut
pub fn register_f3_shortcut<R: tauri::Runtime>(app: &tauri::AppHandle<R>) -> Result<(), String> {
    let shortcut_manager = app.global_shortcut();

    // Try to unregister first in case it's already registered from a previous instance
    let _ = shortcut_manager.unregister("F3");

    // Now register the shortcut
    shortcut_manager
        .register("F3")
        .map_err(|e| format!("Failed to register F3 hotkey: {}", e))
}
