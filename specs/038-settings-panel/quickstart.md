# Quickstart: Settings Panel Window

**Feature Branch**: `038-settings-panel`
**Date**: 2025-12-29

## Overview

This guide provides the essential implementation steps for the Settings Panel feature. Follow these steps in order for the fastest path to a working implementation.

---

## Prerequisites

- Existing RAICOverlay codebase on branch `038-settings-panel`
- Node.js and Rust toolchain installed
- Understanding of existing patterns:
  - `ErrorModal.tsx` for styling reference
  - `tray.rs` for menu integration
  - `persistence.rs` for file I/O patterns
  - `keyboard_hook.rs` for hotkey handling

---

## Step 1: Add Dependencies

### Rust (Cargo.toml)

```toml
[target.'cfg(desktop)'.dependencies]
tauri-plugin-autostart = "2"
```

### JavaScript (package.json)

```bash
npm install @tauri-apps/plugin-autostart
```

---

## Step 2: Add Permissions

Edit `src-tauri/capabilities/default.json`:

```json
{
  "permissions": [
    // ... existing permissions ...
    "core:window:allow-show",
    "core:window:allow-hide",
    "core:window:allow-set-focus",
    "core:window:allow-start-dragging",
    "autostart:allow-enable",
    "autostart:allow-disable",
    "autostart:allow-is-enabled"
  ]
}
```

---

## Step 3: Create User Settings Types

Create `src-tauri/src/user_settings_types.rs`:

```rust
use serde::{Deserialize, Serialize};

pub const CURRENT_USER_SETTINGS_VERSION: u32 = 1;

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct UserSettings {
    pub version: u32,
    pub hotkeys: HotkeySettings,
    pub auto_start: bool,
    pub last_modified: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct HotkeySettings {
    pub toggle_visibility: HotkeyBinding,
    pub toggle_mode: HotkeyBinding,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct HotkeyBinding {
    pub key: String,
    pub key_code: u32,
    pub ctrl: bool,
    pub shift: bool,
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
                key_code: 0x72,
                ctrl: false,
                shift: false,
                alt: false,
            },
            toggle_mode: HotkeyBinding {
                key: "F5".to_string(),
                key_code: 0x74,
                ctrl: false,
                shift: false,
                alt: false,
            },
        }
    }
}
```

---

## Step 4: Create User Settings Module

Create `src-tauri/src/user_settings.rs`:

```rust
//! User settings persistence module
//! @feature 038-settings-panel

use crate::user_settings_types::*;
use std::fs::{self, File};
use std::io::{Read, Write};
use std::path::PathBuf;
use std::sync::RwLock;
use tauri::Manager;

const USER_SETTINGS_FILE: &str = "user-settings.json";

/// Cached user settings
static USER_SETTINGS: RwLock<Option<UserSettings>> = RwLock::new(None);

fn get_user_settings_path(app: &tauri::AppHandle) -> Result<PathBuf, String> {
    app.path()
        .app_data_dir()
        .map(|p| p.join(USER_SETTINGS_FILE))
        .map_err(|e| format!("Failed to get app data dir: {}", e))
}

#[tauri::command]
pub async fn load_user_settings(app: tauri::AppHandle) -> Result<LoadUserSettingsResult, String> {
    let path = get_user_settings_path(&app)?;

    if !path.exists() {
        return Ok(LoadUserSettingsResult {
            success: true,
            settings: None,
            error: None,
        });
    }

    let mut file = File::open(&path)
        .map_err(|e| format!("Failed to open settings: {}", e))?;

    let mut contents = String::new();
    file.read_to_string(&mut contents)
        .map_err(|e| format!("Failed to read settings: {}", e))?;

    let settings: UserSettings = serde_json::from_str(&contents)
        .map_err(|e| format!("Failed to parse settings: {}", e))?;

    // Cache settings
    if let Ok(mut cache) = USER_SETTINGS.write() {
        *cache = Some(settings.clone());
    }

    Ok(LoadUserSettingsResult {
        success: true,
        settings: Some(settings),
        error: None,
    })
}

#[tauri::command]
pub async fn save_user_settings(
    app: tauri::AppHandle,
    settings: UserSettings,
) -> Result<SaveUserSettingsResult, String> {
    let data_dir = app.path().app_data_dir()
        .map_err(|e| format!("Failed to get app data dir: {}", e))?;

    fs::create_dir_all(&data_dir)
        .map_err(|e| format!("Failed to create directory: {}", e))?;

    let path = data_dir.join(USER_SETTINGS_FILE);
    let temp_path = path.with_extension("json.tmp");

    let json = serde_json::to_string_pretty(&settings)
        .map_err(|e| format!("Serialization failed: {}", e))?;

    let mut file = File::create(&temp_path)
        .map_err(|e| format!("Failed to create temp file: {}", e))?;

    file.write_all(json.as_bytes())
        .map_err(|e| format!("Failed to write: {}", e))?;

    file.sync_all()
        .map_err(|e| format!("Failed to sync: {}", e))?;

    fs::rename(&temp_path, &path)
        .map_err(|e| format!("Failed to rename: {}", e))?;

    // Update cache
    if let Ok(mut cache) = USER_SETTINGS.write() {
        *cache = Some(settings);
    }

    log::info!("User settings saved");
    Ok(SaveUserSettingsResult {
        success: true,
        error: None,
    })
}

/// Get cached hotkey settings
pub fn get_hotkey_settings() -> HotkeySettings {
    USER_SETTINGS
        .read()
        .ok()
        .and_then(|s| s.as_ref().map(|s| s.hotkeys.clone()))
        .unwrap_or_default()
}

#[derive(Debug, Clone, serde::Serialize)]
#[serde(rename_all = "camelCase")]
pub struct LoadUserSettingsResult {
    pub success: bool,
    pub settings: Option<UserSettings>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub error: Option<String>,
}

#[derive(Debug, Clone, serde::Serialize)]
#[serde(rename_all = "camelCase")]
pub struct SaveUserSettingsResult {
    pub success: bool,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub error: Option<String>,
}
```

