# Quickstart: Window Background Toggle

**Feature**: 018-window-background-toggle
**Date**: 2025-12-21

## Overview

This feature adds a background transparency toggle to window headers, allowing users to switch between solid and transparent content area backgrounds.

## Files to Modify/Create

### 1. Types (Modify)

**`src/types/windows.ts`**:
- Add `backgroundTransparent: boolean` to `WindowInstance`
- Add `initialBackgroundTransparent?: boolean` to `WindowOpenPayload`

**`src/types/persistence.ts`**:
- Add `backgroundTransparent: boolean` to `WindowStructure`

### 2. Context (Modify)

**`src/contexts/WindowsContext.tsx`**:
- Add `SET_WINDOW_BACKGROUND_TRANSPARENT` action type
- Add reducer case for the action
- Add `setWindowBackgroundTransparent` method to context value
- Update `OPEN_WINDOW` to handle `initialBackgroundTransparent`

### 3. Serialization (Modify)

**`src/lib/serialization.ts`**:
- Add `backgroundTransparent` to `serializeWindow` output

### 4. Components (Modify + Create)

**`src/components/windows/BackgroundToggle.tsx`** (NEW):
```tsx
// Icon toggle button for background transparency
// Uses PanelTop icon from lucide-react
// Props: value, onChange, onCommit
```

**`src/components/windows/WindowHeader.tsx`** (Modify):
- Add BackgroundToggle next to OpacitySlider
- Pass backgroundTransparent value and handlers

**`src/components/windows/Window.tsx`** (Modify):
- Apply conditional `bg-transparent` to content area
- Pass backgroundTransparent to WindowHeader

## Implementation Order

1. **Types first**: Update `windows.ts` and `persistence.ts`
2. **Context second**: Add action and method to `WindowsContext.tsx`
3. **Serialization third**: Update `serialization.ts`
4. **BackgroundToggle component**: Create new component
5. **WindowHeader integration**: Add toggle to header
6. **Window styling**: Apply conditional background class

## Key Patterns to Follow

### Pattern: OpacitySlider (Feature 013)

Follow the same pattern used for opacity control:
- Slider component → Toggle component
- `setWindowOpacity` → `setWindowBackgroundTransparent`
- `opacity` prop → `backgroundTransparent` prop

### Pattern: Persistence Integration

Use `onWindowMoved()` from PersistenceContext for triggering save (same as opacity).

## Testing Checklist

- [ ] Toggle visible in header (interaction mode only)
- [ ] Single click toggles background
- [ ] Content area becomes transparent
- [ ] Header remains solid
- [ ] Setting persists after restart
- [ ] Works in both interaction/non-interaction modes
- [ ] New windows default to solid background

## Common Pitfalls

1. **Don't apply bg-transparent to entire window** - only content area
2. **Don't forget to add to WindowOpenPayload** - needed for restoration
3. **Default must be `false`** - ensures backward compatibility
