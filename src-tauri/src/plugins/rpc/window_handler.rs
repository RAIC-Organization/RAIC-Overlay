// window.* JSON-RPC methods — scoped to the plugin's own primary +
// secondary windows.
//
// All methods accept an optional `windowId` that defaults to the calling
// webview's label. The host validates the windowId belongs to the same
// plugin instance.

use std::collections::HashMap;
use std::sync::Mutex;

use serde_json::Value;
use tauri::{AppHandle, Manager, PhysicalSize, WebviewWindow};

use crate::plugins::rpc::subscription::{
    drop_all_for_window, emit_event, register_subscription,
};
use crate::plugins::runtime::theme::current_tokens;
use crate::plugins::runtime::window::{create_plugin_window, plugin_window_label};
use crate::plugins::types::{JsonRpcError, PluginId, RpcErrorCode, RpcResult};

// ============================================================================
// PluginInstance store — tracks live primary + secondary windows so
// teardown can close them all together (FR-027b).
// ============================================================================

#[derive(Debug, Default)]
pub struct InstanceTracking {
    /// `secondary_label -> caller-supplied secondary id`
    pub secondaries: HashMap<String, String>,
}

#[derive(Default)]
pub struct PluginInstanceStore(Mutex<HashMap<PluginId, InstanceTracking>>);

impl PluginInstanceStore {
    fn with<R>(&self, f: impl FnOnce(&mut HashMap<PluginId, InstanceTracking>) -> R) -> R {
        f(&mut self.0.lock().expect("plugin instance store mutex poisoned"))
    }

    pub fn record_primary(&self, plugin_id: &PluginId) {
        self.with(|map| {
            map.entry(plugin_id.clone()).or_default();
        });
    }

    pub fn record_secondary(&self, plugin_id: &PluginId, label: String, caller_id: String) {
        self.with(|map| {
            map.entry(plugin_id.clone())
                .or_default()
                .secondaries
                .insert(label, caller_id);
        });
    }

    pub fn forget_secondary(&self, plugin_id: &PluginId, label: &str) {
        self.with(|map| {
            if let Some(t) = map.get_mut(plugin_id) {
                t.secondaries.remove(label);
            }
        });
    }

    pub fn secondaries(&self, plugin_id: &PluginId) -> Vec<(String, String)> {
        self.with(|map| {
            map.get(plugin_id)
                .map(|t| t.secondaries.iter().map(|(l, i)| (l.clone(), i.clone())).collect())
                .unwrap_or_default()
        })
    }

    pub fn drop_plugin(&self, plugin_id: &PluginId) -> Vec<String> {
        self.with(|map| {
            map.remove(plugin_id)
                .map(|t| t.secondaries.into_keys().collect())
                .unwrap_or_default()
        })
    }
}

// ============================================================================
// Helpers
// ============================================================================

/// Resolve a target window: the calling window if `windowId` is absent or
/// the named secondary if present (must belong to the same plugin).
fn resolve_window(
    app: &AppHandle,
    plugin_id: &PluginId,
    caller_label: &str,
    params: &Value,
) -> Result<WebviewWindow, JsonRpcError> {
    let label = match params.get("windowId").and_then(|v| v.as_str()) {
        Some(req) => {
            // The plugin-supplied windowId IS the Tauri label (we return it
            // from openSecondary).
            // Sanity: ensure it's prefixed with this plugin's expected slug.
            let expected_prefix = plugin_window_label(plugin_id, "");
            if !req.starts_with(&expected_prefix) && req != caller_label {
                return Err(JsonRpcError::new(
                    RpcErrorCode::InvalidParams,
                    format!("windowId {req:?} does not belong to this plugin instance"),
                ));
            }
            req.to_string()
        }
        None => caller_label.to_string(),
    };

    app.get_webview_window(&label).ok_or_else(|| {
        JsonRpcError::new(
            RpcErrorCode::InvalidParams,
            format!("window {label:?} not found"),
        )
    })
}

fn invalid<S: Into<String>>(msg: S) -> JsonRpcError {
    JsonRpcError::new(RpcErrorCode::InvalidParams, msg)
}

