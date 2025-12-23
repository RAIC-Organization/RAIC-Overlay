# Quickstart: Widget Container System

**Feature**: 027-widget-container
**Date**: 2025-12-23

## Overview

This guide covers the implementation of a widget container system parallel to the existing window system. Widgets are transparent, borderless containers with flip-to-settings animation. The first widget is a clock displaying 24-hour time.

## Prerequisites

- Existing codebase with window system (feature 007)
- motion/react 12.x installed
- Tailwind CSS 4.x configured
- Tauri 2.x backend

## Quick Implementation Steps

### 1. Add Widget Types (TypeScript)

Create `src/types/widgets.ts`:

```typescript
import type { ComponentType } from 'react';

export type WidgetType = 'clock';

export interface WidgetInstance {
  id: string;
  type: WidgetType;
  x: number;
  y: number;
  width: number;
  height: number;
  opacity: number;
  isFlipped: boolean;
  createdAt: number;
}

export interface WidgetOpenPayload {
  type: WidgetType;
  initialX?: number;
  initialY?: number;
  initialWidth?: number;
  initialHeight?: number;
  initialOpacity?: number;
  widgetId?: string;
}

export const WIDGET_CONSTANTS = {
  MIN_WIDTH: 80,
  MIN_HEIGHT: 60,
  DEFAULT_WIDTH: 200,
  DEFAULT_HEIGHT: 80,
  MIN_OPACITY: 0.1,
  MAX_OPACITY: 1.0,
  DEFAULT_OPACITY: 0.6,
  HOLD_THRESHOLD_MS: 175,
  FLIP_DURATION_MS: 500,
} as const;
```

### 2. Add Widget Persistence Types

Extend `src/types/persistence.ts`:

```typescript
// Add to PersistedState interface
export interface PersistedState {
  // ... existing fields
  widgets: WidgetStructure[];
}

export interface WidgetStructure {
  id: string;
  type: WidgetType;
  position: Position;
  size: Size;
  opacity: number;
}

export type WidgetType = 'clock';
```

### 3. Create Widget Event Emitter

Create `src/lib/widgetEvents.ts`:

```typescript
type WidgetEventHandler<T> = (payload: T) => void;

interface WidgetEventMap {
  'widget:open': WidgetOpenPayload;
  'widget:close': { widgetId: string };
}

class WidgetEventEmitter {
  private handlers = new Map<keyof WidgetEventMap, Set<WidgetEventHandler<unknown>>>();

  emit<K extends keyof WidgetEventMap>(event: K, payload: WidgetEventMap[K]) {
    this.handlers.get(event)?.forEach(handler => handler(payload));
  }

  on<K extends keyof WidgetEventMap>(event: K, handler: WidgetEventHandler<WidgetEventMap[K]>) {
    if (!this.handlers.has(event)) {
      this.handlers.set(event, new Set());
    }
    this.handlers.get(event)!.add(handler as WidgetEventHandler<unknown>);
    return () => this.handlers.get(event)?.delete(handler as WidgetEventHandler<unknown>);
  }
}

export const widgetEvents = new WidgetEventEmitter();
```

### 4. Create Widget Component with Flip Animation

Create `src/components/widgets/Widget.tsx`:

```tsx
import { motion } from 'motion/react';
import { useState, useRef, useCallback } from 'react';
import { WIDGET_CONSTANTS } from '@/types/widgets';

interface WidgetProps {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  opacity: number;
  isInteractive: boolean;
  children: React.ReactNode;
  onMove: (id: string, x: number, y: number) => void;
  onResize: (id: string, width: number, height: number) => void;
  onOpacityChange: (id: string, opacity: number) => void;
}

export function Widget({
  id, x, y, width, height, opacity,
  isInteractive, children,
  onMove, onResize, onOpacityChange
}: WidgetProps) {
  const [isFlipped, setIsFlipped] = useState(false);
  const holdTimerRef = useRef<number | null>(null);
  const isDraggingRef = useRef(false);

  const handlePointerDown = useCallback(() => {
    isDraggingRef.current = false;
    holdTimerRef.current = window.setTimeout(() => {
      isDraggingRef.current = true;
      // Enable drag mode
    }, WIDGET_CONSTANTS.HOLD_THRESHOLD_MS);
  }, []);

  const handlePointerUp = useCallback(() => {
    if (holdTimerRef.current) {
      clearTimeout(holdTimerRef.current);
    }
    if (!isDraggingRef.current && isInteractive) {
      setIsFlipped(prev => !prev);
    }
  }, [isInteractive]);

  return (
    <div
      style={{
        position: 'absolute',
        left: x,
        top: y,
        width,
        height,
        perspective: '1000px',
        opacity,
      }}
      onPointerDown={isInteractive ? handlePointerDown : undefined}
      onPointerUp={isInteractive ? handlePointerUp : undefined}
    >
      <motion.div
        animate={{ rotateY: isFlipped ? 180 : 0 }}
        transition={{ duration: 0.5, ease: 'easeInOut' }}
        style={{
          width: '100%',
          height: '100%',
          transformStyle: 'preserve-3d',
        }}
      >
        {/* Front - Content */}
        <div style={{
          position: 'absolute',
          width: '100%',
          height: '100%',
          backfaceVisibility: 'hidden',
        }}>
          {children}
        </div>

        {/* Back - Settings */}
        <div style={{
          position: 'absolute',
          width: '100%',
          height: '100%',
          backfaceVisibility: 'hidden',
          transform: 'rotateY(180deg)',
        }}>
          <WidgetSettings
            opacity={opacity}
            onOpacityChange={(val) => onOpacityChange(id, val)}
            onClose={() => setIsFlipped(false)}
          />
        </div>
      </motion.div>

      {/* Corner accents for resize (interactive mode only) */}
      {isInteractive && (
        <>
          <div className="absolute top-0 left-0 w-3 h-3 border-l-2 border-t-2 border-primary cursor-nw-resize" />
          <div className="absolute top-0 right-0 w-3 h-3 border-r-2 border-t-2 border-primary cursor-ne-resize" />
          <div className="absolute bottom-0 left-0 w-3 h-3 border-l-2 border-b-2 border-primary cursor-sw-resize" />
          <div className="absolute bottom-0 right-0 w-3 h-3 border-r-2 border-b-2 border-primary cursor-se-resize" />
        </>
      )}
    </div>
  );
}
```

