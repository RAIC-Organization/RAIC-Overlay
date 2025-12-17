// T024-T033: Focus monitoring module for automatic hide on focus loss
// Uses polling to monitor foreground window changes

#[cfg(windows)]
use std::sync::atomic::{AtomicBool, Ordering};
#[cfg(windows)]
use std::thread;
#[cfg(windows)]
use std::time::Duration;

#[cfg(windows)]
use tauri::{AppHandle, Emitter, Manager};

use crate::state::OverlayState;
#[cfg(windows)]
use crate::target_window;
use crate::types::AutoHideChangedPayload;
#[cfg(windows)]
use crate::window;

// T024: Shutdown signal for the focus monitor thread
#[cfg(windows)]
static SHOULD_STOP: AtomicBool = AtomicBool::new(false);

// T026: Start focus monitoring with polling approach
#[cfg(windows)]
pub fn start_focus_monitor(app: AppHandle) {
    // Reset shutdown flag
    SHOULD_STOP.store(false, Ordering::SeqCst);

    // Spawn polling thread
    thread::spawn(move || {
        // Poll every 100ms for focus changes
        let poll_interval = Duration::from_millis(100);

        loop {
            // Check if we should stop
            if SHOULD_STOP.load(Ordering::SeqCst) {
                break;
            }

            // Handle focus check
            handle_focus_check(&app);

            // Sleep before next poll
            thread::sleep(poll_interval);
        }
    });
}

// T027: Stop focus monitoring
#[cfg(windows)]
pub fn stop_focus_monitor() {
    SHOULD_STOP.store(true, Ordering::SeqCst);
}

// Check if the overlay window itself is focused
#[cfg(windows)]
fn is_overlay_focused(app: &AppHandle) -> bool {
    use windows::Win32::Foundation::HWND;
    use windows::Win32::UI::WindowsAndMessaging::GetForegroundWindow;

    let Some(window) = app.get_webview_window("main") else {
        return false;
    };

    // Get the overlay's HWND
    let Ok(overlay_hwnd) = window.hwnd() else {
        return false;
    };

    // Get the current foreground window
    let foreground = unsafe { GetForegroundWindow() };

    // Compare the raw pointers
    HWND(overlay_hwnd.0) == foreground
}

// T028, T047: Handle focus check (polling approach) with timing instrumentation
#[cfg(windows)]
fn handle_focus_check(app: &AppHandle) {
    use std::time::Instant;

    let start = Instant::now();
    let state = app.state::<OverlayState>();

    // Only process if overlay is visible and bound to a target
    if !state.is_visible() || !state.target_binding.is_bound() {
        return;
    }

    // Get the stored target window handle
    let stored_hwnd = state.target_binding.get_hwnd();
    if stored_hwnd == 0 {
        return;
    }

    let target_hwnd = target_window::u64_to_hwnd(stored_hwnd);

    // Check if the target window is still valid
    if !target_window::is_window_valid(target_hwnd) {
        // Target window was closed
        handle_target_closed(app, &state);
        return;
    }

    // Check if target window is now focused
    let is_target_focused = target_window::is_target_focused(target_hwnd);

    // Check if the overlay itself is focused (F5 interactive mode)
    let is_overlay_active = is_overlay_focused(app);

    // Treat overlay focus as "target focused" to prevent auto-hide during F5 interaction
    let is_focused = is_target_focused || is_overlay_active;

    // Update focus state in target binding
    let was_focused = state.target_binding.is_focused();
    state.target_binding.set_focused(is_focused);

    // Handle focus transitions
    if was_focused && !is_focused {
        // T029: Target lost focus - auto-hide the overlay
        handle_focus_lost(app, &state);

        // T047: SC-004 validation - focus change response should be <100ms
        let elapsed = start.elapsed();
        if elapsed.as_millis() > 100 {
            eprintln!(
                "Warning: handle_focus_lost took {}ms (target: <100ms)",
                elapsed.as_millis()
            );
        }
    } else if !was_focused && is_focused {
        // T030: Target gained focus - auto-show the overlay
        handle_focus_gained(app, &state);

        // T047: SC-004 validation - focus change response should be <100ms
        let elapsed = start.elapsed();
        if elapsed.as_millis() > 100 {
            eprintln!(
                "Warning: handle_focus_gained took {}ms (target: <100ms)",
                elapsed.as_millis()
            );
        }
    }
}

// T029: Handle target window losing focus
#[cfg(windows)]
fn handle_focus_lost(app: &AppHandle, state: &OverlayState) {
    // Mark as auto-hidden (not user-initiated)
    state.set_auto_hidden(true);

    // Hide the overlay window
    if let Some(window) = app.get_webview_window("main") {
        let _ = window.hide();
    }

    // Emit auto-hide-changed event
    let payload = AutoHideChangedPayload {
        auto_hidden: true,
        reason: "focus_lost".to_string(),
    };
    let _ = app.emit("auto-hide-changed", payload);
}

// T030: Handle target window gaining focus
#[cfg(windows)]
fn handle_focus_gained(app: &AppHandle, state: &OverlayState) {
    // Only auto-show if it was auto-hidden (not user-hidden via F3)
    if !state.is_auto_hidden() {
        return;
    }

    // Get current target rect for repositioning
    let stored_hwnd = state.target_binding.get_hwnd();
    let target_hwnd = target_window::u64_to_hwnd(stored_hwnd);

    if let Ok(rect) = target_window::get_window_rect(target_hwnd) {
        // Update stored rect
        state.target_binding.set_rect(Some(rect));

        // Sync overlay position to target
        if let Some(window) = app.get_webview_window("main") {
            let _ = window::sync_overlay_to_target(&window, &rect);

            // Show the overlay
            let _ = window.show();
        }
    }

    // Clear auto-hidden flag
    state.set_auto_hidden(false);

    // Emit auto-hide-changed event
    let payload = AutoHideChangedPayload {
        auto_hidden: false,
        reason: "focus_gained".to_string(),
    };
    let _ = app.emit("auto-hide-changed", payload);
}

// T031: Handle target window being closed
#[cfg(windows)]
fn handle_target_closed(app: &AppHandle, state: &OverlayState) {
    // Clear the target binding
    state.target_binding.clear();

    // Hide the overlay
    state.set_visible(false);
    state.set_auto_hidden(false);

    if let Some(window) = app.get_webview_window("main") {
        let _ = window.hide();
    }

    // Emit auto-hide-changed event with target_closed reason
    let payload = AutoHideChangedPayload {
        auto_hidden: true,
        reason: "target_closed".to_string(),
    };
    let _ = app.emit("auto-hide-changed", payload);
}
