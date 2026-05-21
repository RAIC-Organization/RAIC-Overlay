// Plugin instance lifecycle.
//
// Phase 3 (US1 MVP): just spawn the primary window with the host's chrome.
// Sidecar spawn (Phase 5), secondary windows (Phase 4 via window.openSecondary),
// and full teardown bookkeeping are added in later phases.

use std::collections::HashMap;

use tauri::{AppHandle, Manager};

use crate::plugins::installer::manifest::{self, Manifest};
use crate::plugins::registry::{plugin_install_dir, PluginRegistryState};
use crate::plugins::runtime::window::{create_plugin_window, plugin_window_label};
use crate::plugins::types::PluginId;

/// Open the plugin's primary window. Invoked when the user clicks the plugin
/// from the conditional "Plugins" dropdown in the main overlay menu.
#[tauri::command]
pub async fn plugin_open(app: AppHandle, plugin_id: PluginId) -> Result<String, String> {
    let registry = app.state::<PluginRegistryState>();
    let plugin = registry
        .get(&plugin_id)
        .ok_or_else(|| format!("plugin not installed: {plugin_id}"))?;
    if !plugin.enabled {
        return Err(format!("plugin disabled: {plugin_id}"));
    }

    // Load the manifest from the install dir so we know the entry path,
    // default size, etc.
    let install_dir = plugin_install_dir(&app, &plugin.id, &plugin.installed_version)?;
    let manifest_path = install_dir.join("raic-plugin.json");
    let manifest_bytes = std::fs::read(&manifest_path)
        .map_err(|e| format!("read manifest {}: {e}", manifest_path.display()))?;
    let manifest: Manifest = manifest::validate_and_parse(&manifest_bytes)
        .map_err(|err| format!("manifest invalid on disk: {}", err.message))?;

    let label = plugin_window_label(&plugin.id, "primary");

    // If the window already exists (re-open), focus it.
    if let Some(existing) = app.get_webview_window(&label) {
        existing
            .set_focus()
            .map_err(|e| format!("set_focus: {e}"))?;
        existing.show().map_err(|e| format!("show: {e}"))?;
        return Ok(label);
    }

    // Build the entry URL. On Windows the custom-scheme path is served as
    // http://plugin.localhost/<id>/<entry-path> by the protocol handler.
    let entry = manifest.entry.ui.replace('\\', "/");
    let url_str = format!("http://plugin.localhost/{}/{}", plugin.id, entry);
    let entry_url = tauri::Url::parse(&url_str).map_err(|e| format!("parse url: {e}"))?;

    let width = manifest.entry.default_width.unwrap_or(480) as f64;
    let height = manifest.entry.default_height.unwrap_or(320) as f64;

    // Phase 3 ships an empty theme-token map; the real SC HUD tokens land in
    // Phase 4 (T045). Plugins that opt into var(--raic-*) tokens before that
    // will resolve to invalid CSS, which is acceptable for an MVP.
    let theme_tokens: HashMap<&'static str, String> = HashMap::new();

    let window = create_plugin_window(
        &app,
        &plugin.id,
        &plugin.installed_version,
        &label,
        entry_url,
        width,
        height,
        &theme_tokens,
    )
    .map_err(|e| format!("create plugin window: {e}"))?;

    log::info!(
        "[plugin={}] opened primary window label={} from {}",
        plugin.id,
        label,
        manifest.entry.ui
    );
    let _ = window.set_focus();
    Ok(label)
}
