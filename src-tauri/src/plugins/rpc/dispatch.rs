// Method-name routing for plugin_rpc.
//
// Phase 4 wires the bulk of v1: window/state/theme/log/permissions +
// raic.unsubscribe. Sidecar/hotkey/notification handlers land in their
// own phases (5 / 7).

use tauri::AppHandle;
use tauri::Manager;

use crate::plugins::registry::PluginRegistryState;
use crate::plugins::rpc::{log_handler, state_handler, subscription, theme_handler, window_handler};
use crate::plugins::types::{
    JsonRpcError, JsonRpcRequest, JsonRpcResponse, PluginId, RpcErrorCode,
};

/// Dispatch one JSON-RPC request from a plugin webview. `caller_label` is
/// the Tauri window label that invoked plugin_rpc (used as the default
/// target for window.* methods and as the subscription owner for *.on*
/// methods).
pub async fn dispatch(
    app: AppHandle,
    plugin_id: PluginId,
    caller_label: String,
    request: JsonRpcRequest,
) -> JsonRpcResponse {
    let id = request.id.clone().unwrap_or(serde_json::Value::Null);

    if request.jsonrpc != "2.0" {
        return JsonRpcResponse::err(
            id,
            JsonRpcError::new(RpcErrorCode::InvalidRequest, "expected jsonrpc: \"2.0\""),
        );
    }

    let result = match request.method.as_str() {
        // raic.* (protocol)
        "raic.unsubscribe" => unsubscribe(&app, &request.params),

        // window.*  (no permission — scoped to plugin's own windows)
        "window.setTitle" => window_handler::set_title(&app, &plugin_id, &caller_label, &request.params),
        "window.setIcon" => window_handler::set_icon(&app, &plugin_id, &caller_label, &request.params),
        "window.close" => window_handler::close_window(&app, &plugin_id, &caller_label, &request.params),
        "window.requestResize" => {
            window_handler::request_resize(&app, &plugin_id, &caller_label, &request.params)
        }
        "window.getBounds" => window_handler::get_bounds(&app, &plugin_id, &caller_label, &request.params),
        "window.onFocusChange" => {
            window_handler::on_focus_change(&app, &plugin_id, &caller_label, &request.params)
        }
        "window.openSecondary" => {
            window_handler::open_secondary(&app, &plugin_id, &caller_label, &request.params)
        }
        "window.closeSecondary" => {
            window_handler::close_secondary(&app, &plugin_id, &caller_label, &request.params)
        }
        "window.listSecondary" => {
            window_handler::list_secondary(&app, &plugin_id, &caller_label, &request.params)
        }

        // state.* (no permission — per-plugin scope)
        "state.get" => state_handler::get(&app, &plugin_id, &request.params),
        "state.set" => state_handler::set(&app, &plugin_id, &request.params),
        "state.delete" => state_handler::delete(&app, &plugin_id, &request.params),
        "state.list" => state_handler::list(&app, &plugin_id, &request.params),
        "state.usage" => state_handler::usage(&app, &plugin_id, &request.params),

        // theme.* (no permission)
        "theme.getTokens" => theme_handler::get_tokens(&app, &plugin_id, &request.params),
        "theme.onChange" => {
            theme_handler::on_change(&app, &plugin_id, &caller_label, &request.params)
        }

        // log.* (no permission — entries tagged with plugin id)
        "log.info" => log_handler::info(&plugin_id, &request.params),
        "log.warn" => log_handler::warn(&plugin_id, &request.params),
        "log.error" => log_handler::error(&plugin_id, &request.params),

        // permissions.* (no permission)
        "permissions.list" => permissions_list(&app, &plugin_id),
        "permissions.has" => permissions_has(&app, &plugin_id, &request.params),

        _ => Err(JsonRpcError::new(
            RpcErrorCode::MethodNotFound,
            format!("method {:?} not implemented in v1 yet", request.method),
        )),
    };

    match result {
        Ok(value) => JsonRpcResponse::ok(id, value),
        Err(err) => {
            log::warn!(
                "[plugin={plugin_id}] rpc rejected: method={} code={} message={}",
                request.method,
                err.code,
                err.message
            );
            JsonRpcResponse::err(id, err)
        }
    }
}

// ---------------------------------------------------------------------------
// raic.unsubscribe
// ---------------------------------------------------------------------------

fn unsubscribe(
    app: &AppHandle,
    params: &serde_json::Value,
) -> Result<serde_json::Value, JsonRpcError> {
    let id = params
        .get("subscriptionId")
        .and_then(|v| v.as_str())
        .ok_or_else(|| {
            JsonRpcError::new(
                RpcErrorCode::InvalidParams,
                "missing or non-string field \"subscriptionId\"",
            )
        })?;
    let existed = subscription::cancel_subscription(app, &id.to_string());
    if !existed {
        return Err(JsonRpcError::new(
            RpcErrorCode::InvalidParams,
            format!("unknown subscriptionId {id:?}"),
        ));
    }
    Ok(serde_json::json!({}))
}

// ---------------------------------------------------------------------------
// permissions.*
// ---------------------------------------------------------------------------

fn permissions_list(
    app: &AppHandle,
    plugin_id: &PluginId,
) -> Result<serde_json::Value, JsonRpcError> {
    let registry = app.state::<PluginRegistryState>();
    let entry = registry.get(plugin_id).ok_or_else(|| {
        JsonRpcError::new(RpcErrorCode::InternalError, "plugin not found in registry")
    })?;
    let granted: Vec<&str> = entry.granted_permissions.iter().map(|p| p.as_str()).collect();
    let declared = granted.clone();
    Ok(serde_json::json!({
        "granted": granted,
        "declared": declared,
    }))
}

fn permissions_has(
    app: &AppHandle,
    plugin_id: &PluginId,
    params: &serde_json::Value,
) -> Result<serde_json::Value, JsonRpcError> {
    let name = params.get("name").and_then(|v| v.as_str()).ok_or_else(|| {
        JsonRpcError::new(
            RpcErrorCode::InvalidParams,
            "missing or non-string field \"name\"",
        )
    })?;
    let registry = app.state::<PluginRegistryState>();
    let granted: bool = registry.with(|reg| {
        reg.plugins
            .get(plugin_id)
            .map(|p| p.granted_permissions.iter().any(|q| q.as_str() == name))
            .unwrap_or(false)
    });
    Ok(serde_json::json!({ "granted": granted }))
}
