# Data Model: MainMenu Component

**Feature Branch**: `006-main-menu-component`
**Date**: 2025-12-18

## Overview

This feature is primarily a UI component with no new persistent data entities. It leverages existing overlay state from `src/types/overlay.ts`.

## Entities

### Existing Entities (Unchanged)

#### OverlayMode (from `src/types/overlay.ts`)

```typescript
export type OverlayMode = 'windowed' | 'fullscreen';
```

- **windowed**: Interactive mode - MainMenu visible, Header at bottom
- **fullscreen**: Click-through mode - MainMenu hidden, Header at top (default position)

#### OverlayState (from `src/types/overlay.ts`)

```typescript
export interface OverlayState {
  visible: boolean;
  initialized: boolean;
  mode: OverlayMode;
  targetBound: boolean;
  targetName: string;
  targetRect: WindowRect | null;
  autoHidden: boolean;
}
```

**Relevant fields for this feature**:
- `mode`: Determines MainMenu visibility (visible when `windowed`)
- `visible`: Overall overlay visibility
- `targetRect`: Used for scaling calculations

### New Types (Component Props)

#### MainMenuProps

```typescript
interface MainMenuProps {
  visible?: boolean;      // Whether the menu is shown (default: true)
  mode?: OverlayMode;     // Current overlay mode (default: 'windowed')
  targetRect?: WindowRect | null;  // Target window dimensions for scaling
}
```

#### HeaderPanelProps (Extended)

```typescript
interface HeaderPanelProps {
  visible?: boolean;
  mode?: OverlayMode;
  targetRect?: WindowRect | null;
  position?: 'top' | 'bottom';  // NEW: Position in container (default: 'top')
}
```

## State Transitions

```
┌─────────────────────────────────────────────────────────────┐
│                    Overlay State Machine                     │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│   ┌──────────────┐         F5          ┌──────────────┐    │
│   │  fullscreen  │ ─────────────────▶  │   windowed   │    │
│   │ (click-thru) │                     │ (interactive)│    │
│   │              │ ◀───────────────── │              │    │
│   │ MainMenu:    │         F5          │ MainMenu:    │    │
│   │  HIDDEN      │                     │  VISIBLE     │    │
│   │ Header: TOP  │                     │ Header:BOTTOM│    │
│   └──────────────┘                     └──────────────┘    │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

## Button Configuration

Static configuration for menu buttons (no runtime data persistence):

| Button | Group | Label | Click Action |
|--------|-------|-------|--------------|
| 1 | Group 1 | "Option 1" | `console.log("Button clicked: Option 1")` |
| 2 | Group 1 | "Option 2" | `console.log("Button clicked: Option 2")` |
| 3 | Group 2 | "Option 3" | `console.log("Button clicked: Option 3")` |

## Validation Rules

1. **Mode validation**: Only 'windowed' or 'fullscreen' values accepted
2. **Visibility logic**: MainMenu shown only when `mode === 'windowed'`
3. **Header position**: Bottom when `mode === 'windowed'`, Top otherwise

## Data Flow

```
F5 Keypress
    │
    ▼
Tauri Backend (toggle_mode)
    │
    ▼
"toggle-mode" Event
    │
    ▼
page.tsx setState({ mode })
    │
    ├──────────────────────────────┐
    ▼                              ▼
MainMenu                      HeaderPanel
  visible={mode === 'windowed'}    position={mode === 'windowed' ? 'bottom' : 'top'}
```

## No New Persistent Storage

This feature:
- ✅ Uses existing OverlayState
- ✅ No new database/file storage
- ✅ No API contracts needed
- ✅ Pure UI component with props-based data flow
