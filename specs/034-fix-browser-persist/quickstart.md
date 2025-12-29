# Quickstart: Fix Browser and File Viewer First-Session Persistence

**Branch**: `034-fix-browser-persist`
**Date**: 2025-12-29

## Quick Summary

Add persistence callback injection for browser and file viewer windows in `useWindowEvents.ts`, following the existing pattern used for Notes and Draw windows.

## Single File Change

**File**: `src/hooks/useWindowEvents.ts`

### Step 1: Add Import

Add to the existing imports at the top of the file:

```typescript
import type { FileType } from '@/types/persistence';
```

### Step 2: Add Browser Handler

Insert after the draw window handler (after line 70, before `return openWindow(enhancedPayload)`):

```typescript
// Add content change callback for browser windows
if (payload.contentType === 'browser' && persistenceRef.current) {
  enhancedPayload.componentProps = {
    ...enhancedPayload.componentProps,
    onContentChange: (url: string, zoom: number) => {
      persistenceRef.current?.onBrowserContentChange(windowId, url, zoom);
    },
  };
}
```

### Step 3: Add File Viewer Handler

Insert immediately after the browser handler:

```typescript
// Add content change callback for file viewer windows
if (payload.contentType === 'fileviewer' && persistenceRef.current) {
  enhancedPayload.componentProps = {
    ...enhancedPayload.componentProps,
    onContentChange: (filePath: string, fileType: FileType, zoom: number) => {
      persistenceRef.current?.onFileViewerContentChange(windowId, filePath, fileType, zoom);
    },
  };
}
```

## Verification

1. Clear app data (delete `state.json` and `window-*.json` files in Tauri app data directory)
2. Start the app
3. Create a browser window, navigate to `https://google.com`
4. Change zoom to 80%
5. Close and restart the app
6. Verify: Browser window shows `https://google.com` at 80% zoom

## Total Lines Changed

- 1 import line
- ~20 lines of new code (2 conditional blocks)
- 0 lines deleted

## No Data Model or API Changes

This bug fix modifies internal callback wiring only. No changes to:
- Persistence file format
- API contracts
- Component interfaces (props already exist)
- Type definitions (types already exist)
