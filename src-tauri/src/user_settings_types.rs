//! User settings type definitions
//! @feature 038-settings-panel

use serde::{Deserialize, Serialize};

pub const CURRENT_USER_SETTINGS_VERSION: u32 = 1;

/// User settings persisted to user-settings.json
/// @feature 038-settings-panel
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct UserSettings {
    /// Schema version for migration support
    pub version: u32,

    /// Hotkey bindings configuration
    pub hotkeys: HotkeySettings,

    /// Auto-start with Windows preference
    pub auto_start: bool,

    /// Last modified timestamp (ISO 8601)
    pub last_modified: String,
}

/// Hotkey bindings for overlay control
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct HotkeySettings {
    /// Toggle overlay visibility (default: F3)
    pub toggle_visibility: HotkeyBinding,

    /// Toggle overlay mode - passthrough/interactive (default: F5)
    pub toggle_mode: HotkeyBinding,
}

/// Single hotkey binding configuration
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct HotkeyBinding {
    /// Primary key name (e.g., "F3", "O")
    pub key: String,

    /// Key code as integer (Windows VK_* code)
    pub key_code: u32,

    /// Ctrl modifier required
    pub ctrl: bool,

    /// Shift modifier required
    pub shift: bool,

    /// Alt modifier required
    pub alt: bool,
}

impl Default for UserSettings {
    fn default() -> Self {
        Self {
            version: CURRENT_USER_SETTINGS_VERSION,
            hotkeys: HotkeySettings::default(),
            auto_start: false,
            last_modified: String::new(),
        }
    }
}

impl Default for HotkeySettings {
    fn default() -> Self {
        Self {
            toggle_visibility: HotkeyBinding {
                key: "F3".to_string(),
                key_code: 0x72, // VK_F3
                ctrl: false,
                shift: false,
                alt: false,
            },
            toggle_mode: HotkeyBinding {
                key: "F5".to_string(),
                key_code: 0x74, // VK_F5
                ctrl: false,
                shift: false,
                alt: false,
            },
        }
    }
}

// T006: Result types for IPC

/// Result of loading user settings
#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct LoadUserSettingsResult {
    pub success: bool,
    pub settings: Option<UserSettings>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub error: Option<String>,
}

/// Result of saving user settings
#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct SaveUserSettingsResult {
    pub success: bool,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub error: Option<String>,
}
