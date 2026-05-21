// JSON-RPC v1 surface: the single plugin_rpc Tauri command + per-capability
// handlers.

pub mod dispatch;
pub mod permissions;
pub mod subscription;
pub mod window_handler;
pub mod state_handler;
pub mod theme_handler;
pub mod log_handler;
pub mod notification_handler;
pub mod hotkey_handler;
pub mod sidecar_handler;

use tauri::{AppHandle, WebviewWindow};

use crate::plugins::types::{JsonRpcRequest, JsonRpcResponse, PluginId};

/// The single Tauri command exposed to plugin webviews.
///
/// `webview` is auto-injected by Tauri 2 — its `.label()` tells us which
/// window the call came from (used for window.* defaults and for owning
/// subscriptions).
#[tauri::command]
pub async fn plugin_rpc(
    app: AppHandle,
    webview: WebviewWindow,
    plugin_id: PluginId,
    request: JsonRpcRequest,
) -> JsonRpcResponse {
    let caller_label = webview.label().to_string();
    dispatch::dispatch(app, plugin_id, caller_label, request).await
}
