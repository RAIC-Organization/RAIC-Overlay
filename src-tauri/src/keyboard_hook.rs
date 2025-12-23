// T003-T019 (029): Low-level keyboard hook implementation
// Intercepts keyboard events at the OS kernel level before any application can consume them
// Follows the same pattern as process_monitor.rs (dedicated thread, global state, start/stop functions)

#![cfg(windows)]

use std::sync::atomic::{AtomicBool, AtomicU32, AtomicU64, AtomicPtr, Ordering};
use std::sync::Mutex;
use std::thread;
use std::time::{SystemTime, UNIX_EPOCH};
use std::ffi::c_void;

use tauri::{AppHandle, Emitter, Runtime};
use windows::Win32::Foundation::{GetLastError, LPARAM, LRESULT, WPARAM};
use windows::Win32::UI::WindowsAndMessaging::{
    CallNextHookEx, DispatchMessageW, GetMessageW, PostThreadMessageW, SetWindowsHookExW,
    TranslateMessage, UnhookWindowsHookEx, HC_ACTION, HHOOK, KBDLLHOOKSTRUCT, MSG,
    WH_KEYBOARD_LL, WM_KEYDOWN, WM_QUIT, WM_SYSKEYDOWN,
};

// T006: Virtual key code constants
/// F3 key - toggle visibility
pub const VK_F3: u32 = 0x72;
/// F5 key - toggle mode
pub const VK_F5: u32 = 0x74;

// T006: Debounce constant
/// Minimum time between hotkey triggers (milliseconds)
pub const DEBOUNCE_MS: u64 = 200;

// T005: HotkeyAction enum representing actions for detected hotkeys
#[derive(Debug, Clone, Copy, PartialEq)]
pub enum HotkeyAction {
    /// F3 pressed - toggle overlay visibility
    ToggleVisibility,
    /// F5 pressed - toggle overlay mode (click-through/interactive)
    ToggleMode,
}

// T004: KeyboardHookState struct with atomic fields
/// Represents the state of the low-level keyboard hook system
pub struct KeyboardHookState {
    /// Whether the hook is currently installed and running
    is_active: AtomicBool,
    /// The Windows hook handle (HHOOK), null if not installed
    hook_handle: AtomicPtr<c_void>,
    /// The thread ID running the message loop, 0 if not running
    thread_id: AtomicU32,
    /// Whether fallback to global shortcut is active
    use_fallback: AtomicBool,
    /// Last F3 press timestamp for debouncing
    last_f3_press: AtomicU64,
    /// Last F5 press timestamp for debouncing
    last_f5_press: AtomicU64,
    /// App handle for event emission (protected by mutex)
    app_handle: Mutex<Option<Box<dyn Fn(HotkeyAction) + Send + Sync>>>,
}

impl KeyboardHookState {
    pub const fn new() -> Self {
        Self {
            is_active: AtomicBool::new(false),
            hook_handle: AtomicPtr::new(std::ptr::null_mut()),
            thread_id: AtomicU32::new(0),
            use_fallback: AtomicBool::new(false),
            last_f3_press: AtomicU64::new(0),
            last_f5_press: AtomicU64::new(0),
            app_handle: Mutex::new(None),
        }
    }

    pub fn is_active(&self) -> bool {
        self.is_active.load(Ordering::SeqCst)
    }

    pub fn set_active(&self, value: bool) {
        self.is_active.store(value, Ordering::SeqCst);
    }

    pub fn get_hook_handle(&self) -> *mut c_void {
        self.hook_handle.load(Ordering::SeqCst)
    }

    pub fn set_hook_handle(&self, handle: *mut c_void) {
        self.hook_handle.store(handle, Ordering::SeqCst);
    }

    pub fn get_thread_id(&self) -> u32 {
        self.thread_id.load(Ordering::SeqCst)
    }

    pub fn set_thread_id(&self, id: u32) {
        self.thread_id.store(id, Ordering::SeqCst);
    }

