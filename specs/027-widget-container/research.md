# Research: Widget Container System

**Feature**: 027-widget-container
**Date**: 2025-12-23

## 1. 3D Backflip Animation Implementation

### Decision
Use CSS 3D transforms with `rotateY(180deg)` for the widget flip animation, implemented via motion.dev (motion/react) for React integration.

### Rationale
- CSS 3D transforms are hardware-accelerated and provide smooth 60fps animations
- The existing codebase already uses motion 12.x for animations (windows, menus)
- motion.dev supports `rotateY` as an independent transform axis
- Consistent with existing animation patterns in the project

### Implementation Pattern

```tsx
// Widget container structure
<div style={{ perspective: '1000px' }}>
  <motion.div
    animate={{ rotateY: isFlipped ? 180 : 0 }}
    transition={{ duration: 0.5, ease: 'easeInOut' }}
    style={{ transformStyle: 'preserve-3d' }}
  >
    {/* Front face - widget content */}
    <div style={{
      backfaceVisibility: 'hidden',
      position: 'absolute',
      width: '100%',
      height: '100%'
    }}>
      {children}
    </div>

    {/* Back face - settings panel */}
    <div style={{
      backfaceVisibility: 'hidden',
      position: 'absolute',
      width: '100%',
      height: '100%',
      transform: 'rotateY(180deg)'
    }}>
      <WidgetSettings />
    </div>
  </motion.div>
</div>
```

### Key CSS Properties Required
- `perspective: 1000px` on container - creates 3D depth
- `transform-style: preserve-3d` on animated element - enables 3D transforms for children
- `backface-visibility: hidden` on both faces - hides back when facing away
- `rotateY(180deg)` on back face by default - positions it facing backwards

### Tailwind CSS 4.x Classes
```text
[perspective:1000px]
[transform-style:preserve-3d]
[backface-visibility:hidden]
```

### Alternatives Considered
1. **Pure CSS transitions without motion.dev** - Rejected: Would require managing class toggling manually, inconsistent with existing animation patterns
2. **React Spring** - Rejected: Not used in project, motion.dev already installed
3. **GSAP** - Rejected: Not used in project, would add unnecessary dependency

