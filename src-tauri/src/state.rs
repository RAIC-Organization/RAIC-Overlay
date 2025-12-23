use std::sync::atomic::{AtomicBool, AtomicU8, Ordering};
use std::sync::Mutex;

use crate::types::{OverlayMode, OverlayStateResponse, WindowState};
#[cfg(windows)]
use crate::types::TargetWindowState;

// T007: Extended OverlayState with mode, saved_window_state, target_binding, and auto_hidden fields
pub struct OverlayState {
    pub visible: AtomicBool,
    pub initialized: AtomicBool,
    mode: AtomicU8, // 0 = Windowed, 1 = Fullscreen
    saved_window_state: Mutex<Option<WindowState>>,
    // T007: Target window binding state (Windows only)
    #[cfg(windows)]
    pub target_binding: TargetWindowState,
    // T007: Auto-hidden due to focus loss (not user toggle)
    pub auto_hidden: AtomicBool,
}

impl Default for OverlayState {
    fn default() -> Self {
        Self {
            visible: AtomicBool::new(false),
            initialized: AtomicBool::new(false),
            mode: AtomicU8::new(0), // Default: Windowed
            saved_window_state: Mutex::new(None),
            #[cfg(windows)]
            target_binding: TargetWindowState::default(),
            auto_hidden: AtomicBool::new(false),
        }
    }
}

impl OverlayState {
    pub fn is_visible(&self) -> bool {
        self.visible.load(Ordering::SeqCst)
    }

    pub fn set_visible(&self, visible: bool) {
        self.visible.store(visible, Ordering::SeqCst);
    }

    pub fn toggle_visible(&self) -> bool {
        let previous = self.visible.fetch_xor(true, Ordering::SeqCst);
        !previous
    }

    pub fn is_initialized(&self) -> bool {
        self.initialized.load(Ordering::SeqCst)
    }

    pub fn set_initialized(&self, initialized: bool) {
        self.initialized.store(initialized, Ordering::SeqCst);
    }

    // T008: Get current overlay mode
    pub fn get_mode(&self) -> OverlayMode {
        match self.mode.load(Ordering::SeqCst) {
            0 => OverlayMode::Windowed,
            _ => OverlayMode::Fullscreen,
        }
    }

    // T009: Set overlay mode
    pub fn set_mode(&self, mode: OverlayMode) {
        let value = match mode {
            OverlayMode::Windowed => 0,
            OverlayMode::Fullscreen => 1,
        };
        self.mode.store(value, Ordering::SeqCst);
    }

    // T010: Save window state for restoration
    pub fn save_window_state(&self, state: WindowState) {
        if let Ok(mut saved) = self.saved_window_state.lock() {
            *saved = Some(state);
        }
    }

    // T011: Get saved window state
    pub fn get_saved_window_state(&self) -> Option<WindowState> {
        self.saved_window_state.lock().ok().and_then(|s| *s)
    }

    // T007: Check if auto-hidden
    pub fn is_auto_hidden(&self) -> bool {
        self.auto_hidden.load(Ordering::SeqCst)
    }

    // T007: Set auto-hidden state
    pub fn set_auto_hidden(&self, auto_hidden: bool) {
        self.auto_hidden.store(auto_hidden, Ordering::SeqCst);
    }

    // T012: Convert state to response
    // T015: Updated to use runtime settings for target window name
    #[cfg(windows)]
    pub fn to_response(&self) -> OverlayStateResponse {
        use crate::target_window::get_target_window_name;

        let mode_str = match self.get_mode() {
            OverlayMode::Windowed => "windowed",
            OverlayMode::Fullscreen => "fullscreen",
        };
        OverlayStateResponse {
            visible: self.is_visible(),
            initialized: self.is_initialized(),
            mode: mode_str.to_string(),
            target_bound: self.target_binding.is_bound(),
            target_name: get_target_window_name().to_string(),
            target_rect: self.target_binding.get_rect(),
            auto_hidden: self.is_auto_hidden(),
        }
    }

    #[cfg(not(windows))]
    pub fn to_response(&self) -> OverlayStateResponse {
        let mode_str = match self.get_mode() {
            OverlayMode::Windowed => "windowed",
            OverlayMode::Fullscreen => "fullscreen",
        };
        OverlayStateResponse {
            visible: self.is_visible(),
            initialized: self.is_initialized(),
            mode: mode_str.to_string(),
            target_bound: false,
            target_name: String::new(),
            target_rect: None,
            auto_hidden: false,
        }
    }
}
