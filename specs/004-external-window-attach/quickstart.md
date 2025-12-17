# Quickstart: External Window Attachment Mode

**Feature**: 004-external-window-attach
**Date**: 2025-12-17

## Prerequisites

- Rust toolchain (2021 edition)
- Node.js 18+
- pnpm (or npm)
- Windows 11 (64-bit)
- Target application to attach to

## Building with Target Window Configuration

### 1. Set the Target Window Name

The target window is configured at **build time** via environment variable:

```powershell
# PowerShell
$env:TARGET_WINDOW_NAME = "Notepad"
```

```bash
# Bash
export TARGET_WINDOW_NAME="Notepad"
```

### 2. Build the Application

```bash
# Development build
pnpm tauri dev

# Production build
pnpm tauri build
```

### 3. Build Validation

If `TARGET_WINDOW_NAME` is not set, the build will fail with:

```
error: TARGET_WINDOW_NAME environment variable must be set at build time
```

## Usage

### Starting the Overlay

1. **Start the target application first** (e.g., Notepad)
2. Launch the overlay application
3. Press **F3** to activate the overlay

### Expected Behavior

| Action | Result |
|--------|--------|
| F3 (target running & focused) | Overlay appears attached to target window |
| F3 (target not running) | Error modal: "Please start [AppName] first" (auto-dismisses in 5s) |
| F3 (target running, not focused) | No action (overlay only shows when target is focused) |
| F5 (overlay visible) | Toggle between click-through (60% transparent) and interactive mode |
| Click other app | Overlay auto-hides |
| Click target app | Overlay auto-shows (if was previously active) |

### Window Tracking

The overlay automatically:
- Matches target window position (follows when moved)
- Matches target window size (resizes when target resizes)
- Scales UI components to remain readable at any size

## Development Workflow

### Running Tests

```bash
# Rust tests
cd src-tauri
cargo test

# Frontend tests
pnpm test
```

### Changing Target Window for Development

```powershell
# Test with different applications
$env:TARGET_WINDOW_NAME = "Calculator"
pnpm tauri dev

$env:TARGET_WINDOW_NAME = "Visual Studio Code"
pnpm tauri dev
```

### Pattern Matching

The target window name uses **substring matching**:

| Pattern | Matches |
|---------|---------|
| `"Notepad"` | "Notepad", "Untitled - Notepad", "file.txt - Notepad" |
| `"Code"` | "Visual Studio Code", "Code - Insiders", etc. |
| `"Chrome"` | "Google Chrome", "New Tab - Google Chrome" |

## Troubleshooting

### Overlay Not Appearing

1. Check target application is running
2. Check target window is focused (click on it)
3. Verify build included correct `TARGET_WINDOW_NAME`

### Error Modal Appearing

- Message "Please start [AppName] first": Target application not running
- Start the target application, then press F3 again

### Overlay Not Following Window

- Check if target window title matches the configured pattern
- Multiple windows? Overlay attaches to most recently focused one

### Build Failures

```
error: TARGET_WINDOW_NAME environment variable must be set
```

Solution: Set the environment variable before building:
```powershell
$env:TARGET_WINDOW_NAME = "YourAppName"
```

## Configuration Reference

### Build-Time Configuration

| Variable | Required | Description |
|----------|----------|-------------|
| `TARGET_WINDOW_NAME` | Yes | Window title pattern to match |

### Performance Targets

| Metric | Target |
|--------|--------|
| Position sync latency | <50ms |
| Focus change response | <100ms |
| UI scale factor | Automatic |

## Architecture Overview

```
┌─────────────────────────────────────────────┐
│                  Frontend                    │
│  ┌─────────────┐  ┌──────────────────────┐  │
│  │ HeaderPanel │  │     ErrorModal       │  │
│  │ (overlay UI)│  │ (target app missing) │  │
│  └─────────────┘  └──────────────────────┘  │
└──────────────────────┬──────────────────────┘
                       │ IPC Events
┌──────────────────────┴──────────────────────┐
│                  Backend (Rust)              │
│  ┌────────────────┐  ┌───────────────────┐  │
│  │ target_window  │  │ Window Event Hook │  │
│  │ (detection)    │  │ (position/focus)  │  │
│  └────────────────┘  └───────────────────┘  │
└──────────────────────┬──────────────────────┘
                       │ Windows API
┌──────────────────────┴──────────────────────┐
│              Target Application              │
│         (e.g., Notepad, VS Code)            │
└─────────────────────────────────────────────┘
```

## Next Steps

1. Run `/speckit.tasks` to generate implementation tasks
2. Implement tasks in priority order (P1 → P4)
3. Run tests after each task completion
