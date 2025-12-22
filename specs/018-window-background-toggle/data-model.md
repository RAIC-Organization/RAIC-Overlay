# Data Model: Window Background Toggle

**Feature**: 018-window-background-toggle
**Date**: 2025-12-21

## Entity Changes

### WindowInstance (Extended)

**File**: `src/types/windows.ts`

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `backgroundTransparent` | `boolean` | `false` | Controls content area background transparency. When `true`, content area has no background color (transparent). When `false`, content area uses theme `bg-background` color. |

**Validation Rules**:
- Must be a boolean (no clamping needed)
- Invalid/missing values default to `false`

**State Transitions**:
```
false (solid) <--toggle--> true (transparent)
```

### WindowStructure (Extended)

**File**: `src/types/persistence.ts`

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `backgroundTransparent` | `boolean` | `false` | Persisted background transparency state |

**Backward Compatibility**:
- Existing persisted windows without this field receive default `false`
- No migration required; field is optional with default

### WindowOpenPayload (Extended)

**File**: `src/types/windows.ts`

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `initialBackgroundTransparent` | `boolean` (optional) | `undefined` | Initial background transparency for restored windows |

## Context Changes

### ExtendedWindowsContextValue (Extended)

**File**: `src/contexts/WindowsContext.tsx`

| Method | Signature | Description |
|--------|-----------|-------------|
| `setWindowBackgroundTransparent` | `(windowId: string, transparent: boolean) => void` | Set background transparency for a specific window |

### WindowsAction (Extended)

| Action Type | Payload | Description |
|-------------|---------|-------------|
| `SET_WINDOW_BACKGROUND_TRANSPARENT` | `{ windowId: string; transparent: boolean }` | Update window background transparency |

## Serialization Changes

### serializeWindow (Modified)

**File**: `src/lib/serialization.ts`

Add `backgroundTransparent` field to output:

```typescript
return {
  // ... existing fields
  opacity: win.opacity ?? WINDOW_CONSTANTS.DEFAULT_OPACITY,
  backgroundTransparent: win.backgroundTransparent ?? false,  // NEW
};
```

## UI Component

### BackgroundToggle

**File**: `src/components/windows/BackgroundToggle.tsx` (NEW)

| Prop | Type | Description |
|------|------|-------------|
| `value` | `boolean` | Current background transparency state |
| `onChange` | `(value: boolean) => void` | Callback when toggle is clicked |
| `onCommit` | `() => void` | Callback when change should be persisted |

**Behavior**:
- Renders as icon button with `PanelTop` icon
- Visual state: full opacity = solid, reduced = transparent
- Single click toggles state and triggers `onChange` + `onCommit`

## Constants (No Changes)

No new constants required. Uses existing:
- `WINDOW_CONSTANTS.HEADER_HEIGHT` for header sizing
- Theme colors via Tailwind (`bg-background`, `bg-transparent`)

## Relationships

```
WindowInstance
    └── backgroundTransparent: boolean
            │
            ▼
    WindowStructure (persistence)
            │
            ▼
    BackgroundToggle (UI control)
            │
            ▼
    Window.tsx content area styling
```

## Default Behavior

1. **New Window Created**: `backgroundTransparent = false` (solid background)
2. **Existing Window Loaded (no field)**: defaults to `false` (solid background)
3. **Toggle Clicked**: immediately toggles state, triggers persistence
4. **Mode Switch (F5)**: background transparency preserved (no change)