### 5. Create Clock Widget Content

Create `src/components/widgets/ClockWidgetContent.tsx`:

```tsx
import { useState, useEffect, useRef, useCallback } from 'react';

export function ClockWidgetContent() {
  const [time, setTime] = useState(new Date());
  const [fontSize, setFontSize] = useState(48);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const updateFontSize = useCallback(() => {
    if (!containerRef.current) return;
    const { width, height } = containerRef.current.getBoundingClientRect();
    const newFontSize = Math.max(12, Math.min(width / 5, height / 1.5));
    setFontSize(newFontSize);
  }, []);

  useEffect(() => {
    const observer = new ResizeObserver(updateFontSize);
    if (containerRef.current) observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, [updateFontSize]);

  const formattedTime = time.toLocaleTimeString('en-US', {
    hour12: false,
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });

  return (
    <div
      ref={containerRef}
      className="w-full h-full flex items-center justify-center font-orbitron"
      style={{ fontSize }}
    >
      <span className="text-white" style={{
        textShadow: '0 0 2px #3b82f6, 0 0 4px #3b82f6',
        WebkitTextStroke: '1px #3b82f6',
      }}>
        {formattedTime}
      </span>
    </div>
  );
}
```

### 6. Update MainMenu

In `src/components/MainMenu.tsx`, replace clock window button:

```tsx
// REMOVE this:
// <MenuButton onClick={() => windowEvents.emit('window:open', { ... clock ... })}>
//   Clock
// </MenuButton>

// ADD this:
<MenuButton onClick={() => widgetEvents.emit('widget:open', { type: 'clock' })}>
  Clock Widget
</MenuButton>
```

### 7. Update Rust Persistence Types

In `src-tauri/src/persistence_types.rs`:

```rust
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct PersistedState {
    pub version: u32,
    pub last_modified: String,
    pub global: GlobalSettings,
    pub windows: Vec<WindowStructure>,
    #[serde(default)]
    pub widgets: Vec<WidgetStructure>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct WidgetStructure {
    pub id: String,
    pub widget_type: WidgetType,
    pub position: Position,
    pub size: Size,
    pub opacity: f32,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "lowercase")]
pub enum WidgetType {
    Clock,
}
```

## Key Patterns

### Flip Animation
- Use `perspective: 1000px` on container
- Use `transform-style: preserve-3d` on animated element
- Use `backface-visibility: hidden` on both faces
- Animate `rotateY` from 0 to 180 degrees

### Click vs Drag Detection
- 175ms hold threshold
- Release before threshold = flip to settings
- Hold beyond threshold = enable drag

### Persistence
- Widgets stored in `state.json` alongside windows
- Use `#[serde(default)]` for backward compatibility
- Skip `isFlipped` and `createdAt` in persisted data

## Testing Checklist

- [ ] Clock widget displays correct 24-hour time
- [ ] Time updates every second
- [ ] Widget has no header/border (transparent)
- [ ] Corner accents visible only in interaction mode (F5)
- [ ] Click flips to settings panel
- [ ] Hold + drag moves widget
- [ ] Corner drag resizes widget
- [ ] Content scales on resize
- [ ] Opacity slider works in real-time
- [ ] Widget state persists across app restarts
- [ ] Old clock window button removed from menu
