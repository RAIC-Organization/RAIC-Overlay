# Quickstart: App Icon Branding

**Feature**: 011-app-icon-branding
**Date**: 2025-12-20

## Prerequisites

- Node.js 18+ installed
- Rust 1.75+ installed (for Tauri)
- Project dependencies installed (`npm install`)

## Quick Verification Steps

After implementation, verify the feature works:

### 1. Start Development Server

```bash
npm run tauri:dev
```

### 2. Verify Icon Display

1. Press **F3** to toggle overlay visibility
2. Observe:
   - Icon appears in top-left corner (50px from edges)
   - Icon is 50×50 pixels
   - Icon is fully visible (100% opacity) in interactive mode

### 3. Verify Mode Transitions

1. Press **F5** to toggle to fullscreen (non-interactive) mode
2. Observe:
   - Icon fades to 40% opacity
   - Icon remains in same position
   - Clicking through icon area passes to underlying window

3. Press **F5** again to return to windowed mode
4. Observe:
   - Icon fades back to 100% opacity
   - Transition is smooth (or instant if reduced motion enabled)

### 4. Verify Header Removal

1. In either mode, confirm:
   - No "RAIC Overlay" text header is visible
   - Only the icon provides branding

## File Changes Summary

| Action | File |
|--------|------|
| CREATE | `src/components/AppIcon.tsx` |
| CREATE | `src/assets/icon.png` |
| CREATE | `tests/react/AppIcon.test.tsx` |
| DELETE | `src/components/HeaderPanel.tsx` |
| DELETE | `tests/react/HeaderPanel.test.tsx` |
| MODIFY | `app/page.tsx` |

## Component Usage

```tsx
// In app/page.tsx
import { AppIcon } from "@/components/AppIcon";

// Replace HeaderPanel with:
<AppIcon
  visible={state.visible}
  mode={state.mode}
/>
```

## Running Tests

```bash
# Run all tests
npm test

# Run only AppIcon tests
npm test -- AppIcon
```

## Expected Test Results

```
✓ AppIcon renders when visible is true
✓ AppIcon does not render when visible is false
✓ AppIcon displays at 50x50 pixels
✓ AppIcon has 100% opacity in windowed mode
✓ AppIcon has 40% opacity in fullscreen mode
✓ AppIcon has pointer-events-none in fullscreen mode
✓ AppIcon respects reduced motion preferences
```

## Troubleshooting

### Icon not appearing

1. Check `src/assets/icon.png` exists
2. Verify import path in `AppIcon.tsx`
3. Check browser console for image loading errors

### Animation not working

1. Verify `motion/react` is imported correctly
2. Check reduced motion settings in OS (animations disabled if enabled)
3. Confirm `AnimatePresence` wraps the conditional render

### Click-through not working in fullscreen

1. Verify `pointer-events-none` class is applied when `mode === 'fullscreen'`
2. Check Tauri window configuration allows click-through
