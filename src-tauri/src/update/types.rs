//! T006 (049): Auto-update type definitions
//! @see specs/049-auto-update/data-model.md
//! @feature 051-fix-update-popup

use serde::{Deserialize, Serialize};
use std::sync::Mutex;

/// Persisted update state for tracking check history
#[derive(Debug, Clone, Serialize, Deserialize, Default)]
#[serde(rename_all = "camelCase")]
pub struct UpdateState {
    pub last_check_timestamp: Option<String>,
    pub last_notified_version: Option<String>,
    pub pending_installer_path: Option<String>,
}

/// GitHub release response from the releases API
#[derive(Debug, Clone, Deserialize)]
pub struct GitHubRelease {
    pub tag_name: String,
    pub name: Option<String>,
    pub prerelease: bool,
    pub draft: bool,
    pub published_at: String,
    pub assets: Vec<ReleaseAsset>,
    pub html_url: String,
}

/// Release asset (e.g., MSI installer)
#[derive(Debug, Clone, Deserialize)]
pub struct ReleaseAsset {
    pub name: String,
    pub browser_download_url: String,
    pub size: u64,
    pub content_type: String,
}

/// Information about an available update
#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct UpdateInfo {
    pub version: String,
    pub current_version: String,
    pub download_url: String,
    pub download_size: u64,
    pub release_url: String,
}

/// Result of checking for updates
#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct UpdateCheckResult {
    pub update_available: bool,
    pub update_info: Option<UpdateInfo>,
}

/// Download progress events sent to frontend via Channel
#[derive(Debug, Clone, Serialize)]
#[serde(tag = "event", content = "data", rename_all = "camelCase")]
pub enum DownloadEvent {
    #[serde(rename_all = "camelCase")]
    Started { content_length: Option<u64> },
    #[serde(rename_all = "camelCase")]
    Progress {
        bytes_downloaded: u64,
        total_bytes: u64,
    },
    #[serde(rename_all = "camelCase")]
    Finished { installer_path: String },
    #[serde(rename_all = "camelCase")]
    Error { message: String },
}

// ============================================================================
// T001, T002 (051): Update window state types
// @feature 051-fix-update-popup
// ============================================================================

/// T001: Managed state for the update notification window
/// Holds the update info to be displayed when the window opens
#[derive(Default)]
pub struct UpdateWindowState {
    pub update_info: Mutex<Option<UpdateInfo>>,
}

/// T002: Result of opening the update window
#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct OpenUpdateWindowResult {
    pub success: bool,
    pub created: bool,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub error: Option<String>,
}
