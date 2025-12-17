use std::sync::atomic::{AtomicU64, Ordering};
use std::time::{SystemTime, UNIX_EPOCH};
use tauri::Emitter;
use tauri_plugin_global_shortcut::{Code, GlobalShortcutExt, Modifiers, Shortcut, ShortcutState};

// Debounce time in milliseconds
const DEBOUNCE_MS: u64 = 200;

// Last press timestamps for debouncing (separate for each hotkey)
static LAST_PRESS_F3: AtomicU64 = AtomicU64::new(0);
static LAST_PRESS_F5: AtomicU64 = AtomicU64::new(0);

fn current_time_ms() -> u64 {
    SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .unwrap_or_default()
        .as_millis() as u64
}

/// Build the global shortcut plugin with F3 and F5 handlers
/// F3: Toggle visibility (show/hide)
/// F5: Toggle mode (click-through/interactive)
pub fn build_shortcut_plugin<R: tauri::Runtime>() -> tauri_plugin_global_shortcut::Builder<R> {
    tauri_plugin_global_shortcut::Builder::new().with_handler(
        move |app: &tauri::AppHandle<R>, shortcut: &Shortcut, event| {
            if event.state != ShortcutState::Pressed {
                return;
            }

            let now = current_time_ms();

            // F3: Toggle visibility (show/hide)
            if shortcut.matches(Modifiers::empty(), Code::F3) {
                let last = LAST_PRESS_F3.load(Ordering::SeqCst);
                if now - last < DEBOUNCE_MS {
                    return;
                }
                LAST_PRESS_F3.store(now, Ordering::SeqCst);

                if let Err(e) = app.emit("toggle-visibility", ()) {
                    eprintln!("Failed to emit toggle-visibility event: {}", e);
                }
                return;
            }

            // F5: Toggle mode (click-through/interactive)
            if shortcut.matches(Modifiers::empty(), Code::F5) {
                let last = LAST_PRESS_F5.load(Ordering::SeqCst);
                if now - last < DEBOUNCE_MS {
                    return;
                }
                LAST_PRESS_F5.store(now, Ordering::SeqCst);

                if let Err(e) = app.emit("toggle-mode", ()) {
                    eprintln!("Failed to emit toggle-mode event: {}", e);
                }
            }
        },
    )
}

/// Register global shortcuts (F3 and F5)
pub fn register_shortcuts<R: tauri::Runtime>(app: &tauri::AppHandle<R>) -> Result<(), String> {
    let shortcut_manager = app.global_shortcut();

    // Unregister first in case already registered
    let _ = shortcut_manager.unregister("F3");
    let _ = shortcut_manager.unregister("F5");

    // Register F3 for visibility toggle
    shortcut_manager
        .register("F3")
        .map_err(|e| format!("Failed to register F3 hotkey: {}", e))?;

    // Register F5 for mode toggle
    shortcut_manager
        .register("F5")
        .map_err(|e| format!("Failed to register F5 hotkey: {}", e))?;

    Ok(())
}
