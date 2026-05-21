// Plugin auto-update poller (Phase 6 / Clarification Q5).
//
// At host startup we spawn a background task that:
//   1. Waits 10 s (so it doesn't compete with the host's own update check)
//   2. Iterates every enabled plugin and calls fetch_latest_release with
//      the previously cached ETag (if any)
//   3. When a newer version appears, stores it in registry.available_update,
//      emits `raic:plugin-update-available`, and saves registry.json
//   4. Sleeps 24 h, repeats
//
// User-facing: the Settings → Plugins UI badges the row + the conditional
// "Plugins" menu trigger badges with the count.
//
// Per FR-005b there is NO silent install path — finding an update just
// surfaces a notification; the user must accept via the consent dialog.

use std::time::Duration;

use semver::Version;
use tauri::{AppHandle, Emitter, Manager};
use tokio::time::sleep;

use crate::plugins::installer::github::fetch_latest_release;
use crate::plugins::installer::manifest::parse_github_repo;
use crate::plugins::registry::{save_registry, PluginRegistryState};
use crate::plugins::types::AvailableUpdate;

const INITIAL_DELAY: Duration = Duration::from_secs(10);
const POLL_INTERVAL: Duration = Duration::from_secs(60 * 60 * 24); // 24 h

/// Spawn the daily poller task. Returns immediately; the task lives for
/// the lifetime of the host process.
pub fn start(app: AppHandle) {
    tokio::spawn(async move {
        sleep(INITIAL_DELAY).await;
        loop {
            check_all(&app).await;
            sleep(POLL_INTERVAL).await;
        }
    });
}

/// Re-export for the manual "Check for updates" button (plugin_check_updates).
pub async fn check_all_now(app: &AppHandle) {
    check_all(app).await
}

async fn check_all(app: &AppHandle) {
    let registry = app.state::<PluginRegistryState>();
    let snapshot = registry.snapshot();

    let mut any_updates = false;
    for (id, plugin) in &snapshot.plugins {
        if !plugin.enabled {
            continue;
        }
        let Some((owner, repo)) = parse_github_repo(&plugin.source_repo_url) else {
            log::warn!(
                "[plugin={id}] cannot parse source_repo_url {} for poll",
                plugin.source_repo_url
            );
            continue;
        };

        let etag = plugin.etag.as_deref();
        match fetch_latest_release(&owner, &repo, etag).await {
            Ok(None) => {
                // 304 — no change, etag still valid.
            }
            Ok(Some(fetched)) => {
                let tag = fetched.release.tag_name.trim_start_matches('v').to_string();
                let current = Version::parse(&plugin.installed_version).ok();
                let upstream = Version::parse(&tag).ok();
                let newer = match (current, upstream) {
                    (Some(c), Some(u)) => u > c,
                    _ => false,
                };
                if newer {
                    let asset_size = fetched
                        .release
                        .assets
                        .iter()
                        .find(|a| a.name.eq_ignore_ascii_case("raic-plugin.zip"))
                        .map(|a| a.size)
                        .unwrap_or(0);
                    let update = AvailableUpdate {
                        version: tag,
                        release_url: fetched.release.html_url,
                        release_notes: fetched.release.body.unwrap_or_default(),
                        asset_size_bytes: asset_size,
                        detected_at: chrono::Utc::now().to_rfc3339(),
                    };
                    registry.mutate(|reg| {
                        if let Some(p) = reg.plugins.get_mut(id) {
                            p.available_update = Some(update.clone());
                            p.etag = fetched.etag.clone();
                        }
                    });
                    any_updates = true;
                    let _ = app.emit(
                        "raic:plugin-update-available",
                        serde_json::json!({
                            "pluginId": id,
                            "version": update.version,
                        }),
                    );
                    log::info!(
                        "[plugin={id}] update available: {} -> {}",
                        plugin.installed_version,
                        update.version
                    );
                } else {
                    // Either same version or older — just refresh ETag.
                    registry.mutate(|reg| {
                        if let Some(p) = reg.plugins.get_mut(id) {
                            p.etag = fetched.etag.clone();
                        }
                    });
                }
            }
            Err(e) => {
                log::warn!("[plugin={id}] update poll failed: {e}");
            }
        }
    }

    // One write per poll cycle (not per plugin) to minimise disk churn.
    if any_updates {
        let snap = registry.snapshot();
        if let Err(e) = save_registry(app, &snap) {
            log::warn!("[plugins] save_registry after poll failed: {e}");
        }
    }
    registry.mutate(|reg| {
        reg.last_update_check_at = Some(chrono::Utc::now().to_rfc3339());
    });
}
