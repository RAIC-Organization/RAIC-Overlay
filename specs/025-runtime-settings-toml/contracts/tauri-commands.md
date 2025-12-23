# Tauri Commands: Runtime Settings System

**Feature**: 025-runtime-settings-toml
**Date**: 2025-12-23

## Commands

### get_settings

Returns the current runtime settings configuration.

**Rust Signature**:
```rust
#[tauri::command]
pub fn get_settings() -> SettingsConfig
```

**TypeScript Interface**:
```typescript
interface SettingsConfig {
  targetWindowName: string;
  debugBorder: boolean;
  logLevel: string;
}

// Usage
const settings = await invoke<SettingsConfig>("get_settings");
```

**Response**:
```json
{
  "targetWindowName": "Star Citizen",
  "debugBorder": false,
  "logLevel": "WARN"
}
```

**Behavior**:
- Always succeeds (no error case)
- Returns resolved settings (file values merged with defaults)
- Called during frontend initialization

---

### get_settings_sources

Returns information about where each setting value came from (for debugging).

**Rust Signature**:
```rust
#[tauri::command]
pub fn get_settings_sources() -> SettingsSourcesResponse
```

**TypeScript Interface**:
```typescript
interface SettingsSourcesResponse {
  targetWindowName: "file" | "default";
  debugBorder: "file" | "default";
  logLevel: "file" | "default";
}

// Usage
const sources = await invoke<SettingsSourcesResponse>("get_settings_sources");
```

**Response**:
```json
{
  "targetWindowName": "file",
  "debugBorder": "default",
  "logLevel": "file"
}
```

**Behavior**:
- Always succeeds (no error case)
- Useful for debugging configuration issues
- Indicates which settings came from settings.toml vs compile-time defaults

---

## Modified Existing Commands

### get_log_config

**Current Behavior**: Returns log configuration based on `RAIC_LOG_LEVEL` environment variable.

**New Behavior**: Returns log configuration based on resolved runtime settings.

**No Interface Changes**: Response structure remains the same.

---

### get_target_window_info

**Current Behavior**: Uses compile-time `TARGET_WINDOW_NAME` constant.

**New Behavior**: Uses resolved runtime settings for target window pattern.

**No Interface Changes**: Response structure remains the same.

---

## Frontend Integration

### Initialization Sequence

```typescript
// app/page.tsx - during component mount

useEffect(() => {
  const initSettings = async () => {
    try {
      const settings = await invoke<SettingsConfig>("get_settings");

      // Apply debug border
      const root = document.getElementById("root");
      if (root) {
        if (settings.debugBorder) {
          root.classList.add("debug-border");
        } else {
          root.classList.remove("debug-border");
        }
      }
    } catch (error) {
      console.error("Failed to load settings:", error);
      // Continue with default behavior (no debug border)
    }
  };

  initSettings();
}, []);
```

### Type Definitions

Add to frontend types:

```typescript
// types/settings.ts

export interface SettingsConfig {
  targetWindowName: string;
  debugBorder: boolean;
  logLevel: string;
}

export interface SettingsSourcesResponse {
  targetWindowName: "file" | "default";
  debugBorder: "file" | "default";
  logLevel: "file" | "default";
}
```