---

## Step 5: Add Settings Window Creation

Add to `src-tauri/src/settings_window.rs`:

```rust
//! Settings window management
//! @feature 038-settings-panel

use tauri::{Manager, WebviewUrl, WebviewWindowBuilder};

/// Open or focus the settings window
#[tauri::command]
pub async fn open_settings_window(app: tauri::AppHandle) -> Result<OpenSettingsResult, String> {
    // Check if window already exists
    if let Some(window) = app.get_webview_window("settings") {
        window.show().map_err(|e| e.to_string())?;
        window.set_focus().map_err(|e| e.to_string())?;
        return Ok(OpenSettingsResult {
            success: true,
            created: false,
            error: None,
        });
    }

    // Create new settings window
    WebviewWindowBuilder::new(
        &app,
        "settings",
        WebviewUrl::App("settings".into()),
    )
    .title("RAIC Overlay Settings")
    .inner_size(450.0, 400.0)
    .decorations(false)
    .transparent(true)
    .skip_taskbar(false)
    .resizable(false)
    .center()
    .build()
    .map_err(|e| format!("Failed to create window: {}", e))?;

    log::info!("Settings window created");
    Ok(OpenSettingsResult {
        success: true,
        created: true,
        error: None,
    })
}

#[derive(Debug, Clone, serde::Serialize)]
#[serde(rename_all = "camelCase")]
pub struct OpenSettingsResult {
    pub success: bool,
    pub created: bool,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub error: Option<String>,
}
```

---

## Step 6: Update Tray Menu

Modify `src-tauri/src/tray.rs`:

```rust
use crate::settings_window::open_settings_window;

pub fn setup_tray(app: &AppHandle) -> Result<(), Box<dyn std::error::Error>> {
    // Add Settings menu item
    let settings_item = MenuItem::with_id(app, "settings", "Settings", true, None::<&str>)?;
    let quit_item = MenuItem::with_id(app, "quit", "Exit", true, None::<&str>)?;

    let menu = Menu::with_items(app, &[&settings_item, &quit_item])?;

    let app_handle = app.clone();
    TrayIconBuilder::new()
        .icon(app.default_window_icon().unwrap().clone())
        .menu(&menu)
        .tooltip("RAICOverlay")
        .on_menu_event(move |app, event| {
            match event.id.as_ref() {
                "settings" => {
                    let handle = app.clone();
                    tauri::async_runtime::spawn(async move {
                        if let Err(e) = open_settings_window(handle).await {
                            log::error!("Failed to open settings: {}", e);
                        }
                    });
                }
                "quit" => {
                    // ... existing quit logic ...
                }
                _ => {}
            }
        })
        .build(app)?;

    Ok(())
}
```

---

## Step 7: Create Settings Page

Create `app/settings/page.tsx`:

```tsx
"use client";

import { SettingsPanel } from "@/components/settings/SettingsPanel";

export default function SettingsPage() {
  return <SettingsPanel />;
}
```

---

## Step 8: Create Settings Panel Component

Create `src/components/settings/SettingsPanel.tsx`:

