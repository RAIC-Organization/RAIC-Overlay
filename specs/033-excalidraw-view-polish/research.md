# Research: Excalidraw View Mode Polish

**Feature**: 033-excalidraw-view-polish
**Date**: 2025-12-28

## Research Tasks

### 1. Excalidraw View Mode CSS Class

**Question**: What CSS class does Excalidraw apply when `viewModeEnabled={true}`?

**Decision**: Use `.excalidraw--view-mode` selector

**Rationale**:
- Inspected `node_modules/@excalidraw/excalidraw/dist/dev/index.css` line 6075
- Found: `.excalidraw.excalidraw--view-mode .App-menu { ... }`
- This class is automatically applied by Excalidraw when `viewModeEnabled` prop is true
- Stable selector used by Excalidraw's own styling

**Alternatives considered**:
- `.view-mode` - Not used by Excalidraw
- Checking DOM at runtime - Unnecessary, CSS class is reliable

### 2. UI Elements to Hide

**Question**: What CSS selectors target the menu, zoom controls, and help button?

**Decision**: Target these selectors in view mode:
- `.App-menu` - Main menu container (hamburger button)
- `.zoom-actions` - Zoom controls container (-, %, +)
- `.help-icon` - Help button (?)
- `.layer-ui__wrapper__footer-right` - Footer right section (contains help)

**Rationale**:
- Verified in Excalidraw CSS (lines 2754-2804, 5847-5912, 5977-6029)
- These are stable class names used throughout the codebase
- The `.App-menu` in view mode is explicitly styled at line 6075

**Alternatives considered**:
- Using `UIOptions` prop - Does not support hiding these elements (verified via Context7 docs)
- Zen mode (`zenModeEnabled`) - Changes too much behavior, not just visibility

### 3. Transparent Background Support

**Question**: Does Excalidraw support transparent `viewBackgroundColor`?

**Decision**: Yes, use `viewBackgroundColor: "transparent"` in appState

**Rationale**:
- Context7 documentation confirms `viewBackgroundColor` is part of appState
- Documentation shows `exportBackground: false` works for exports
- CSS Legal Color Values including "transparent" are supported
- Default is `#fff` but can be set to any valid CSS color

**Alternatives considered**:
- CSS `background: transparent` on container - Won't affect Excalidraw's internal canvas
- Removing background via `exportBackground` - Only affects exports, not live view

### 4. Prop Passing Pattern

**Question**: How does the window system pass `backgroundTransparent` to content components?

**Decision**: Extend `DrawContentProps` interface to accept `backgroundTransparent` prop

**Rationale**:
- Inspected `Window.tsx` line 283: `<Component {...(componentProps ?? {})} isInteractive={isInteractive} />`
- The `componentProps` object is spread into the component
- `backgroundTransparent` is available in `windowInstance` (line 42)
- Need to either add it to componentProps at window creation or pass directly

**Current flow**:
1. `WindowInstance` has `backgroundTransparent` property
2. `Window` component receives it and applies to container styles
3. Content component (`DrawContent`) receives `isInteractive` but NOT `backgroundTransparent`

**Solution**: Pass `backgroundTransparent` alongside `isInteractive` to content component

## Key Findings Summary

| Topic | Finding | Confidence |
|-------|---------|------------|
| View mode class | `.excalidraw--view-mode` | High (verified in CSS) |
| Menu selector | `.App-menu` | High (verified in CSS) |
| Zoom selector | `.zoom-actions` | High (verified in CSS) |
| Help selector | `.help-icon` | High (verified in CSS) |
| Transparent bg | `viewBackgroundColor: "transparent"` | High (Context7 docs) |
| Prop passing | Extend componentProps or direct prop | High (code inspection) |

## Implementation Approach

### Issue 1: Hide UI Controls

Add CSS rules to `app/globals.css`:
```css
/* Excalidraw view mode - hide UI controls */
.excalidraw.excalidraw--view-mode .App-menu,
.excalidraw.excalidraw--view-mode .zoom-actions,
.excalidraw.excalidraw--view-mode .help-icon {
  display: none !important;
}
```

### Issue 2: Transparent Background

Modify `DrawContent.tsx`:
1. Add `backgroundTransparent?: boolean` to props interface
2. Compute effective `viewBackgroundColor` based on `backgroundTransparent` and `isInteractive`
3. Apply to Excalidraw's `initialData.appState`

```typescript
const effectiveAppState = {
  ...initialAppState,
  viewBackgroundColor: (backgroundTransparent && !isInteractive)
    ? "transparent"
    : (initialAppState?.viewBackgroundColor ?? "#1e1e1e"),
};
```

Modify `Window.tsx` (line ~283):
- Pass `backgroundTransparent` to content component alongside `isInteractive`