    pub fn is_using_fallback(&self) -> bool {
        self.use_fallback.load(Ordering::SeqCst)
    }

    pub fn set_use_fallback(&self, value: bool) {
        self.use_fallback.store(value, Ordering::SeqCst);
    }

    pub fn get_last_f3_press(&self) -> u64 {
        self.last_f3_press.load(Ordering::SeqCst)
    }

    pub fn set_last_f3_press(&self, timestamp: u64) {
        self.last_f3_press.store(timestamp, Ordering::SeqCst);
    }

    pub fn get_last_f5_press(&self) -> u64 {
        self.last_f5_press.load(Ordering::SeqCst)
    }

    pub fn set_last_f5_press(&self, timestamp: u64) {
        self.last_f5_press.store(timestamp, Ordering::SeqCst);
    }

    pub fn set_event_emitter(&self, emitter: Box<dyn Fn(HotkeyAction) + Send + Sync>) {
        if let Ok(mut guard) = self.app_handle.lock() {
            *guard = Some(emitter);
        }
    }

    pub fn emit_action(&self, action: HotkeyAction) {
        if let Ok(guard) = self.app_handle.lock() {
            if let Some(ref emitter) = *guard {
                emitter(action);
            }
        }
    }
}

// T007: Global static KEYBOARD_HOOK_STATE using lazy_static
lazy_static::lazy_static! {
    pub static ref KEYBOARD_HOOK_STATE: KeyboardHookState = KeyboardHookState::new();
}

/// Get current time in milliseconds since UNIX epoch
fn current_time_ms() -> u64 {
    SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .unwrap_or_default()
        .as_millis() as u64
}

// T009, T010, T011: Low-level keyboard hook callback
/// Callback function for the low-level keyboard hook
/// Detects F3/F5 key presses and emits events
unsafe extern "system" fn keyboard_hook_callback(
    n_code: i32,
    w_param: WPARAM,
    l_param: LPARAM,
) -> LRESULT {
    // Only process if nCode is HC_ACTION
    if n_code == HC_ACTION as i32 {
        let msg_type = w_param.0 as u32;

        // Only process key down events (not key up)
        if msg_type == WM_KEYDOWN || msg_type == WM_SYSKEYDOWN {
            // Get keyboard event data
            let kb_struct = &*(l_param.0 as *const KBDLLHOOKSTRUCT);
            let vk_code = kb_struct.vkCode;
            let now = current_time_ms();

            // T009, T010, T024: Check for F3 (toggle visibility) with debounce and logging
            if vk_code == VK_F3 {
                let last_press = KEYBOARD_HOOK_STATE.get_last_f3_press();
                if now - last_press >= DEBOUNCE_MS {
                    KEYBOARD_HOOK_STATE.set_last_f3_press(now);
                    // T024: Log with timestamp
                    log::info!(
                        "F3 pressed: toggle visibility requested (low-level hook, timestamp={})",
                        now
                    );
                    KEYBOARD_HOOK_STATE.emit_action(HotkeyAction::ToggleVisibility);
                } else {
                    log::debug!(
                        "F3 pressed: debounced ({}ms since last, threshold={}ms)",
                        now - last_press,
                        DEBOUNCE_MS
                    );
                }
            }

            // T009, T010, T024: Check for F5 (toggle mode) with debounce and logging
            if vk_code == VK_F5 {
                let last_press = KEYBOARD_HOOK_STATE.get_last_f5_press();
                if now - last_press >= DEBOUNCE_MS {
                    KEYBOARD_HOOK_STATE.set_last_f5_press(now);
                    // T024: Log with timestamp
                    log::info!(
                        "F5 pressed: toggle mode requested (low-level hook, timestamp={})",
                        now
                    );
                    KEYBOARD_HOOK_STATE.emit_action(HotkeyAction::ToggleMode);
                } else {
                    log::debug!(
                        "F5 pressed: debounced ({}ms since last, threshold={}ms)",
                        now - last_press,
                        DEBOUNCE_MS
                    );
                }
            }
        }
    }

    // T011: Always call CallNextHookEx to pass events to other hooks (non-blocking)
    unsafe {
        CallNextHookEx(
            Some(HHOOK(KEYBOARD_HOOK_STATE.get_hook_handle())),
            n_code,
            w_param,
            l_param,
        )
    }
}

