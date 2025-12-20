# Quickstart: Browser Component

**Date**: 2025-12-20
**Branch**: 014-browser-component

## Overview

Add a new Browser window component that displays web content via iframe with navigation and zoom controls.

---

## Prerequisites

- Feature 007 (windows-system) fully implemented
- Feature 008 (Notes) and 009 (Draw) patterns available for reference
- Tauri CSP configured (see Configuration section)

---

## Configuration Required

### Update Tauri CSP

Edit `src-tauri/tauri.conf.json` to allow iframe sources:

```json
{
  "app": {
    "security": {
      "csp": "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; frame-src https: http:; img-src 'self' data: https: http:"
    }
  }
}
```

**Key Addition**: `frame-src https: http:` allows iframes to load external websites.

---

## Files to Create

### 1. BrowserContent.tsx

Location: `src/components/windows/BrowserContent.tsx`

Main component structure:
```typescript
"use client";

import { useState, useCallback } from "react";
import { BrowserToolbar } from "./BrowserToolbar";

const DEFAULT_URL = "https://www.google.com";
const DEFAULT_ZOOM = 50;
const ZOOM_MIN = 10;
const ZOOM_MAX = 200;
const ZOOM_STEP = 10;

export interface BrowserContentProps {
  isInteractive: boolean;
}

export function BrowserContent({ isInteractive }: BrowserContentProps) {
  // State management
  const [url, setUrl] = useState(DEFAULT_URL);
  const [historyStack, setHistoryStack] = useState([DEFAULT_URL]);
  const [historyIndex, setHistoryIndex] = useState(0);
  const [zoom, setZoom] = useState(DEFAULT_ZOOM);
  const [isLoading, setIsLoading] = useState(false);

  // Navigation handlers...
  // Zoom handlers...
  // Render toolbar + iframe...
}
```

### 2. BrowserToolbar.tsx

Location: `src/components/windows/BrowserToolbar.tsx`

Toolbar layout: `[Back][Forward][Refresh][Address Bar][Zoom-][%][Zoom+]`

Uses existing UI components:
- `Button` from `@/components/ui/button`
- Icons from `lucide-react`: `ArrowLeft`, `ArrowRight`, `RotateCw`, `Minus`, `Plus`, `Loader2`

### 3. Update MainMenu.tsx

Add Browser button and handler:
```typescript
import { BrowserContent } from "@/components/windows/BrowserContent";

const handleOpenBrowser = () => {
  windowEvents.emit("window:open", {
    component: BrowserContent,
    title: "Browser",
    contentType: "browser",
    componentProps: { isInteractive: mode === "windowed" },
  });
};

// In JSX, add button after Draw:
<Button variant="secondary" onClick={handleOpenBrowser}>
  Browser
</Button>
```

---

## Zoom Implementation

Use CSS transform with dimension compensation:

```tsx
const scaleValue = zoom / 100;
const inverseScale = 100 / zoom;

<div className="flex-1 overflow-hidden relative">
  {!isInteractive && (
    <div className="absolute inset-0 z-10" /> {/* Blocks interaction */}
  )}
  <iframe
    src={url}
    style={{
      width: `${inverseScale * 100}%`,
      height: `${inverseScale * 100}%`,
      transform: `scale(${scaleValue})`,
      transformOrigin: '0 0',
    }}
    onLoad={() => setIsLoading(false)}
  />
</div>
```

---

## Testing Checklist

- [ ] Browser button appears in menu after Draw
- [ ] Clicking Browser opens new window with google.com at 50% zoom
- [ ] Address bar shows current URL
- [ ] Entering URL and pressing Enter navigates iframe
- [ ] URLs without protocol get https:// prepended
- [ ] Back/Forward buttons work after navigating to multiple URLs
- [ ] Back button disabled on first page, Forward disabled on latest page
- [ ] Refresh button reloads current page
- [ ] Zoom +/- buttons change zoom by 10%
- [ ] Zoom percentage label updates correctly
- [ ] Zoom bounded at 10% minimum, 200% maximum
- [ ] Toolbar hidden in non-interactive mode (F5)
- [ ] Iframe not clickable in non-interactive mode
- [ ] Multiple Browser windows work independently
- [ ] Closing window loses all state

---

## Known Limitations

1. **Cross-origin restrictions**: Some websites block iframe embedding via `X-Frame-Options` or CSP headers. This is expected.

2. **In-page navigation not tracked**: History only tracks explicit address bar navigations, not clicks within the iframe (cross-origin security).

3. **Loading detection limited**: Some sites may not trigger proper load events.

---

## Reference Patterns

Study these existing components:
- `src/components/windows/NotesContent.tsx` - Toolbar visibility pattern
- `src/components/windows/DrawContent.tsx` - isInteractive prop handling
- `src/components/windows/NotesToolbar.tsx` - Toolbar structure
- `src/components/MainMenu.tsx` - Window open event pattern
