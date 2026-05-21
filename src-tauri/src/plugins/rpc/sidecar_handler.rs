// sidecar.* JSON-RPC methods (permission: sidecar).
//
// Routes UI→sidecar calls through the host's relay, applies the
// 30 s default / 300 s cap per-call timeout (FR-022 + Clarification Q3),
// emits sidecar.onEvent notifications to the calling webview.

use std::sync::atomic::Ordering;
use std::time::Duration;

use serde_json::Value;
use tauri::{AppHandle, Manager};
use tokio::sync::{mpsc, oneshot};
use tokio::time::timeout;

use crate::plugins::rpc::permissions;
use crate::plugins::rpc::subscription::{emit_event, register_subscription};
use crate::plugins::sidecar::supervisor::SidecarStore;
use crate::plugins::types::{JsonRpcError, Permission, PluginId, RpcErrorCode, RpcResult};

const DEFAULT_TIMEOUT_MS: u64 = 30_000;
const MAX_TIMEOUT_MS: u64 = 300_000;

pub async fn call(
    app: &AppHandle,
    plugin_id: &PluginId,
    params: &Value,
) -> RpcResult {
    permissions::require(app, plugin_id, Permission::Sidecar)?;

    let method = params
        .get("method")
        .and_then(|v| v.as_str())
        .ok_or_else(|| {
            JsonRpcError::new(
                RpcErrorCode::InvalidParams,
                "missing or non-string field \"method\"",
            )
        })?
        .to_string();
    let inner_params = params.get("params").cloned().unwrap_or(Value::Null);
    let requested_ms = params
        .get("timeoutMs")
        .and_then(|v| v.as_u64())
        .unwrap_or(DEFAULT_TIMEOUT_MS);
    let effective_ms = requested_ms.min(MAX_TIMEOUT_MS);

    let store = app.state::<SidecarStore>();
    let proc = store.get(plugin_id).ok_or_else(|| {
        JsonRpcError::new(
            RpcErrorCode::SidecarUnavailable,
            "sidecar is not running",
        )
    })?;

    let id_num = proc.next_id.fetch_add(1, Ordering::Relaxed);
    let id_str = id_num.to_string();

    let (tx, rx) = oneshot::channel::<Result<Value, JsonRpcError>>();
    proc.pending.lock().await.insert(id_str.clone(), tx);

    let request = serde_json::json!({
        "jsonrpc": "2.0",
        "id": id_str,
        "method": method,
        "params": inner_params,
    });
    let bytes = serde_json::to_vec(&request).map_err(|e| {
        JsonRpcError::new(RpcErrorCode::InternalError, format!("encode: {e}"))
    })?;
    if proc.stdin_tx.send(bytes).await.is_err() {
        return Err(JsonRpcError::new(
            RpcErrorCode::SidecarUnavailable,
            "sidecar stdin channel closed",
        ));
    }

    match timeout(Duration::from_millis(effective_ms), rx).await {
        Ok(Ok(Ok(value))) => Ok(serde_json::json!({ "result": value })),
        Ok(Ok(Err(rpc_err))) => Err(rpc_err),
        Ok(Err(_recv_err)) => Err(JsonRpcError::new(
            RpcErrorCode::SidecarUnavailable,
            "sidecar response channel closed before reply",
        )),
        Err(_) => {
            // Remove the dangling pending entry so a late sidecar reply doesn't
            // panic the routing layer.
            proc.pending.lock().await.remove(&id_str);
            Err(JsonRpcError::new(
                RpcErrorCode::SidecarTimeout,
                format!(
                    "sidecar.call({method}) exceeded effective timeout {effective_ms}ms"
                ),
            )
            .with_data(serde_json::json!({ "timeoutMs": effective_ms })))
        }
    }
}

pub fn on_event(
    app: &AppHandle,
    plugin_id: &PluginId,
    window_label: &str,
    _params: &Value,
) -> RpcResult {
    permissions::require(app, plugin_id, Permission::Sidecar)?;

    let subscription_id = register_subscription(app, plugin_id, window_label, "sidecar.onEvent")
        .map_err(|e| JsonRpcError::new(RpcErrorCode::InternalError, format!("subscribe: {e}")))?;

    // Hook the sidecar's event broadcaster: when it pushes a raic.event
    // notification, fan it out as a sidecar.onEvent host event.
    let store = app.state::<SidecarStore>();
    if let Some(proc) = store.get(plugin_id) {
        let (sink_tx, mut sink_rx) = mpsc::unbounded_channel::<Value>();
        // Register sink on the sidecar's event_sinks list.
        let event_sinks = proc.event_sinks.clone();
        let app_clone = app.clone();
        let plugin_clone = plugin_id.clone();
        tokio::spawn(async move {
            event_sinks.lock().await.push(sink_tx);
            while let Some(payload) = sink_rx.recv().await {
                emit_event(
                    &app_clone,
                    Some(&plugin_clone),
                    "sidecar.onEvent",
                    payload,
                );
            }
        });
    }

    Ok(serde_json::json!({ "subscriptionId": subscription_id }))
}

pub fn status(app: &AppHandle, plugin_id: &PluginId, _params: &Value) -> RpcResult {
    permissions::require(app, plugin_id, Permission::Sidecar)?;
    let store = app.state::<SidecarStore>();
    match store.get(plugin_id) {
        Some(proc) => {
            let uptime_ms = proc.started_at.elapsed().as_millis() as u64;
            Ok(serde_json::json!({
                "running": true,
                "pid": proc.pid,
                "uptimeMs": uptime_ms,
            }))
        }
        None => Ok(serde_json::json!({
            "running": false,
            "pid": null,
            "uptimeMs": null,
        })),
    }
}
