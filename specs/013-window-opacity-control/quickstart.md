# Quickstart: Per-Window Opacity Control

**Feature**: 013-window-opacity-control
**Date**: 2025-12-20

## Prerequisites

- Feature 007 (Windows System) implemented
- Feature 010 (State Persistence System) implemented
- Node.js and pnpm installed
- Rust toolchain installed

## Quick Setup

### 1. Install shadcn/ui Slider Component

```bash
cd C:\Users\leona\Development\RAICOverlay
npx shadcn@latest add slider
```

This installs:
- `@radix-ui/react-slider` dependency
- `src/components/ui/slider.tsx` component

### 2. Update Type Definitions

**src/types/windows.ts** - Add opacity constants and property:

```typescript
export const WINDOW_CONSTANTS = {
  // ... existing
  MIN_OPACITY: 0.1,
  MAX_OPACITY: 1.0,
  DEFAULT_OPACITY: 0.6,
} as const;

export interface WindowInstance {
  // ... existing
  opacity: number;
}

export interface WindowOpenPayload {
  // ... existing
  initialOpacity?: number;
}
```

**src/types/persistence.ts** - Add opacity to WindowStructure:

```typescript
export interface WindowStructure {
  // ... existing
  opacity: number;
}
```

### 3. Update Rust Types

**src-tauri/src/persistence_types.rs**:

```rust
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct WindowStructure {
    // ... existing
    #[serde(default = "default_opacity")]
    pub opacity: f32,
}

fn default_opacity() -> f32 {
    0.6
}
```

### 4. Create OpacitySlider Component

**src/components/windows/OpacitySlider.tsx**:

```tsx
"use client";

import { Slider } from "@/components/ui/slider";

interface OpacitySliderProps {
  value: number;
  onChange: (value: number) => void;
  onCommit: () => void;
}

export function OpacitySlider({ value, onChange, onCommit }: OpacitySliderProps) {
  return (
    <div className="flex items-center gap-2">
      <Slider
        value={[value * 100]}
        onValueChange={(v) => onChange(v[0] / 100)}
        onValueCommit={onCommit}
        min={10}
        max={100}
        step={1}
        className="w-20"
      />
      <span className="text-xs tabular-nums w-8">{Math.round(value * 100)}%</span>
    </div>
  );
}
```

### 5. Update WindowHeader

**src/components/windows/WindowHeader.tsx** - Add opacity slider:

```tsx
import { OpacitySlider } from './OpacitySlider';

// In component props, add:
opacity: number;
onOpacityChange: (opacity: number) => void;
onOpacityCommit: () => void;

// In JSX, between title and close button:
<OpacitySlider
  value={opacity}
  onChange={onOpacityChange}
  onCommit={onOpacityCommit}
/>
```

### 6. Update WindowsContext

**src/contexts/WindowsContext.tsx** - Add opacity action and method:

```typescript
// Add action type
| { type: 'SET_WINDOW_OPACITY'; windowId: string; opacity: number }

// Add reducer case
case 'SET_WINDOW_OPACITY': {
  const clampedOpacity = Math.max(0.1, Math.min(1.0, action.opacity));
  return {
    ...state,
    windows: state.windows.map((w) =>
      w.id === action.windowId ? { ...w, opacity: clampedOpacity } : w
    ),
  };
}

// Add context method
const setWindowOpacity = useCallback((windowId: string, opacity: number) => {
  dispatch({ type: 'SET_WINDOW_OPACITY', windowId, opacity });
}, []);
```

### 7. Update Window Component

**src/components/windows/Window.tsx** - Apply opacity:

```tsx
// Pass opacity to WindowHeader
<WindowHeader
  windowId={id}
  title={title}
  x={x}
  y={y}
  isInteractive={isInteractive}
  opacity={windowInstance.opacity}
  onOpacityChange={(opacity) => setWindowOpacity(id, opacity)}
  onOpacityCommit={() => persistence?.onWindowMoved()}
/>

// Apply opacity to window container (in non-interactive mode)
<motion.div
  animate={{
    opacity: windowInstance.opacity,  // Use configured opacity always
    scale: 1
  }}
>
```

### 8. Update Serialization

**src/lib/serialization.ts** - Handle opacity in serialization:

```typescript
// When serializing window to persistence format
const windowStructure: WindowStructure = {
  // ... existing
  opacity: window.opacity ?? WINDOW_CONSTANTS.DEFAULT_OPACITY,
};

// When deserializing from persistence
const opacity = Math.max(0.1, Math.min(1.0, structure.opacity ?? 0.6));
```

## Verification Steps

1. **Build Check**:
   ```bash
   pnpm build
   ```

2. **Run Application**:
   ```bash
   pnpm tauri dev
   ```

3. **Test Opacity Control**:
   - Press F5 to enter interactive mode
   - Open a window (Notes or Draw)
   - Locate the opacity slider in the window header
   - Drag slider to adjust opacity
   - Verify percentage label updates
   - Verify window opacity changes in real-time

4. **Test Persistence**:
   - Adjust window opacity to a custom value (e.g., 40%)
   - Close the application
   - Reopen the application
   - Verify window restores with the configured opacity

5. **Test Mode Consistency**:
   - Set window opacity to 80%
   - Press F5 to toggle interaction mode
   - Verify opacity remains at 80% in non-interactive mode

## Troubleshooting

**Slider not appearing**: Ensure shadcn/ui slider component is installed and imported correctly.

**Opacity not persisting**: Check that `opacity` field is included in serialization and Rust types have `#[serde(default)]`.

**Type errors**: Ensure all interfaces are updated with the opacity property.