### Sources
- [Motion.dev Documentation - 3D Transforms](https://motion.dev/docs/animate)
- [W3Schools - CSS Flip Card](https://www.w3schools.com/howto/howto_css_flip_card.asp)
- [CSS 3D Transforms - Card Flip](https://3dtransforms.desandro.com/card-flip)

---

## 2. Click vs Drag Differentiation (Hold Threshold)

### Decision
Implement a 150-200ms hold threshold using pointer events and timeouts to differentiate between click (settings flip) and drag (reposition).

### Rationale
- Matches clarification decision from spec (150-200ms threshold)
- Common pattern in mobile and desktop UIs for touch/click differentiation
- Simple to implement with setTimeout and pointer event handlers

### Implementation Pattern

```tsx
const HOLD_THRESHOLD_MS = 175; // Middle of 150-200ms range

function useClickOrDrag(onFlip: () => void, onDragStart: () => void) {
  const holdTimerRef = useRef<number | null>(null);
  const isDraggingRef = useRef(false);
  const startPosRef = useRef({ x: 0, y: 0 });

  const handlePointerDown = (e: React.PointerEvent) => {
    startPosRef.current = { x: e.clientX, y: e.clientY };
    isDraggingRef.current = false;

    holdTimerRef.current = window.setTimeout(() => {
      isDraggingRef.current = true;
      onDragStart();
    }, HOLD_THRESHOLD_MS);
  };

  const handlePointerUp = () => {
    if (holdTimerRef.current) {
      clearTimeout(holdTimerRef.current);
    }

    if (!isDraggingRef.current) {
      onFlip(); // Released before threshold = click
    }
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    // Cancel if moved significantly before threshold
    const dx = Math.abs(e.clientX - startPosRef.current.x);
    const dy = Math.abs(e.clientY - startPosRef.current.y);
    if (dx > 5 || dy > 5) {
      if (holdTimerRef.current) {
        clearTimeout(holdTimerRef.current);
        isDraggingRef.current = true;
        onDragStart();
      }
    }
  };

  return { handlePointerDown, handlePointerUp, handlePointerMove };
}
```

### Alternatives Considered
1. **Modifier key (Ctrl+click)** - Rejected: Less intuitive, requires keyboard
2. **Dedicated drag handle area** - Rejected: Conflicts with spec requirement to drag anywhere
3. **Mouse move detection only** - Rejected: Would not distinguish stationary hold from click

---

## 3. Widget State Persistence

### Decision
Extend existing persistence system with new `widgets` array in `state.json`, parallel to existing `windows` array.

### Rationale
- Follows existing patterns from feature 010-state-persistence-system
- Consistent with window persistence architecture
- Reuses atomic file write mechanism for data safety
- Minimal backend changes required

### Data Structure (TypeScript)

```typescript
// Extends PersistedState in persistence.ts
export interface PersistedState {
  version: number;
  lastModified: string;
  global: GlobalSettings;
  windows: WindowStructure[];
  widgets: WidgetStructure[];  // NEW
}

export interface WidgetStructure {
  id: string;
  type: WidgetType;
  position: Position;
  size: Size;
  opacity: number;  // 0.1 to 1.0 (10-100%)
}

export type WidgetType = 'clock';  // Extensible for future widgets
```

### Data Structure (Rust)

```rust
// Extends PersistedState in persistence_types.rs
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct PersistedState {
    pub version: u32,
    pub last_modified: String,
    pub global: GlobalSettings,
    pub windows: Vec<WindowStructure>,
    pub widgets: Vec<WidgetStructure>,  // NEW
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct WidgetStructure {
    pub id: String,
    pub widget_type: WidgetType,
    pub position: Position,
    pub size: Size,
    pub opacity: f32,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "lowercase")]
pub enum WidgetType {
    Clock,
}
```

### Migration Consideration
- Existing `state.json` files without `widgets` field will default to empty array
- Version number remains at 1 (backward compatible addition)

### Alternatives Considered
1. **Separate widgets.json file** - Rejected: Adds complexity, existing pattern works well
2. **Store widgets inside windows array** - Rejected: Conceptually different entities, would conflate types

---

## 4. Widget Container Architecture

### Decision
Create parallel widget system to windows with shared patterns but distinct components.

### Rationale
- Widgets have fundamentally different UX (no header, backflip settings, different drag behavior)
- Shared architectural patterns (events, context, persistence) ensure consistency
- Separation prevents window code from becoming bloated with widget-specific logic

### Component Hierarchy

```text
WidgetsContainer (orchestrator)
└── Widget (individual widget with flip animation)
    ├── WidgetFront (content side)
    │   ├── ClockWidgetContent
    │   └── [future widget contents]
    └── WidgetBack (settings side)
        └── WidgetSettings (opacity slider, close button)
```

### Event System

```typescript
// New event types for widgets
export interface WidgetEventMap {
  'widget:open': WidgetOpenPayload;
  'widget:close': WidgetClosePayload;
}

export interface WidgetOpenPayload {
  type: WidgetType;
  initialX?: number;
  initialY?: number;
  initialWidth?: number;
  initialHeight?: number;
  initialOpacity?: number;
  widgetId?: string;  // For restoration
}
```

### Alternatives Considered
1. **Extend Window component with widget mode** - Rejected: Would add complexity to Window, different enough to warrant separation
2. **Single unified container for both** - Rejected: Different rendering logic needed

---

## 5. Clock Widget Content Scaling

### Decision
Use CSS `font-size` scaling based on container dimensions via ResizeObserver.

### Rationale
- Existing ClockContent.tsx already implements this pattern
- Uses ResizeObserver for responsive font sizing
- Simple and performant approach

### Implementation Pattern (from existing code)

```tsx
const updateFontSize = useCallback(() => {
  if (!containerRef.current) return;
  const { width, height } = containerRef.current.getBoundingClientRect();
  // Scale font to fit container, with minimum size
  const newFontSize = Math.max(12, Math.min(width / 5, height / 1.5));
  setFontSize(newFontSize);
}, []);

useEffect(() => {
  const resizeObserver = new ResizeObserver(updateFontSize);
  if (containerRef.current) {
    resizeObserver.observe(containerRef.current);
  }
  return () => resizeObserver.disconnect();
}, [updateFontSize]);
```

### Styling
- White text with blue stroke for contrast (existing pattern)
- Orbitron font from feature 021
- HH:mm:ss format with 1-second update interval

---

## 6. Corner Accent Resize Handles

### Decision
Display visible corner accents (not edge-only handles) for resize in interaction mode only.

### Rationale
- Matches spec requirement for "corner accent indicators"
- Different from window system which uses invisible edge/corner hit areas
- Provides clear visual affordance for widget resizing

### Implementation Pattern

```tsx
// Corner accents visible only in interaction mode
{isInteractive && (
  <>
    <div className="absolute top-0 left-0 w-3 h-3 border-l-2 border-t-2 border-primary cursor-nw-resize" />
    <div className="absolute top-0 right-0 w-3 h-3 border-r-2 border-t-2 border-primary cursor-ne-resize" />
    <div className="absolute bottom-0 left-0 w-3 h-3 border-l-2 border-b-2 border-primary cursor-sw-resize" />
    <div className="absolute bottom-0 right-0 w-3 h-3 border-r-2 border-b-2 border-primary cursor-se-resize" />
  </>
)}
```

### Styling Notes
- Use SC HUD theme accent color for corners
- 2px border width for visibility
- Corner size approximately 12x12px for easy targeting

---

## 7. Deprecating Clock Window

### Decision
Remove `ClockContent.tsx` from windows system, remove clock button from MainMenu, update persistence to migrate existing clock windows.

### Rationale
- Spec explicitly requires removal of duplicate functionality
- Clean user experience with single clock mechanism
- Simplifies codebase by removing redundant code

### Migration Strategy
1. Remove `'clock'` from `WindowContentType` union
2. Remove clock button from MainMenu
3. Delete `ClockContent.tsx` from `src/components/windows/`
4. Add migration logic in hydration to skip clock windows
5. Update persistence types (Rust and TypeScript)

### Files to Modify
- `src/components/MainMenu.tsx` - Remove clock window button
- `src/components/windows/ClockContent.tsx` - DELETE
- `src/types/windows.ts` - Remove 'clock' from WindowContentType
- `src/types/persistence.ts` - Remove 'clock' from WindowType
- `src-tauri/src/persistence_types.rs` - Remove Clock from WindowType enum
- `src/hooks/useHydration.ts` - Skip restoring clock windows

---

## Summary

| Research Area | Decision | Key Technology |
|--------------|----------|----------------|
| Backflip Animation | CSS 3D + motion.dev rotateY | motion/react, perspective, preserve-3d |
| Click/Drag Detection | 175ms hold threshold | Pointer events, setTimeout |
| State Persistence | Extend state.json with widgets array | Existing persistence system |
| Architecture | Parallel widget system | Event emitter, context, persistence |
| Content Scaling | ResizeObserver font sizing | Existing pattern from ClockContent |
| Resize Handles | Visible corner accents | Tailwind borders, absolute positioning |
| Clock Deprecation | Remove from windows, migrate data | Delete files, update types |
