// T038-T051 (028): Process monitor for automatic game launch detection
// This module monitors for the target process and emits events when it starts/stops

use std::sync::atomic::{AtomicBool, AtomicU64, Ordering};
use std::sync::Mutex;
use std::thread;
use std::time::{Duration, Instant};
use tauri::{AppHandle, Emitter, Runtime};

use crate::settings;
use crate::target_window;

// T039: ProcessMonitorState struct
pub struct ProcessMonitorState {
    /// Whether monitoring is active
    is_monitoring: AtomicBool,
    /// Whether target process was found in last check
    target_process_found: AtomicBool,
    /// HWND of target window (0 if not found)
    target_hwnd: AtomicU64,
    /// Last check timestamp
    last_check_time: Mutex<Instant>,
    /// User manually hid the overlay (don't auto-show until new game session)
    user_manually_hidden: AtomicBool,
    /// Polling interval in milliseconds
    polling_interval_ms: u64,
}

impl Default for ProcessMonitorState {
    fn default() -> Self {
        Self {
            is_monitoring: AtomicBool::new(false),
            target_process_found: AtomicBool::new(false),
            target_hwnd: AtomicU64::new(0),
            last_check_time: Mutex::new(Instant::now()),
            user_manually_hidden: AtomicBool::new(false),
            polling_interval_ms: settings::get_process_monitor_interval(),
        }
    }
}

impl ProcessMonitorState {
    pub fn is_monitoring(&self) -> bool {
        self.is_monitoring.load(Ordering::SeqCst)
    }

    pub fn set_monitoring(&self, value: bool) {
        self.is_monitoring.store(value, Ordering::SeqCst);
    }

    pub fn is_target_found(&self) -> bool {
        self.target_process_found.load(Ordering::SeqCst)
    }

    pub fn set_target_found(&self, value: bool) {
        self.target_process_found.store(value, Ordering::SeqCst);
    }

    pub fn get_target_hwnd(&self) -> u64 {
        self.target_hwnd.load(Ordering::SeqCst)
    }

    pub fn set_target_hwnd(&self, hwnd: u64) {
        self.target_hwnd.store(hwnd, Ordering::SeqCst);
    }

    pub fn is_user_manually_hidden(&self) -> bool {
        self.user_manually_hidden.load(Ordering::SeqCst)
    }

    // T050: Set user manually hidden flag
    pub fn set_user_manually_hidden(&self, value: bool) {
        self.user_manually_hidden.store(value, Ordering::SeqCst);
    }

    // T051: Reset user manually hidden flag on fresh game launch
    pub fn reset_for_new_session(&self) {
        self.user_manually_hidden.store(false, Ordering::SeqCst);
    }

    pub fn update_last_check(&self) {
        if let Ok(mut time) = self.last_check_time.lock() {
            *time = Instant::now();
        }
    }
}

// Global state for process monitor
lazy_static::lazy_static! {
    pub static ref PROCESS_MONITOR_STATE: ProcessMonitorState = ProcessMonitorState::default();
}

// T040: Check if target process is running by looking for matching windows
#[cfg(windows)]
pub fn is_process_running() -> bool {
    // Use the existing detection to check if process is running
    let result = target_window::find_target_window_verified();

    // Process is running if we found any candidates with matching process name
    let target_process = settings::get_target_process_name().to_lowercase();
    result.candidates_evaluated.iter().any(|c| {
        c.process_name.to_lowercase() == target_process
    })
}

#[cfg(not(windows))]
pub fn is_process_running() -> bool {
    false
}

// Event payload for process events
#[derive(Clone, serde::Serialize)]
pub struct ProcessEventPayload {
    pub process_name: String,
    pub detected: bool,
}

// T041, T042: Start process monitor thread
pub fn start_process_monitor<R: Runtime>(app_handle: AppHandle<R>) {
    // Don't start if already monitoring
    if PROCESS_MONITOR_STATE.is_monitoring() {
        log::debug!("Process monitor already running");
        return;
    }

    PROCESS_MONITOR_STATE.set_monitoring(true);
    let interval = PROCESS_MONITOR_STATE.polling_interval_ms;
    let target_process = settings::get_target_process_name().to_string();

    log::info!(
        "Starting process monitor for '{}' with {}ms interval",
        target_process, interval
    );

    thread::spawn(move || {
        let mut was_running = false;

        loop {
            // Check if we should stop monitoring
            if !PROCESS_MONITOR_STATE.is_monitoring() {
                log::info!("Process monitor stopped");
                break;
            }

            let is_running = is_process_running();

            // T043, T044, T045, T046: Detect state changes
            if is_running && !was_running {
                // Process just started
                log::info!("Target process detected: {}", target_process);

                // T051: Reset user_manually_hidden for new session
                PROCESS_MONITOR_STATE.reset_for_new_session();
                PROCESS_MONITOR_STATE.set_target_found(true);

                // T045: Emit process detected event
                let payload = ProcessEventPayload {
                    process_name: target_process.clone(),
                    detected: true,
                };
                let _ = app_handle.emit("target-process-detected", payload);

                // T049: Auto-show overlay if window is focused and not manually hidden
                #[cfg(windows)]
                {
                    let detection = target_window::find_target_window_verified();
                    if detection.success {
                        if let Some(ref matched) = detection.matched_window {
                            let hwnd = target_window::u64_to_hwnd(matched.hwnd);
                            PROCESS_MONITOR_STATE.set_target_hwnd(matched.hwnd);

                            if target_window::is_target_focused(hwnd) {
                                if !PROCESS_MONITOR_STATE.is_user_manually_hidden() {
                                    log::info!("Target focused on launch - emitting auto-show event");
                                    let _ = app_handle.emit("auto-show-overlay", ());
                                } else {
                                    log::debug!("Target focused but user manually hidden - not auto-showing");
                                }
                            }
                        }
                    }
                }
            } else if !is_running && was_running {
                // Process just stopped
                log::info!("Target process terminated");

                PROCESS_MONITOR_STATE.set_target_found(false);
                PROCESS_MONITOR_STATE.set_target_hwnd(0);

                // T046: Emit process terminated event
                let payload = ProcessEventPayload {
                    process_name: target_process.clone(),
                    detected: false,
                };
                let _ = app_handle.emit("target-process-terminated", payload);
            }

            was_running = is_running;
            PROCESS_MONITOR_STATE.update_last_check();

            // Sleep for polling interval
            thread::sleep(Duration::from_millis(interval));
        }
    });
}

// Stop the process monitor
pub fn stop_process_monitor() {
    PROCESS_MONITOR_STATE.set_monitoring(false);
}
