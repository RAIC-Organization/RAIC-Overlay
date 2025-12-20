# Quickstart Guide: Browser Window Persistence

**Feature**: 015-browser-persistence
**Date**: 2025-12-20

## Overview

This guide walks through implementing Browser window persistence by extending the existing state persistence system (010). The implementation adds `'browser'` to the WindowType enum and persists URL + zoom level.

## Prerequisites

Ensure the following features are implemented:
- 010-state-persistence-system (persistence infrastructure)
- 013-window-opacity-control (opacity in window structure)
- 014-browser-component (BrowserContent component)

## Implementation Steps

### Step 1: Extend TypeScript Types

**File**: `src/types/persistence.ts`

1. Update the `WindowType` union:
   ```typescript
   export type WindowType = 'notes' | 'draw' | 'browser';
   ```

2. Add `BrowserPersistedContent` interface:
   ```typescript
   export interface BrowserPersistedContent {
     url: string;
     zoom: number;
   }
   ```

3. Update `WindowContentFile.content` union to include `BrowserPersistedContent`

4. Add default and helper functions for browser content normalization

### Step 2: Extend Rust Types

**File**: `src-tauri/src/persistence_types.rs`

1. Add `Browser` variant to `WindowType` enum:
   ```rust
   #[derive(Debug, Clone, Serialize, Deserialize)]
   #[serde(rename_all = "lowercase")]
   pub enum WindowType {
       Notes,
       Draw,
       Browser,
   }
   ```

### Step 3: Update Serialization

**File**: `src/lib/serialization.ts`

1. Add case for `'browser'` type in any type-switch logic
2. Ensure browser content is serialized as `{ url, zoom }`

### Step 4: Modify BrowserContent Component

**File**: `src/components/windows/BrowserContent.tsx`

1. Extend props interface:
   ```typescript
   export interface BrowserContentProps {
     isInteractive: boolean;
     windowId: string;
     initialUrl?: string;
     initialZoom?: number;
     onUrlChange?: (url: string) => void;
     onZoomChange?: (zoom: number) => void;
   }
   ```

2. Use `initialUrl` and `initialZoom` as initial state values:
   ```typescript
   const [url, setUrl] = useState(
     initialUrl ?? BROWSER_DEFAULTS.DEFAULT_URL
   );
   const [zoom, setZoom] = useState(
     initialZoom ?? BROWSER_DEFAULTS.DEFAULT_ZOOM
   );
   ```

3. Call `onUrlChange` when iframe loads (after redirect handling):
   ```typescript
   onLoad={() => {
     setIsLoading(false);
     onUrlChange?.(url);  // Persist final URL
   }}
   ```

4. Call `onZoomChange` when zoom changes:
   ```typescript
   const zoomIn = () => {
     const newZoom = Math.min(zoom + BROWSER_DEFAULTS.ZOOM_STEP, BROWSER_DEFAULTS.ZOOM_MAX);
     setZoom(newZoom);
     onZoomChange?.(newZoom);
   };
   ```

### Step 5: Update WindowsContainer

**File**: `src/components/windows/WindowsContainer.tsx`

1. Pass initial state to BrowserContent when rendering:
   ```typescript
   case 'browser':
     return (
       <BrowserContent
         isInteractive={isInteractive}
         windowId={window.id}
         initialUrl={window.content?.url}
         initialZoom={window.content?.zoom}
         onUrlChange={(url) => handleContentChange(window.id, { url })}
         onZoomChange={(zoom) => handleContentChange(window.id, { zoom })}
       />
     );
   ```

2. Ensure `handleContentChange` triggers persistence with debounce

### Step 6: Update Window Creation

**File**: Where windows are created (likely `WindowsContext.tsx` or similar)

1. When creating a browser window, initialize with default content:
   ```typescript
   const newWindow = {
     id: generateWindowId(),
     type: 'browser' as const,
     content: {
       url: BROWSER_DEFAULTS.DEFAULT_URL,
       zoom: BROWSER_DEFAULTS.DEFAULT_ZOOM,
     },
     // ... position, size, etc.
   };
   ```

## Verification Steps

### Manual Testing Checklist

- [ ] Create a new Browser window - verify it opens with default URL and zoom
- [ ] Navigate to a different URL - close and reopen app - verify URL is restored
- [ ] Change zoom level - close and reopen app - verify zoom is restored
- [ ] Verify opacity persists for Browser windows (existing functionality)
- [ ] Verify position/size persists for Browser windows (existing functionality)
- [ ] Close a Browser window - verify content file is deleted
- [ ] Test with invalid persisted zoom (edit JSON) - verify clamping to valid range
- [ ] Test with missing content file - verify defaults are used

### Integration Test Cases

```typescript
describe('Browser Persistence', () => {
  it('should persist URL after navigation', async () => {
    // Create browser window, navigate, verify persistence
  });

  it('should persist zoom level', async () => {
    // Create browser window, change zoom, verify persistence
  });

  it('should restore browser state on app launch', async () => {
    // Create persisted state, launch app, verify restoration
  });

  it('should clamp invalid zoom to valid range', async () => {
    // Create content with zoom: 999, verify clamped to 200
  });

  it('should use defaults when content file missing', async () => {
    // Create window in state.json but no content file
    // Verify defaults are used
  });
});
```

## File Changes Summary

| File | Change |
|------|--------|
| `src/types/persistence.ts` | Add `BrowserPersistedContent`, extend `WindowType` |
| `src/lib/serialization.ts` | Add 'browser' case handling |
| `src/components/windows/BrowserContent.tsx` | Add persistence props |
| `src/components/windows/WindowsContainer.tsx` | Pass content to BrowserContent |
| `src-tauri/src/persistence_types.rs` | Add `Browser` variant |

## Estimated Effort

- TypeScript type changes: ~30 min
- Rust type changes: ~10 min
- BrowserContent modification: ~1 hour
- WindowsContainer integration: ~30 min
- Testing: ~1 hour

**Total**: ~3-4 hours

## Troubleshooting

### Browser window restores with wrong URL
- Check that `onUrlChange` is called after iframe `onLoad`
- Verify the URL in `window-{id}.json` matches expected

### Zoom not persisting
- Ensure `onZoomChange` is called in both `zoomIn` and `zoomOut`
- Check debounce timing (500ms)

### Content file not created
- Verify window type is 'browser' in state.json
- Check persistence service is receiving content change events

### Invalid JSON after manual editing
- System should fall back to defaults
- Check console for parsing errors
