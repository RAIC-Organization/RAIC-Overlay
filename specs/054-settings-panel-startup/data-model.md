# Data Model: Settings Panel Startup Behavior

**Feature**: 054-settings-panel-startup
**Date**: 2026-01-03

## Entity Changes

### UserSettings (Extended)

This feature extends the existing `UserSettings` entity with a single field.

#### Current Structure (Before)

```rust
pub struct UserSettings {
    pub version: u32,
    pub hotkeys: HotkeySettings,
    pub auto_start: bool,
    pub last_modified: String,
}
```

#### Updated Structure (After)

```rust
pub struct UserSettings {
    pub version: u32,
    pub hotkeys: HotkeySettings,
    pub auto_start: bool,
    #[serde(default)]  // NEW: defaults to false for backward compatibility
    pub start_minimized: bool,  // NEW FIELD
    pub last_modified: String,
}
```

### Field Specification

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `start_minimized` | `bool` | `false` | When false, Settings panel opens on app startup. When true, app starts silently (original behavior). |

### TypeScript Mirror Type

```typescript
export interface UserSettings {
  version: number;
  hotkeys: HotkeySettings;
  autoStart: boolean;
  startMinimized: boolean;  // NEW FIELD (camelCase per serde rename)
  lastModified: string;
}

export const DEFAULT_USER_SETTINGS: UserSettings = {
  version: 1,
  hotkeys: { /* existing */ },
  autoStart: false,
  startMinimized: false,  // NEW: default shows Settings on startup
  lastModified: "",
};
```

## Persistence

### File Location

```
{TAURI_APP_DATA_DIR}/user-settings.json
```

### JSON Schema (Updated)

```json
{
  "version": 1,
  "hotkeys": {
    "toggleVisibility": { "key": "F3", "keyCode": 114, "ctrl": false, "shift": false, "alt": false },
    "toggleMode": { "key": "F5", "keyCode": 116, "ctrl": false, "shift": false, "alt": false },
    "chronometerStartPause": { "key": "T", "keyCode": 84, "ctrl": true, "shift": false, "alt": false },
    "chronometerReset": { "key": "Y", "keyCode": 89, "ctrl": true, "shift": false, "alt": false }
  },
  "autoStart": false,
  "startMinimized": false,
  "lastModified": "2026-01-03T12:00:00.000Z"
}
```

## State Transitions

### start_minimized Field

```
                    ┌─────────────────────┐
                    │  Initial Install    │
                    │  (no settings file) │
                    └─────────┬───────────┘
                              │ default: false
                              ▼
┌─────────────────────────────────────────────────────┐
│                  start_minimized = false            │
│       (Settings panel opens on app startup)         │
└─────────────────────────────────────────────────────┘
                              │
              User enables "Start Minimized" and saves
                              │
                              ▼
┌─────────────────────────────────────────────────────┐
│                  start_minimized = true             │
│        (App starts silently, tray only)             │
└─────────────────────────────────────────────────────┘
                              │
             User disables "Start Minimized" and saves
                              │
                              ▼
                    (Back to false state)
```

## Validation Rules

| Rule | Description |
|------|-------------|
| Type safety | Field must be boolean (true/false only) |
| Default fallback | Missing field in JSON defaults to `false` via serde |
| No null | Field cannot be null; use default if not present |

## Migration

**No migration required.**

The `#[serde(default)]` attribute handles backward compatibility:
- Existing settings files without `startMinimized` field load successfully
- Field defaults to `false` (show Settings panel on startup)
- First save after update will include the new field

## Related Entities

- `HotkeySettings` - Unchanged, part of parent UserSettings
- `HotkeyBinding` - Unchanged, nested in HotkeySettings
