# Quickstart: Runtime Settings System

**Feature**: 025-runtime-settings-toml
**Date**: 2025-12-23

## Overview

This feature adds runtime configuration via a `settings.toml` file located next to the executable. Users can customize target window name, debug border, and log level without rebuilding the application.

## Usage

### 1. Locate the Settings File

The `settings.toml` file should be placed in the same directory as the executable:

```
C:\Program Files\RAIC Overlay\
├── RAIC Overlay.exe
├── settings.toml          # Your configuration
└── settings.example.toml  # Reference template
```

### 2. Create Your Configuration

Copy `settings.example.toml` to `settings.toml` and edit as needed:

```toml
# settings.toml

# Target window for overlay attachment
target_window_name = "Star Citizen"

# Enable debug border (red outline)
debug_border = false

# Log verbosity: TRACE, DEBUG, INFO, WARN, ERROR
log_level = "WARN"
```

### 3. Apply Changes

Restart the application to apply new settings. Changes are read at startup.

## Configuration Options

| Setting | Type | Default | Description |
|---------|------|---------|-------------|
| `target_window_name` | string | (from build) | Window title pattern for overlay attachment |
| `debug_border` | boolean | `false` | Show red debug border around overlay |
| `log_level` | string | `"WARN"` | Logging verbosity level |

### Log Levels

| Level | Output | Use Case |
|-------|--------|----------|
| `TRACE` | File + Console | Detailed debugging |
| `DEBUG` | File + Console | Development debugging |
| `INFO` | File + Console | General information |
| `WARN` | File only | Warnings and errors |
| `ERROR` | File only | Errors only |

## Examples

### Testing with Notepad

```toml
# settings.toml
target_window_name = "Notepad"
debug_border = true
log_level = "DEBUG"
```

### Production Use

```toml
# settings.toml
target_window_name = "Star Citizen"
debug_border = false
log_level = "WARN"
```

### Minimal Configuration

You can omit any setting to use the default:

```toml
# settings.toml - only override log level
log_level = "DEBUG"
```

## Troubleshooting

### Settings Not Applied

1. Verify `settings.toml` is in the same directory as the executable
2. Check file is valid TOML syntax (no trailing commas, strings in quotes)
3. Restart the application after changes

### Check Current Settings

Open the log file to see which settings are active:

```
[INFO] Settings loaded:
  target_window_name: 'Notepad' (from settings.toml)
  debug_border: false (from default)
  log_level: DEBUG (from settings.toml)
```

### Common Errors

**Invalid TOML syntax**:
```
[WARN] Failed to parse settings.toml: expected string, found number
[WARN] Using default settings
```

**Invalid log level**:
```
[WARN] Invalid log_level 'VERBOSE' in settings.toml, using default
```

## Development

### Building with Custom Defaults

Set environment variables before building:

```powershell
$env:TARGET_WINDOW_NAME = "Star Citizen"
$env:VITE_DEBUG_BORDER = "false"
$env:RAIC_LOG_LEVEL = "WARN"
npm run tauri build
```

### Testing Settings Module

```bash
cd src-tauri
cargo test settings
```

## API Reference

### TypeScript

```typescript
import { invoke } from "@tauri-apps/api/core";

interface SettingsConfig {
  targetWindowName: string;
  debugBorder: boolean;
  logLevel: string;
}

// Get current settings
const settings = await invoke<SettingsConfig>("get_settings");
console.log(settings.targetWindowName); // "Star Citizen"
```

### Rust

```rust
use crate::settings::{RuntimeSettings, get_settings};

// Get current settings (cached after first load)
let settings = get_settings();
println!("Target: {}", settings.target_window_name);
```
