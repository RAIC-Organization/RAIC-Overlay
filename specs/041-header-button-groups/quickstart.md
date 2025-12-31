# Quickstart: Header Button Group Separation

**Feature**: 041-header-button-groups
**Date**: 2025-12-31

## Overview

This feature removes the Test Windows button and reorganizes the MainMenu button layout into two visually separated groups: Apps and Widgets.

## Files Changed

| File | Action | Description |
|------|--------|-------------|
| `src/components/windows/TestWindowContent.tsx` | DELETE | Remove unused test component |
| `src/components/MainMenu.tsx` | MODIFY | Reorganize buttons into Apps/Widgets groups |
| `src/types/windows.ts` | MODIFY | Remove 'test' from WindowContentType |

## Implementation Steps

### Step 1: Delete TestWindowContent.tsx

```bash
rm src/components/windows/TestWindowContent.tsx
```

### Step 2: Update WindowContentType

In `src/types/windows.ts`, change line 150 from:
```typescript
export type WindowContentType = 'notes' | 'draw' | 'browser' | 'fileviewer' | 'test';
```
to:
```typescript
export type WindowContentType = 'notes' | 'draw' | 'browser' | 'fileviewer';
```

### Step 3: Update MainMenu.tsx

1. Remove the TestWindowContent import (line 20)
2. Remove the handleTestWindows function (lines 100-106)
3. Replace the single ButtonGroup with two groups separated by a divider

## Verification

1. Run the application:
   ```bash
   npm run tauri dev
   ```

2. Press F3 to toggle the overlay

3. Verify the following:
   - [ ] No "Test Windows" button visible
   - [ ] Apps group contains: Notes, Draw, Browser, File Viewer
   - [ ] Vertical divider visible between groups
   - [ ] Widgets group contains: Clock
   - [ ] Settings section (Scanlines toggle) remains on far right
   - [ ] All buttons still function correctly

## Visual Layout (Expected)

```
┌─────────────────────────────────────────────────────────────────┐
│  [Notes][Draw][Browser][File Viewer] │ [Clock] │ [⌘ Scanlines] │
│  └──────── Apps ─────────────────────┘  Widgets   Settings      │
└─────────────────────────────────────────────────────────────────┘
```

## Rollback

If issues occur, revert with:
```bash
git checkout HEAD -- src/components/MainMenu.tsx src/types/windows.ts
git checkout HEAD -- src/components/windows/TestWindowContent.tsx
```
