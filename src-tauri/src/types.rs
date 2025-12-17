use serde::{Deserialize, Serialize};

// T001: OverlayMode enum for windowed/fullscreen states
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
pub enum OverlayMode {
    Windowed,
    Fullscreen,
}

impl Default for OverlayMode {
    fn default() -> Self {
        Self::Windowed
    }
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
pub struct ModeChangePayload {
    pub previous_mode: String,
    pub current_mode: String,
}

#[derive(Clone, Serialize)]
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

// T004: Updated OverlayStateResponse to include mode field
#[derive(Serialize)]
pub struct OverlayStateResponse {
    pub visible: bool,
    pub initialized: bool,
    pub mode: String,
}
