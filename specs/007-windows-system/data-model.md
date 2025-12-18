# Data Model: Decoupled Windows System

**Feature**: 007-windows-system
**Date**: 2025-12-18

## Entities

### WindowInstance

Represents a single window in the windowing system.

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| id | string | Yes | Unique identifier (UUID v4) |
| title | string | Yes | Window title displayed in header |
| component | React.ComponentType | Yes | React component to render in window body |
| componentProps | Record<string, unknown> | No | Props to pass to the component |
| x | number | Yes | X position in pixels (relative to container) |
| y | number | Yes | Y position in pixels (relative to container) |
| width | number | Yes | Window width in pixels |
| height | number | Yes | Window height in pixels |
| zIndex | number | Yes | Stacking order (higher = front) |
| createdAt | number | Yes | Timestamp for creation order |

**Constraints**:
- `width` >= 150 (MIN_WIDTH)
- `height` >= 100 (MIN_HEIGHT)
- Default size: 400x300 pixels
- `x`, `y` constrained to keep 50px visible within container

**State Transitions**:
```
[Created] → [Positioned] → [Focused] → [Closed]
     ↓           ↓             ↓
     └───────────┴─────────────┘
                 ↓
            [Resized/Moved]
```

### WindowsState

Aggregate state for the entire windowing system.

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| windows | WindowInstance[] | Yes | Array of all open windows |
| activeWindowId | string \| null | Yes | ID of currently focused window |
| nextZIndex | number | Yes | Counter for next z-index assignment |

**Invariants**:
- `activeWindowId` must reference an existing window or be null
- No duplicate window IDs
- `nextZIndex` always greater than any window's current zIndex

### WindowOpenRequest

Event payload for opening a new window.

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| component | React.ComponentType | Yes | Component to render |
| title | string | Yes | Window title |
| componentProps | Record<string, unknown> | No | Optional props for component |
| initialWidth | number | No | Override default width (400px) |
| initialHeight | number | No | Override default height (300px) |

## Relationships

```
WindowsState 1 ──────────* WindowInstance
      │
      └── activeWindowId ──→ WindowInstance.id (nullable reference)

WindowOpenRequest ──creates→ WindowInstance
```

## Validation Rules

### WindowInstance

1. **ID Uniqueness**: `id` must be unique across all windows
2. **Title Non-Empty**: `title.length > 0`
3. **Size Constraints**:
   - `width >= 150 && width <= containerWidth`
   - `height >= 100 && height <= containerHeight`
4. **Position Constraints**:
   - `x >= -width + 50` (at least 50px visible on left)
   - `x <= containerWidth - 50` (at least 50px visible on right)
   - `y >= 0` (cannot go above container)
   - `y <= containerHeight - 50` (at least 50px visible at bottom)

### WindowOpenRequest

1. **Component Required**: `component !== null && component !== undefined`
2. **Title Required**: `title.length > 0`
3. **Optional Size Validation** (if provided):
   - `initialWidth >= 150`
   - `initialHeight >= 100`

## Constants

```typescript
// Size constraints
const MIN_WIDTH = 150;
const MIN_HEIGHT = 100;
const DEFAULT_WIDTH = 400;
const DEFAULT_HEIGHT = 300;

// Visibility constraints
const MIN_VISIBLE_EDGE = 50; // pixels that must remain visible

// Z-index management
const BASE_Z_INDEX = 100;
const HEADER_HEIGHT = 32; // pixels
```

## Type Definitions Location

All types defined in: `src/types/windows.ts`
