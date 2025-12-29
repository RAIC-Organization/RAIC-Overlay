# Data Model: Settings Panel Window

**Feature Branch**: `038-settings-panel`
**Date**: 2025-12-29

## Overview

This document defines the data structures for the Settings Panel feature, including user settings persistence, hotkey bindings, and auto-start configuration.

---

## 1. User Settings File

**File Location**: `{app_data_dir}/user-settings.json` (same directory as `state.json` per FR-011)
**Purpose**: Persist user preferences for hotkeys and auto-start
**Note**: Uses `app.path().app_data_dir()` - verified to match existing persistence.rs pattern

### TypeScript Interface

```typescript
// src/types/user-settings.ts

/**
 * User settings persisted to user-settings.json
 * @feature 038-settings-panel
 */
export interface UserSettings {
  /** Schema version for migration support */
  version: number;

  /** Hotkey bindings configuration */
  hotkeys: HotkeySettings;

  /** Auto-start with Windows preference */
  autoStart: boolean;

  /** Last modified timestamp (ISO 8601) */
  lastModified: string;
}

/**
 * Hotkey bindings for overlay control
 */
export interface HotkeySettings {
  /** Toggle overlay visibility (default: F3) */
  toggleVisibility: HotkeyBinding;

  /** Toggle overlay mode - passthrough/interactive (default: F5) */
  toggleMode: HotkeyBinding;
}

/**
 * Single hotkey binding configuration
 */
export interface HotkeyBinding {
  /** Primary key code (Windows VK code as string, e.g., "F3", "O") */
  key: string;

  /** Key code as integer (Windows VK_* code) */
  keyCode: number;

  /** Ctrl modifier required */
  ctrl: boolean;

  /** Shift modifier required */
  shift: boolean;

  /** Alt modifier required */
  alt: boolean;
}

/**
 * Default user settings
 */
export const DEFAULT_USER_SETTINGS: UserSettings = {
  version: 1,
  hotkeys: {
    toggleVisibility: {
      key: "F3",
      keyCode: 0x72,  // VK_F3
      ctrl: false,
      shift: false,
      alt: false,
    },
    toggleMode: {
      key: "F5",
      keyCode: 0x74,  // VK_F5
      ctrl: false,
      shift: false,
      alt: false,
    },
  },
  autoStart: false,
  lastModified: "",
};
```

### Rust Struct

```rust
// src-tauri/src/user_settings_types.rs

use serde::{Deserialize, Serialize};

pub const CURRENT_USER_SETTINGS_VERSION: u32 = 1;

/// User settings persisted to user-settings.json
/// @feature 038-settings-panel
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct UserSettings {
    /// Schema version for migration support
    pub version: u32,

    /// Hotkey bindings configuration
    pub hotkeys: HotkeySettings,

    /// Auto-start with Windows preference
    pub auto_start: bool,

    /// Last modified timestamp (ISO 8601)
    pub last_modified: String,
}

/// Hotkey bindings for overlay control
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct HotkeySettings {
    /// Toggle overlay visibility (default: F3)
    pub toggle_visibility: HotkeyBinding,

    /// Toggle overlay mode - passthrough/interactive (default: F5)
    pub toggle_mode: HotkeyBinding,
}

/// Single hotkey binding configuration
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct HotkeyBinding {
    /// Primary key name (e.g., "F3", "O")
    pub key: String,

    /// Key code as integer (Windows VK_* code)
    pub key_code: u32,

    /// Ctrl modifier required
    pub ctrl: bool,

    /// Shift modifier required
    pub shift: bool,

    /// Alt modifier required
    pub alt: bool,
}

impl Default for UserSettings {
    fn default() -> Self {
        Self {
            version: CURRENT_USER_SETTINGS_VERSION,
            hotkeys: HotkeySettings::default(),
            auto_start: false,
            last_modified: String::new(),
        }
    }
}

impl Default for HotkeySettings {
    fn default() -> Self {
        Self {
            toggle_visibility: HotkeyBinding {
                key: "F3".to_string(),
                key_code: 0x72,  // VK_F3
                ctrl: false,
                shift: false,
                alt: false,
            },
            toggle_mode: HotkeyBinding {
                key: "F5".to_string(),
                key_code: 0x74,  // VK_F5
                ctrl: false,
                shift: false,
                alt: false,
            },
        }
    }
}
```

