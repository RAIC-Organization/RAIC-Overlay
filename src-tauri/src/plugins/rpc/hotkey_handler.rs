// hotkey.* JSON-RPC methods (permission: hotkeys).
//
// Uses tauri-plugin-global-shortcut for runtime registration. Combos are
// parsed by `Shortcut::from_str` ("Ctrl+Shift+P" etc).
//
// Each registration is tracked on the PluginInstanceStore so teardown
// releases everything the plugin claimed.

use std::sync::Mutex;
use std::collections::HashMap;
use std::str::FromStr;

use serde_json::Value;
use tauri::{AppHandle, Manager};
use tauri_plugin_global_shortcut::{GlobalShortcutExt, Shortcut, ShortcutState};

use crate::plugins::rpc::permissions;
use crate::plugins::rpc::subscription::{emit_event, register_subscription};
use crate::plugins::types::{JsonRpcError, Permission, PluginId, RegistrationId, RpcErrorCode, RpcResult};

/// Tauri-managed: maps plugin_id → list of (registrationId, combo, caller_id).
#[derive(Default)]
pub struct PluginHotkeyRegistry(Mutex<HashMap<PluginId, Vec<HotkeyRegistration>>>);

#[derive(Debug, Clone)]
pub struct HotkeyRegistration {
    pub registration_id: RegistrationId,
    pub combo: String,
    pub caller_id: String,
}

impl PluginHotkeyRegistry {
    fn with<R>(&self, f: impl FnOnce(&mut HashMap<PluginId, Vec<HotkeyRegistration>>) -> R) -> R {
        f(&mut self.0.lock().expect("plugin hotkey registry mutex poisoned"))
    }
}

fn next_registration_id() -> RegistrationId {
    use std::sync::atomic::{AtomicU64, Ordering};
    static N: AtomicU64 = AtomicU64::new(1);
    format!("reg-{}", N.fetch_add(1, Ordering::Relaxed))
}

pub fn register(app: &AppHandle, plugin_id: &PluginId, params: &Value) -> RpcResult {
    permissions::require(app, plugin_id, Permission::Hotkeys)?;

    let combo = params.get("combo").and_then(|v| v.as_str()).ok_or_else(|| {
        JsonRpcError::new(
            RpcErrorCode::InvalidParams,
            "missing or non-string field \"combo\"",
        )
    })?;
    let caller_id = params.get("id").and_then(|v| v.as_str()).ok_or_else(|| {
        JsonRpcError::new(
            RpcErrorCode::InvalidParams,
            "missing or non-string field \"id\"",
        )
    })?;

    let shortcut = Shortcut::from_str(combo).map_err(|e| {
        JsonRpcError::new(
            RpcErrorCode::InvalidParams,
            format!("invalid combo {combo:?}: {e}"),
        )
    })?;

    let gs = app.global_shortcut();
    // Detect existing registration → Conflict
    if gs.is_registered(shortcut) {
        return Err(JsonRpcError::new(
            RpcErrorCode::Conflict,
            format!("combo {combo:?} already registered by another plugin or the host"),
        )
        .with_data(serde_json::json!({ "reason": "combo-in-use", "combo": combo })));
    }

    let registration_id = next_registration_id();
    let plugin_id_for_cb = plugin_id.clone();
    let registration_id_for_cb = registration_id.clone();
    let combo_for_cb = combo.to_string();
    let caller_id_for_cb = caller_id.to_string();
    let app_for_cb = app.clone();

    gs.on_shortcut(shortcut, move |_app, _sc, evt| {
        if evt.state() != ShortcutState::Pressed {
            return;
        }
        emit_event(
            &app_for_cb,
            Some(&plugin_id_for_cb),
            "hotkey.onTrigger",
            serde_json::json!({
                "registrationId": registration_id_for_cb,
                "id": caller_id_for_cb,
                "combo": combo_for_cb,
                "at": chrono::Utc::now().to_rfc3339(),
            }),
        );
    })
    .map_err(|e| {
        JsonRpcError::new(
            RpcErrorCode::InternalError,
            format!("global_shortcut register failed: {e}"),
        )
    })?;

    let registry = app.state::<PluginHotkeyRegistry>();
    registry.with(|map| {
        map.entry(plugin_id.clone())
            .or_default()
            .push(HotkeyRegistration {
                registration_id: registration_id.clone(),
                combo: combo.to_string(),
                caller_id: caller_id.to_string(),
            });
    });

    log::info!(
        "[plugin={plugin_id}] hotkey registered: combo={combo} registrationId={registration_id}"
    );
    Ok(serde_json::json!({ "registrationId": registration_id }))
}

pub fn unregister(app: &AppHandle, plugin_id: &PluginId, params: &Value) -> RpcResult {
    permissions::require(app, plugin_id, Permission::Hotkeys)?;
    let reg_id = params
        .get("registrationId")
        .and_then(|v| v.as_str())
        .ok_or_else(|| {
            JsonRpcError::new(
                RpcErrorCode::InvalidParams,
                "missing or non-string field \"registrationId\"",
            )
        })?;
    let combo = {
        let registry = app.state::<PluginHotkeyRegistry>();
        registry.with(|map| {
            map.get(plugin_id)
                .and_then(|list| list.iter().find(|r| r.registration_id == reg_id))
                .map(|r| r.combo.clone())
        })
    };
    let combo = combo.ok_or_else(|| {
        JsonRpcError::new(
            RpcErrorCode::InvalidParams,
            format!("unknown registrationId {reg_id:?}"),
        )
    })?;

    if let Ok(sc) = Shortcut::from_str(&combo) {
        let _ = app.global_shortcut().unregister(sc);
    }
    let registry = app.state::<PluginHotkeyRegistry>();
    registry.with(|map| {
        if let Some(list) = map.get_mut(plugin_id) {
            list.retain(|r| r.registration_id != reg_id);
        }
    });

    Ok(serde_json::json!({}))
}

pub fn on_trigger(
    app: &AppHandle,
    plugin_id: &PluginId,
    window_label: &str,
    _params: &Value,
) -> RpcResult {
    permissions::require(app, plugin_id, Permission::Hotkeys)?;
    let id = register_subscription(app, plugin_id, window_label, "hotkey.onTrigger").map_err(|e| {
        JsonRpcError::new(RpcErrorCode::InternalError, format!("subscribe: {e}"))
    })?;
    Ok(serde_json::json!({ "subscriptionId": id }))
}

/// Release every hotkey owned by a plugin (called from teardown_primary).
pub fn release_all(app: &AppHandle, plugin_id: &PluginId) {
    let registry = app.state::<PluginHotkeyRegistry>();
    let owned: Vec<HotkeyRegistration> = registry.with(|map| {
        map.remove(plugin_id).unwrap_or_default()
    });
    if owned.is_empty() {
        return;
    }
    let gs = app.global_shortcut();
    for r in &owned {
        if let Ok(sc) = Shortcut::from_str(&r.combo) {
            let _ = gs.unregister(sc);
        }
    }
    log::info!(
        "[plugin={plugin_id}] released {} hotkey registration(s) on teardown",
        owned.len()
    );
}
