// JSON-RPC v1 surface: the single plugin_rpc Tauri command and per-capability
// handlers.

pub mod dispatch;
pub mod permissions;
pub mod window_handler;
pub mod state_handler;
pub mod theme_handler;
pub mod log_handler;
pub mod notification_handler;
pub mod hotkey_handler;
pub mod sidecar_handler;
