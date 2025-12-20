# State Contracts: Per-Window Opacity Control

**Feature**: 013-window-opacity-control
**Date**: 2025-12-20

## Overview

This feature extends existing state contracts without introducing new APIs. All changes are additive extensions to the window state management system.

---

## Extended Interfaces

### WindowsContextValue Extension

```typescript
/**
 * Extended context interface with opacity control
 */
export interface ExtendedWindowsContextValue extends WindowsContextValue {
  // ... existing methods

  /**
   * Set the opacity of a specific window
   * @param windowId - The window to modify
   * @param opacity - New opacity value (0.1 to 1.0)
   */
  setWindowOpacity: (windowId: string, opacity: number) => void;
}
```

---

### PersistenceContext Extension

The existing `onWindowMoved()` trigger is reused for opacity changes. No new persistence triggers required.

```typescript
/**
 * Persistence trigger - reused for opacity changes
 * Called when user finishes adjusting the slider
 */
onWindowMoved: () => void;
```

---

## Component Props Contracts

### OpacitySlider Props

```typescript
interface OpacitySliderProps {
  /** Current opacity value (0.1 to 1.0) */
  value: number;

  /** Callback when value changes during drag */
  onChange: (value: number) => void;

  /** Callback when user commits value (releases slider) */
  onCommit: () => void;

  /** Whether slider is disabled */
  disabled?: boolean;
}
```

### WindowHeader Props Extension

```typescript
interface WindowHeaderProps {
  windowId: string;
  title: string;
  x: number;
  y: number;
  isInteractive?: boolean;

  /** NEW: Current window opacity for slider */
  opacity: number;

  /** NEW: Callback when opacity changes */
  onOpacityChange: (opacity: number) => void;

  /** NEW: Callback when opacity adjustment completes */
  onOpacityCommit: () => void;
}
```

### Window Props (Unchanged)

```typescript
interface WindowProps {
  window: WindowInstance;  // Now includes opacity property
  isInteractive?: boolean;
  onExitComplete?: () => void;
}
```

---

## Reducer Action Contract

```typescript
/**
 * New action for opacity changes
 */
interface SetWindowOpacityAction {
  type: 'SET_WINDOW_OPACITY';
  windowId: string;
  opacity: number;  // Will be clamped to 0.1-1.0 range
}
```

---

## Persistence Contract Extension

### state.json Schema Extension

```json
{
  "version": 1,
  "lastModified": "2025-12-20T10:00:00.000Z",
  "global": {
    "overlayMode": "windowed",
    "overlayVisible": true
  },
  "windows": [
    {
      "id": "win_abc123",
      "type": "notes",
      "position": { "x": 100, "y": 150 },
      "size": { "width": 400, "height": 300 },
      "zIndex": 101,
      "flags": { "minimized": false, "maximized": false },
      "opacity": 0.6
    }
  ]
}
```

**New Field**: `opacity` (number, 0.1-1.0, defaults to 0.6 if missing)

---

## Event Flow Contract

```
User Input          State Update           Visual Update         Persistence
─────────────────────────────────────────────────────────────────────────────

Slider drag     →   SET_WINDOW_OPACITY  →  Window re-renders  →  (no persist)
                    (immediate)             with new opacity

Slider release  →   (no state change)   →  (no change)        →  onWindowMoved()
                                                                  debounced save
```

---

## Validation Contract

```typescript
/**
 * Opacity validation rules
 */
const OpacityValidation = {
  /** Minimum allowed value */
  MIN: 0.1,

  /** Maximum allowed value */
  MAX: 1.0,

  /** Default value for new windows or invalid data */
  DEFAULT: 0.6,

  /** Clamp function */
  clamp: (value: number): number =>
    Math.max(0.1, Math.min(1.0, value)),

  /** Validation function */
  isValid: (value: unknown): value is number =>
    typeof value === 'number' &&
    !isNaN(value) &&
    value >= 0.1 &&
    value <= 1.0,
};
```
