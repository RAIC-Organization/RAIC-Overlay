# Data Model: Webview Hotkey Capture

**Feature Branch**: `031-webview-hotkey-capture`
**Date**: 2025-12-28

## Overview

This feature is stateless - it captures keyboard events and triggers backend commands without persisting any data. The only "state" is transient debounce timestamps stored in React refs.

## Entities

### HotkeyCapture (Transient)

Internal state for the `useHotkeyCapture` hook. Not persisted.

| Field | Type | Description |
|-------|------|-------------|
| lastF3Press | number | Unix timestamp (ms) of last F3 key press |
| lastF5Press | number | Unix timestamp (ms) of last F5 key press |

**Lifecycle**: Created when component mounts, destroyed when component unmounts.

**Validation Rules**:
- Timestamps must be non-negative integers
- Debounce threshold is 200ms (matching backend constant `DEBOUNCE_MS`)

## Constants

| Constant | Value | Description |
|----------|-------|-------------|
| DEBOUNCE_MS | 200 | Minimum milliseconds between hotkey triggers |
| KEY_F3 | 'F3' | KeyboardEvent.key value for F3 |
| KEY_F5 | 'F5' | KeyboardEvent.key value for F5 |

## Integration Points

### Existing Backend Commands (Unchanged)

| Command | Trigger | Response Type | Description |
|---------|---------|---------------|-------------|
| `toggle_visibility` | F3 key | `OverlayStateResponse` | Show/hide overlay |
| `toggle_mode` | F5 key | `OverlayStateResponse` | Toggle windowed/fullscreen mode |

### Existing Events (Reused)

| Event | Emitted By | Payload | Description |
|-------|------------|---------|-------------|
| `toggle-visibility` | Backend | `()` | Visibility toggle requested |
| `toggle-mode` | Backend | `()` | Mode toggle requested |

## State Transitions

```
[Webview Focused]
       │
       ▼
  ┌─────────────────┐
  │  Key Pressed    │
  │  (F3 or F5)     │
  └────────┬────────┘
           │
           ▼
  ┌─────────────────┐     No
  │ Debounce Check  ├─────────► [Ignore - Log Debug]
  │ (200ms elapsed?)│
  └────────┬────────┘
           │ Yes
           ▼
  ┌─────────────────┐
  │ preventDefault  │
  │ Update timestamp│
  │ Log info        │
  └────────┬────────┘
           │
           ▼
  ┌─────────────────┐
  │ invoke command  │───────► [Backend handles state]
  │ (async)         │
  └─────────────────┘
```

## No Persistence Required

This feature does not persist any data:
- Debounce timestamps are ephemeral (reset on component mount)
- State changes are handled by existing backend commands
- No new files or database entries created
