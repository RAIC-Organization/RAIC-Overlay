# Quickstart: System Clock Window

**Feature**: 023-system-clock-window
**Date**: 2025-12-22

## Overview

This feature adds a new "Clock" window type to the overlay system that displays the current system time in 24-hour format (HH:MM:SS). The clock window features:

- White text with blue border for contrast
- Fully transparent background
- Auto-scaling text that fits the window size
- Click-through on transparent areas
- Draggable and resizable like other overlay windows
- Persistent position/size across sessions

## Prerequisites

- Existing RAICOverlay development environment
- Node.js, pnpm, Rust/Cargo installed
- Familiarity with existing window components (NotesContent, DrawContent)

## Implementation Steps

### Step 1: Add Clock Window Type (Types)

**File**: `src/types/windows.ts`

Add 'clock' to the WindowContentType union:

```typescript
export type WindowContentType =
  | 'notes'
  | 'draw'
  | 'browser'
  | 'fileviewer'
  | 'clock'  // Add this
  | 'test';
```

**File**: `src/types/persistence.ts`

Add 'clock' to the WindowType:

```typescript
export type WindowType = 'notes' | 'draw' | 'browser' | 'fileviewer' | 'clock';
```

### Step 2: Add Rust Persistence Type

**File**: `src-tauri/src/persistence_types.rs`

Add Clock variant to WindowType enum:

```rust
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "lowercase")]
pub enum WindowType {
    Notes,
    Draw,
    Browser,
    Fileviewer,
    Clock,  // Add this
}
```

### Step 3: Create ClockContent Component

**File**: `src/components/windows/ClockContent.tsx` (NEW)

```typescript
'use client';

import { useState, useEffect, useRef } from 'react';

export interface ClockContentProps {
  isInteractive: boolean;
  windowId?: string;
}

export function ClockContent({ isInteractive }: ClockContentProps) {
  const [time, setTime] = useState(new Date());
  const [fontSize, setFontSize] = useState(48);
  const containerRef = useRef<HTMLDivElement>(null);

  // Update time every second
  useEffect(() => {
    const interval = setInterval(() => {
      setTime(new Date());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  // Auto-scale font based on container size
  useEffect(() => {
    if (!containerRef.current) return;

    const observer = new ResizeObserver((entries) => {
      const { width, height } = entries[0].contentRect;
      // Scale font to fit: ~15% of width or ~70% of height
      const newSize = Math.min(width * 0.15, height * 0.7);
      setFontSize(Math.max(12, newSize)); // Minimum 12px
    });

    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  const formattedTime = time.toLocaleTimeString('en-GB', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  });

  return (
    <div
      ref={containerRef}
      className="w-full h-full flex items-center justify-center pointer-events-none"
    >
      <span
        className="pointer-events-auto cursor-move select-none"
        style={{
          fontSize: `${fontSize}px`,
          fontFamily: 'system-ui, -apple-system, sans-serif',
          color: 'white',
          WebkitTextStroke: '2px #3b82f6',
          paintOrder: 'stroke fill',
        }}
      >
        {formattedTime}
      </span>
    </div>
  );
}
```

### Step 4: Add to Main Menu

**File**: `src/components/MainMenu.tsx`

Import and add button handler:

```typescript
import { ClockContent } from '@/components/windows/ClockContent';

// Inside component:
const handleOpenClock = () => {
  windowEvents.emit('window:open', {
    component: ClockContent,
    title: 'Clock',
    contentType: 'clock',
    initialWidth: 200,
    initialHeight: 80,
    initialOpacity: 0.8,
    initialBackgroundTransparent: true,
    componentProps: { isInteractive: mode === 'windowed' },
  });
};

// In JSX:
<Button variant="secondary" onClick={handleOpenClock}>
  Clock
</Button>
```

### Step 5: Add Window Restoration

**File**: `app/page.tsx` (WindowRestorer component)

Add case for clock window type in the restoration switch:

```typescript
case 'clock':
  openWindow({
    component: ClockContent,
    title: 'Clock',
    contentType: 'clock',
    windowId,
    initialX: win.position.x,
    initialY: win.position.y,
    initialWidth: win.size.width,
    initialHeight: win.size.height,
    initialZIndex: win.zIndex,
    initialOpacity: win.opacity,
    initialBackgroundTransparent: win.backgroundTransparent,
    componentProps: { isInteractive: mode === 'windowed' },
  });
  break;
```

### Step 6: Optional - Add Serialization (for consistency)

**File**: `src/lib/serialization.ts`

```typescript
export function serializeClockContent(windowId: string): WindowContentFile {
  return {
    windowId,
    type: 'clock',
    content: null,
    lastModified: new Date().toISOString(),
  };
}
```

## Testing

1. **Build and run**: `pnpm tauri dev`
2. **Create clock**: Click "Clock" button in main menu
3. **Verify display**: Time shows in HH:MM:SS format, updates every second
4. **Test styling**: White text with blue border visible
5. **Test resize**: Drag window edges, verify text scales
6. **Test drag**: Drag text to move window
7. **Test transparency**: Background should be fully transparent
8. **Test click-through**: Clicks on transparent areas pass to windows behind
9. **Test persistence**: Close app, reopen - clock position/size restored

## Common Issues

### Text not scaling
- Ensure ResizeObserver is properly attached
- Check that containerRef is assigned to the outer div

### Blue border not visible
- Verify `-webkit-text-stroke` CSS is applied
- Check that `paintOrder: 'stroke fill'` is set

### Click-through not working
- Container needs `pointer-events: none`
- Text span needs `pointer-events: auto`

### Window not persisting
- Verify 'clock' added to both TypeScript and Rust WindowType enums
- Rebuild Tauri after Rust changes

## Files Changed Summary

| File | Change Type |
|------|-------------|
| `src/types/windows.ts` | Modify - add 'clock' type |
| `src/types/persistence.ts` | Modify - add 'clock' type |
| `src-tauri/src/persistence_types.rs` | Modify - add Clock variant |
| `src/components/windows/ClockContent.tsx` | New file |
| `src/components/MainMenu.tsx` | Modify - add clock button |
| `app/page.tsx` | Modify - add clock restoration |
| `src/lib/serialization.ts` | Optional modify - add clock serializer |
