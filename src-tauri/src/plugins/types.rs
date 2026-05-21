// Core types for the plugin system (Feature 060).
//
// Mirrors specs/060-plugin-system/data-model.md. Serialised via serde for
// registry.json and the JSON-RPC v1 wire format.

use serde::{Deserialize, Deserializer, Serialize, Serializer};
use std::collections::HashMap;

// ============================================================================
// Identifier aliases
// ============================================================================

/// Reverse-DNS-style globally unique plugin id, e.g. `com.alice.demo`.
pub type PluginId = String;

/// SemVer 2.0.0 string, e.g. `"1.4.2"`.
pub type SemverString = String;

/// Opaque id for a hotkey registration owned by a plugin instance.
pub type RegistrationId = String;

/// Opaque id for an event subscription owned by a plugin instance.
pub type SubscriptionId = String;

// ============================================================================
// Registry (persisted)
// ============================================================================

/// Root of `<app_data>/plugins/registry.json`.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PluginRegistry {
    pub schema_version: u32,
    #[serde(default)]
    pub plugins: HashMap<PluginId, RegisteredPlugin>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub last_update_check_at: Option<String>,
}

impl Default for PluginRegistry {
    fn default() -> Self {
        Self {
            schema_version: 1,
            plugins: HashMap::new(),
            last_update_check_at: None,
        }
    }
}

/// One installed plugin's registry entry.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct RegisteredPlugin {
    pub id: PluginId,
    pub name: String,
    pub installed_version: SemverString,
    pub installed_at: String,
    pub updated_at: String,
    pub source_repo_url: String,
    pub enabled: bool,
    pub granted_permissions: Vec<Permission>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub etag: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub available_update: Option<AvailableUpdate>,
    #[serde(default)]
    pub storage_bytes: u64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AvailableUpdate {
    pub version: SemverString,
    pub release_url: String,
    pub release_notes: String,
    pub asset_size_bytes: u64,
    pub detected_at: String,
}

// ============================================================================
// Permission
// ============================================================================

/// A capability category declared by a plugin's manifest. Unknown names are
/// preserved (FR-forward-compat) so the consent dialog can show them and the
/// user can knowingly grant or reject them.
#[derive(Debug, Clone, PartialEq, Eq, Hash)]
pub enum Permission {
    Notifications,
    Hotkeys,
    Sidecar,
    Unknown(String),
}

impl Permission {
    pub fn parse(s: &str) -> Self {
        match s {
            "notifications" => Self::Notifications,
            "hotkeys" => Self::Hotkeys,
            "sidecar" => Self::Sidecar,
            other => Self::Unknown(other.to_string()),
        }
    }

    pub fn as_str(&self) -> &str {
        match self {
            Self::Notifications => "notifications",
            Self::Hotkeys => "hotkeys",
            Self::Sidecar => "sidecar",
            Self::Unknown(s) => s.as_str(),
        }
    }

    pub fn is_known(&self) -> bool {
        !matches!(self, Self::Unknown(_))
    }
}

impl Serialize for Permission {
    fn serialize<S: Serializer>(&self, ser: S) -> Result<S::Ok, S::Error> {
        ser.serialize_str(self.as_str())
    }
}

impl<'de> Deserialize<'de> for Permission {
    fn deserialize<D: Deserializer<'de>>(de: D) -> Result<Self, D::Error> {
        let s = String::deserialize(de)?;
        Ok(Self::parse(&s))
    }
}

// ============================================================================
// JSON-RPC wire types (contracts/jsonrpc-v1.md)
// ============================================================================

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct JsonRpcRequest {
    pub jsonrpc: String,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub id: Option<serde_json::Value>,
    pub method: String,
    #[serde(default)]
    pub params: serde_json::Value,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct JsonRpcResponse {
    pub jsonrpc: String,
    pub id: serde_json::Value,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub result: Option<serde_json::Value>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub error: Option<JsonRpcError>,
}

impl JsonRpcResponse {
    pub fn ok(id: serde_json::Value, result: serde_json::Value) -> Self {
        Self {
            jsonrpc: "2.0".into(),
            id,
            result: Some(result),
            error: None,
        }
    }

    pub fn err(id: serde_json::Value, error: JsonRpcError) -> Self {
        Self {
            jsonrpc: "2.0".into(),
            id,
            result: None,
            error: Some(error),
        }
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct JsonRpcError {
    pub code: i32,
    pub message: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub data: Option<serde_json::Value>,
}

/// JSON-RPC v1 error codes (contracts/jsonrpc-v1.md §Error model).
#[derive(Debug, Clone, Copy)]
pub enum RpcErrorCode {
    ParseError = -32700,
    InvalidRequest = -32600,
    MethodNotFound = -32601,
    InvalidParams = -32602,
    InternalError = -32603,
    PermissionDenied = -32000,
    SidecarUnavailable = -32001,
    SidecarTimeout = -32002,
    Conflict = -32003,
}

impl JsonRpcError {
    pub fn new(code: RpcErrorCode, message: impl Into<String>) -> Self {
        Self {
            code: code as i32,
            message: message.into(),
            data: None,
        }
    }

    pub fn with_data(mut self, data: serde_json::Value) -> Self {
        self.data = Some(data);
        self
    }
}

/// Shorthand for dispatcher handler return types.
pub type RpcResult = Result<serde_json::Value, JsonRpcError>;
