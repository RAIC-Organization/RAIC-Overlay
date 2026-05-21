// JSON-RPC v1 surface: the single plugin_rpc Tauri command + per-capability
// handlers.
//
// All plugin webviews can invoke exactly one Tauri command — plugin_rpc.
// Routing is by method name and gated by per-method permission checks.

pub mod dispatch;
pub mod permissions;
pub mod window_handler;
pub mod state_handler;
pub mod theme_handler;
pub mod log_handler;
pub mod notification_handler;
pub mod hotkey_handler;
pub mod sidecar_handler;

use tauri::AppHandle;

use crate::plugins::types::{JsonRpcRequest, JsonRpcResponse, PluginId};

/// The single Tauri command exposed to plugin webviews (capability
/// `plugin-webview.json` allows nothing else).
///
/// Frontend usage from inside a plugin webview (already wired by the
/// injected `window.raic` bootstrap script):
///
/// ```js
/// await window.__TAURI_INTERNALS__.invoke('plugin_rpc', {
///   pluginId: 'com.alice.demo',
///   request: { jsonrpc: '2.0', id: '1', method: 'permissions.list' }
/// })
/// ```
#[tauri::command]
pub async fn plugin_rpc(
    app: AppHandle,
    plugin_id: PluginId,
    request: JsonRpcRequest,
) -> JsonRpcResponse {
    dispatch::dispatch(app, plugin_id, request).await
}
