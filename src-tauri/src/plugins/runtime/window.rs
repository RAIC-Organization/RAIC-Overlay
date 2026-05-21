// Plugin webview creation: WebviewWindowBuilder factory that injects the
// bootstrap script (window.raic + theme CSS tokens) before plugin scripts run.

use std::collections::HashMap;

use tauri::{AppHandle, WebviewUrl, WebviewWindow, WebviewWindowBuilder};

use crate::plugins::types::PluginId;

/// The raw bootstrap script, baked into the binary at compile time.
/// Placeholders are substituted before injection (one copy per plugin window).
const BOOTSTRAP_SCRIPT: &str = include_str!("../../../resources/plugin-bootstrap.js");

/// Build the per-window bootstrap script by substituting the four template
/// placeholders. Keep this in sync with `resources/plugin-bootstrap.js`.
pub fn build_bootstrap(
    plugin_id: &PluginId,
    plugin_version: &str,
    window_id: &str,
    theme_tokens: &HashMap<&'static str, String>,
) -> String {
    // Theme tokens are embedded as a single-quoted JSON string literal inside
    // the script — we therefore escape any single quotes / backslashes.
    let tokens_json = serde_json::to_string(theme_tokens)
        .unwrap_or_else(|_| "{}".to_string());
    let tokens_escaped = tokens_json.replace('\\', "\\\\").replace('\'', "\\'");

    BOOTSTRAP_SCRIPT
        .replace("__RAIC_PLUGIN_ID__", plugin_id)
        .replace("__RAIC_PLUGIN_VERSION__", plugin_version)
        .replace("__RAIC_WINDOW_ID__", window_id)
        .replace("__RAIC_THEME_TOKENS__", &tokens_escaped)
}

/// Window label convention for plugin webviews. The `plugin-webview`
/// capability targets `plugin-*` (see capabilities/plugin-webview.json).
pub fn plugin_window_label(plugin_id: &PluginId, suffix: &str) -> String {
    // Replace dots in the plugin id so Tauri's label rules accept it.
    let id_slug = plugin_id.replace('.', "_");
    format!("plugin-{id_slug}-{suffix}")
}

/// Create a host-owned WebviewWindow for a plugin instance. The window
/// inherits the standard SC HUD chrome (frame, drag, opacity, close button)
/// from the calling site's WebviewWindowBuilder options.
///
/// The `entry_url` must be a URL the plugin's UI can be loaded from — in
/// production this is `http://plugin.localhost/<plugin-id>/<entry.ui>` (served
/// by the custom URI scheme protocol registered in `protocol.rs`).
pub fn create_plugin_window(
    app: &AppHandle,
    plugin_id: &PluginId,
    plugin_version: &str,
    label: &str,
    entry_url: tauri::Url,
    width: f64,
    height: f64,
    theme_tokens: &HashMap<&'static str, String>,
) -> tauri::Result<WebviewWindow> {
    let bootstrap = build_bootstrap(plugin_id, plugin_version, label, theme_tokens);

    WebviewWindowBuilder::new(app, label, WebviewUrl::External(entry_url))
        .title(plugin_id)
        .inner_size(width, height)
        .resizable(true)
        .initialization_script(&bootstrap)
        .build()
}
