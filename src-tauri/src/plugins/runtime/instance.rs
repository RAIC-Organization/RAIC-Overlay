// Plugin instance lifecycle.
//
// plugin_open builds the primary window; we record it in the
// PluginInstanceStore so future window.openSecondary calls can attach
// secondaries. On primary-window close we tear the instance down: close
// all secondaries, drop subscriptions, evict from the store.

use tauri::{AppHandle, Manager, WindowEvent};

use crate::plugins::installer::manifest::{self, Manifest};
use crate::plugins::registry::{plugin_install_dir, PluginRegistryState};
use crate::plugins::rpc::subscription;
use crate::plugins::rpc::window_handler::{self, PluginInstanceStore};
use crate::plugins::runtime::theme::current_tokens;
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

    let install_dir = plugin_install_dir(&app, &plugin.id, &plugin.installed_version)?;
    let manifest_path = install_dir.join("raic-plugin.json");
    let manifest_bytes = std::fs::read(&manifest_path)
        .map_err(|e| format!("read manifest {}: {e}", manifest_path.display()))?;
    let manifest: Manifest = manifest::validate_and_parse(&manifest_bytes)
        .map_err(|err| format!("manifest invalid on disk: {}", err.message))?;

    let label = plugin_window_label(&plugin.id, "primary");

    // If the window already exists (re-open), focus it.
    if let Some(existing) = app.get_webview_window(&label) {
        existing.set_focus().map_err(|e| format!("set_focus: {e}"))?;
        existing.show().map_err(|e| format!("show: {e}"))?;
        return Ok(label);
    }

    let entry = manifest.entry.ui.replace('\\', "/");
    let url_str = format!("http://plugin.localhost/{}/{}", plugin.id, entry);
    let entry_url = tauri::Url::parse(&url_str).map_err(|e| format!("parse url: {e}"))?;

    let width = manifest.entry.default_width.unwrap_or(480) as f64;
    let height = manifest.entry.default_height.unwrap_or(320) as f64;

    let theme_tokens = current_tokens();

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

    // Track the instance + wire teardown on window close.
    let store = app.state::<PluginInstanceStore>();
    store.record_primary(&plugin.id);

    let teardown_app = app.clone();
    let teardown_id = plugin.id.clone();
    let teardown_label = label.clone();
    window.on_window_event(move |event| {
        // CloseRequested fires before the window is destroyed, Destroyed
        // after. Use Destroyed so any owned secondaries we close don't
        // re-emit the cleanup loop.
        if matches!(event, WindowEvent::Destroyed) {
            teardown_primary(&teardown_app, &teardown_id, &teardown_label);
        }
    });

    // Focus-change event → emit window.onFocusChange subscriptions.
    let focus_app = app.clone();
    let focus_id = plugin.id.clone();
    let focus_label = label.clone();
    window.on_window_event(move |event| {
        if let WindowEvent::Focused(focused) = event {
            window_handler::fire_focus_change(&focus_app, &focus_id, &focus_label, *focused);
        }
    });

    let _ = window.set_focus();
    log::info!(
        "[plugin={}] opened primary window {label} from {}",
        plugin.id,
        manifest.entry.ui
    );
    Ok(label)
}

/// Tear down a plugin instance — invoked when the primary window's
/// Destroyed event fires.
pub fn teardown_primary(app: &AppHandle, plugin_id: &PluginId, _primary_label: &str) {
    let store = app.state::<PluginInstanceStore>();
    let secondaries = store.drop_plugin(plugin_id);
    for sec_label in &secondaries {
        if let Some(win) = app.get_webview_window(sec_label) {
            let _ = win.close();
        }
        subscription::drop_all_for_window(app, sec_label);
    }
    subscription::drop_all_for_plugin(app, plugin_id);
    log::info!(
        "[plugin={plugin_id}] primary window closed → torn down ({} secondaries, all subs dropped)",
        secondaries.len()
    );
}
