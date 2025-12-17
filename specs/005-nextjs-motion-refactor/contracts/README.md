# API Contracts

**Feature**: 005-nextjs-motion-refactor

## Not Applicable

This feature is a UI-only migration and animation enhancement. No new API contracts are required.

### Existing Contracts (Unchanged)

The following Tauri IPC commands remain unchanged from the existing implementation:

| Command | Direction | Description |
|---------|-----------|-------------|
| `toggle_visibility` | Frontend → Rust | Toggle overlay show/hide state |
| `toggle_mode` | Frontend → Rust | Toggle fullscreen/windowed mode |

### Existing Events (Unchanged)

| Event | Direction | Description |
|-------|-----------|-------------|
| `overlay-ready` | Rust → Frontend | Overlay initialization complete |
| `toggle-visibility` | Rust → Frontend | Visibility toggle triggered |
| `toggle-mode` | Rust → Frontend | Mode toggle triggered |
| `mode-changed` | Rust → Frontend | Mode state changed |
| `target-window-changed` | Rust → Frontend | Target window rect updated |
| `show-error-modal` | Rust → Frontend | Display error modal |
| `dismiss-error-modal` | Rust → Frontend | Hide error modal |
| `auto-hide-changed` | Rust → Frontend | Auto-hide state changed |

All backend Rust code remains completely unchanged for this feature.
