# Quickstart: Sync Webview Hotkeys with Backend Settings

**Feature**: 042-sync-webview-hotkeys
**Date**: 2025-12-31

## Overview

This feature fixes the frontend webview hotkey capture to use configurable settings instead of hardcoded F3/F5 keys. The implementation involves:

1. **Backend Change**: Emit `hotkeys-updated` event when settings change
2. **Frontend Change**: Refactor `useHotkeyCapture` to load and listen for settings

## Implementation Summary

### Files to Modify

| File | Change Type | Description |
|------|-------------|-------------|
| `src-tauri/src/user_settings.rs` | Modify | Add event emission in `update_hotkeys()` |
| `src/hooks/useHotkeyCapture.ts` | Refactor | Replace hardcoded keys with dynamic config |

### Files Unchanged (Reference Only)

| File | Purpose |
|------|---------|
| `src/types/user-settings.ts` | Existing types (HotkeySettings, HotkeyBinding) |
| `src/components/settings/SettingsPanel.tsx` | Already calls `update_hotkeys` |
| `src-tauri/src/keyboard_hook.rs` | Already reads from settings cache |

## Step-by-Step Implementation

### Step 1: Backend Event Emission

**File**: `src-tauri/src/user_settings.rs`

Modify `update_hotkeys` command to emit event:

```rust
#[tauri::command]
pub fn update_hotkeys(app: tauri::AppHandle, hotkeys: HotkeySettings) -> Result<(), String> {
    // Existing: Update in-memory cache
    let mut settings = USER_SETTINGS.lock().map_err(|e| e.to_string())?;
    if let Some(ref mut s) = *settings {
        s.hotkeys = hotkeys.clone();
    }
    drop(settings);

    // NEW: Emit event to frontend
    app.emit("hotkeys-updated", &hotkeys)
        .map_err(|e| format!("Failed to emit hotkeys-updated: {}", e))?;

    info!("Hotkeys updated and event emitted");
    Ok(())
}
```

**Required Import**: Add `use tauri::Emitter;`

**Command Signature Change**: Add `app: tauri::AppHandle` parameter

### Step 2: Refactor useHotkeyCapture Hook

**File**: `src/hooks/useHotkeyCapture.ts`

Replace the entire implementation:

```typescript
import { useState, useEffect, useRef } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { listen, UnlistenFn } from '@tauri-apps/api/event';
import { info, debug } from '@/lib/logger';
import type { OverlayStateResponse } from '@/types/ipc';
import type { HotkeySettings, HotkeyBinding, LoadUserSettingsResult } from '@/types/user-settings';
import { DEFAULT_USER_SETTINGS } from '@/types/user-settings';

const DEBOUNCE_MS = 200;

function matchesHotkey(event: KeyboardEvent, binding: HotkeyBinding): boolean {
  return (
    event.key === binding.key &&
    event.ctrlKey === binding.ctrl &&
    event.shiftKey === binding.shift &&
    event.altKey === binding.alt
  );
}

export function useHotkeyCapture(enabled: boolean): void {
  const [hotkeyConfig, setHotkeyConfig] = useState<HotkeySettings | null>(null);
  const lastVisibilityPressRef = useRef<number>(0);
  const lastModePressRef = useRef<number>(0);
  const unlistenRef = useRef<UnlistenFn | null>(null);

  // Load initial settings
  useEffect(() => {
    let ignore = false;

    const loadSettings = async () => {
      try {
        const result = await invoke<LoadUserSettingsResult>('load_user_settings');
        if (!ignore) {
          if (result.success && result.settings) {
            setHotkeyConfig(result.settings.hotkeys);
          } else {
            setHotkeyConfig(DEFAULT_USER_SETTINGS.hotkeys);
          }
        }
      } catch (err) {
        debug(`Failed to load hotkey settings: ${err}`);
        if (!ignore) {
          setHotkeyConfig(DEFAULT_USER_SETTINGS.hotkeys);
        }
      }
    };

    loadSettings();
    return () => { ignore = true; };
  }, []);

  // Listen for settings changes
  useEffect(() => {
    const setupListener = async () => {
      unlistenRef.current = await listen<HotkeySettings>('hotkeys-updated', (event) => {
        info('Hotkeys updated via event');
        setHotkeyConfig(event.payload);
      });
    };

    setupListener();
    return () => {
      unlistenRef.current?.();
    };
  }, []);

  // Hotkey capture
  useEffect(() => {
    if (!enabled || !hotkeyConfig) return;

    function handleKeyDown(e: KeyboardEvent): void {
      const now = Date.now();

      // Check visibility toggle
      if (matchesHotkey(e, hotkeyConfig.toggleVisibility)) {
        e.preventDefault();
        e.stopImmediatePropagation();

        const elapsed = now - lastVisibilityPressRef.current;
        if (elapsed >= DEBOUNCE_MS) {
          lastVisibilityPressRef.current = now;
          info('Visibility toggle hotkey pressed (webview capture)');
          invoke<OverlayStateResponse>('toggle_visibility').catch((err) => {
            debug(`toggle_visibility failed: ${err}`);
          });
        }
        return;
      }

      // Check mode toggle
      if (matchesHotkey(e, hotkeyConfig.toggleMode)) {
        e.preventDefault();
        e.stopImmediatePropagation();

        const elapsed = now - lastModePressRef.current;
        if (elapsed >= DEBOUNCE_MS) {
          lastModePressRef.current = now;
          info('Mode toggle hotkey pressed (webview capture)');
          invoke<OverlayStateResponse>('toggle_mode').catch((err) => {
            debug(`toggle_mode failed: ${err}`);
          });
        }
        return;
      }
    }

    document.addEventListener('keydown', handleKeyDown, { capture: true });
    return () => {
      document.removeEventListener('keydown', handleKeyDown, { capture: true });
    };
  }, [enabled, hotkeyConfig]);
}
```

## Testing Checklist

### Basic Functionality

- [ ] Default F3/F5 work on fresh install when overlay is focused
- [ ] Custom hotkey (e.g., Ctrl+O) works when overlay is focused
- [ ] Modifiers are correctly required (Ctrl+O ≠ just O)
- [ ] Hotkey changes in Settings take effect immediately

### Edge Cases

- [ ] Rapid key presses are debounced (200ms)
- [ ] Old hotkey stops working after change
- [ ] Settings persist across app restart
- [ ] Works when overlay is minimized then restored

### Verification Commands

```bash
# Build and run
npm run tauri dev

# Check TypeScript compilation
npm run type-check

# Check Rust compilation
cd src-tauri && cargo check
```

## Architecture Notes

### Why Two Hotkey Systems?

1. **Backend (keyboard_hook.rs)**: Low-level Windows hook captures keys globally, even when other apps have focus
2. **Frontend (useHotkeyCapture.ts)**: Webview-level capture for when the overlay window itself has focus

Both are needed because the low-level hook doesn't receive events when the webview is focused (browser handles them first).

### Event Flow After This Fix

```
User presses Ctrl+O (configured visibility toggle)
        │
        ├─► If overlay NOT focused:
        │   └─► keyboard_hook.rs detects → emits toggle-visibility → page.tsx handles
        │
        └─► If overlay IS focused:
            └─► useHotkeyCapture detects → invokes toggle_visibility → state updates
```
