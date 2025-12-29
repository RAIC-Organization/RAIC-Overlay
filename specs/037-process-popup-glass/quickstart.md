# Quickstart: Process Not Found Popup Liquid Glass Style

**Feature**: 037-process-popup-glass
**Date**: 2025-12-29

## Overview

Refactor ErrorModal to match the windows overlay system aesthetic with liquid glass effect, SC theme border, window header structure, and Orbitron typography.

## Prerequisites

- Existing ErrorModal component at `src/components/ErrorModal.tsx`
- SC theme utilities in `src/styles/sc-theme.css`
- Liquid glass styles in `app/globals.css`
- Orbitron font configured in `app/layout.tsx`

## Quick Implementation

### Step 1: Update ErrorModal Structure

Replace the current ErrorModal content with window-style structure:

**Current Structure** (to replace):
```tsx
<Card className="error-modal p-6 max-w-md mx-4 shadow-2xl">
  <div className="flex flex-col items-center gap-4">
    {/* Icon, title, message, button, countdown */}
  </div>
</Card>
```

**New Structure**:
```tsx
<div className="relative max-w-md w-full mx-4 border border-border rounded-lg overflow-hidden sc-glow-transition sc-corner-accents shadow-glow-sm bg-background/80 backdrop-blur-xl">
  {/* Header */}
  <div className="flex items-center justify-between px-3 py-2 border-b border-border bg-muted/50">
    <h2 id="error-modal-title" className="font-display text-sm font-medium uppercase tracking-wide truncate">
      {targetName} Not Found
    </h2>
    <button
      onClick={onDismiss}
      className="p-1 rounded sc-glow-transition hover:bg-muted/50 hover:shadow-glow-sm cursor-pointer"
      aria-label="Close"
    >
      <X className="h-4 w-4" />
    </button>
  </div>

  {/* Content */}
  <div className="p-6 flex flex-col items-center gap-4">
    {/* Warning icon with blue glow */}
    <div className="w-12 h-12 rounded-full bg-blue-500/10 flex items-center justify-center">
      <svg
        xmlns="http://www.w3.org/2000/svg"
        className="h-6 w-6"
        style={{
          color: 'rgba(59, 130, 246, 0.9)',
          filter: 'drop-shadow(0 0 8px rgba(59, 130, 246, 0.6))'
        }}
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
        />
      </svg>
    </div>

    {/* Message */}
    <p id="error-modal-description" className="font-display text-sm text-muted-foreground text-center">
      {message}
    </p>

    {/* Countdown */}
    <p className="font-display text-xs text-muted-foreground">
      Auto-dismissing in {Math.ceil(remainingTime / 1000)}s
    </p>
  </div>
</div>
```

### Step 2: Add X Icon Import

```tsx
import { X } from 'lucide-react';
```

### Step 3: Remove Card Import

```tsx
// Remove this line:
// import { Card } from "@/components/ui/card";
```

### Step 4: Update JSDoc Header

```tsx
/**
 * ErrorModal Component
 *
 * Displays error messages when target process is not found.
 * Styled with liquid glass effect and SC theme to match overlay windows.
 * Features window header with title and X close button.
 * Auto-dismisses after configurable timeout with countdown display.
 *
 * @feature 037-process-popup-glass
 */
```

## Testing Checklist

### Visual Tests

1. [ ] Window header displays with title on left, X button on right
2. [ ] Border has corner accents (top-left, bottom-right)
3. [ ] Blue glow shadow visible around container
4. [ ] Glass effect visible (backdrop blur, semi-transparent)
5. [ ] Warning icon has blue color with glow effect
6. [ ] All text uses Orbitron font (uppercase in header)
7. [ ] X button shows glow effect on hover

### Functional Tests

1. [ ] Clicking X dismisses the modal
2. [ ] Auto-dismiss works after 5 seconds
3. [ ] Countdown displays correctly
4. [ ] Entry/exit animations work smoothly
5. [ ] Edge/corner dragging does NOT resize (no resize cursor)

### Accessibility Tests

1. [ ] Screen reader announces modal content
2. [ ] Keyboard focus moves to modal when shown
3. [ ] Tab navigation works within modal
4. [ ] ARIA attributes present and correct

## Trigger Test

To test the ErrorModal, run the app and press F3 when Star Citizen is not running:

```bash
npm run tauri dev
# Press F3 - error modal should appear
```

## Files Modified

| File | Change |
|------|--------|
| `src/components/ErrorModal.tsx` | Restructure with window header, apply SC theme + liquid glass |

## Reference Screenshots

Compare the styled ErrorModal against:
- Any overlay window (Notes, Browser, etc.) in interactive mode
- Clock widget for liquid glass effect reference
