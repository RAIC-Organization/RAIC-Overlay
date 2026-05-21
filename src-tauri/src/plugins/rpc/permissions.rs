// Permission gate for plugin_rpc handlers.
//
// Reads from the in-memory PluginRegistryState (granted_permissions snapshot
// taken at install/update time). Returns a JSON-RPC PermissionDenied error
// when the plugin's manifest did not declare the required capability.

use tauri::{AppHandle, Manager};

use crate::plugins::registry::PluginRegistryState;
use crate::plugins::types::{JsonRpcError, Permission, PluginId, RpcErrorCode};

/// Check that `plugin_id` has been granted `required`. On success returns Ok.
/// On failure returns a JSON-RPC `PermissionDenied` error whose `data.required`
/// is the missing permission name (per contracts/jsonrpc-v1.md §Error model).
pub fn require(
    app: &AppHandle,
    plugin_id: &PluginId,
    required: Permission,
) -> Result<(), JsonRpcError> {
    let registry = app.state::<PluginRegistryState>();
    let granted: bool = registry.with(|reg| {
        reg.plugins
            .get(plugin_id)
            .map(|p| p.granted_permissions.contains(&required))
            .unwrap_or(false)
    });

    if granted {
        return Ok(());
    }

    log::warn!(
        "[plugin={plugin_id}] permission denied: required={}",
        required.as_str()
    );
    Err(
        JsonRpcError::new(RpcErrorCode::PermissionDenied, "permission denied").with_data(
            serde_json::json!({ "required": required.as_str() }),
        ),
    )
}
