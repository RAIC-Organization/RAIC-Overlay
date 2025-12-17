use std::sync::atomic::{AtomicBool, AtomicU8, Ordering};
use std::sync::Mutex;

use crate::types::{OverlayMode, OverlayStateResponse, WindowState};

// T007: Extended OverlayState with mode and saved_window_state fields
pub struct OverlayState {
    pub visible: AtomicBool,
    pub initialized: AtomicBool,
    mode: AtomicU8, // 0 = Windowed, 1 = Fullscreen
    saved_window_state: Mutex<Option<WindowState>>,
}

impl Default for OverlayState {
    fn default() -> Self {
        Self {
            visible: AtomicBool::new(false),
            initialized: AtomicBool::new(false),
            mode: AtomicU8::new(0), // Default: Windowed
            saved_window_state: Mutex::new(None),
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

    // T012: Convert state to response
    pub fn to_response(&self) -> OverlayStateResponse {
        let mode_str = match self.get_mode() {
            OverlayMode::Windowed => "windowed",
            OverlayMode::Fullscreen => "fullscreen",
        };
        OverlayStateResponse {
            visible: self.is_visible(),
            initialized: self.is_initialized(),
            mode: mode_str.to_string(),
        }
    }
}