fn internal<S: Into<String>>(msg: S) -> JsonRpcError {
    JsonRpcError::new(RpcErrorCode::InternalError, msg)
}

// ============================================================================
// Methods
// ============================================================================

pub fn set_title(
    app: &AppHandle,
    plugin_id: &PluginId,
    caller_label: &str,
    params: &Value,
) -> RpcResult {
    let title = params.get("title").and_then(|v| v.as_str()).ok_or_else(|| {
        invalid("missing or non-string field \"title\"")
    })?;
    let win = resolve_window(app, plugin_id, caller_label, params)?;
    win.set_title(title).map_err(|e| internal(format!("set_title: {e}")))?;
    Ok(serde_json::json!({}))
}

pub fn set_icon(
    _app: &AppHandle,
    _plugin_id: &PluginId,
    _caller_label: &str,
    _params: &Value,
) -> RpcResult {
    // Setting a runtime icon on a Tauri 2 WebviewWindow requires loading the
    // bytes and calling .set_icon(Image). For the MVP this is a no-op that
    // returns success rather than rejecting — most plugins won't notice. A
    // proper implementation lands when we have an icon-loading helper.
    Ok(serde_json::json!({}))
}

pub fn close_window(
    app: &AppHandle,
    plugin_id: &PluginId,
    caller_label: &str,
    params: &Value,
) -> RpcResult {
    let win = resolve_window(app, plugin_id, caller_label, params)?;
    win.close().map_err(|e| internal(format!("close: {e}")))?;
    Ok(serde_json::json!({}))
}

pub fn request_resize(
    app: &AppHandle,
    plugin_id: &PluginId,
    caller_label: &str,
    params: &Value,
) -> RpcResult {
    let w = params
        .get("width")
        .and_then(|v| v.as_u64())
        .ok_or_else(|| invalid("missing or non-integer field \"width\""))?;
    let h = params
        .get("height")
        .and_then(|v| v.as_u64())
        .ok_or_else(|| invalid("missing or non-integer field \"height\""))?;
    // Clamp to a sane range (matches manifest schema).
    let w = w.clamp(100, 4000) as u32;
    let h = h.clamp(100, 4000) as u32;
    let win = resolve_window(app, plugin_id, caller_label, params)?;
    win.set_size(PhysicalSize::new(w, h))
        .map_err(|e| internal(format!("set_size: {e}")))?;
    Ok(serde_json::json!({ "width": w, "height": h }))
}

pub fn get_bounds(
    app: &AppHandle,
    plugin_id: &PluginId,
    caller_label: &str,
    params: &Value,
) -> RpcResult {
    let win = resolve_window(app, plugin_id, caller_label, params)?;
    let pos = win.outer_position().map_err(|e| internal(format!("outer_position: {e}")))?;
    let size = win.outer_size().map_err(|e| internal(format!("outer_size: {e}")))?;
    Ok(serde_json::json!({
        "x": pos.x,
        "y": pos.y,
        "width": size.width,
        "height": size.height,
    }))
}

pub fn on_focus_change(
    app: &AppHandle,
    plugin_id: &PluginId,
    caller_label: &str,
    _params: &Value,
) -> RpcResult {
    let id = register_subscription(app, plugin_id, caller_label, "window.onFocusChange")
        .map_err(internal)?;
    Ok(serde_json::json!({ "subscriptionId": id }))
}

