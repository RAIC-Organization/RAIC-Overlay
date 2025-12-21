# Research: Window Background Toggle

**Feature**: 018-window-background-toggle
**Date**: 2025-12-21

## Research Items

### 1. Toggle Component Implementation

**Question**: What component should be used for the background toggle?

**Decision**: Use a simple toggle button with lucide-react icons (already in project) rather than adding a new shadcn/ui Checkbox component.

**Rationale**:
- lucide-react is already a project dependency (used for X close icon in WindowHeader)
- Avoids adding new shadcn/ui component dependency (Checkbox)
- Simpler implementation: icon button toggles between `Square` (solid) and `SquareSlash`/custom transparent icon
- Consistent with existing header controls pattern (icon-based)

**Alternatives Considered**:
1. **shadcn/ui Checkbox** - Would require adding new component; doesn't match header icon-button aesthetic
2. **shadcn/ui Switch** - More visually prominent than needed for this subtle control
3. **Icon toggle button** ✅ CHOSEN - Minimal, icon-based, matches existing header UI

### 2. Transparent Icon Selection

**Question**: Which icon best represents "transparent background"?

**Decision**: Use `PanelTop` icon from lucide-react to represent the content area, with visual styling to indicate transparent vs solid state.

**Rationale**:
- `PanelTop` represents a window content area
- Toggle state indicated by icon opacity/color:
  - Full opacity = solid background (default)
  - Reduced opacity or different color = transparent background
- Consistent with Tailwind CSS styling approach

**Alternatives Considered**:
1. **Square/SquareDashed** - Confusing; doesn't clearly indicate background
2. **Layers** - Too abstract
3. **PanelTop with opacity** ✅ CHOSEN - Clear visual representation of content area

### 3. CSS Implementation for Transparent Content Area

**Question**: How to implement transparent background for content area only?

**Decision**: Conditionally apply `bg-transparent` class to the content area div within Window.tsx.

**Rationale**:
- Current implementation uses `bg-background` on the outer motion.div
- Content area is a separate div inside the window
- By applying `bg-background` to header and `bg-transparent` conditionally to content, we achieve the desired effect
- No new CSS required; uses existing Tailwind utilities

**Implementation Approach**:
```tsx
// Window.tsx content area
<div
  className={cn(
    "overflow-auto pointer-events-auto",
    backgroundTransparent ? "bg-transparent" : "bg-background"
  )}
  style={{ height: contentHeight }}
>
```

**Alternatives Considered**:
1. **CSS custom properties** - Over-engineered for simple boolean toggle
2. **Separate wrapper component** - Unnecessary abstraction
3. **Conditional Tailwind class** ✅ CHOSEN - Simple, direct, Tailwind-idiomatic

### 4. State Management Integration

**Question**: How to integrate backgroundTransparent into existing window state?

**Decision**: Follow exact pattern of opacity implementation from feature 013:
- Add `backgroundTransparent: boolean` to WindowInstance
- Add `SET_WINDOW_BACKGROUND_TRANSPARENT` action
- Add `setWindowBackgroundTransparent` context method
- Add to WindowStructure in persistence.ts with default `false`

**Rationale**:
- Opacity control (feature 013) provides proven pattern
- Consistent reducer/action structure
- Minimal changes to existing code

### 5. Persistence Integration

**Question**: How to persist backgroundTransparent setting?

**Decision**: Add `backgroundTransparent` field to WindowStructure in persistence.ts, defaulting to `false`.

**Rationale**:
- Follows existing pattern for window properties (opacity, position, size)
- Boolean serializes cleanly to JSON
- Default `false` ensures backward compatibility with existing state files

**Migration Note**: Existing persisted windows without this field will get `false` (solid background) automatically due to TypeScript default handling.

## Summary

All research items resolved. Implementation approach:
1. Create `BackgroundToggle.tsx` using icon button pattern (not checkbox)
2. Use `PanelTop` icon with styling to indicate state
3. Add `backgroundTransparent` to window types and context
4. Conditionally apply `bg-transparent` to content area
5. Persist as part of WindowStructure with default `false`

No new dependencies required. All changes use existing patterns and libraries.
