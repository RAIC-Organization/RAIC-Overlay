// log.* JSON-RPC methods.
//
// Each call writes a structured entry to the unified host log, tagged with
// the plugin id so users (and authors) can grep for misbehaviour or
// surprises in production.

use serde_json::Value;

use crate::plugins::types::{JsonRpcError, PluginId, RpcErrorCode, RpcResult};

enum Level {
    Info,
    Warn,
    Error,
}

pub fn info(plugin_id: &PluginId, params: &Value) -> RpcResult {
    write(plugin_id, params, Level::Info)
}

pub fn warn(plugin_id: &PluginId, params: &Value) -> RpcResult {
    write(plugin_id, params, Level::Warn)
}

pub fn error(plugin_id: &PluginId, params: &Value) -> RpcResult {
    write(plugin_id, params, Level::Error)
}

fn write(plugin_id: &PluginId, params: &Value, level: Level) -> RpcResult {
    let message = params
        .get("message")
        .and_then(|v| v.as_str())
        .ok_or_else(|| {
            JsonRpcError::new(
                RpcErrorCode::InvalidParams,
                "missing or non-string field \"message\"",
            )
        })?;
    let data = params.get("data").cloned();
    let formatted = match data {
        Some(d) if !d.is_null() => format!("{message} | {d}"),
        _ => message.to_string(),
    };
    match level {
        Level::Info => log::info!("[plugin={plugin_id}] {formatted}"),
        Level::Warn => log::warn!("[plugin={plugin_id}] {formatted}"),
        Level::Error => log::error!("[plugin={plugin_id}] {formatted}"),
    }
    Ok(serde_json::json!({}))
}