---

## 2. IPC Result Types

### Load User Settings Result

```typescript
// src/types/user-settings.ts

export interface LoadUserSettingsResult {
  success: boolean;
  settings: UserSettings | null;
  error?: string;
}
```

```rust
// src-tauri/src/user_settings_types.rs

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct LoadUserSettingsResult {
    pub success: bool,
    pub settings: Option<UserSettings>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub error: Option<String>,
}
```

### Save User Settings Result

```typescript
export interface SaveUserSettingsResult {
  success: boolean;
  error?: string;
}
```

```rust
#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct SaveUserSettingsResult {
    pub success: bool,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub error: Option<String>,
}
```

---

## 3. Settings Window State

### React State (Frontend)

```typescript
// src/components/settings/SettingsPanel.tsx

interface SettingsState {
  /** Current settings being edited */
  settings: UserSettings;

  /** Original settings (for detecting changes) */
  originalSettings: UserSettings;

  /** Which hotkey field is currently capturing input */
  capturingField: 'toggleVisibility' | 'toggleMode' | null;

  /** Validation errors */
  errors: {
    toggleVisibility?: string;
    toggleMode?: string;
    autoStart?: string;
  };

  /** Loading state */
  isLoading: boolean;

  /** Saving state */
  isSaving: boolean;
}
```

---

## 4. Hotkey Validation

### Validation Rules

```typescript
// src/utils/hotkey-validation.ts

/**
 * Reserved key combinations that cannot be assigned
 */
export const RESERVED_COMBINATIONS: string[] = [
  "Ctrl+Alt+Delete",
  "Alt+F4",
  "Ctrl+Escape",
  "Alt+Tab",
  "Win+L",
];

/**
 * Modifier-only keys that are invalid as standalone bindings
 */
export const MODIFIER_KEYS = ["Control", "Shift", "Alt", "Meta"];

/**
 * Validate a hotkey binding
 * @returns Error message or null if valid
 */
export function validateHotkeyBinding(
  binding: HotkeyBinding,
  otherBinding: HotkeyBinding
): string | null {
  // Check for standalone modifier
  if (MODIFIER_KEYS.includes(binding.key)) {
    return "Cannot use modifier key alone";
  }

  // Check for reserved combination
  const formatted = formatHotkey(binding);
  if (RESERVED_COMBINATIONS.includes(formatted)) {
    return `${formatted} is a reserved system shortcut`;
  }

  // Check for duplicate with other binding
  if (hotkeyEquals(binding, otherBinding)) {
    return "This key is already assigned to another action";
  }

  return null;
}

/**
 * Format hotkey for display
 */
export function formatHotkey(binding: HotkeyBinding): string {
  const parts: string[] = [];
  if (binding.ctrl) parts.push("Ctrl");
  if (binding.shift) parts.push("Shift");
  if (binding.alt) parts.push("Alt");
  parts.push(binding.key);
  return parts.join("+");
}

/**
 * Check if two hotkey bindings are equal
 */
export function hotkeyEquals(a: HotkeyBinding, b: HotkeyBinding): boolean {
  return (
    a.keyCode === b.keyCode &&
    a.ctrl === b.ctrl &&
    a.shift === b.shift &&
    a.alt === b.alt
  );
}
```

---

## 5. Virtual Key Code Mapping

### Common VK Codes

