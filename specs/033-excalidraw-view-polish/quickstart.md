# Quickstart: Excalidraw View Mode Polish

**Feature**: 033-excalidraw-view-polish
**Date**: 2025-12-28

## Summary

This feature polishes the Draw window by:
1. **Hiding UI controls** (menu, zoom, help) in non-interactive/passive mode
2. **Enabling transparent background** integration with the window system toggle

## Files to Modify

| File | Change |
|------|--------|
| `app/globals.css` | Add CSS rules to hide Excalidraw UI in view mode |
| `src/components/windows/DrawContent.tsx` | Add `backgroundTransparent` prop and apply to Excalidraw |
| `src/components/windows/Window.tsx` | Pass `backgroundTransparent` to content component |
| `tests/react/DrawContent.test.tsx` | Add tests for new functionality |

## Implementation Steps

### Step 1: Add CSS Rules

In `app/globals.css`, add after the existing window styles:

```css
/* Excalidraw view mode - hide UI controls (033-excalidraw-view-polish) */
.excalidraw.excalidraw--view-mode .App-menu,
.excalidraw.excalidraw--view-mode .zoom-actions,
.excalidraw.excalidraw--view-mode .help-icon {
  display: none !important;
}
```

### Step 2: Update DrawContent Props

In `src/components/windows/DrawContent.tsx`:

1. Add to interface:
```typescript
export interface DrawContentProps {
  // ... existing props
  /** Whether window background should be transparent (only applies in non-interactive mode) */
  backgroundTransparent?: boolean;
}
```

2. Update component to use prop:
```typescript
export function DrawContent({
  isInteractive,
  initialElements,
  initialAppState,
  onContentChange,
  backgroundTransparent,
}: DrawContentProps) {
  // Compute effective background color
  const effectiveViewBackgroundColor = (backgroundTransparent && !isInteractive)
    ? "transparent"
    : (initialAppState?.viewBackgroundColor ?? "#1e1e1e");

  // Use in Excalidraw
  <Excalidraw
    initialData={{
      elements: initialElements,
      appState: {
        ...initialAppState,
        viewBackgroundColor: effectiveViewBackgroundColor,
      },
    }}
    // ... rest of props
  />
}
```

### Step 3: Pass Prop from Window

In `src/components/windows/Window.tsx`, modify the content rendering (around line 283):

```typescript
<Component
  {...(componentProps ?? {})}
  isInteractive={isInteractive}
  backgroundTransparent={backgroundTransparent}
/>
```

### Step 4: Add Tests

Add test cases to verify:
1. UI controls are hidden when `isInteractive={false}`
2. Background becomes transparent when `backgroundTransparent={true}` and `isInteractive={false}`
3. Background remains solid when `isInteractive={true}` regardless of `backgroundTransparent`

## Verification

1. **UI Controls Hidden**:
   - Open Draw window in interactive mode → controls visible
   - Press F3 to toggle to passive mode → controls hidden
   - Press F3 again → controls visible again

2. **Transparent Background**:
   - In interactive mode, toggle background transparency in window header
   - Switch to passive mode (F3)
   - Drawing canvas should show content behind (game/app)
   - Toggle back to solid → canvas background returns to dark color

## Dependencies

- No new dependencies required
- Uses existing Excalidraw 0.18.0 CSS classes
- Uses existing window system `backgroundTransparent` prop
