# Research: Per-Window Opacity Control

**Feature**: 013-window-opacity-control
**Date**: 2025-12-20

## Research Topics

### 1. shadcn/ui Slider Component Integration

**Decision**: Use shadcn/ui Slider component with `@radix-ui/react-slider` as the underlying primitive.

**Rationale**:
- Consistent with existing project UI patterns (shadcn/ui already in use)
- Built on Radix UI primitives ensuring accessibility
- Supports controlled value via `value` and `onValueChange` props
- Supports `min`, `max`, `step` configuration
- Lightweight and customizable via Tailwind CSS

**Installation**:
```bash
npx shadcn@latest add slider
```

**Key Props**:
- `value`: Controlled value as number array (e.g., `[60]`)
- `onValueChange`: Callback when value changes `(value: number[]) => void`
- `min`: Minimum value (default: 0)
- `max`: Maximum value (default: 100)
- `step`: Step increment (default: 1)
- `className`: Tailwind classes for styling

**Usage Pattern**:
```tsx
import { useState } from "react"
import { Slider } from "@/components/ui/slider"

function OpacitySlider({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  return (
    <Slider
      value={[value]}
      onValueChange={(v) => onChange(v[0])}
      min={10}
      max={100}
      step={1}
      className="w-20"
    />
  )
}
```

**Alternatives Considered**:
- Native HTML `<input type="range">`: Rejected due to limited styling and inconsistent cross-browser appearance
- Custom slider implementation: Rejected as unnecessary complexity when shadcn/ui provides a ready solution

---

### 2. Header Layout Integration

**Decision**: Place opacity slider inline in window header, between title and close button.

**Rationale**:
- Header already has flexbox layout with space-between
- Slider is compact enough to fit in header (w-20 = 80px)
- Percentage label adjacent to slider provides immediate feedback
- Close button remains rightmost element for consistency

**Layout Structure**:
```
┌─────────────────────────────────────────────────────────┐
│ [Title]                    [Slider] [60%]    [X Close] │
└─────────────────────────────────────────────────────────┘
```

**Alternatives Considered**:
- Dropdown menu with slider: Rejected as adds extra click
- Context menu on right-click: Rejected as not discoverable
- Settings panel: Rejected as over-engineered for single setting

---

### 3. Opacity Application Strategy

**Decision**: Apply opacity via CSS `opacity` property on the window container's motion.div element.

**Rationale**:
- Simple CSS property change with minimal performance overhead
- Works with existing motion/react animation setup
- Opacity affects entire window including content (desired behavior)
- Header remains fully opaque in interactive mode for usability

**Implementation Approach**:
```tsx
// In Window.tsx
<motion.div
  style={{
    opacity: isInteractive ? 1 : windowInstance.opacity,
    // ... other styles
  }}
  animate={{
    opacity: isInteractive ? 1 : windowInstance.opacity,
    scale: 1
  }}
>
```

**Key Insight**: In interactive mode, header is fully opaque regardless of window opacity setting for better usability. In non-interactive mode, entire window (including content) uses the configured opacity.

**Alternatives Considered**:
- Background color alpha only: Rejected as content would remain fully opaque
- Backdrop filter: Not appropriate for opacity control
- CSS variables: Unnecessary indirection for single value

---

### 4. Persistence Integration

**Decision**: Add `opacity` field to `WindowStructure` in existing persistence types.

**Rationale**:
- Follows established persistence pattern from feature 010
- Stored in `state.json` alongside position, size, zIndex
- Debounced persistence already exists for window moves/resizes
- Same debounce mechanism applies to opacity changes

**Data Model Extension**:
```typescript
// types/persistence.ts
export interface WindowStructure {
  id: string;
  type: WindowType;
  position: Position;
  size: Size;
  zIndex: number;
  flags: WindowFlags;
  opacity: number;  // NEW: 0.1 to 1.0, default 0.6
}
```

```rust
// persistence_types.rs
pub struct WindowStructure {
    // ... existing fields
    pub opacity: f32,  // NEW: 0.1 to 1.0, default 0.6
}
```

**Migration Strategy**:
- Missing `opacity` field defaults to 0.6 (60%)
- No version bump required (backwards compatible)

**Alternatives Considered**:
- Separate opacity config file: Rejected as over-engineered
- Store in window content file: Rejected as opacity is structural, not content

---

### 5. State Management Integration

**Decision**: Add `opacity` property to `WindowInstance` and new reducer action `SET_WINDOW_OPACITY`.

**Rationale**:
- Consistent with existing window state pattern
- Allows real-time updates without persistence on every change
- Persistence triggered on debounced basis after slider interaction ends

**New Action**:
```typescript
type WindowsAction =
  // ... existing actions
  | { type: 'SET_WINDOW_OPACITY'; windowId: string; opacity: number };
```

**Context Extension**:
```typescript
export interface WindowsContextValue {
  // ... existing methods
  setWindowOpacity: (windowId: string, opacity: number) => void;
}
```

**Alternatives Considered**:
- Local component state only: Rejected as opacity needs to persist and be shared
- Redux/Zustand: Rejected as project already uses React Context

---

### 6. Debounce Strategy

**Decision**: Reuse existing debounce mechanism from persistence system (500ms delay).

**Rationale**:
- `usePersistence` hook already provides `onWindowMoved()` trigger
- Same debounce delay appropriate for opacity changes
- No new debounce implementation needed

**Trigger Point**: Call persistence trigger on slider `onValueCommit` or on `pointerUp` after slider interaction.

**Note**: The Radix Slider supports `onValueCommit` which fires only when user finishes dragging (releases pointer), distinct from `onValueChange` which fires on every value change. This is ideal for triggering persistence.

---

## Summary

All research questions resolved. No NEEDS CLARIFICATION items remain.

| Topic | Decision | Status |
|-------|----------|--------|
| UI Component | shadcn/ui Slider | Resolved |
| Header Layout | Inline slider + percentage label | Resolved |
| Opacity Application | CSS opacity on motion.div | Resolved |
| Persistence | Extend WindowStructure with opacity field | Resolved |
| State Management | Add opacity to WindowInstance + new action | Resolved |
| Debounce | Reuse existing 500ms persistence debounce | Resolved |
