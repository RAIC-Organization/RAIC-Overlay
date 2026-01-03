# Quickstart: Disable Text Selection

**Feature**: 057-disable-text-select
**Implementation Time**: ~5 minutes

## Overview

This feature disables text selection on UI chrome elements to provide a native Windows desktop experience. Only `app/globals.css` needs modification.

## Implementation Steps

### Step 1: Add Global Text Selection Prevention

**File**: `app/globals.css`

Add to the existing `body` rule block (around line 123-127):

```css
body {
  color: hsl(var(--foreground));
  font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
  color-scheme: dark;
  user-select: none; /* Add this line */
}
```

### Step 2: Add Content Area Opt-in

**File**: `app/globals.css`

Add a new rule block after the body rules (around line 127):

```css
/* Content areas where text selection should be allowed */
.tiptap,
input,
textarea,
[contenteditable="true"] {
  user-select: text;
}
```

## Verification

1. Run the development server: `npm run tauri:dev`
2. Test each scenario:

| Element | Expected Behavior |
|---------|-------------------|
| Window header text | No selection possible |
| Button labels | No selection possible |
| Menu items | No selection possible |
| Settings labels | No selection possible |
| Notes editor | Selection works normally |
| Browser URL input | Selection works normally |
| Settings inputs | Selection works normally |

## Rollback

If issues occur, remove the two CSS additions:
1. Remove `user-select: none;` from `body` rule
2. Remove the content area opt-in rule block

## Notes

- No JavaScript changes required
- No component changes required
- Excalidraw uses canvas-based rendering, unaffected by CSS user-select
- All standard input elements automatically support text selection via the opt-in rule
