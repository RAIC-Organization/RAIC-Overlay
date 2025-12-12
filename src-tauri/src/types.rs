use serde::{Deserialize, Serialize};

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

#[derive(Serialize)]
pub struct OverlayStateResponse {
    pub visible: bool,
    pub initialized: bool,
}
