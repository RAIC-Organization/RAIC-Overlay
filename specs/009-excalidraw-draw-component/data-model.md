# Data Model: Excalidraw Draw Component

**Feature**: 009-excalidraw-draw-component
**Date**: 2025-12-19
**Status**: Complete

## Overview

This feature is UI-focused with ephemeral state only. There is no persistent data model - all drawing state is managed internally by Excalidraw and discarded when windows close.

## Component Interfaces

### DrawContentProps

The primary interface for the Draw window content component.

```typescript
/**
 * Props for the DrawContent component.
 * Follows the same pattern as NotesContentProps.
 */
export interface DrawContentProps {
  /**
   * Whether the overlay is in interaction mode.
   * When true: Excalidraw toolbar visible, canvas editable
   * When false: View-only mode, toolbar hidden
   */
  isInteractive: boolean;
}
```

### Relationship with Existing Types

```typescript
// From src/types/windows.ts (existing)
export interface WindowOpenPayload {
  component: React.ComponentType<any>;
  title: string;
  componentProps?: Record<string, unknown>;
  initialPosition?: { x: number; y: number };
  initialSize?: { width: number; height: number };
}

// Usage pattern for Draw windows
const drawWindowPayload: WindowOpenPayload = {
  component: DrawContent,
  title: "Draw",
  componentProps: { isInteractive: true } as DrawContentProps,
};
```

## State Management

### Internal State (Excalidraw-managed)

Excalidraw manages its own internal state. Key state elements:

| State | Description | Lifecycle |
|-------|-------------|-----------|
| elements | Array of drawing elements (shapes, lines, text) | Per-instance, lost on unmount |
| appState | Canvas state (zoom, pan, selected elements) | Per-instance, lost on unmount |
| collaborators | N/A (not using collaboration features) | N/A |

### External State (Props-driven)

| Prop | Source | Updates |
|------|--------|---------|
| isInteractive | Parent component via WindowsContext | On F5 toggle |
| theme | Hardcoded THEME.DARK | Never changes |
| viewModeEnabled | Derived from `!isInteractive` | On F5 toggle |

## Entity Relationships

```
┌──────────────────┐
│    MainMenu      │
│                  │
│  [Draw Button]   │──────onClick──────┐
└──────────────────┘                   │
                                       ▼
                          ┌─────────────────────────┐
                          │    windowEvents.emit    │
                          │    'window:open'        │
                          │    { component: Draw }  │
                          └───────────┬─────────────┘
                                      │
                                      ▼
┌──────────────────────────────────────────────────────┐
│                  WindowsContainer                     │
│                                                       │
│  ┌─────────────────┐  ┌─────────────────┐            │
│  │   Draw Window   │  │   Draw Window   │   ...      │
│  │   (instance 1)  │  │   (instance 2)  │            │
│  │                 │  │                 │            │
│  │  ┌───────────┐  │  │  ┌───────────┐  │            │
│  │  │DrawContent│  │  │  │DrawContent│  │            │
│  │  │           │  │  │  │           │  │            │
│  │  │Excalidraw │  │  │  │Excalidraw │  │            │
│  │  │ Instance  │  │  │  │ Instance  │  │            │
│  │  │(isolated) │  │  │  │(isolated) │  │            │
│  │  └───────────┘  │  │  └───────────┘  │            │
│  └─────────────────┘  └─────────────────┘            │
└──────────────────────────────────────────────────────┘
```

## Data Lifecycle

### Window Open
1. User clicks "Draw" button in MainMenu
2. `windowEvents.emit('window:open', payload)` fired
3. WindowsContainer creates new Window instance
4. Window renders DrawContent with `isInteractive` prop
5. DrawContent mounts fresh Excalidraw instance with empty canvas

### Mode Toggle (F5)
1. User presses F5
2. Overlay mode changes (windowed ↔ fullscreen)
3. `isInteractive` prop updates for all DrawContent instances
4. Each Excalidraw updates `viewModeEnabled` state
5. Toolbar visibility and edit capability toggle

### Window Close
1. User clicks close button on window
2. Window component unmounts
3. DrawContent unmounts
4. Excalidraw instance destroyed
5. All drawing state lost (by design - FR-012)

## Validation Rules

| Rule | Description | Source |
|------|-------------|--------|
| Independent instances | Each window has isolated state | FR-004, FR-016 |
| No persistence | Content lost on close | FR-012 |
| Mode-aware UI | Toolbar visible only in interactive | FR-005, FR-006 |
| Dark theme only | THEME.DARK always applied | FR-017 |

## Notes

- No database schema - purely ephemeral state
- No API contracts needed - all client-side
- Excalidraw handles all drawing element types internally
- No custom serialization/deserialization needed for v1