```typescript
// src/utils/vk-codes.ts

/**
 * Windows Virtual Key code mapping
 * @see https://docs.microsoft.com/en-us/windows/win32/inputdev/virtual-key-codes
 */
export const VK_CODES: Record<string, number> = {
  // Function keys
  F1: 0x70,
  F2: 0x71,
  F3: 0x72,
  F4: 0x73,
  F5: 0x74,
  F6: 0x75,
  F7: 0x76,
  F8: 0x77,
  F9: 0x78,
  F10: 0x79,
  F11: 0x7A,
  F12: 0x7B,

  // Letters (A-Z: 0x41-0x5A)
  A: 0x41,
  B: 0x42,
  C: 0x43,
  // ... etc

  // Numbers (0-9: 0x30-0x39)
  "0": 0x30,
  "1": 0x31,
  // ... etc

  // Special keys
  Space: 0x20,
  Enter: 0x0D,
  Escape: 0x1B,
  Tab: 0x09,
  Backspace: 0x08,
  Delete: 0x2E,
  Insert: 0x2D,
  Home: 0x24,
  End: 0x23,
  PageUp: 0x21,
  PageDown: 0x22,

  // Arrow keys
  ArrowLeft: 0x25,
  ArrowUp: 0x26,
  ArrowRight: 0x27,
  ArrowDown: 0x28,

  // Numpad
  Numpad0: 0x60,
  Numpad1: 0x61,
  // ... etc
};

/**
 * Get VK code from KeyboardEvent.key
 */
export function keyToVkCode(key: string): number | null {
  // Normalize key name
  const normalizedKey = key.toUpperCase();

  // Direct lookup
  if (VK_CODES[normalizedKey]) {
    return VK_CODES[normalizedKey];
  }

  // Handle single letters
  if (normalizedKey.length === 1 && normalizedKey >= "A" && normalizedKey <= "Z") {
    return normalizedKey.charCodeAt(0);
  }

  // Handle digits
  if (normalizedKey.length === 1 && normalizedKey >= "0" && normalizedKey <= "9") {
    return normalizedKey.charCodeAt(0);
  }

  return null;
}
```

---

## 6. File Schema

### user-settings.json Example

```json
{
  "version": 1,
  "hotkeys": {
    "toggleVisibility": {
      "key": "O",
      "keyCode": 79,
      "ctrl": true,
      "shift": true,
      "alt": false
    },
    "toggleMode": {
      "key": "M",
      "keyCode": 77,
      "ctrl": true,
      "shift": true,
      "alt": false
    }
  },
  "autoStart": true,
  "lastModified": "2025-12-29T10:30:00.000Z"
}
```

---

## 7. Entity Relationships

```
+-------------------+
|   UserSettings    |
+-------------------+
| version           |
| autoStart         |
| lastModified      |
+--------+----------+
         |
         | 1:1
         v
+-------------------+
|  HotkeySettings   |
+-------------------+
| toggleVisibility  |----+
| toggleMode        |-+  |
+-------------------+ |  |
                      |  |
         +------------+  |
         |               |
         v               v
+-------------------+   +-------------------+
|  HotkeyBinding    |   |  HotkeyBinding    |
+-------------------+   +-------------------+
| key               |   | key               |
| keyCode           |   | keyCode           |
| ctrl              |   | ctrl              |
| shift             |   | shift             |
| alt               |   | alt               |
+-------------------+   +-------------------+
```

---

## 8. State Transitions

### Hotkey Capture State Machine

```
                 +--------+
                 | IDLE   |
                 +---+----+
                     |
           focus on field
                     v
                 +--------+
                 |CAPTURING|<------+
                 +---+----+        |
                     |             |
          keydown event       modifier only
                     |             |
                     v             |
              +------+------+      |
              | is modifier |------+
              | only?       |
              +------+------+
                     | no
                     v
              +------+------+
              | validate    |
              | binding     |
              +------+------+
                     |
         +-----------+-----------+
         |                       |
      valid                  invalid
         |                       |
         v                       v
    +--------+              +--------+
    | VALID  |              | ERROR  |
    +---+----+              +---+----+
        |                       |
   click save              user corrects
        |                       |
        v                       |
    +--------+                  |
    | SAVING |                  |
    +---+----+                  |
        |                       |
    save complete               |
        |                       |
        v                       |
    +--------+                  |
    | IDLE   |<-----------------+
    +--------+
```

---

## 9. Migration Strategy

### Version 1 (Initial)
- Base schema as defined above
- No migrations needed

### Future Versions
- Add `version` field check on load
- Implement migration functions per version bump
- Example: Version 2 might add mouse button support

```rust
fn migrate_settings(settings: serde_json::Value) -> Result<UserSettings, String> {
    let version = settings["version"].as_u64().unwrap_or(0);

    match version {
        0 => {
            // Legacy format without version
            migrate_v0_to_v1(settings)
        }
        1 => {
            // Current version
            serde_json::from_value(settings)
                .map_err(|e| format!("Failed to parse settings: {}", e))
        }
        _ => {
            // Future version - try to parse, may fail
            serde_json::from_value(settings)
                .map_err(|e| format!("Unknown settings version: {}", e))
        }
    }
}
```
