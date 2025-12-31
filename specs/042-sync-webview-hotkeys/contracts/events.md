# Event Contracts: Sync Webview Hotkeys

**Feature**: 042-sync-webview-hotkeys
**Date**: 2025-12-31

## Events

### hotkeys-updated

Emitted by backend when hotkey settings are updated via the `update_hotkeys` command.

**Direction**: Backend → Frontend (global broadcast)

**Event Name**: `hotkeys-updated`

**Payload Schema**:

```typescript
interface HotkeysUpdatedPayload {
  toggleVisibility: {
    key: string;      // Key name (e.g., "F3", "O")
    keyCode: number;  // Windows VK code (e.g., 0x72)
    ctrl: boolean;    // Ctrl modifier required
    shift: boolean;   // Shift modifier required
    alt: boolean;     // Alt modifier required
  };
  toggleMode: {
    key: string;
    keyCode: number;
    ctrl: boolean;
    shift: boolean;
    alt: boolean;
  };
}
```

**Example Payload**:

```json
{
  "toggleVisibility": {
    "key": "O",
    "keyCode": 79,
    "ctrl": true,
    "shift": false,
    "alt": false
  },
  "toggleMode": {
    "key": "M",
    "keyCode": 77,
    "ctrl": true,
    "shift": true,
    "alt": false
  }
}
```

**Trigger Conditions**:
- Called from `update_hotkeys` command in `user_settings.rs`
- Emitted AFTER in-memory cache is updated
- Emitted regardless of whether persistence succeeds (cache update is authoritative)

**Frontend Handling**:

```typescript
import { listen, UnlistenFn } from '@tauri-apps/api/event';
import type { HotkeySettings } from '@/types/user-settings';

// Setup listener
const unlisten: UnlistenFn = await listen<HotkeySettings>(
  'hotkeys-updated',
  (event) => {
    console.log('Hotkeys updated:', event.payload);
    // event.payload matches HotkeySettings interface
  }
);

// Cleanup
unlisten();
```

**Backend Emission**:

```rust
use tauri::{AppHandle, Emitter};
use crate::user_settings_types::HotkeySettings;

pub fn emit_hotkeys_updated(app: &AppHandle, hotkeys: &HotkeySettings) -> Result<(), String> {
    app.emit("hotkeys-updated", hotkeys)
        .map_err(|e| format!("Failed to emit hotkeys-updated event: {}", e))
}
```

---

## Existing Events (Reference)

These events are already implemented and should NOT be modified:

### toggle-visibility (existing)

Emitted by backend keyboard hook when visibility toggle is triggered.

**Usage**: Already handled in `app/page.tsx` useEffect

### toggle-mode (existing)

Emitted by backend keyboard hook when mode toggle is triggered.

**Usage**: Already handled in `app/page.tsx` useEffect

---

## Commands (Existing - No Changes to Contract)

### load_user_settings

Load user settings including hotkey configuration.

**Invocation**: `invoke<LoadUserSettingsResult>('load_user_settings')`

**Response**:
```typescript
interface LoadUserSettingsResult {
  success: boolean;
  settings: UserSettings | null;
  error?: string;
}
```

### update_hotkeys

Update hotkey configuration in memory and emit change event.

**Invocation**: `invoke('update_hotkeys', { hotkeys: HotkeySettings })`

**Response**: `Result<(), String>` (success or error message)

**Side Effect (NEW)**: Emits `hotkeys-updated` event after successful cache update

---

## Error Handling

| Scenario | Behavior |
|----------|----------|
| Event emission fails | Log error, continue operation (hotkeys still work via invoke) |
| Frontend listener setup fails | Log error, fall back to defaults |
| Settings load fails | Use `DEFAULT_USER_SETTINGS.hotkeys` |
| Malformed event payload | TypeScript types enforce structure; log and ignore if parsing fails |
