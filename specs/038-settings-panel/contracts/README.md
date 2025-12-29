# API Contracts: Settings Panel Window

**Feature Branch**: `038-settings-panel`
**Date**: 2025-12-29

## Overview

This document defines the Tauri IPC commands and frontend-backend communication contracts for the Settings Panel feature.

---

## Tauri Commands

### 1. Load User Settings

**Command**: `load_user_settings`
**Direction**: Frontend → Backend
**Purpose**: Load user settings from user-settings.json on Settings panel open

#### Request
```typescript
// No parameters
invoke('load_user_settings')
```

#### Response
```typescript
interface LoadUserSettingsResult {
  success: boolean;
  settings: UserSettings | null;  // null if file doesn't exist (use defaults)
  error?: string;
}
```

#### Behavior
- If file exists and is valid: return parsed settings
- If file doesn't exist: return `{ success: true, settings: null }` (frontend uses defaults)
- If file is corrupted: return `{ success: false, error: "..." }` (frontend uses defaults, shows warning)

---

### 2. Save User Settings

**Command**: `save_user_settings`
**Direction**: Frontend → Backend
**Purpose**: Persist user settings to user-settings.json

#### Request
```typescript
invoke('save_user_settings', { settings: UserSettings })
```

#### Response
```typescript
interface SaveUserSettingsResult {
  success: boolean;
  error?: string;
}
```

#### Behavior
- Validates settings structure
- Writes atomically (temp file + rename)
- Updates `lastModified` timestamp
- Returns success/failure

---

### 3. Update Hotkeys

**Command**: `update_hotkeys`
**Direction**: Frontend → Backend
**Purpose**: Apply new hotkey bindings to the keyboard hook immediately

#### Request
```typescript
invoke('update_hotkeys', {
  hotkeys: HotkeySettings
})
```

#### Response
```typescript
interface UpdateHotkeysResult {
  success: boolean;
  error?: string;
}
```

#### Behavior
- Updates the keyboard hook configuration
- Restarts hook if necessary
- Returns success immediately (non-blocking)

---

### 4. Get Auto-Start Status

**Command**: `get_autostart_status`
**Direction**: Frontend → Backend
**Purpose**: Check current Windows startup registration state

#### Request
```typescript
invoke('get_autostart_status')
```

#### Response
```typescript
interface AutoStartStatusResult {
  enabled: boolean;
  error?: string;
}
```

#### Behavior
- Queries tauri-plugin-autostart for current status
- Returns actual Windows Registry state (FR-016)

---

### 5. Set Auto-Start

**Command**: `set_autostart`
**Direction**: Frontend → Backend
**Purpose**: Enable or disable Windows startup registration

#### Request
```typescript
invoke('set_autostart', { enabled: boolean })
```

#### Response
```typescript
interface SetAutoStartResult {
  success: boolean;
  error?: string;
}
```

#### Behavior
- Calls tauri-plugin-autostart enable() or disable()
- Updates Windows Registry (HKCU\...\Run)
- Returns success/failure

---

### 6. Open Settings Window

**Command**: `open_settings_window`
**Direction**: Frontend → Backend (or Tray → Backend)
**Purpose**: Create or focus the Settings window

#### Request
```typescript
invoke('open_settings_window')
```

#### Response
```typescript
interface OpenSettingsResult {
  success: boolean;
  created: boolean;  // true if new window created, false if focused existing
  error?: string;
}
```

#### Behavior
- If Settings window exists: show and focus it (FR-017)
- If Settings window doesn't exist: create new window
- Window configuration:
  - Label: "settings"
  - URL: "settings.html" (or "/settings" route)
  - Size: 450x400
  - Decorations: false
  - Transparent: true
  - Skip taskbar: false (visible in taskbar)
  - Resizable: false
  - Always on top: false

---

## Frontend Events

### 1. Settings Saved

**Event**: `settings-saved`
**Direction**: Frontend → Frontend (internal)
**Purpose**: Notify components that settings have been saved

```typescript
// Emitted after successful save
window.dispatchEvent(new CustomEvent('settings-saved', {
  detail: { settings: UserSettings }
}));
```

---

## Backend Events

### 1. Hotkeys Updated

**Event**: `hotkeys-updated`
**Direction**: Backend → Frontend
**Purpose**: Confirm hotkey configuration has been applied

```typescript
// Listen for confirmation
await listen('hotkeys-updated', (event) => {
  console.log('Hotkeys active:', event.payload);
});
```

#### Payload
```typescript
{
  toggleVisibility: string;  // e.g., "Ctrl+Shift+O"
  toggleMode: string;        // e.g., "Ctrl+Shift+M"
}
```

---

## Window Management

### Settings Window Lifecycle

```
Tray "Settings" clicked
        │
        v
┌───────────────────────┐
│  open_settings_window │
└───────────┬───────────┘
            │
    ┌───────┴───────┐
    │               │
exists?          no │
    │               │
    v               v
┌───────┐     ┌─────────────┐
│ show  │     │ create new  │
│ focus │     │ window      │
└───────┘     └─────────────┘


Settings X clicked
        │
        v
┌───────────────────────┐
│  window.hide()        │  (not close!)
└───────────────────────┘


App Exit
        │
        v
┌───────────────────────┐
│  destroy all windows  │
└───────────────────────┘
```

---

## Error Handling

### Error Codes

| Code | Description | User Action |
|------|-------------|-------------|
| `SETTINGS_FILE_CORRUPT` | user-settings.json parse error | Defaults used, file recreated on save |
| `SETTINGS_WRITE_FAILED` | Failed to write settings file | Retry or check permissions |
| `HOTKEY_INVALID` | Invalid key combination | Choose different key |
| `HOTKEY_RESERVED` | System-reserved combination | Choose different key |
| `AUTOSTART_FAILED` | Registry write failed | Check permissions |

---

## Permissions Required

Add to `src-tauri/capabilities/default.json`:

```json
{
  "permissions": [
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

## Sequence Diagrams

### Open Settings Flow

```
User          Tray           Backend         Settings Window
  │             │               │                   │
  │ right-click │               │                   │
  ├────────────>│               │                   │
  │             │               │                   │
  │ "Settings"  │               │                   │
  ├────────────>│               │                   │
  │             │               │                   │
  │             │ open_settings │                   │
  │             ├──────────────>│                   │
  │             │               │                   │
  │             │               │ create/show       │
  │             │               ├──────────────────>│
  │             │               │                   │
  │             │    result     │                   │
  │             │<──────────────│                   │
  │             │               │                   │
  │             │               │  load_user_settings
  │             │               │<──────────────────│
  │             │               │                   │
  │             │               │  settings data   │
  │             │               ├──────────────────>│
  │             │               │                   │
```

### Save Settings Flow

```
User          Settings UI      Backend         Keyboard Hook
  │                │               │                   │
  │ change hotkey  │               │                   │
  ├───────────────>│               │                   │
  │                │               │                   │
  │ click Save     │               │                   │
  ├───────────────>│               │                   │
  │                │               │                   │
  │                │ save_user_settings                │
  │                ├──────────────>│                   │
  │                │               │                   │
  │                │               │ write file        │
  │                │               ├──────────────────>│
  │                │               │                   │
  │                │ update_hotkeys│                   │
  │                ├──────────────>│                   │
  │                │               │                   │
  │                │               │ restart hook      │
  │                │               ├──────────────────>│
  │                │               │                   │
  │                │ hotkeys-updated                   │
  │                │<──────────────│                   │
  │                │               │                   │
  │ success toast  │               │                   │
  │<───────────────│               │                   │
```
