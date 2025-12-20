//! Persistence Types for State Persistence System
//!
//! Defines the Rust types for persisted state, matching the TypeScript
//! interfaces defined in data-model.md.
//!
//! @feature 010-state-persistence-system
//! @feature 015-browser-persistence

use serde::{Deserialize, Serialize};

pub const CURRENT_STATE_VERSION: u32 = 1;

// ============================================================================
// Persisted State (state.json)
// ============================================================================

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct PersistedState {
    pub version: u32,
    pub last_modified: String,
    pub global: GlobalSettings,
    pub windows: Vec<WindowStructure>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct GlobalSettings {
    pub overlay_mode: OverlayMode,
    pub overlay_visible: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "lowercase")]
pub enum OverlayMode {
    Windowed,
    Fullscreen,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct WindowStructure {
    pub id: String,
    #[serde(rename = "type")]
    pub window_type: WindowType,
    pub position: Position,
    pub size: Size,
    pub z_index: u32,
    pub flags: WindowFlags,
    #[serde(default = "default_opacity")]
    pub opacity: f32,
}

fn default_opacity() -> f32 {
    0.6
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "lowercase")]
pub enum WindowType {
    Notes,
    Draw,
    Browser,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Position {
    pub x: i32,
    pub y: i32,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Size {
    pub width: u32,
    pub height: u32,
}

#[derive(Debug, Clone, Default, Serialize, Deserialize)]
pub struct WindowFlags {
    pub minimized: bool,
    pub maximized: bool,
}

// ============================================================================
// Window Content (window-{id}.json)
// ============================================================================

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct WindowContentFile {
    pub window_id: String,
    #[serde(rename = "type")]
    pub window_type: WindowType,
    pub content: serde_json::Value, // Flexible JSON for TipTap/Excalidraw/Browser
    pub last_modified: String,
}

// ============================================================================
// IPC Result Types
// ============================================================================

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct LoadStateResult {
    pub success: bool,
    pub state: Option<PersistedState>,
    pub window_contents: Vec<WindowContentFile>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub error: Option<String>,
}

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct SaveResult {
    pub success: bool,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub error: Option<String>,
}

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct DeleteResult {
    pub success: bool,
    pub existed: bool,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub error: Option<String>,
}

// ============================================================================
// Default Implementations
// ============================================================================

impl Default for GlobalSettings {
    fn default() -> Self {
        Self {
            overlay_mode: OverlayMode::Windowed,
            overlay_visible: false,
        }
    }
}


impl Default for PersistedState {
    fn default() -> Self {
        Self {
            version: CURRENT_STATE_VERSION,
            last_modified: String::new(), // Will be set by frontend
            global: GlobalSettings::default(),
            windows: Vec::new(),
        }
    }
}
