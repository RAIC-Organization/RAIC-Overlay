// theme.* JSON-RPC methods.
//
// theme.getTokens returns the current SC HUD CSS custom-property map (the
// same one injected into plugin webviews by the bootstrap script). v1 is
// static; theme.onChange subscriptions are accepted but never fire until
// a future host feature adds a runtime theme switcher.

use serde_json::Value;
use tauri::AppHandle;

use crate::plugins::rpc::subscription::register_subscription;
use crate::plugins::runtime::theme::current_tokens;
use crate::plugins::types::{JsonRpcError, PluginId, RpcErrorCode, RpcResult};

pub fn get_tokens(_app: &AppHandle, _plugin_id: &PluginId, _params: &Value) -> RpcResult {
    let tokens = current_tokens();
    Ok(serde_json::json!({ "tokens": tokens }))
}

pub fn on_change(
    app: &AppHandle,
    plugin_id: &PluginId,
    window_label: &str,
    _params: &Value,
) -> RpcResult {
    let subscription_id =
        register_subscription(app, plugin_id, window_label, "theme.onChange").map_err(|e| {
            JsonRpcError::new(RpcErrorCode::InternalError, format!("subscribe: {e}"))
        })?;
    Ok(serde_json::json!({ "subscriptionId": subscription_id }))
}
