# Quickstart: Excalidraw Draw Component

**Feature**: 009-excalidraw-draw-component
**Date**: 2025-12-19

## Prerequisites

- Node.js 18+
- Existing RAICOverlay project with 008-tiptap-notes-component implemented
- Windows system (007) and MainMenu (006) functional

## Quick Setup

### 1. Install Excalidraw

```bash
npm install @excalidraw/excalidraw --force
```

Note: `--force` is required due to React 19 peer dependency warnings.

### 2. Create DrawContent Component

Create `src/components/windows/DrawContent.tsx`:

```tsx
"use client";

import { Excalidraw, THEME } from "@excalidraw/excalidraw";
import "@excalidraw/excalidraw/index.css";

export interface DrawContentProps {
  isInteractive: boolean;
}

export function DrawContent({ isInteractive }: DrawContentProps) {
  return (
    <div className="h-full w-full">
      <Excalidraw
        theme={THEME.DARK}
        viewModeEnabled={!isInteractive}
        UIOptions={{
          canvasActions: {
            toggleTheme: false,
            loadScene: false,
            saveToActiveFile: false,
            saveAsImage: false,
            export: false,
          },
        }}
      />
    </div>
  );
}
```

### 3. Add Draw Button to MainMenu

Update `src/components/MainMenu.tsx`:

```tsx
// Add import
import { DrawContent } from "@/components/windows/DrawContent";

// Add handler (after handleOpenNotes)
const handleOpenDraw = () => {
  windowEvents.emit("window:open", {
    component: DrawContent,
    title: "Draw",
    componentProps: { isInteractive: mode === "windowed" },
  });
};

// Add button in ButtonGroup (between Notes and Test Windows)
<Button variant="secondary" onClick={handleOpenDraw}>
  Draw
</Button>
```

### 4. Verify

```bash
npm run dev
```

1. Press F5 to enter interaction mode
2. Click "Draw" button in menu
3. Draw window should open with Excalidraw canvas
4. Draw shapes, lines, text
5. Press F5 to toggle mode - toolbar should hide
6. Close window - drawing should be lost

## Key Files

| File | Purpose |
|------|---------|
| `src/components/windows/DrawContent.tsx` | New - Excalidraw wrapper component |
| `src/components/MainMenu.tsx` | Modify - Add Draw button |

## Common Issues

### 1. SSR Error: "window is not defined"

Excalidraw requires client-side rendering. Ensure:
- `"use client"` directive at top of DrawContent.tsx
- Component is dynamically imported if used elsewhere

### 2. Canvas Not Visible

Ensure container has explicit dimensions:
- Parent must have non-zero height
- Use `h-full w-full` on container div

### 3. Peer Dependency Warnings

Expected with React 19. Use `--force` or `--legacy-peer-deps`:
```bash
npm install @excalidraw/excalidraw --force
```

### 4. Theme Not Dark

Ensure both are set:
- `theme={THEME.DARK}` prop
- `toggleTheme: false` in UIOptions to prevent user override

## Testing Checklist

- [ ] Draw button appears after Notes in menu
- [ ] Clicking Draw opens new window
- [ ] Multiple Draw windows can be opened
- [ ] Each window has independent canvas
- [ ] All drawing tools work (shapes, lines, text, freehand)
- [ ] Toolbar hidden in non-interaction mode (F5)
- [ ] Canvas view-only in non-interaction mode
- [ ] Closing window loses all drawings
- [ ] Dark theme applied to canvas
