# Data Model: Windows System Tray Icon

**Feature**: 022-tray-icon-menu
**Date**: 2025-12-22

## Overview

This feature introduces **no new data entities**. The system tray icon is a UI element managed by the operating system and Tauri framework with no persistent state of its own.

## Entities

### Existing Entities (No Changes)

| Entity | Relevance | Changes |
|--------|-----------|---------|
| OverlayState | Exit triggers state persistence | No schema changes |
| WindowContent | Persisted before exit | No schema changes |
| AppState (state.json) | Saved before exit | No schema changes |

## Events

### New Events

| Event Name | Direction | Payload | Purpose |
|------------|-----------|---------|---------|
| `app-exit-requested` | Backend → Frontend | `()` (unit) | Signals frontend to persist state before app terminates |

### Event Flow

```
User clicks "Exit" in tray menu
         │
         ▼
┌─────────────────────────┐
│ on_menu_event handler   │
│ (tray.rs)               │
└───────────┬─────────────┘
            │ emit "app-exit-requested"
            ▼
┌─────────────────────────┐
│ Frontend listener       │
│ (PersistenceContext)    │
│ - Calls save_state      │
│ - Saves window content  │
└───────────┬─────────────┘
            │ (async, ~500ms timeout)
            ▼
┌─────────────────────────┐
│ app.exit(0)             │
│ (tray.rs, delayed)      │
└─────────────────────────┘
```

## State Transitions

### Application Lifecycle with Tray

```
┌─────────────┐
│   Startup   │
└──────┬──────┘
       │ setup()
       ▼
┌─────────────┐     F3 toggle      ┌─────────────┐
│   Running   │◄──────────────────►│   Visible   │
│ (tray icon  │                    │  (overlay   │
│  visible)   │                    │   shown)    │
└──────┬──────┘                    └─────────────┘
       │ Tray Exit clicked
       ▼
┌─────────────┐
│  Exiting    │ ← app-exit-requested emitted
│ (persisting)│
└──────┬──────┘
       │ ~500ms delay
       ▼
┌─────────────┐
│ Terminated  │
└─────────────┘
```

## Integration Points

| System | Integration | Notes |
|--------|-------------|-------|
| Persistence (010) | Exit triggers save | Uses existing `save_state` command |
| Logging (019) | Log exit event | Uses existing `log::info!` |
| App Icon (011/012) | Reuse icon.ico | Via `default_window_icon()` |
