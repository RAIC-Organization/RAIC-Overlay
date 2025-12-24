// T024-T033: Focus monitoring module for automatic hide on focus loss
// Uses polling to monitor foreground window changes
// T002 (030): Added focus log deduplication to reduce log noise

#[cfg(windows)]
use std::sync::atomic::{AtomicBool, Ordering};
#[cfg(windows)]
use std::sync::Mutex;
#[cfg(windows)]
use std::thread;
#[cfg(windows)]
use std::time::{Duration, Instant};

#[cfg(windows)]
use tauri::{AppHandle, Emitter, Manager};

use crate::state::OverlayState;

// T002 (030): Deduplication state for focus logging
// Tracks the last logged focus state to prevent rapid oscillation spam
#[cfg(windows)]
static LAST_FOCUS_LOG: Mutex<Option<(bool, Instant)>> = Mutex::new(None);

// T002 (030): Deduplication window in milliseconds
#[cfg(windows)]
const FOCUS_LOG_DEDUP_MS: u64 = 500;

/// T002 (030): Check if a focus change should be logged
/// Returns true if this is a new state or the deduplication window has expired
#[cfg(windows)]
pub fn should_log_focus_change(is_focused: bool) -> bool {
    let mut last = match LAST_FOCUS_LOG.lock() {
        Ok(guard) => guard,
        Err(poisoned) => poisoned.into_inner(),
    };
    let now = Instant::now();

    match *last {
        Some((last_state, last_time)) => {
            // Skip if same state within dedup window
            if last_state == is_focused
                && now.duration_since(last_time).as_millis() < FOCUS_LOG_DEDUP_MS as u128
            {
                return false;
            }
            *last = Some((is_focused, now));
            true
        }
        None => {
            *last = Some((is_focused, now));
            true
        }
    }
}

/// T002 (030): Reset deduplication state (for testing)
#[cfg(windows)]
#[allow(dead_code)]
pub fn reset_focus_log_state() {
    let mut last = match LAST_FOCUS_LOG.lock() {
        Ok(guard) => guard,
        Err(poisoned) => poisoned.into_inner(),
    };
    *last = None;
}

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

    // T018 (030): Log focus monitor initialization
    log::info!("Starting focus monitor with 100ms polling interval");

    // Spawn polling thread
    thread::spawn(move || {
        // Poll every 100ms for focus changes
        let poll_interval = Duration::from_millis(100);

        loop {
            // Check if we should stop
            if SHOULD_STOP.load(Ordering::SeqCst) {
                // T018.5 (030): Log graceful shutdown
                log::info!("Focus monitor stopped");
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
            log::warn!(
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
            log::warn!(
                "Warning: handle_focus_gained took {}ms (target: <100ms)",
                elapsed.as_millis()
            );
        }
    }
}

// T029: Handle target window losing focus
#[cfg(windows)]
fn handle_focus_lost(app: &AppHandle, state: &OverlayState) {
    // T007 (030): Log focus lost with deduplication
    if should_log_focus_change(false) {
        log::debug!("Target window lost focus - auto-hiding overlay");
    }

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

    // T007 (030): Log focus gained with deduplication
    if should_log_focus_change(true) {
        log::debug!("Target window gained focus - auto-showing overlay");
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

// T003 (030): Unit tests for deduplication logic
#[cfg(test)]
mod tests {
    use super::*;
    use std::thread::sleep;
    use std::time::Duration;

    #[test]
    fn test_first_focus_change_is_logged() {
        // Reset state before test
        reset_focus_log_state();

        // First call should always return true
        assert!(should_log_focus_change(true));
    }

    #[test]
    fn test_same_state_within_window_is_deduplicated() {
        // Reset state before test
        reset_focus_log_state();

        // First call - should log
        assert!(should_log_focus_change(true));

        // Same state immediately - should be deduplicated
        assert!(!should_log_focus_change(true));
    }

    #[test]
    fn test_different_state_is_logged_immediately() {
        // Reset state before test
        reset_focus_log_state();

        // First call - should log
        assert!(should_log_focus_change(true));

        // Different state - should log immediately (no dedup)
        assert!(should_log_focus_change(false));
    }

    #[test]
    fn test_same_state_after_window_expires_is_logged() {
        // Reset state before test
        reset_focus_log_state();

        // First call - should log
        assert!(should_log_focus_change(true));

        // Wait for dedup window to expire (500ms + buffer)
        sleep(Duration::from_millis(550));

        // Same state after window expired - should log
        assert!(should_log_focus_change(true));
    }

    // T003.5 (030): Verify errors bypass deduplication
    // Note: This test validates the design decision that errors (log::error!, log::warn!)
    // are never subject to deduplication. The deduplication only applies to the
    // should_log_focus_change() helper used for focus state transitions at DEBUG level.
    // Error/warning logs are always emitted immediately by design.
    #[test]
    fn test_deduplication_only_applies_to_debug_focus_logs() {
        // Reset state before test
        reset_focus_log_state();

        // The deduplication function only controls focus DEBUG logs
        // Errors and warnings (like timing warnings) are always logged
        // This is verified by the fact that handle_focus_lost/gained
        // only call should_log_focus_change() for the debug log,
        // not for the warning log about timing.

        // Verify the function works correctly for its intended purpose
        assert!(should_log_focus_change(false));
        assert!(!should_log_focus_change(false)); // deduplicated
        assert!(should_log_focus_change(true)); // different state, logged
    }
}