// T012, T013, T014, T015, T016: Start keyboard hook
/// Starts the low-level keyboard hook on a dedicated thread
/// Returns true if hook was started successfully, false otherwise
pub fn start_keyboard_hook<R: Runtime>(app_handle: AppHandle<R>) -> bool {
    // Don't start if already active
    if KEYBOARD_HOOK_STATE.is_active() {
        log::debug!("Keyboard hook already active");
        return true;
    }

    log::info!("Starting low-level keyboard hook...");

    // T016: Store AppHandle in thread-safe global state for event emission
    let app_handle_clone = app_handle.clone();
    KEYBOARD_HOOK_STATE.set_event_emitter(Box::new(move |action| {
        let event_name = match action {
            HotkeyAction::ToggleVisibility => "toggle-visibility",
            HotkeyAction::ToggleMode => "toggle-mode",
        };
        if let Err(e) = app_handle_clone.emit(event_name, ()) {
            log::error!("Failed to emit {} event: {}", event_name, e);
        }
    }));

    // T012: Spawn dedicated thread for hook
    let (tx, rx) = std::sync::mpsc::channel::<bool>();

    thread::spawn(move || {
        // Get current thread ID for later signaling
        let thread_id = unsafe { windows::Win32::System::Threading::GetCurrentThreadId() };
        KEYBOARD_HOOK_STATE.set_thread_id(thread_id);

        // T020: Detailed logging for hook installation attempt with thread ID
        log::info!(
            "Hook thread started (thread_id={}), attempting to install WH_KEYBOARD_LL hook...",
            thread_id
        );

        // T014: Install the hook
        let hook_result = unsafe {
            SetWindowsHookExW(
                WH_KEYBOARD_LL,
                Some(keyboard_hook_callback),
                None, // No module handle needed for WH_KEYBOARD_LL
                0,    // Thread ID 0 = all threads (global hook)
            )
        };

        match hook_result {
            Ok(hook) => {
                KEYBOARD_HOOK_STATE.set_hook_handle(hook.0 as *mut c_void);
                KEYBOARD_HOOK_STATE.set_active(true);
                // T021: Success logging with handle info
                log::info!(
                    "Low-level keyboard hook installed successfully (handle={:?}, thread_id={})",
                    hook.0,
                    thread_id
                );
                let _ = tx.send(true);

                // T013: Run Windows message loop
                let mut msg = MSG::default();
                loop {
                    let result = unsafe { GetMessageW(&mut msg, None, 0, 0) };

                    match result.0 {
                        -1 => {
                            // Error occurred
                            log::error!("GetMessageW error in hook thread");
                            break;
                        }
                        0 => {
                            // WM_QUIT received
                            log::debug!("WM_QUIT received, exiting hook message loop");
                            break;
                        }
                        _ => {
                            unsafe {
                                let _ = TranslateMessage(&msg);
                                DispatchMessageW(&msg);
                            }
                        }
                    }
                }

                // T023: Unhook when loop exits with logging
                let hook_handle = KEYBOARD_HOOK_STATE.get_hook_handle();
                if !hook_handle.is_null() {
                    log::debug!("Uninstalling keyboard hook (handle={:?})...", hook_handle);
                    let unhook_result = unsafe { UnhookWindowsHookEx(HHOOK(hook_handle)) };
                    if unhook_result.is_ok() {
                        log::info!("Low-level keyboard hook uninstalled successfully");
                    } else {
                        let error_code = unsafe { GetLastError() };
                        log::warn!(
                            "UnhookWindowsHookEx returned error (code: {:?})",
                            error_code
                        );
                    }
                }

                KEYBOARD_HOOK_STATE.set_hook_handle(std::ptr::null_mut());
                KEYBOARD_HOOK_STATE.set_active(false);
                KEYBOARD_HOOK_STATE.set_thread_id(0);
            }
            Err(e) => {
                // T022: Failure logging with Windows error code and description
                let error_code = unsafe { GetLastError() };
                log::error!(
                    "Failed to install keyboard hook: {:?} (Windows error code: {:?})",
                    e,
                    error_code
                );
                // T025, T027: Set fallback flag and log reason
                KEYBOARD_HOOK_STATE.set_use_fallback(true);
                log::warn!(
                    "Falling back to global shortcut plugin (reason: hook installation failed)"
                );
                let _ = tx.send(false);
            }
        }
    });

    // Wait for hook installation result
    match rx.recv_timeout(std::time::Duration::from_secs(5)) {
        Ok(true) => true,
        Ok(false) => {
            log::warn!("Hook installation failed, fallback mode activated");
            false
        }
        Err(_) => {
            log::error!("Timeout waiting for hook installation");
            false
        }
    }
}

