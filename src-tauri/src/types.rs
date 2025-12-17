use serde::{Deserialize, Serialize};

// T001: OverlayMode enum for windowed/fullscreen states
#[derive(Debug, Clone, Copy, Default, PartialEq, Eq, Serialize, Deserialize)]
pub enum OverlayMode {
    #[default]
    Windowed,
    Fullscreen,
}

// T002: WindowState struct for position/size restoration
#[derive(Debug, Clone, Copy, Serialize, Deserialize)]
pub struct WindowState {
    pub x: f64,
    pub y: f64,
    pub width: f64,
    pub height: f64,
}

// T003: ModeChangePayload for mode-changed event
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ModeChangePayload {
    pub previous_mode: String,
    pub current_mode: String,
}

#[derive(Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct OverlayReadyPayload {
    pub window_id: String,
    pub position: Position,
}

#[derive(Clone, Serialize)]
pub struct Position {
    pub x: f64,
    pub y: f64,
}

#[derive(Deserialize)]
pub struct SetVisibilityParams {
    pub visible: bool,
}

// T004: Updated OverlayStateResponse to include mode field and target binding
#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
pub struct OverlayStateResponse {
    pub visible: bool,
    pub initialized: bool,
    pub mode: String,
    // T009: Extended fields for target window binding
    pub target_bound: bool,
    pub target_name: String,
    pub target_rect: Option<WindowRect>,
    pub auto_hidden: bool,
}

// T004: WindowRect struct for target window position/size
#[derive(Debug, Clone, Copy, PartialEq, Serialize, Deserialize)]
pub struct WindowRect {
    pub x: i32,
    pub y: i32,
    pub width: u32,
    pub height: u32,
}

// T005: TargetWindowError enum for target window operation errors
#[derive(Debug, Clone, Serialize)]
#[serde(tag = "type")]
pub enum TargetWindowError {
    NotFound { pattern: String },
    NotFocused,
    InvalidHandle,
}

impl std::fmt::Display for TargetWindowError {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        match self {
            TargetWindowError::NotFound { pattern } => {
                write!(f, "Target window '{}' not found", pattern)
            }
            TargetWindowError::NotFocused => write!(f, "Target window is not focused"),
            TargetWindowError::InvalidHandle => write!(f, "Target window handle is invalid"),
        }
    }
}

impl std::error::Error for TargetWindowError {}

// T006: TargetWindowState struct for tracking target window binding
#[cfg(windows)]
pub struct TargetWindowState {
    pub hwnd: std::sync::atomic::AtomicU64,
    pub is_focused: std::sync::atomic::AtomicBool,
    pub rect: std::sync::Mutex<Option<WindowRect>>,
    pub last_check: std::sync::Mutex<std::time::Instant>,
}

#[cfg(windows)]
impl Default for TargetWindowState {
    fn default() -> Self {
        Self {
            hwnd: std::sync::atomic::AtomicU64::new(0),
            is_focused: std::sync::atomic::AtomicBool::new(false),
            rect: std::sync::Mutex::new(None),
            last_check: std::sync::Mutex::new(std::time::Instant::now()),
        }
    }
}

#[cfg(windows)]
impl TargetWindowState {
    pub fn get_hwnd(&self) -> u64 {
        self.hwnd.load(std::sync::atomic::Ordering::SeqCst)
    }

    pub fn set_hwnd(&self, hwnd: u64) {
        self.hwnd.store(hwnd, std::sync::atomic::Ordering::SeqCst);
    }

    pub fn is_focused(&self) -> bool {
        self.is_focused.load(std::sync::atomic::Ordering::SeqCst)
    }

    pub fn set_focused(&self, focused: bool) {
        self.is_focused
            .store(focused, std::sync::atomic::Ordering::SeqCst);
    }

    pub fn get_rect(&self) -> Option<WindowRect> {
        self.rect.lock().ok().and_then(|r| *r)
    }

    pub fn set_rect(&self, rect: Option<WindowRect>) {
        if let Ok(mut r) = self.rect.lock() {
            *r = rect;
        }
    }

    pub fn update_last_check(&self) {
        if let Ok(mut t) = self.last_check.lock() {
            *t = std::time::Instant::now();
        }
    }

    pub fn is_bound(&self) -> bool {
        self.get_hwnd() != 0
    }

    pub fn clear(&self) {
        self.set_hwnd(0);
        self.set_focused(false);
        self.set_rect(None);
    }
}

// Event payloads for IPC
#[derive(Debug, Clone, Serialize)]
pub struct TargetWindowChangedPayload {
    pub bound: bool,
    pub focused: bool,
    pub rect: Option<WindowRect>,
}

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct ShowErrorModalPayload {
    pub target_name: String,
    pub message: String,
    pub auto_dismiss_ms: u32,
}

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct AutoHideChangedPayload {
    pub auto_hidden: bool,
    pub reason: String,
}

#[derive(Debug, Clone, Serialize)]
pub struct TargetWindowInfo {
    pub pattern: String,
    pub found: bool,
    pub focused: bool,
    pub rect: Option<WindowRect>,
}
