//! T006 (049): Auto-update type definitions
//! @see specs/049-auto-update/data-model.md

use serde::{Deserialize, Serialize};

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
