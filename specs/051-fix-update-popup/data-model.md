# Data Model: Fix Update Popup Not Appearing

**Feature**: 051-fix-update-popup
**Date**: 2026-01-03

## Entities

### UpdateWindowState (NEW)

Manages the state for the dedicated update window.

| Field | Type | Description |
|-------|------|-------------|
| update_info | `Option<UpdateInfo>` | The update info to display in the window |

**Rust Implementation**:
```rust
#[derive(Default)]
pub struct UpdateWindowState {
    pub update_info: Mutex<Option<UpdateInfo>>,
}
```

**Lifecycle**:
1. Created at app startup (empty)
2. Populated when `check_for_updates` finds an update
3. Read by frontend when update window opens
4. Cleared when user dismisses or accepts update

### UpdateInfo (EXISTING - No Changes)

Information about an available update.

| Field | Type | Description |
|-------|------|-------------|
| version | `String` | New version available (e.g., "0.2.0") |
| current_version | `String` | Currently installed version (e.g., "0.1.0") |
| download_url | `String` | URL to download the MSI installer |
| download_size | `u64` | Size of the installer in bytes |
| release_url | `String` | URL to the GitHub release page |

### OpenUpdateWindowResult (NEW)

Result returned by the `open_update_window` Tauri command.

| Field | Type | Description |
|-------|------|-------------|
| success | `bool` | Whether the window was opened/focused successfully |
| created | `bool` | True if new window was created, false if existing was focused |
| error | `Option<String>` | Error message if success is false |

**Rust Implementation**:
```rust
#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct OpenUpdateWindowResult {
    pub success: bool,
    pub created: bool,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub error: Option<String>,
}
```

## State Transitions

```
┌─────────────────┐
│   App Launch    │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Check Updates  │ (after 3 second delay)
└────────┬────────┘
         │
         ├── No update ──► Done
         │
         ▼ Update available
┌─────────────────┐
│ Set Window State│
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Open/Focus      │
│ Update Window   │
└────────┬────────┘
         │
         ├── "Update Now" ──► Download ──► Install ──► Exit app
         │
         └── "Ask Later" / X ──► Close window ──► Done (until next check)
```

## Relationships

```
UpdateWindowState
      │
      │ contains
      ▼
  UpdateInfo
      │
      │ used by
      ▼
OpenUpdateWindowResult
```

## Validation Rules

1. **UpdateWindowState.update_info**:
   - Must be set before opening the update window
   - Must be cleared when window is closed/dismissed

2. **OpenUpdateWindowResult**:
   - If `success` is false, `error` must contain a message
   - If `created` is false, an existing window was focused

3. **UpdateInfo** (existing rules, unchanged):
   - `version` must be a valid semver string
   - `download_url` must be a valid HTTPS URL
   - `download_size` must be > 0

## Migration Notes

- No database migration required (in-memory state only)
- No breaking changes to existing `UpdateInfo` type
- New types are additive to the `update` module
