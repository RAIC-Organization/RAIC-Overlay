# Quickstart: Decoupled Windows System

**Feature**: 007-windows-system
**Date**: 2025-12-18

## Overview

This guide explains how to use the Windows System to open, manage, and interact with draggable windows in the overlay.

## Prerequisites

- Overlay running in development mode (`npm run tauri dev`)
- Interaction mode enabled (press F5)

## Basic Usage

### Opening a Window from MainMenu

1. Press **F5** to enter interaction mode (overlay becomes interactive)
2. Click the **"Test Windows"** button in the main menu
3. A centered window appears with the test component

### Window Interactions (Interaction Mode Only)

| Action | How To |
|--------|--------|
| Move window | Drag the header bar |
| Resize window | Drag edges or corners (cursor changes) |
| Bring to front | Click anywhere on the window |
| Close window | Click the X button in header |

### Mode Behavior

| Mode | Window Appearance |
|------|------------------|
| Interaction (F5 active) | Header visible, 1px gray border, fully opaque |
| Passive (F5 inactive) | Header hidden, no border, 60% transparent |

## Opening Windows Programmatically

### Using the Event System

```typescript
import { windowEvents } from '@/lib/windowEvents';
import { MyComponent } from '@/components/MyComponent';

// Open a window with a component
windowEvents.emit('window:open', {
  component: MyComponent,
  title: 'My Window Title',
  componentProps: { foo: 'bar' }, // optional
});
```

### Using the Context Hook

```typescript
import { useWindows } from '@/contexts/WindowsContext';
import { MyComponent } from '@/components/MyComponent';

function MyButton() {
  const { openWindow } = useWindows();

  const handleClick = () => {
    openWindow({
      component: MyComponent,
      title: 'My Window',
    });
  };

  return <button onClick={handleClick}>Open Window</button>;
}
```

## API Reference

### WindowOpenPayload

```typescript
interface WindowOpenPayload {
  component: ComponentType<unknown>;  // Required: React component
  title: string;                       // Required: Window title
  componentProps?: Record<string, unknown>; // Optional: Props for component
  initialWidth?: number;               // Optional: Width (default: 400)
  initialHeight?: number;              // Optional: Height (default: 300)
}
```

### Window Events

| Event | Payload | Description |
|-------|---------|-------------|
| `window:open` | WindowOpenPayload | Open a new window |
| `window:close` | `{ windowId: string }` | Close a specific window |
| `window:focus` | `{ windowId: string }` | Bring window to front |

### Context Methods

| Method | Signature | Description |
|--------|-----------|-------------|
| `openWindow` | `(payload) => string` | Opens window, returns ID |
| `closeWindow` | `(id) => void` | Closes window by ID |
| `focusWindow` | `(id) => void` | Brings window to front |
| `moveWindow` | `(id, x, y) => void` | Updates position |
| `resizeWindow` | `(id, w, h) => void` | Updates size |

## Constraints

- **Minimum size**: 150x100 pixels
- **Default size**: 400x300 pixels
- **Visibility**: Windows constrained to keep 50px visible in container
- **Max windows**: 10+ supported without performance degradation

## Troubleshooting

### Window doesn't appear

1. Ensure you're in interaction mode (F5)
2. Check browser console for errors
3. Verify component is a valid React component

### Can't move/resize window

1. Must be in interaction mode (F5)
2. Drag from header for move, edges/corners for resize

### Window appears off-screen

Windows are automatically centered. If repositioned off-screen, they're constrained to remain partially visible.
