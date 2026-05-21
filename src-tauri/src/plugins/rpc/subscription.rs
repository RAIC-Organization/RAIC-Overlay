// Subscription registry — shared infra for every `*.on*` JSON-RPC method.
//
// When a plugin calls e.g. `theme.onChange`, the host registers a
// subscription and returns an opaque id. Later, when the underlying source
// emits (theme change, hotkey trigger, focus change, sidecar event), we look
// up which subscriptions are listening and emit `raic:event` to the right
// webview labels with the matching subscription id.
//
// raic.unsubscribe drops a subscription. PluginInstance teardown drops all
// subscriptions for that plugin instance.

use std::collections::HashMap;
use std::sync::atomic::{AtomicU64, Ordering};
use std::sync::Mutex;

use serde::Serialize;
use tauri::{AppHandle, Emitter, Manager};

use crate::plugins::types::{PluginId, SubscriptionId};

/// One live subscription owned by a plugin webview.
#[derive(Debug, Clone)]
pub struct Subscription {
    pub id: SubscriptionId,
    pub plugin_id: PluginId,
    pub window_label: String,
    /// The method name the plugin called (e.g. `theme.onChange`). Used for
    /// fan-out at emission sites.
    pub method: String,
}

/// Tauri-managed registry.
#[derive(Default)]
pub struct SubscriptionRegistry {
    counter: AtomicU64,
    items: Mutex<HashMap<SubscriptionId, Subscription>>,
}

impl SubscriptionRegistry {
    fn next_id(&self) -> SubscriptionId {
        let n = self.counter.fetch_add(1, Ordering::Relaxed);
        format!("sub-{n}")
    }
}

/// Register a new subscription. Returns its opaque id.
pub fn register_subscription(
    app: &AppHandle,
    plugin_id: &PluginId,
    window_label: &str,
    method: &str,
) -> Result<SubscriptionId, String> {
    let reg = app.state::<SubscriptionRegistry>();
    let id = reg.next_id();
    let sub = Subscription {
        id: id.clone(),
        plugin_id: plugin_id.clone(),
        window_label: window_label.to_string(),
        method: method.to_string(),
    };
    reg.items
        .lock()
        .map_err(|_| "subscription registry mutex poisoned".to_string())?
        .insert(id.clone(), sub);
    Ok(id)
}

/// Cancel a subscription by id. Returns true if it existed.
pub fn cancel_subscription(app: &AppHandle, id: &SubscriptionId) -> bool {
    let reg = app.state::<SubscriptionRegistry>();
    let mut items = match reg.items.lock() {
        Ok(g) => g,
        Err(_) => return false,
    };
    items.remove(id).is_some()
}

/// Drop every subscription owned by a plugin instance (called on teardown).
pub fn drop_all_for_plugin(app: &AppHandle, plugin_id: &PluginId) {
    let reg = app.state::<SubscriptionRegistry>();
    let mut items = match reg.items.lock() {
        Ok(g) => g,
        Err(_) => return,
    };
    items.retain(|_, s| s.plugin_id != *plugin_id);
}

/// Drop every subscription owned by a specific window label (e.g. when a
/// secondary window closes).
pub fn drop_all_for_window(app: &AppHandle, window_label: &str) {
    let reg = app.state::<SubscriptionRegistry>();
    let mut items = match reg.items.lock() {
        Ok(g) => g,
        Err(_) => return,
    };
    items.retain(|_, s| s.window_label != window_label);
}

/// Emit a `raic:event` to every webview subscribed to `method` for
/// `plugin_id` (use `plugin_id == None` to broadcast to all subscribers
/// of `method`, e.g. theme.onChange).
pub fn emit_event<T: Serialize + Clone>(
    app: &AppHandle,
    plugin_id_filter: Option<&PluginId>,
    method: &str,
    event: T,
) {
    let reg = app.state::<SubscriptionRegistry>();
    let matches: Vec<Subscription> = match reg.items.lock() {
        Ok(items) => items
            .values()
            .filter(|s| {
                s.method == method
                    && plugin_id_filter
                        .map(|pid| s.plugin_id == *pid)
                        .unwrap_or(true)
            })
            .cloned()
            .collect(),
        Err(_) => Vec::new(),
    };

    for sub in matches {
        let payload = serde_json::json!({
            "subscription": sub.id,
            "event": &event,
        });
        if let Err(e) = app.emit_to(&sub.window_label, "raic:event", payload) {
            log::warn!(
                "[plugin={}] emit raic:event to {} failed: {e}",
                sub.plugin_id,
                sub.window_label
            );
        }
    }
}
