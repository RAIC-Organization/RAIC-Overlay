# Data Model: Next.js Migration with Motion Animations

**Feature**: 005-nextjs-motion-refactor
**Date**: 2025-12-18

## Overview

This feature primarily involves UI framework migration and animation additions. The data model remains largely unchanged from the existing implementation, with additions for animation configuration.

## Entities

### OverlayState (Existing - Unchanged)

The core state object tracking overlay visibility and mode.

| Field | Type | Description |
|-------|------|-------------|
| `visible` | `boolean` | Whether the overlay is currently shown |
| `mode` | `OverlayMode` | Current interaction mode ("fullscreen" \| "windowed") |
| `targetBound` | `boolean` | Whether attached to a target window |
| `targetName` | `string \| null` | Name of the target window if bound |
| `targetRect` | `WindowRect \| null` | Dimensions of target window |
| `initialized` | `boolean` | Whether overlay has completed initialization |
| `autoHidden` | `boolean` | Whether auto-hidden due to focus loss |

**State Transitions**:
- `visible`: false → true (F3 show, triggers fade-in animation)
- `visible`: true → false (F3 hide, triggers fade-out animation)
- `mode`: "fullscreen" → "windowed" (F5, triggers opacity 60%→100% animation)
- `mode`: "windowed" → "fullscreen" (F5, triggers opacity 100%→60% animation)

### OverlayMode (Existing - Unchanged)

```typescript
type OverlayMode = "fullscreen" | "windowed";
```

- `fullscreen`: Click-through mode, 60% opacity
- `windowed`: Interactive mode, 100% opacity

### WindowRect (Existing - Unchanged)

```typescript
interface WindowRect {
  x: number;
  y: number;
  width: number;
  height: number;
}
```

### ErrorModalState (Existing - Unchanged)

| Field | Type | Description |
|-------|------|-------------|
| `visible` | `boolean` | Whether error modal is shown |
| `targetName` | `string` | Name of the missing target |
| `message` | `string` | Error message to display |
| `autoDismissMs` | `number` | Auto-dismiss timer duration |

**State Transitions**:
- `visible`: false → true (error occurs, triggers entrance animation)
- `visible`: true → false (dismiss/timeout, triggers exit animation)

### AnimationConfig (New)

Configuration for animation timing and behavior.

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `showHideDuration` | `number` | 0.3 | Show/hide fade duration in seconds |
| `modeChangeDuration` | `number` | 0.25 | Opacity mode change duration |
| `modalDuration` | `number` | 0.2 | Error modal animation duration |
| `easing` | `string` | "easeOut" | Easing function name |
| `reducedMotion` | `boolean` | (system) | Whether to use instant transitions |

**Validation Rules**:
- All durations must be positive numbers
- Durations should be between 0.1 and 1.0 seconds for good UX
- When `reducedMotion` is true, all animations become instant (duration: 0)

## Animation State Machine

### Show/Hide Transition

```
[Hidden] --F3--> [Animating In] --complete--> [Visible]
[Visible] --F3--> [Animating Out] --complete--> [Hidden]
[Animating In] --F3--> [Animating Out] (interrupt/reverse)
[Animating Out] --F3--> [Animating In] (interrupt/reverse)
```

Motion handles interruption automatically with smooth reversal.

### Mode Opacity Transition

```
[Windowed 100%] --F5--> [Animating to 60%] --complete--> [Fullscreen 60%]
[Fullscreen 60%] --F5--> [Animating to 100%] --complete--> [Windowed 100%]
```

Opacity animation runs independently of show/hide state.

## IPC Events (Existing - Unchanged)

| Event | Direction | Payload | Animation Trigger |
|-------|-----------|---------|-------------------|
| `toggle-visibility` | Rust → React | - | Start show/hide animation |
| `toggle-mode` | Rust → React | - | Start opacity animation |
| `mode-changed` | Rust → React | `ModeChangePayload` | Update mode state |
| `show-error-modal` | Rust → React | `ShowErrorModalPayload` | Start modal entrance animation |
| `dismiss-error-modal` | Rust → React | - | Start modal exit animation |

## Component Props Changes

### HeaderPanel Props (Extended)

```typescript
interface HeaderPanelProps {
  visible?: boolean;      // Existing
  mode?: OverlayMode;     // Existing
  targetRect?: WindowRect | null;  // Existing
  // Animation handled internally via motion component
}
```

### ErrorModal Props (Unchanged)

```typescript
interface ErrorModalProps {
  visible: boolean;
  targetName: string;
  message: string;
  autoDismissMs: number;
  onDismiss: () => void;
  // Animation handled internally via AnimatePresence
}
```

## No API Contracts Required

This feature is purely frontend UI changes. No new API endpoints, REST contracts, or GraphQL schemas are needed. All existing Tauri IPC commands remain unchanged:

- `toggle_visibility` - Invoked via Rust, returns `OverlayStateResponse`
- `toggle_mode` - Invoked via Rust, returns `OverlayStateResponse`

The Rust backend requires no modifications for this feature.
