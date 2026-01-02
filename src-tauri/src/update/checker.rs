//! T011-T014 (049): GitHub release checker
//! Stub - will be implemented in Phase 3

use super::types::UpdateCheckResult;

/// Check GitHub for new releases.
/// Returns update information if a newer version is available.
#[tauri::command]
pub async fn check_for_updates(_app: tauri::AppHandle) -> Result<UpdateCheckResult, String> {
    // Stub - will be implemented in Phase 3
    Ok(UpdateCheckResult {
        update_available: false,
        update_info: None,
    })
}