```tsx
"use client";

import { useState, useEffect } from "react";
import { invoke } from "@tauri-apps/api/core";
import { getCurrentWindow } from "@tauri-apps/api/window";
import { X } from "lucide-react";
import { HotkeyInput } from "./HotkeyInput";
import { AutoStartToggle } from "./AutoStartToggle";
import { UserSettings, DEFAULT_USER_SETTINGS } from "@/types/user-settings";

export function SettingsPanel() {
  const [settings, setSettings] = useState<UserSettings>(DEFAULT_USER_SETTINGS);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const result = await invoke<{ success: boolean; settings: UserSettings | null }>(
        "load_user_settings"
      );
      if (result.success && result.settings) {
        setSettings(result.settings);
      }
    } catch (e) {
      console.error("Failed to load settings:", e);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = async () => {
    const window = await getCurrentWindow();
    await window.hide();
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const updatedSettings = {
        ...settings,
        lastModified: new Date().toISOString(),
      };
      await invoke("save_user_settings", { settings: updatedSettings });
      await invoke("update_hotkeys", { hotkeys: settings.hotkeys });
    } catch (e) {
      console.error("Failed to save settings:", e);
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return <div className="p-4">Loading...</div>;
  }

  return (
    <div className="h-screen bg-background/80 backdrop-blur-xl border border-border rounded-lg overflow-hidden sc-glow-transition sc-corner-accents shadow-glow-sm">
      {/* Header - Draggable */}
      <div
        data-tauri-drag-region
        className="flex items-center justify-between px-3 py-2 border-b border-border bg-muted/50"
      >
        <h1 className="font-display text-sm font-medium uppercase tracking-wide">
          Settings
        </h1>
        <button
          onClick={handleClose}
          className="p-1 rounded sc-glow-transition hover:bg-muted/50 hover:shadow-glow-sm cursor-pointer"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* Content */}
      <div className="p-4 space-y-6">
        {/* Hotkeys Section */}
        <section>
          <h2 className="font-display text-xs font-medium uppercase tracking-wide text-muted-foreground mb-3">
            Hotkeys
          </h2>
          <div className="space-y-3">
            <HotkeyInput
              label="Toggle Visibility"
              binding={settings.hotkeys.toggleVisibility}
              onChange={(binding) =>
                setSettings({
                  ...settings,
                  hotkeys: { ...settings.hotkeys, toggleVisibility: binding },
                })
              }
            />
            <HotkeyInput
              label="Toggle Mode"
              binding={settings.hotkeys.toggleMode}
              onChange={(binding) =>
                setSettings({
                  ...settings,
                  hotkeys: { ...settings.hotkeys, toggleMode: binding },
                })
              }
            />
          </div>
        </section>

        {/* Startup Section */}
        <section>
          <h2 className="font-display text-xs font-medium uppercase tracking-wide text-muted-foreground mb-3">
            Startup
          </h2>
          <AutoStartToggle
            enabled={settings.autoStart}
            onChange={(enabled) => setSettings({ ...settings, autoStart: enabled })}
          />
        </section>

        {/* Save Button */}
        <button
          onClick={handleSave}
          disabled={isSaving}
          className="w-full py-2 px-4 bg-primary/20 hover:bg-primary/30 border border-border rounded font-display text-sm uppercase tracking-wide sc-glow-transition hover:shadow-glow-sm"
        >
          {isSaving ? "Saving..." : "Save Settings"}
        </button>
      </div>
    </div>
  );
}
```

---

## Step 9: Register Commands

Update `src-tauri/src/lib.rs`:

```rust
pub mod user_settings;
pub mod user_settings_types;
pub mod settings_window;

// In run():
.invoke_handler(tauri::generate_handler![
    // ... existing commands ...
    user_settings::load_user_settings,
    user_settings::save_user_settings,
    settings_window::open_settings_window,
])
```

---

## Step 10: Initialize Autostart Plugin

Update `src-tauri/src/lib.rs` in setup:

```rust
#[cfg(desktop)]
{
    use tauri_plugin_autostart::MacosLauncher;
    app.handle().plugin(tauri_plugin_autostart::init(
        MacosLauncher::LaunchAgent,
        None,
    ));
}
```

---

## Testing Checklist

- [ ] Settings opens from tray menu
- [ ] Settings window visible in taskbar
- [ ] Window draggable by header
- [ ] X button hides window (doesn't close app)
- [ ] Hotkey input captures key combinations
- [ ] Settings persist after restart
- [ ] Auto-start toggle works
- [ ] New hotkeys apply immediately

---

## Common Issues

### Window Not Creating
- Check capabilities/default.json permissions
- Verify settings route exists in Next.js

### Hotkeys Not Working
- Check keyboard_hook.rs uses configurable keys
- Verify user_settings is loaded on app startup

### Auto-start Not Working
- Run app as administrator to verify
- Check Windows Registry manually

---

## Files Created/Modified

### New Files
- `src-tauri/src/user_settings.rs`
- `src-tauri/src/user_settings_types.rs`
- `src-tauri/src/settings_window.rs`
- `src/types/user-settings.ts`
- `src/components/settings/SettingsPanel.tsx`
- `src/components/settings/HotkeyInput.tsx`
- `src/components/settings/AutoStartToggle.tsx`
- `app/settings/page.tsx`

### Modified Files
- `src-tauri/Cargo.toml`
- `src-tauri/src/lib.rs`
- `src-tauri/src/tray.rs`
- `src-tauri/src/keyboard_hook.rs`
- `src-tauri/capabilities/default.json`
- `package.json`
