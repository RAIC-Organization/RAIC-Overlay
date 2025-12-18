# Research: Decoupled Windows System

**Feature**: 007-windows-system
**Date**: 2025-12-18
**Status**: Complete

## Research Tasks

### 1. React State Management for Window Collections

**Decision**: React Context with useReducer

**Rationale**:
- The existing codebase uses local component state and Tauri events
- React Context provides a lightweight solution for sharing window state across components
- useReducer handles complex state updates (add, remove, move, resize, focus) cleanly
- No external dependency required (Redux, Zustand unnecessary for this scope)

**Alternatives Considered**:
- Zustand: Overkill for 10-window limit; adds dependency
- Redux: Too heavy for single-feature state
- Jotai: Good but unfamiliar to maintain; Context is simpler

### 2. Drag and Resize Implementation

**Decision**: Native pointer events with requestAnimationFrame

**Rationale**:
- React 19 supports pointer events natively
- `onPointerDown`, `onPointerMove`, `onPointerUp` provide touch/mouse unified handling
- requestAnimationFrame ensures 60fps updates during drag
- No external library needed; existing codebase has no drag library
- CSS `cursor` changes for resize affordance (as per spec)

**Alternatives Considered**:
- react-draggable: Adds dependency; limited resize support
- react-rnd: Feature-rich but 15KB+ bundle size
- HTML5 Drag API: Poor for continuous position updates; designed for drop targets

**Implementation Pattern**:
```typescript
// Pseudocode for drag handler
const handlePointerDown = (e: PointerEvent) => {
  e.currentTarget.setPointerCapture(e.pointerId);
  startDrag({ x: e.clientX, y: e.clientY });
};

const handlePointerMove = (e: PointerEvent) => {
  if (isDragging) {
    requestAnimationFrame(() => {
      updatePosition(e.clientX - offset.x, e.clientY - offset.y);
    });
  }
};
```

### 3. Z-Index Management

**Decision**: Incremental z-index with focus tracking

**Rationale**:
- Each window gets a base z-index (100 + creation order)
- Clicking a window brings it to front by assigning `maxZIndex + 1`
- Simple counter avoids z-index collisions
- Periodic normalization (optional) prevents integer overflow after many focus changes

**Implementation Pattern**:
```typescript
// Window state includes zIndex
const bringToFront = (windowId: string) => {
  const newMaxZ = Math.max(...windows.map(w => w.zIndex)) + 1;
  updateWindow(windowId, { zIndex: newMaxZ });
};
```

### 4. Event System Architecture

**Decision**: Custom event emitter with typed events

**Rationale**:
- Spec requires decoupled event-based window opening
- Custom EventEmitter class keeps windows system independent of MainMenu
- TypeScript generics ensure type safety for event payloads
- Similar pattern to existing Tauri event listeners in page.tsx

**Event Types**:
```typescript
type WindowEvents = {
  'window:open': { component: React.ComponentType; title: string };
  'window:close': { windowId: string };
  'window:focus': { windowId: string };
};
```

**Alternatives Considered**:
- Tauri events: Would require Rust changes; unnecessary for frontend-only feature
- React Context callbacks: Couples components; spec wants decoupled events
- DOM CustomEvents: Works but less type-safe than custom emitter

### 5. Mode-Aware Styling

**Decision**: Tailwind CSS with conditional classes

**Rationale**:
- Existing components use Tailwind with `cn()` utility
- Mode passed as prop from parent (already available via overlay state)
- No CSS-in-JS needed; matches codebase conventions

**Style Matrix**:

| Property | Interaction Mode | Passive Mode |
|----------|------------------|--------------|
| Header | Visible | Hidden (h-0) |
| Border | 1px gray, rounded-lg | None |
| Opacity | 100% | 60% (opacity-60) |
| Pointer Events | All | None (pointer-events-none on drag areas) |

### 6. Window Constraints

**Decision**: Clamp position during drag; enforce minimum size during resize

**Rationale**:
- Spec: Windows must remain partially visible (at least 50px inside container)
- Spec: Minimum size 150x100px, default 400x300px
- Container bounds available via `getBoundingClientRect()`

**Constraint Logic**:
```typescript
const constrainPosition = (x: number, y: number, width: number, height: number) => ({
  x: Math.max(-width + 50, Math.min(x, containerWidth - 50)),
  y: Math.max(0, Math.min(y, containerHeight - 50))
});

const constrainSize = (width: number, height: number) => ({
  width: Math.max(150, width),
  height: Math.max(100, height)
});
```

### 7. Animation Integration

**Decision**: Use existing motion.js for open/close transitions

**Rationale**:
- motion.js (12.x) already installed and used in MainMenu, HeaderPanel
- AnimatePresence for window mount/unmount animations
- Consistent with existing animation patterns

**Animation Specs**:
- Open: Scale from 0.95 + fade in (200ms)
- Close: Scale to 0.95 + fade out (150ms)
- Mode transition: Opacity crossfade (100ms per spec)

## Dependencies Verified

| Dependency | Version | Status | Notes |
|------------|---------|--------|-------|
| React | 19.0.0 | ✅ Installed | Pointer events supported |
| motion | 12.x | ✅ Installed | AnimatePresence available |
| Tailwind CSS | 4.1.18 | ✅ Installed | cn() utility ready |
| TypeScript | 5.7.2 | ✅ Installed | Strict types enabled |

## Key Findings

1. **No external drag library needed** - Native pointer events + RAF sufficient
2. **React Context preferred** - Matches codebase simplicity principle
3. **Event emitter pattern** - Keeps window system decoupled as spec requires
4. **Existing patterns reusable** - motion.js, Tailwind, shadcn integration straightforward

## Open Questions Resolved

All technical unknowns from spec have been resolved through research:
- ✅ State management approach: React Context + useReducer
- ✅ Drag/resize implementation: Native pointer events
- ✅ Event system: Custom typed EventEmitter
- ✅ Animation: Existing motion.js
- ✅ Styling: Tailwind with conditional classes
