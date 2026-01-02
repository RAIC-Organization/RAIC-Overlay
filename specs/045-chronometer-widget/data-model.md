# Data Model: Chronometer Widget

**Feature**: 045-chronometer-widget
**Date**: 2026-01-02

## Entity Definitions

### 1. ChronometerState (Frontend Runtime)

Internal state for the chronometer hook. NOT persisted directly.

```typescript
interface ChronometerState {
  /** Whether the chronometer is actively counting */
  isRunning: boolean;

  /** Total elapsed time in milliseconds */
  elapsedMs: number;

  /** Timestamp when last tick occurred (for accurate time calculation) */
  lastTickTimestamp: number | null;
}
```

**State Transitions**:
```
[Stopped/Paused] --Ctrl+T--> [Running]
[Running] --Ctrl+T--> [Paused]
[Running|Paused] --Ctrl+Y--> [Stopped] (elapsedMs=0)
[Running] --Widget Close--> [Paused] (save elapsedMs)
```

---

### 2. ChronometerWidgetData (Persisted)

Widget-specific data saved in state.json.

```typescript
interface ChronometerWidgetData {
  /** Elapsed time in milliseconds when widget was last saved */
  elapsedMs: number;
}
```

**Persistence Rules**:
- Saved on widget close, move, resize, opacity change
- `isRunning` is NOT persisted - always starts paused on reopen
- Default value: `{ elapsedMs: 0 }`

---

### 3. HotkeyBinding (Existing - Extended Usage)

Already exists in codebase. Used for chronometer hotkey configuration.

```typescript
// TypeScript (src/types/user-settings.ts)
interface HotkeyBinding {
  /** Display name of the key (e.g., "T", "F3") */
  key: string;

  /** Windows Virtual Key code */
  keyCode: number;

  /** Ctrl modifier required */
  ctrl: boolean;

  /** Shift modifier required */
  shift: boolean;

  /** Alt modifier required */
  alt: boolean;
}
```

```rust
// Rust (src-tauri/src/user_settings_types.rs)
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct HotkeyBinding {
    pub key: String,
    pub key_code: u32,
    pub ctrl: bool,
    pub shift: bool,
    pub alt: bool,
}
```

---

### 4. HotkeySettings (Existing - Extended)

Extended to include chronometer bindings.

```typescript
// TypeScript (src/types/user-settings.ts)
interface HotkeySettings {
  toggleVisibility: HotkeyBinding;  // Existing
  toggleMode: HotkeyBinding;        // Existing
  chronometerStartPause: HotkeyBinding;  // NEW
  chronometerReset: HotkeyBinding;       // NEW
}
```

```rust
// Rust (src-tauri/src/user_settings_types.rs)
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct HotkeySettings {
    pub toggle_visibility: HotkeyBinding,
    pub toggle_mode: HotkeyBinding,
    pub chronometer_start_pause: HotkeyBinding,  // NEW
    pub chronometer_reset: HotkeyBinding,         // NEW
}
```

**Default Values**:
```rust
chronometer_start_pause: HotkeyBinding {
    key: "T".to_string(),
    key_code: 0x54,  // VK_T
    ctrl: true,
    shift: false,
    alt: false,
}

chronometer_reset: HotkeyBinding {
    key: "Y".to_string(),
    key_code: 0x59,  // VK_Y
    ctrl: true,
    shift: false,
    alt: false,
}
```

---

### 5. HotkeyAction (Rust Enum - Extended)

Backend enum for hotkey events.

```rust
// src-tauri/src/keyboard_hook.rs
#[derive(Debug, Clone, Copy, PartialEq)]
pub enum HotkeyAction {
    ToggleVisibility,       // Existing - F3
    ToggleMode,             // Existing - F5
    ChronometerStartPause,  // NEW - Ctrl+T
    ChronometerReset,       // NEW - Ctrl+Y
}
```

---

### 6. WidgetType (Extended)

Extended to include 'chronometer' variant.

```typescript
// src/types/widgets.ts
type WidgetType = 'clock' | 'timer' | 'chronometer';
```

---

### 7. WidgetInstance (Existing - No Changes)

Chronometer uses standard widget instance structure.

```typescript
interface WidgetInstance {
  id: string;
  type: WidgetType;  // 'chronometer'
  x: number;
  y: number;
  width: number;
  height: number;
  opacity: number;
  isFlipped: boolean;   // Runtime only
  createdAt: number;    // Runtime only
}
```

---

## Relationships

```
┌─────────────────────────────────────────────────────────────────┐
│                        UserSettings                              │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │                    HotkeySettings                        │    │
│  │  ├── toggleVisibility: HotkeyBinding                    │    │
│  │  ├── toggleMode: HotkeyBinding                          │    │
│  │  ├── chronometerStartPause: HotkeyBinding ◄── NEW       │    │
│  │  └── chronometerReset: HotkeyBinding ◄──────── NEW      │    │
│  └─────────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼ (read by)
┌─────────────────────────────────────────────────────────────────┐
│                    Keyboard Hook System                          │
│  ┌──────────────────────┐    ┌──────────────────────────────┐   │
│  │  keyboard_hook.rs    │    │  useHotkeyCapture.ts         │   │
│  │  (Backend Hook)      │    │  (Webview Capture)           │   │
│  │                      │    │                              │   │
│  │  HotkeyAction enum   │    │  matchesHotkey() function    │   │
│  │  - ChronometerStart  │    │  - chronometerStartPause     │   │
│  │  - ChronometerReset  │    │  - chronometerReset          │   │
│  └──────────────────────┘    └──────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼ (emits events / invokes commands)
┌─────────────────────────────────────────────────────────────────┐
│                    Chronometer Hook                              │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │                 useChronometer.ts                         │   │
│  │  - Listens for chronometer events                        │   │
│  │  - Manages ChronometerState                              │   │
│  │  - Updates display via formatElapsedTime()               │   │
│  └──────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼ (consumed by)
┌─────────────────────────────────────────────────────────────────┐
│                    Widget Components                             │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │              ChronometerWidgetContent.tsx                 │   │
│  │  - Displays formatted time                               │   │
│  │  - Auto-scales text with ResizeObserver                  │   │
│  └──────────────────────────────────────────────────────────┘   │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │              ChronometerWidgetSettings.tsx                │   │
│  │  - Hotkey input fields                                   │   │
│  │  - Conflict validation                                   │   │
│  │  - Save/Cancel buttons                                   │   │
│  └──────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
```

---

## Validation Rules

### HotkeyBinding Validation
1. `key` must be non-empty string
2. `keyCode` must be valid Windows VK code (0x00-0xFF)
3. At least one of `ctrl`, `shift`, `alt` should be true for letter keys (prevent accidental triggers)
4. Cannot duplicate existing system hotkeys (warning shown, override allowed)

### ChronometerState Validation
1. `elapsedMs` must be >= 0
2. `elapsedMs` capped at 359999000 (99:59:59 in ms)
3. `lastTickTimestamp` must be null when `isRunning` is false

### Widget Constraints
1. Chronometer hotkeys only trigger when:
   - Chronometer widget exists (is open)
   - Overlay is visible (not F3-hidden)
2. Multiple chronometer widgets share same state (singleton)
