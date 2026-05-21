// state.* JSON-RPC methods — per-plugin persistent KV store.
//
// Storage layout (data-model §E-11 + R-008):
//   <app_data>/plugins/<plugin-id>/state/state.json
//
// Scoping (FR-024): each plugin's state file path is keyed on its id, so
// plugin A literally cannot reach plugin B's keys through any documented
// method. Atomic writes via .tmp + rename.

use std::collections::BTreeMap;
use std::path::PathBuf;
use std::sync::Mutex;

use serde::{Deserialize, Serialize};
use serde_json::Value;
use tauri::{AppHandle, Manager};

use crate::plugins::registry::plugin_state_dir;
use crate::plugins::types::{JsonRpcError, PluginId, RpcErrorCode, RpcResult};

const STATE_FILE: &str = "state.json";

#[derive(Debug, Clone, Default, Serialize, Deserialize)]
pub struct PluginState {
    #[serde(default)]
    pub data: BTreeMap<String, Value>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub updated_at: Option<String>,
}

/// In-memory cache + serialised write throttle. Tauri-managed.
#[derive(Default)]
pub struct PluginStateCache(Mutex<std::collections::HashMap<PluginId, PluginState>>);

fn state_file(app: &AppHandle, id: &PluginId) -> Result<PathBuf, String> {
    Ok(plugin_state_dir(app, id)?.join(STATE_FILE))
}

fn load_state_from_disk(app: &AppHandle, id: &PluginId) -> Result<PluginState, String> {
    let path = state_file(app, id)?;
    if !path.exists() {
        return Ok(PluginState::default());
    }
    let bytes = std::fs::read(&path).map_err(|e| format!("read {}: {e}", path.display()))?;
    serde_json::from_slice(&bytes).map_err(|e| format!("parse {}: {e}", path.display()))
}

fn save_state_to_disk(app: &AppHandle, id: &PluginId, state: &PluginState) -> Result<(), String> {
    let path = state_file(app, id)?;
    let tmp = path.with_extension("json.tmp");
    let bytes = serde_json::to_vec_pretty(state).map_err(|e| format!("serialise: {e}"))?;
    std::fs::write(&tmp, &bytes).map_err(|e| format!("write {}: {e}", tmp.display()))?;
    std::fs::rename(&tmp, &path)
        .map_err(|e| format!("rename {} -> {}: {e}", tmp.display(), path.display()))?;
    Ok(())
}

fn with_state<F, R>(app: &AppHandle, id: &PluginId, f: F) -> Result<R, String>
where
    F: FnOnce(&mut PluginState) -> R,
{
    let cache = app.state::<PluginStateCache>();
    let mut map = cache.0.lock().expect("plugin state cache mutex poisoned");
    if !map.contains_key(id) {
        let on_disk = load_state_from_disk(app, id)?;
        map.insert(id.clone(), on_disk);
    }
    let state = map.get_mut(id).expect("just inserted");
    let result = f(state);
    Ok(result)
}

fn write_through<F, R>(app: &AppHandle, id: &PluginId, f: F) -> Result<R, String>
where
    F: FnOnce(&mut PluginState) -> R,
{
    let result = with_state(app, id, |s| {
        let r = f(s);
        s.updated_at = Some(chrono::Utc::now().to_rfc3339());
        r
    })?;
    // Snapshot under the lock for the disk write (small files, OK to hold).
    let cache = app.state::<PluginStateCache>();
    let snapshot = {
        let map = cache.0.lock().expect("plugin state cache mutex poisoned");
        map.get(id).cloned().unwrap_or_default()
    };
    save_state_to_disk(app, id, &snapshot)?;
    Ok(result)
}

// ---------------------------------------------------------------------------
// JSON-RPC methods (called by rpc::dispatch::dispatch)
// ---------------------------------------------------------------------------

pub fn get(app: &AppHandle, plugin_id: &PluginId, params: &Value) -> RpcResult {
    let key = require_string(params, "key")?;
    let value = with_state(app, plugin_id, |s| s.data.get(&key).cloned())
        .map_err(internal)?
        .unwrap_or(Value::Null);
    Ok(serde_json::json!({ "value": value }))
}

pub fn set(app: &AppHandle, plugin_id: &PluginId, params: &Value) -> RpcResult {
    let key = require_string(params, "key")?;
    let value = params.get("value").cloned().ok_or_else(|| {
        JsonRpcError::new(RpcErrorCode::InvalidParams, "missing field \"value\"")
    })?;
    write_through(app, plugin_id, |s| {
        s.data.insert(key, value);
    })
    .map_err(internal)?;
    Ok(serde_json::json!({}))
}

pub fn delete(app: &AppHandle, plugin_id: &PluginId, params: &Value) -> RpcResult {
    let key = require_string(params, "key")?;
    let existed = write_through(app, plugin_id, |s| s.data.remove(&key).is_some())
        .map_err(internal)?;
    Ok(serde_json::json!({ "existed": existed }))
}

pub fn list(app: &AppHandle, plugin_id: &PluginId, _params: &Value) -> RpcResult {
    let keys: Vec<String> =
        with_state(app, plugin_id, |s| s.data.keys().cloned().collect()).map_err(internal)?;
    Ok(serde_json::json!({ "keys": keys }))
}

pub fn usage(app: &AppHandle, plugin_id: &PluginId, _params: &Value) -> RpcResult {
    let path = state_file(app, plugin_id).map_err(internal)?;
    let bytes = if path.exists() {
        std::fs::metadata(&path).map(|m| m.len()).unwrap_or(0)
    } else {
        0
    };
    Ok(serde_json::json!({ "bytes": bytes }))
}

// ---------------------------------------------------------------------------
// helpers
// ---------------------------------------------------------------------------

fn require_string(params: &Value, field: &str) -> Result<String, JsonRpcError> {
    params
        .get(field)
        .and_then(|v| v.as_str())
        .map(|s| s.to_string())
        .ok_or_else(|| {
            JsonRpcError::new(
                RpcErrorCode::InvalidParams,
                format!("missing or non-string field {field:?}"),
            )
        })
}

fn internal(e: String) -> JsonRpcError {
    JsonRpcError::new(RpcErrorCode::InternalError, e)
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn missing_value_field_is_invalid_params() {
        // Direct unit test of the require_string helper / get path validation.
        let err = require_string(&serde_json::json!({}), "key").expect_err("missing key");
        assert_eq!(err.code, RpcErrorCode::InvalidParams as i32);
    }
}
