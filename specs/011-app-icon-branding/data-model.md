# Data Model: App Icon Branding

**Feature**: 011-app-icon-branding
**Date**: 2025-12-20

## Overview

This feature is UI-only and introduces no new data entities or persistence requirements. The data model documents the component interface and its relationship to existing overlay state.

## Component Interface

### AppIcon Component

```typescript
interface AppIconProps {
  /**
   * Controls whether the icon is rendered
   * @default true
   */
  visible?: boolean;

  /**
   * Current overlay mode - determines opacity and click-through behavior
   * - 'windowed': 100% opacity, captures clicks
   * - 'fullscreen': 40% opacity, click-through
   * @default 'windowed'
   */
  mode?: OverlayMode;
}
```

### Dependencies on Existing Types

```typescript
// From @/types/overlay
type OverlayMode = 'windowed' | 'fullscreen';
```

## State Flow

```
┌─────────────────────────────────────────────────────────────┐
│                      app/page.tsx                           │
│                                                             │
│  state: {                                                   │
│    visible: boolean,                                        │
│    mode: OverlayMode,                                       │
│    ...                                                      │
│  }                                                          │
│           │                                                 │
│           │ props                                           │
│           ▼                                                 │
│  ┌─────────────────┐                                        │
│  │    AppIcon      │                                        │
│  │                 │                                        │
│  │  visible ──────►│ AnimatePresence renders/unmounts       │
│  │  mode ─────────►│ opacity: 1 (windowed) / 0.4 (fullscreen)│
│  │                 │ pointer-events: auto / none            │
│  └─────────────────┘                                        │
└─────────────────────────────────────────────────────────────┘
```

## Asset Specification

### Icon Image

| Property | Value |
|----------|-------|
| Source file | `temp/Icon.png` (move to `src/assets/icon.png`) |
| Display size | 50 × 50 pixels |
| Format | PNG with transparency |
| Position | Fixed, 50px from top edge, 50px from left edge |

## Removed Entity: HeaderPanel

The following component is being removed:

```typescript
// DELETED - src/components/HeaderPanel.tsx
interface HeaderPanelProps {
  visible?: boolean;
  mode?: OverlayMode;
  targetRect?: WindowRect | null;
  position?: "top" | "bottom";
}
```

**Reason**: Replaced by simpler AppIcon component per spec requirement.

## No API Contracts

This feature has no backend integration or API changes:
- No Tauri commands added or modified
- No IPC events added or modified
- No data persistence requirements
