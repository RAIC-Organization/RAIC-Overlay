# Research: System Clock Window

**Feature**: 023-system-clock-window
**Date**: 2025-12-22
**Status**: Complete

## Research Topics

### 1. Existing Window Architecture

**Decision**: Follow established window component patterns from NotesContent, DrawContent, BrowserContent

**Rationale**: The codebase has a well-defined architecture for window content components:
- All content components receive `isInteractive`, `windowId`, `initialContent`, and `onContentChange` props
- Window wrapper handles drag, resize, opacity, and background transparency
- State persistence uses existing Tauri backend with JSON files
- Window events system provides decoupled communication

**Alternatives Considered**:
- Creating standalone window outside overlay system - Rejected: Would duplicate functionality and break consistency
- Using native Tauri window - Rejected: Would not integrate with existing window management

**Key Findings**:
- Window content interface pattern: `{ isInteractive, windowId, initialContent, onContentChange }`
- WindowContentType enum in `src/types/windows.ts` needs 'clock' addition
- WindowType enum in Rust `src-tauri/src/persistence_types.rs` needs Clock variant
- MainMenu.tsx pattern for adding new window buttons

### 2. Text Stroke/Outline Effect (Blue Border)

**Decision**: Use CSS `-webkit-text-stroke` combined with Tailwind CSS text-shadow for robust cross-browser support

**Rationale**:
- `-webkit-text-stroke` provides clean text outline effect with 96.89% browser support
- Works perfectly in WebKit-based browsers (Chrome, Edge, Safari)
- Can combine with text-shadow for additional contrast/depth

**Implementation**:
```css
.clock-text {
  color: white;
  -webkit-text-stroke: 2px #3b82f6; /* blue-500 */
  paint-order: stroke fill; /* Renders stroke behind fill */
}
```

**Alternatives Considered**:
- Pure text-shadow (multiple shadows) - Viable but less crisp edges, more complex CSS
- SVG text with stroke - Rejected: Overkill for simple outline, harder to scale dynamically
- Canvas rendering - Rejected: Not React-friendly, complicates component architecture

**Sources**:
- [MDN: -webkit-text-stroke](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Properties/-webkit-text-stroke)
- [CSS-Tricks: Adding Stroke to Web Text](https://css-tricks.com/adding-stroke-to-web-text/)
- [Tailwind CSS: Text Shadow](https://tailwindcss.com/docs/text-shadow)

### 3. Auto-Scaling Text to Fit Container

**Decision**: Use CSS `container queries` with `cqw` units or `clamp()` with viewport-based fallback

**Rationale**:
- Container queries allow text to scale based on parent container size
- Modern CSS approach, well-supported in current browsers
- Tailwind CSS 4.x supports container queries via `@container` plugin

**Implementation Approach**:
```css
/* Container-based scaling */
.clock-container {
  container-type: size;
}

.clock-text {
  font-size: clamp(1rem, 20cqw, 20rem);
}
```

**Alternative (simpler, fallback)**:
```tsx
// JavaScript-based approach using ResizeObserver
const [fontSize, setFontSize] = useState(48);
useEffect(() => {
  const observer = new ResizeObserver(entries => {
    const { width, height } = entries[0].contentRect;
    setFontSize(Math.min(width * 0.15, height * 0.7));
  });
  observer.observe(containerRef.current);
  return () => observer.disconnect();
}, []);
```

**Alternatives Considered**:
- Fixed font sizes with breakpoints - Rejected: Not responsive to arbitrary resize
- FitText.js library - Rejected: Adds dependency, can implement natively
- SVG viewBox scaling - Viable but adds complexity for simple text display

### 4. Click-Through Transparency

**Decision**: Use Tauri's `set_ignore_cursor_events` for transparent areas, keeping text interactive

**Rationale**:
- Existing fullscreen mode already implements click-through via Tauri backend
- For clock window, need selective click-through (transparent areas only)
- May require custom approach since text area should remain draggable

**Implementation Considerations**:
- Option A: Make entire window click-through, add small visible drag handle
- Option B: Use pointer-events CSS on transparent areas (limited effectiveness)
- Option C: Custom hit-testing with Tauri window event handling

**Recommended Approach**:
Given FR-013 and FR-014 requirements, implement as:
1. Window background is fully transparent
2. Text element has `pointer-events: auto` for drag interactions
3. Container has `pointer-events: none` to pass clicks through

```css
.clock-container {
  pointer-events: none;
}
.clock-text {
  pointer-events: auto;
  cursor: move;
}
```

### 5. Time Display and Update

**Decision**: Use `setInterval` with 1-second updates and `Date` API for time formatting

**Rationale**:
- Simple, reliable approach for second-precision updates
- React `useState` with cleanup in `useEffect` for proper lifecycle
- 24-hour format using `toLocaleTimeString` with options

**Implementation**:
```tsx
const [time, setTime] = useState(new Date());

useEffect(() => {
  const interval = setInterval(() => {
    setTime(new Date());
  }, 1000);
  return () => clearInterval(interval);
}, []);

const formattedTime = time.toLocaleTimeString('en-GB', {
  hour: '2-digit',
  minute: '2-digit',
  second: '2-digit',
  hour12: false
});
```

**Alternatives Considered**:
- `requestAnimationFrame` - Rejected: Overkill for second-level precision, wastes CPU
- External time library (date-fns, luxon) - Rejected: Unnecessary dependency for simple formatting
- Server time sync - Rejected: System time is the requirement per spec

### 6. State Persistence

**Decision**: Minimal persistence - only window position/size (handled by existing system)

**Rationale**:
- Clock has no user-configurable content state (unlike Notes with text, Draw with elements)
- Window position, size, opacity, and background transparency already persisted by Window wrapper
- Clock format is fixed at 24-hour per requirements

**Implementation**:
- Add 'clock' to WindowType enum in persistence types
- No ClockPersistedContent needed (empty/minimal)
- Window structure (position, size) automatically persisted

**Simplification**: Since there's no clock-specific content to persist, the `onContentChange` callback can be a no-op or omitted. The window wrapper handles all necessary persistence.

### 7. System Font

**Decision**: Use CSS `system-ui` font stack for true system font rendering

**Rationale**:
- Spec requires "system default font"
- `system-ui` CSS value provides native system font (Segoe UI on Windows 11)
- Consistent with OS look and feel

**Implementation**:
```css
.clock-text {
  font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
}
```

## Summary of Key Decisions

| Topic | Decision | Key Rationale |
|-------|----------|---------------|
| Architecture | Follow existing window patterns | Consistency, reuse, maintainability |
| Text Outline | `-webkit-text-stroke` | 96.89% browser support, clean effect |
| Auto-scaling | ResizeObserver + dynamic fontSize | Works for arbitrary resize, no dependencies |
| Click-through | CSS pointer-events on container | Simple, effective for transparent areas |
| Time Updates | setInterval (1s) + Date API | Simple, reliable, no dependencies |
| Persistence | Window structure only (no content) | Clock has no configurable content state |
| Font | system-ui CSS value | True system font per requirements |

## Unresolved Items

None - all technical decisions resolved.
