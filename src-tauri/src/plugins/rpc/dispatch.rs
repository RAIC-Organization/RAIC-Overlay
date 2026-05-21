// Method-name routing for plugin_rpc.
//
// Phase 2 wires only the no-permission `permissions.*` methods. Every other
// JSON-RPC v1 method returns MethodNotFound until its handler is implemented
// in a later phase (per tasks.md per-phase task lists).

use tauri::AppHandle;

use crate::plugins::registry::PluginRegistryState;
use crate::plugins::types::{
    JsonRpcError, JsonRpcRequest, JsonRpcResponse, PluginId, RpcErrorCode,
};
use tauri::Manager;

/// Dispatch a single request from a plugin webview to the appropriate handler.
/// Always returns a well-formed JsonRpcResponse (errors are encoded in the
/// response envelope, never propagated as Tauri command errors).
pub async fn dispatch(
    app: AppHandle,
    plugin_id: PluginId,
    request: JsonRpcRequest,
) -> JsonRpcResponse {
    let id = request.id.clone().unwrap_or(serde_json::Value::Null);

    // Validate envelope
    if request.jsonrpc != "2.0" {
        return JsonRpcResponse::err(
            id,
            JsonRpcError::new(
                RpcErrorCode::InvalidRequest,
                "expected jsonrpc: \"2.0\"",
            ),
        );
    }

    let result = match request.method.as_str() {
        // permissions.* - no permission required
        "permissions.list" => permissions_list(&app, &plugin_id),
        "permissions.has" => permissions_has(&app, &plugin_id, &request.params),

        // Everything else lands in later phases.
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
// permissions.*
// ---------------------------------------------------------------------------

fn permissions_list(app: &AppHandle, plugin_id: &PluginId) -> Result<serde_json::Value, JsonRpcError> {
    let registry = app.state::<PluginRegistryState>();
    let entry = registry.get(plugin_id).ok_or_else(|| {
        JsonRpcError::new(
            RpcErrorCode::InternalError,
            "plugin not found in registry",
        )
    })?;

    let granted: Vec<&str> = entry.granted_permissions.iter().map(|p| p.as_str()).collect();
    // For v1 the declared set is the same as the granted set (we never grant
    // more than was declared and the user grants/denies the whole bundle at
    // install time). Once per-permission consent UX lands these will diverge.
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
    let name = params
        .get("name")
        .and_then(|v| v.as_str())
        .ok_or_else(|| {
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