pub fn open_secondary(
    app: &AppHandle,
    plugin_id: &PluginId,
    caller_label: &str,
    params: &Value,
) -> RpcResult {
    let caller_id = params
        .get("id")
        .and_then(|v| v.as_str())
        .ok_or_else(|| invalid("missing or non-string field \"id\""))?
        .to_string();
    let ui = params
        .get("ui")
        .and_then(|v| v.as_str())
        .ok_or_else(|| invalid("missing or non-string field \"ui\""))?
        .replace('\\', "/");
    let title = params
        .get("title")
        .and_then(|v| v.as_str())
        .unwrap_or(plugin_id)
        .to_string();
    let width = params
        .get("width")
        .and_then(|v| v.as_u64())
        .unwrap_or(480)
        .clamp(100, 4000) as f64;
    let height = params
        .get("height")
        .and_then(|v| v.as_u64())
        .unwrap_or(320)
        .clamp(100, 4000) as f64;

    let label = plugin_window_label(plugin_id, &format!("sec-{caller_id}"));

    // Reject duplicates (FR-027b: id is unique within plugin).
    if app.get_webview_window(&label).is_some() {
        return Err(JsonRpcError::new(
            RpcErrorCode::Conflict,
            format!("secondary window id {caller_id:?} already open"),
        )
        .with_data(serde_json::json!({ "reason": "duplicate-id" })));
    }

    // We need plugin version to build the URL. Cheapest: read from the
    // calling primary window's plugin-version metadata isn't directly
    // available, so look up via registry.
    use crate::plugins::registry::PluginRegistryState;
    let registry = app.state::<PluginRegistryState>();
    let version = registry
        .get(plugin_id)
        .map(|p| p.installed_version)
        .ok_or_else(|| internal("plugin not in registry"))?;

    let url_str = format!("http://plugin.localhost/{plugin_id}/{ui}");
    let url = tauri::Url::parse(&url_str).map_err(|e| invalid(format!("parse url: {e}")))?;
    let theme_tokens = current_tokens();

    create_plugin_window(
        app,
        plugin_id,
        &version,
        &label,
        url,
        width,
        height,
        &theme_tokens,
    )
    .map_err(|e| internal(format!("create secondary window: {e}")))?;

    // Set the title separately so the caller's `title` param wins.
    if let Some(win) = app.get_webview_window(&label) {
        let _ = win.set_title(&title);
    }

    // Track for teardown
    let store = app.state::<PluginInstanceStore>();
    store.record_secondary(plugin_id, label.clone(), caller_id);

    log::info!(
        "[plugin={plugin_id}] opened secondary window {label} (caller-id={})",
        params.get("id").and_then(|v| v.as_str()).unwrap_or("?")
    );

    Ok(serde_json::json!({ "windowId": label }))
}

pub fn close_secondary(
    app: &AppHandle,
    plugin_id: &PluginId,
    _caller_label: &str,
    params: &Value,
) -> RpcResult {
    let label = params
        .get("windowId")
        .and_then(|v| v.as_str())
        .ok_or_else(|| invalid("missing or non-string field \"windowId\""))?;
    let expected_prefix = plugin_window_label(plugin_id, "");
    if !label.starts_with(&expected_prefix) {
        return Err(invalid("windowId does not belong to this plugin"));
    }
    if let Some(win) = app.get_webview_window(label) {
        win.close().map_err(|e| internal(format!("close: {e}")))?;
    }
    let store = app.state::<PluginInstanceStore>();
    store.forget_secondary(plugin_id, label);
    drop_all_for_window(app, label);
    Ok(serde_json::json!({}))
}

pub fn list_secondary(
    app: &AppHandle,
    plugin_id: &PluginId,
    _caller_label: &str,
    _params: &Value,
) -> RpcResult {
    let store = app.state::<PluginInstanceStore>();
    let entries: Vec<serde_json::Value> = store
        .secondaries(plugin_id)
        .into_iter()
        .map(|(label, id)| {
            let title = app
                .get_webview_window(&label)
                .and_then(|w| w.title().ok())
                .unwrap_or_else(|| plugin_id.clone());
            serde_json::json!({
                "id": id,
                "windowId": label,
                "title": title,
            })
        })
        .collect();
    Ok(serde_json::json!({ "windows": entries }))
}

// ============================================================================
// Focus-change emission (called from runtime/window.rs setup)
// ============================================================================

pub fn fire_focus_change(app: &AppHandle, plugin_id: &PluginId, window_label: &str, focused: bool) {
    emit_event(
        app,
        Some(plugin_id),
        "window.onFocusChange",
        serde_json::json!({
            "focused": focused,
            "windowId": window_label,
        }),
    );
}