// T017: Stop keyboard hook
/// Stops the low-level keyboard hook gracefully
pub fn stop_keyboard_hook() {
    if !KEYBOARD_HOOK_STATE.is_active() {
        log::debug!("Keyboard hook not active, nothing to stop");
        return;
    }

    log::info!("Stopping low-level keyboard hook...");

    let thread_id = KEYBOARD_HOOK_STATE.get_thread_id();
    if thread_id != 0 {
        // Send WM_QUIT to the hook thread's message loop
        unsafe {
            let _ = PostThreadMessageW(thread_id, WM_QUIT, WPARAM(0), LPARAM(0));
        }
        log::debug!("Posted WM_QUIT to hook thread {}", thread_id);
    }
}

// T028: Query function to check if using fallback
/// Returns true if the low-level hook failed and fallback is active
pub fn is_using_fallback() -> bool {
    KEYBOARD_HOOK_STATE.is_using_fallback()
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_debounce_logic() {
        // Reset state for test
        KEYBOARD_HOOK_STATE.set_last_f3_press(0);

        let now = current_time_ms();

        // First press should be allowed
        let last = KEYBOARD_HOOK_STATE.get_last_f3_press();
        assert!(now - last >= DEBOUNCE_MS);
        KEYBOARD_HOOK_STATE.set_last_f3_press(now);

        // Immediate second press should be debounced
        let now2 = current_time_ms();
        let last2 = KEYBOARD_HOOK_STATE.get_last_f3_press();
        assert!(now2 - last2 < DEBOUNCE_MS);

        // After waiting, press should be allowed again
        std::thread::sleep(std::time::Duration::from_millis(DEBOUNCE_MS + 10));
        let now3 = current_time_ms();
        let last3 = KEYBOARD_HOOK_STATE.get_last_f3_press();
        assert!(now3 - last3 >= DEBOUNCE_MS);
    }

    #[test]
    fn test_hotkey_action_enum() {
        let visibility = HotkeyAction::ToggleVisibility;
        let mode = HotkeyAction::ToggleMode;

        assert_ne!(visibility, mode);
        assert_eq!(visibility, HotkeyAction::ToggleVisibility);
        assert_eq!(mode, HotkeyAction::ToggleMode);
    }

    #[test]
    fn test_keyboard_hook_state_defaults() {
        // Create a new state to test defaults
        let state = KeyboardHookState::new();

        assert!(!state.is_active());
        assert!(state.get_hook_handle().is_null());
        assert_eq!(state.get_thread_id(), 0);
        assert!(!state.is_using_fallback());
        assert_eq!(state.get_last_f3_press(), 0);
        assert_eq!(state.get_last_f5_press(), 0);
    }
}
