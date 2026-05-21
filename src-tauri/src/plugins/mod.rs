// Plugin system feature module (060-plugin-system)
//
// Layered architecture (per CLAUDE.md / Feature 055):
//   - types          : core data types shared across submodules
//   - registry       : persistent index of installed plugins (registry.json)
//   - installer/     : manifest validation, GitHub release fetch, zip extraction
//   - runtime/       : plugin instance lifecycle, webview creation, custom protocol
//   - rpc/           : single plugin_rpc Tauri command + handlers per capability
//   - sidecar/       : child-process spawn, stdio transport, supervision
//   - update/        : daily release polling

pub mod types;
pub mod registry;
pub mod installer;
pub mod runtime;
pub mod rpc;
pub mod sidecar;
pub mod update;
