# Data Model: Sync Webview Hotkeys with Backend Settings

**Feature**: 042-sync-webview-hotkeys
**Date**: 2025-12-31

## Entities

This feature uses existing entities from the codebase. No new entities are introduced.

### Existing Entities (No Changes Required)

#### HotkeyBinding

Represents a single hotkey configuration with key and modifier flags.

**Location**: `src/types/user-settings.ts` (frontend), `src-tauri/src/user_settings_types.rs` (backend)

| Field | Type | Description |
|-------|------|-------------|
| key | string | The key name (e.g., "F3", "O", "M") |
| keyCode | number | Windows Virtual Key code (e.g., 0x72 for F3) |
| ctrl | boolean | Ctrl modifier required |
| shift | boolean | Shift modifier required |
| alt | boolean | Alt modifier required |

**Validation Rules**:
- `key` must be a valid key name (not a modifier-only key)
- `keyCode` must be a valid Windows VK code (0x00-0xFF)
- At least one of `ctrl`, `shift`, `alt` must be true OR `key` must be a function key (F1-F12)

#### HotkeySettings

Container for all hotkey bindings in the application.

**Location**: `src/types/user-settings.ts` (frontend), `src-tauri/src/user_settings_types.rs` (backend)

| Field | Type | Description |
|-------|------|-------------|
| toggleVisibility | HotkeyBinding | Hotkey to show/hide overlay |
| toggleMode | HotkeyBinding | Hotkey to toggle interactive/click-through mode |

**Default Values**:
```typescript
{
  toggleVisibility: { key: "F3", keyCode: 0x72, ctrl: false, shift: false, alt: false },
  toggleMode: { key: "F5", keyCode: 0x74, ctrl: false, shift: false, alt: false }
}
```

#### UserSettings (Container - Partial)

Only the `hotkeys` field is relevant to this feature.

| Field | Type | Description |
|-------|------|-------------|
| hotkeys | HotkeySettings | Hotkey configuration (relevant) |
| version | number | Settings schema version (unchanged) |
| autoStart | boolean | Auto-start on login (unchanged) |
| lastModified | string | ISO timestamp (unchanged) |

## New Event Types

### HotkeysUpdatedEvent

Event emitted by backend when hotkey settings change.

**Event Name**: `hotkeys-updated`

**Payload**: `HotkeySettings`

```typescript
// Frontend usage
import { listen } from '@tauri-apps/api/event';

listen<HotkeySettings>('hotkeys-updated', (event) => {
  // event.payload: HotkeySettings
  console.log(event.payload.toggleVisibility); // HotkeyBinding
  console.log(event.payload.toggleMode);       // HotkeyBinding
});
```

```rust
// Backend emission
use tauri::{AppHandle, Emitter};

fn emit_hotkeys_updated(app: &AppHandle, hotkeys: &HotkeySettings) -> Result<(), String> {
    app.emit("hotkeys-updated", hotkeys)
        .map_err(|e| format!("Failed to emit hotkeys-updated: {}", e))
}
```

## State Transitions

### Hotkey Configuration State Machine

```
┌─────────────────┐
│   Unloaded      │ (hook mounted, no config yet)
└────────┬────────┘
         │ load_user_settings() success
         ▼
┌─────────────────┐
│   Configured    │ ◄──────────────────┐
│   (active)      │                    │
└────────┬────────┘                    │
         │ hotkeys-updated event       │
         │                             │
         ▼                             │
┌─────────────────┐                    │
│   Updating      │────────────────────┘
│   (re-render)   │  setState triggers
└─────────────────┘  useEffect to use new config
```

**States**:
1. **Unloaded**: Hook mounted but settings not yet loaded
2. **Configured**: Settings loaded, keydown listener active with current config
3. **Updating**: New settings received, transitioning to new configuration

**Transitions**:
- `Unloaded → Configured`: On successful `load_user_settings()` invoke
- `Configured → Updating → Configured`: On `hotkeys-updated` event received

## Data Flow

```
┌─────────────────────────────────────────────────────────────┐
│ User changes hotkey in Settings Panel                       │
└─────────────────────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────┐
│ SettingsPanel calls invoke("update_hotkeys", { hotkeys })   │
└─────────────────────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────┐
│ Backend: update_hotkeys()                                   │
│ 1. Update in-memory cache (USER_SETTINGS)                   │
│ 2. Emit "hotkeys-updated" event with HotkeySettings payload │
└─────────────────────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────┐
│ Frontend: useHotkeyCapture listener receives event          │
│ 1. setHotkeyConfig(event.payload)                           │
│ 2. React re-renders, useEffect with new config runs         │
│ 3. New keydown handler captures configured keys             │
└─────────────────────────────────────────────────────────────┘
```

## Persistence

No new persistence requirements. Existing `user-settings.json` in Tauri app data directory already handles hotkey persistence through `save_user_settings` command.

## Related Types (Existing)

| Type | Location | Used For |
|------|----------|----------|
| `LoadUserSettingsResult` | `src/types/user-settings.ts` | Loading settings on startup |
| `DEFAULT_USER_SETTINGS` | `src/types/user-settings.ts` | Fallback defaults |
| `OverlayStateResponse` | `src/types/ipc.ts` | Invoke response type |
