# Quickstart: Session Timer Widget

**Feature**: 044-session-timer-widget
**Date**: 2026-01-02

## Overview

This guide provides a quick reference for implementing the Session Timer Widget feature. The widget displays elapsed time since the target process started, using the same visual styling as the clock widget.

## Key Files to Modify/Create

### New Files

| File | Purpose |
|------|---------|
| `src/hooks/useSessionTimer.ts` | Hook managing session timer state and Tauri event subscriptions |
| `src/components/widgets/SessionTimerWidgetContent.tsx` | Widget content component (renders timer display) |

### Modified Files

| File | Changes |
|------|---------|
| `src/types/widgets.ts` | Add `'timer'` to `WidgetType` union |
| `src/contexts/WidgetsContext.tsx` | Add timer default dimensions (200x80) |
| `src/components/widgets/WidgetsContainer.tsx` | Add timer case to `renderWidgetContent` switch |
| `src/components/widgets/index.ts` | Export `SessionTimerWidgetContent` |
| `src/components/MainMenu.tsx` | Add "Session Timer" button |

## Implementation Order

1. **Type Extension** - Add 'timer' to WidgetType
2. **Context Update** - Add default dimensions for timer
3. **Hook Creation** - Create useSessionTimer hook
4. **Component Creation** - Create SessionTimerWidgetContent
5. **Container Update** - Add timer case to switch
6. **Menu Integration** - Add menu button

## Code Snippets

### 1. Type Extension (`src/types/widgets.ts`)

```typescript
// Change from:
export type WidgetType = 'clock';

// To:
export type WidgetType = 'clock' | 'timer';
```

### 2. Default Dimensions (`src/contexts/WidgetsContext.tsx`)

```typescript
function getDefaultDimensions(type: WidgetType): { width: number; height: number } {
  switch (type) {
    case 'clock':
      return { width: 200, height: 80 };
    case 'timer':
      return { width: 200, height: 80 };  // Add this case
    default:
      return { width: WIDGET_CONSTANTS.DEFAULT_WIDTH, height: WIDGET_CONSTANTS.DEFAULT_HEIGHT };
  }
}
```

### 3. Hook Structure (`src/hooks/useSessionTimer.ts`)

```typescript
import { useState, useEffect, useRef } from 'react';
import { listen } from '@tauri-apps/api/event';

interface ProcessEventPayload {
  process_name: string;
  detected: boolean;
}

interface SessionTimerState {
  isRunning: boolean;
  sessionStartTime: number | null;
  elapsedMs: number;
  lastSessionMs: number;
}

export function useSessionTimer() {
  const [state, setState] = useState<SessionTimerState>({
    isRunning: false,
    sessionStartTime: null,
    elapsedMs: 0,
    lastSessionMs: 0,
  });
  const intervalRef = useRef<number | null>(null);

  // Subscribe to process events
  useEffect(() => {
    const unlistenDetected = listen<ProcessEventPayload>('target-process-detected', () => {
      setState({
        isRunning: true,
        sessionStartTime: Date.now(),
        elapsedMs: 0,
        lastSessionMs: 0,
      });
    });

    const unlistenTerminated = listen<ProcessEventPayload>('target-process-terminated', () => {
      setState((prev) => ({
        ...prev,
        isRunning: false,
        sessionStartTime: null,
        lastSessionMs: prev.elapsedMs,
      }));
    });

    return () => {
      unlistenDetected.then((f) => f());
      unlistenTerminated.then((f) => f());
    };
  }, []);

  // Update elapsed time every second while running
  useEffect(() => {
    if (state.isRunning && state.sessionStartTime) {
      intervalRef.current = window.setInterval(() => {
        setState((prev) => ({
          ...prev,
          elapsedMs: Date.now() - (prev.sessionStartTime ?? Date.now()),
        }));
      }, 1000);
    } else if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [state.isRunning, state.sessionStartTime]);

  // Display value
  const displayMs = state.isRunning ? state.elapsedMs : state.lastSessionMs;

  return { ...state, displayMs };
}
```

### 4. Time Formatting Utility

```typescript
export function formatElapsedTime(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
}
```

### 5. Component Structure (`src/components/widgets/SessionTimerWidgetContent.tsx`)

```typescript
import { useRef, useState, useEffect } from 'react';
import { useSessionTimer, formatElapsedTime } from '@/hooks/useSessionTimer';

interface SessionTimerWidgetContentProps {
  isInteractive?: boolean;
}

export function SessionTimerWidgetContent({ isInteractive = false }: SessionTimerWidgetContentProps) {
  const { displayMs } = useSessionTimer();
  const containerRef = useRef<HTMLDivElement>(null);
  const [fontSize, setFontSize] = useState(48);

  // Responsive font sizing (same pattern as ClockWidgetContent)
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width, height } = entry.contentRect;
        const newSize = Math.max(12, Math.min(width * 0.15, height * 0.7));
        setFontSize(newSize);
      }
    });

    resizeObserver.observe(container);
    return () => resizeObserver.disconnect();
  }, []);

  return (
    <div
      ref={containerRef}
      className="w-full h-full flex items-center justify-center"
    >
      <span
        className="font-orbitron liquid-glass-text whitespace-nowrap"
        style={{ fontSize: `${fontSize}px` }}
      >
        {formatElapsedTime(displayMs)}
      </span>
    </div>
  );
}
```

### 6. Container Switch Case (`src/components/widgets/WidgetsContainer.tsx`)

```typescript
function renderWidgetContent(widget: WidgetInstance, isInteractive: boolean) {
  switch (widget.type as WidgetType) {
    case 'clock':
      return <ClockWidgetContent isInteractive={isInteractive} />;
    case 'timer':
      return <SessionTimerWidgetContent isInteractive={isInteractive} />;  // Add this
    default:
      return null;
  }
}
```

### 7. Menu Button (`src/components/MainMenu.tsx`)

```typescript
// Add alongside existing clock widget button
<Button
  onClick={() => {
    widgetEvents.emit('widget:open', { type: 'timer' });
    onClose?.();
  }}
>
  Session Timer
</Button>
```

## Testing Checklist

- [ ] Timer shows 00:00:00 on first load (no process running)
- [ ] Timer starts counting when target process detected
- [ ] Timer resets to 00:00:00 on new session (process restart)
- [ ] Timer freezes and shows last time when process terminates
- [ ] Timer continues counting while overlay is hidden (F3)
- [ ] Timer displays correctly beyond 24 hours (e.g., 25:30:15)
- [ ] Widget can be added from main menu
- [ ] Widget can be moved, resized, and opacity adjusted
- [ ] Widget position/size persists across app restart
- [ ] Multiple timer widgets show same time

## Backend Events Reference

Events are already emitted by `src-tauri/src/process_monitor.rs`:

| Event | Payload | When Emitted |
|-------|---------|--------------|
| `target-process-detected` | `{ process_name, detected: true }` | Target process starts |
| `target-process-terminated` | `{ process_name, detected: false }` | Target process stops |

No backend changes required.
