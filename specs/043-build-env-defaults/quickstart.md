# Quickstart: Build-Time Environment Variable Defaults

**Feature**: 043-build-env-defaults
**Date**: 2025-12-31

## What Changed

Build-time environment variables are now **optional** with sensible defaults:

| Variable | Required? | Default |
|----------|-----------|---------|
| `TARGET_WINDOW_NAME` | No (was: Yes) | "Star Citizen" |
| `TARGET_PROCESS_NAME` | No (new) | "StarCitizen.exe" |
| `TARGET_WINDOW_CLASS` | No (new) | "CryENGINE" |

## Quick Usage

### Zero-Configuration Build (Star Citizen)

```powershell
# Just build - no environment variables needed!
cargo tauri build
```

The application will target Star Citizen windows by default.

### Custom Target Application

```powershell
# PowerShell - target Notepad
$env:TARGET_WINDOW_NAME = "Notepad"
$env:TARGET_PROCESS_NAME = "notepad.exe"
$env:TARGET_WINDOW_CLASS = "Notepad"
cargo tauri build
```

```bash
# Bash - target Notepad
TARGET_WINDOW_NAME=Notepad TARGET_PROCESS_NAME=notepad.exe TARGET_WINDOW_CLASS=Notepad cargo tauri build
```

### Partial Customization

You can set only the variables you need:

```powershell
# Only change window name, keep process/class defaults
$env:TARGET_WINDOW_NAME = "Calculator"
cargo tauri build
```

## Runtime Override

You can still override at runtime using `settings.toml`:

```toml
# settings.toml (next to executable)
target_window_name = "Custom App"
target_process_name = "custom.exe"
target_window_class = "CustomClass"
```

Runtime settings take precedence over build-time defaults.

## Verification

After building, check the build output for configuration summary:

```
warning: Build configuration:
warning:   TARGET_WINDOW_NAME: Star Citizen (default)
warning:   TARGET_PROCESS_NAME: StarCitizen.exe (default)
warning:   TARGET_WINDOW_CLASS: CryENGINE (default)
```

Or with custom values:

```
warning: Build configuration:
warning:   TARGET_WINDOW_NAME: Notepad (env)
warning:   TARGET_PROCESS_NAME: notepad.exe (env)
warning:   TARGET_WINDOW_CLASS: Notepad (env)
```

## Priority Chain

Values are resolved in this order (highest to lowest priority):

1. **settings.toml** (runtime) - If file exists and value is non-empty
2. **Build-time env var** - If set and non-empty at compile time
3. **Hardcoded default** - "Star Citizen", "StarCitizen.exe", "CryENGINE"

## Common Scenarios

### Scenario 1: New Developer Setup

```powershell
git clone <repo>
cd RAICOverlay
cargo tauri build  # Works immediately!
```

### Scenario 2: Testing with Different App

```powershell
$env:TARGET_WINDOW_NAME = "Visual Studio Code"
$env:TARGET_PROCESS_NAME = "Code.exe"
$env:TARGET_WINDOW_CLASS = "Chrome_WidgetWin_1"
cargo tauri dev
```

### Scenario 3: CI/CD Pipeline

```yaml
# GitHub Actions example
- name: Build for Star Citizen
  run: cargo tauri build
  # No env vars needed - uses defaults

- name: Build for Testing
  run: cargo tauri build
  env:
    TARGET_WINDOW_NAME: "Test App"
```

## Files Modified

| File | Change |
|------|--------|
| `src-tauri/build.rs` | Made TARGET_WINDOW_NAME optional, added TARGET_PROCESS_NAME and TARGET_WINDOW_CLASS |
| `src-tauri/src/settings.rs` | Replaced hardcoded constants with env!() macros |
| `.env.example` | Updated documentation for all optional env vars |

## Troubleshooting

### Build fails with "env var not found"

This means the changes haven't been applied yet. After implementing this feature, all env vars are optional.

### Empty value causes issues

Empty strings (`""`) and whitespace-only values are treated as "not set" and will use the default.

### Runtime override not working

Ensure `settings.toml` is in the same directory as the executable, not the source directory.
