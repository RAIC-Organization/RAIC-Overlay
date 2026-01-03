# Quickstart: Settings Panel Startup Behavior

**Feature**: 054-settings-panel-startup
**Date**: 2026-01-03

## Implementation Summary

Add `startMinimized` boolean to user settings. When false (default), Settings panel opens on app startup. When true, app starts silently as before.

## Files to Modify

### Backend (Rust)

1. **`src-tauri/src/user_settings_types.rs`**
   - Add `start_minimized: bool` field to `UserSettings` struct
   - Add `#[serde(default)]` attribute for backward compatibility
   - Update `Default` impl to set `start_minimized: false`

2. **`src-tauri/src/user_settings.rs`**
   - Add `get_start_minimized()` function to read cached preference

3. **`src-tauri/src/lib.rs`**
   - In `setup()` callback, after `init_user_settings()`:
     - Call `get_start_minimized()`
     - If false, spawn async task to call `open_settings_window()`

### Frontend (TypeScript/React)

4. **`src/types/user-settings.ts`**
   - Add `startMinimized: boolean` to `UserSettings` interface
   - Add `startMinimized: false` to `DEFAULT_USER_SETTINGS`

5. **`src/components/settings/StartMinimizedToggle.tsx`** (NEW)
   - Create component following `AutoStartToggle.tsx` pattern
   - Label: "Start Minimized"
   - Description: "Launch app to system tray without showing settings"

6. **`src/components/settings/SettingsPanel.tsx`**
   - Import and render `StartMinimizedToggle` in Startup section
   - Wire up state and onChange handler

## Code Snippets

### Rust: UserSettings Field Addition

```rust
// user_settings_types.rs
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct UserSettings {
    pub version: u32,
    pub hotkeys: HotkeySettings,
    pub auto_start: bool,
    #[serde(default)]
    pub start_minimized: bool,  // ADD THIS
    pub last_modified: String,
}

impl Default for UserSettings {
    fn default() -> Self {
        Self {
            version: CURRENT_USER_SETTINGS_VERSION,
            hotkeys: HotkeySettings::default(),
            auto_start: false,
            start_minimized: false,  // ADD THIS
            last_modified: String::new(),
        }
    }
}
```

### Rust: Get Start Minimized Function

```rust
// user_settings.rs
pub fn get_start_minimized() -> bool {
    USER_SETTINGS
        .read()
        .ok()
        .and_then(|s| s.as_ref().map(|s| s.start_minimized))
        .unwrap_or(false)  // Default to false (show settings)
}
```

### Rust: Startup Logic in lib.rs

```rust
// In setup() callback, after init_user_settings()
if !user_settings::get_start_minimized() {
    let startup_handle = handle.clone();
    tauri::async_runtime::spawn(async move {
        if let Err(e) = settings_window::open_settings_window(startup_handle).await {
            log::warn!("Failed to open settings window on startup: {}", e);
        }
    });
}
```

### TypeScript: Type Update

```typescript
// src/types/user-settings.ts
export interface UserSettings {
  version: number;
  hotkeys: HotkeySettings;
  autoStart: boolean;
  startMinimized: boolean;  // ADD THIS
  lastModified: string;
}

export const DEFAULT_USER_SETTINGS: UserSettings = {
  version: 1,
  hotkeys: { /* existing */ },
  autoStart: false,
  startMinimized: false,  // ADD THIS
  lastModified: "",
};
```

### React: Toggle Component

```tsx
// src/components/settings/StartMinimizedToggle.tsx
"use client";

import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

interface StartMinimizedToggleProps {
  enabled: boolean;
  onChange: (enabled: boolean) => void;
}

export function StartMinimizedToggle({ enabled, onChange }: StartMinimizedToggleProps) {
  return (
    <div className="flex items-center justify-between">
      <div className="space-y-0.5">
        <Label htmlFor="start-minimized" className="font-display text-sm">
          Start Minimized
        </Label>
        <p className="text-xs text-muted-foreground">
          Launch to system tray without showing settings
        </p>
      </div>
      <Switch
        id="start-minimized"
        checked={enabled}
        onCheckedChange={onChange}
      />
    </div>
  );
}
```

## Testing Checklist

- [ ] Fresh install: Settings panel opens on first launch
- [ ] Enable "Start Minimized", save, restart: No Settings panel
- [ ] Disable "Start Minimized", save, restart: Settings panel opens
- [ ] Delete user-settings.json, restart: Settings panel opens (default)
- [ ] Settings window can still be opened from tray menu

## Dependencies

No new dependencies required. Uses existing:
- serde with `#[serde(default)]`
- Tauri WebviewWindowBuilder
- shadcn/ui Switch component
