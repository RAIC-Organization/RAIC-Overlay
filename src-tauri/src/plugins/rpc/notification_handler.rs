// notification.* JSON-RPC methods (permission: notifications).
//
// Emits a raic:plugin-notification event into the main webview; the
// frontend's PluginNotifications component (Phase 7) renders a
// transient toast with aria-live=polite for screen-reader access.

use std::sync::atomic::{AtomicU64, Ordering};

use serde_json::Value;
use tauri::{AppHandle, Emitter};

use crate::plugins::rpc::permissions;
use crate::plugins::types::{JsonRpcError, Permission, PluginId, RpcErrorCode, RpcResult};

const DEFAULT_DURATION_MS: u64 = 4000;
const MIN_DURATION_MS: u64 = 500;
const MAX_DURATION_MS: u64 = 30000;

pub fn show(app: &AppHandle, plugin_id: &PluginId, params: &Value) -> RpcResult {
    permissions::require(app, plugin_id, Permission::Notifications)?;

    let title = params.get("title").and_then(|v| v.as_str()).ok_or_else(|| {
        JsonRpcError::new(
            RpcErrorCode::InvalidParams,
            "missing or non-string field \"title\"",
        )
    })?;
    let body = params.get("body").and_then(|v| v.as_str()).ok_or_else(|| {
        JsonRpcError::new(
            RpcErrorCode::InvalidParams,
            "missing or non-string field \"body\"",
        )
    })?;
    let duration = params
        .get("durationMs")
        .and_then(|v| v.as_u64())
        .unwrap_or(DEFAULT_DURATION_MS)
        .clamp(MIN_DURATION_MS, MAX_DURATION_MS);

    let id = next_notification_id();
    let _ = app.emit(
        "raic:plugin-notification",
        serde_json::json!({
            "notificationId": id,
            "pluginId": plugin_id,
            "title": title,
            "body": body,
            "durationMs": duration,
        }),
    );

    log::info!(
        "[plugin={plugin_id}] notification: title={title:?} duration={duration}ms"
    );
    Ok(serde_json::json!({ "notificationId": id }))
}

fn next_notification_id() -> String {
    static N: AtomicU64 = AtomicU64::new(1);
    format!("notif-{}", N.fetch_add(1, Ordering::Relaxed))
}
