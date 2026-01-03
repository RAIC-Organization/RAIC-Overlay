# Contracts: Settings Panel Startup Behavior

**Feature**: 054-settings-panel-startup
**Date**: 2026-01-03

## Overview

This feature extends existing Tauri IPC commands. No new API endpoints are introduced.

## Modified Commands

### load_user_settings

**Existing command** - Response payload extended with new field.

```typescript
// Request: No parameters
invoke<LoadUserSettingsResult>("load_user_settings")

// Response (extended)
interface LoadUserSettingsResult {
  success: boolean;
  settings: UserSettings | null;  // Now includes startMinimized
  error?: string;
}

interface UserSettings {
  version: number;
  hotkeys: HotkeySettings;
  autoStart: boolean;
  startMinimized: boolean;  // NEW FIELD
  lastModified: string;
}
```

### save_user_settings

**Existing command** - Request payload extended with new field.

```typescript
// Request (extended)
invoke("save_user_settings", {
  settings: {
    version: 1,
    hotkeys: { /* ... */ },
    autoStart: boolean,
    startMinimized: boolean,  // NEW FIELD
    lastModified: string
  }
})

// Response: No change
interface SaveUserSettingsResult {
  success: boolean;
  error?: string;
}
```

## New Internal Functions (Rust)

### get_start_minimized

**Internal function** - Not exposed via IPC, called during app setup.

```rust
/// Get the cached start_minimized preference
/// Returns false if settings not loaded (default behavior: show Settings)
pub fn get_start_minimized() -> bool
```

## Startup Flow Contract

```
Application Launch
       │
       ▼
init_settings()          // Load runtime settings (settings.toml)
       │
       ▼
init_user_settings()     // Load and cache user-settings.json
       │
       ▼
get_start_minimized()    // Check cached preference
       │
       ├─► true  ──► Skip Settings window (silent start)
       │
       └─► false ──► open_settings_window()
                            │
                            ▼
                     Settings panel visible
```

## UI Component Contract

### StartMinimizedToggle

**New React component** - Follows existing AutoStartToggle pattern.

```typescript
interface StartMinimizedToggleProps {
  enabled: boolean;         // Current state from settings
  onChange: (enabled: boolean) => void;  // Callback when toggled
}

// Usage in SettingsPanel.tsx
<StartMinimizedToggle
  enabled={settings.startMinimized}
  onChange={(enabled) => setSettings(prev => ({ ...prev, startMinimized: enabled }))}
/>
```

## Event Contracts

No new events introduced. Settings changes are persisted via existing save flow.
