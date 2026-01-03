//! T011-T014 (049): GitHub release checker
//! @see specs/049-auto-update/research.md

use super::state::{load_update_state, save_update_state};
use super::types::{GitHubRelease, UpdateCheckResult, UpdateInfo};
use reqwest::Client;
use semver::Version;
use std::time::Duration;

/// GitHub repository owner
const GITHUB_OWNER: &str = "RAIC-Organization";
/// GitHub repository name
const GITHUB_REPO: &str = "RAIC-Overlay";
/// Request timeout for GitHub API
const REQUEST_TIMEOUT_SECS: u64 = 10;

/// T011: Create HTTP client with appropriate configuration
fn create_client() -> Result<Client, String> {
    Client::builder()
        .timeout(Duration::from_secs(REQUEST_TIMEOUT_SECS))
        .connect_timeout(Duration::from_secs(5))
        .user_agent("RAIC-Overlay-Updater")
        .build()
        .map_err(|e| format!("Failed to create HTTP client: {}", e))
}

/// T012: Compare two version strings using semver
/// Returns true if latest_version is newer than current_version
fn is_newer_version(current: &str, latest: &str) -> bool {
    // Strip 'v' prefix if present
    let current = current.trim_start_matches('v');
    let latest = latest.trim_start_matches('v');

    match (Version::parse(current), Version::parse(latest)) {
        (Ok(current_ver), Ok(latest_ver)) => latest_ver > current_ver,
        _ => {
            log::warn!(
                "Failed to parse versions: current={}, latest={}",
                current,
                latest
            );
            false
        }
    }
}

/// T013: Find MSI asset in release assets
fn find_msi_asset(assets: &[super::types::ReleaseAsset]) -> Option<&super::types::ReleaseAsset> {
    // First try to find an asset with app name in it
    if let Some(asset) = assets
        .iter()
        .find(|a| a.name.ends_with(".msi") && a.name.contains("RAIC"))
    {
        return Some(asset);
    }

    // Fall back to any MSI file
    assets.iter().find(|a| a.name.ends_with(".msi"))
}

/// T014: Check GitHub for new releases
/// Returns update information if a newer version is available
#[tauri::command]
pub async fn check_for_updates(app: tauri::AppHandle) -> Result<UpdateCheckResult, String> {
    log::info!("Checking for updates...");

    // Get current version from package info
    let current_version = app.package_info().version.to_string();
    log::debug!("Current version: {}", current_version);

    // Create HTTP client
    let client = create_client()?;

    // Fetch latest release from GitHub
    let url = format!(
        "https://api.github.com/repos/{}/{}/releases/latest",
        GITHUB_OWNER, GITHUB_REPO
    );

    log::debug!("Fetching release info from: {}", url);

    let response = match client
        .get(&url)
        .header("Accept", "application/vnd.github+json")
        .header("X-GitHub-Api-Version", "2022-11-28")
        .send()
        .await
    {
        Ok(resp) => resp,
        Err(e) => {
            // Network errors are not fatal - silently fail
            log::warn!("Failed to fetch release info: {}", e);
            return Ok(UpdateCheckResult {
                update_available: false,
                update_info: None,
            });
        }
    };

    // Handle HTTP errors
    if !response.status().is_success() {
        if response.status().as_u16() == 404 {
            // No releases yet
            log::info!("No releases found on GitHub");
        } else {
            log::warn!("GitHub API returned status: {}", response.status());
        }
        return Ok(UpdateCheckResult {
            update_available: false,
            update_info: None,
        });
    }

    // Parse response
    let release: GitHubRelease = match response.json().await {
        Ok(r) => r,
        Err(e) => {
            log::warn!("Failed to parse release JSON: {}", e);
            return Ok(UpdateCheckResult {
                update_available: false,
                update_info: None,
            });
        }
    };

    log::debug!(
        "Latest release: {} (prerelease={}, draft={})",
        release.tag_name,
        release.prerelease,
        release.draft
    );

    // Skip pre-releases and drafts
    if release.prerelease || release.draft {
        log::info!("Latest release is prerelease or draft, skipping");
        return Ok(UpdateCheckResult {
            update_available: false,
            update_info: None,
        });
    }

    // Compare versions
    let latest_version = release.tag_name.trim_start_matches('v');
    if !is_newer_version(&current_version, latest_version) {
        log::info!(
            "Current version {} is up to date (latest: {})",
            current_version,
            latest_version
        );
        return Ok(UpdateCheckResult {
            update_available: false,
            update_info: None,
        });
    }

    // Find MSI asset
    let msi_asset = match find_msi_asset(&release.assets) {
        Some(asset) => asset,
        None => {
            log::warn!("No MSI asset found in release");
            return Ok(UpdateCheckResult {
                update_available: false,
                update_info: None,
            });
        }
    };

    log::info!(
        "Update available: {} -> {} ({})",
        current_version,
        latest_version,
        msi_asset.name
    );

    // Update last check timestamp
    let mut state = load_update_state(&app)?;
    state.last_check_timestamp = Some(chrono::Utc::now().to_rfc3339());
    save_update_state(&app, &state)?;

    Ok(UpdateCheckResult {
        update_available: true,
        update_info: Some(UpdateInfo {
            version: latest_version.to_string(),
            current_version: current_version.clone(),
            download_url: msi_asset.browser_download_url.clone(),
            download_size: msi_asset.size,
            release_url: release.html_url.clone(),
        }),
    })
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_is_newer_version() {
        assert!(is_newer_version("1.0.0", "1.1.0"));
        assert!(is_newer_version("1.0.0", "2.0.0"));
        assert!(is_newer_version("0.1.0", "0.2.0"));
        assert!(!is_newer_version("1.1.0", "1.0.0"));
        assert!(!is_newer_version("1.0.0", "1.0.0"));
    }

    #[test]
    fn test_is_newer_version_with_v_prefix() {
        assert!(is_newer_version("v1.0.0", "v1.1.0"));
        assert!(is_newer_version("1.0.0", "v1.1.0"));
        assert!(is_newer_version("v1.0.0", "1.1.0"));
    }

    #[test]
    fn test_is_newer_version_prerelease() {
        // Pre-release is less than release
        assert!(is_newer_version("1.0.0-beta", "1.0.0"));
        assert!(!is_newer_version("1.0.0", "1.0.0-beta"));
    }

    #[test]
    fn test_is_newer_version_invalid() {
        // Invalid versions should return false
        assert!(!is_newer_version("invalid", "1.0.0"));
        assert!(!is_newer_version("1.0.0", "invalid"));
        assert!(!is_newer_version("", "1.0.0"));
    }
}
