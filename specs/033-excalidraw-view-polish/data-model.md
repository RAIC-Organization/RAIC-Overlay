# Data Model: Excalidraw View Mode Polish

**Feature**: 033-excalidraw-view-polish
**Date**: 2025-12-28

## Overview

This feature does not introduce new data entities. It extends an existing component interface with a new prop.

## Interface Changes

### DrawContentProps (Extended)

**File**: `src/components/windows/DrawContent.tsx`

```typescript
export interface DrawContentProps {
  isInteractive: boolean;
  /** Initial elements from persistence */
  initialElements?: readonly ExcalidrawElement[];
  /** Initial app state from persistence */
  initialAppState?: Partial<AppState>;
  /** Callback when content changes (for persistence) */
  onContentChange?: (elements: readonly ExcalidrawElement[], appState: AppState) => void;
  /** NEW: Whether window background should be transparent (only applies in non-interactive mode) */
  backgroundTransparent?: boolean;
}
```

**New Property**:

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `backgroundTransparent` | `boolean` | `undefined` (falsy) | When true AND `isInteractive` is false, sets Excalidraw's `viewBackgroundColor` to "transparent" |

## State Flow

```
WindowInstance.backgroundTransparent
        ↓
    Window.tsx
        ↓ (passed via component props)
DrawContent.backgroundTransparent
        ↓ (computed)
Excalidraw.initialData.appState.viewBackgroundColor
```

## Excalidraw AppState (Reference)

The Excalidraw library's `AppState` includes:

| Property | Type | Description |
|----------|------|-------------|
| `viewBackgroundColor` | `string` | Canvas background color (CSS color value, including "transparent") |

**Behavior**:
- Default: `#fff` (white)
- Project default: `#1e1e1e` (dark theme)
- When transparent: `"transparent"`

## No Database/Persistence Changes

The `backgroundTransparent` setting is already persisted by the existing window system (`WindowInstance.backgroundTransparent` in `state.json`). No changes to persistence are required.
