# Quickstart: Webview Hotkey Capture

**Feature Branch**: `031-webview-hotkey-capture`
**Date**: 2025-12-28

## Problem

When the overlay webview is focused (interactive mode), F3 and F5 keys don't trigger visibility/mode toggles because the webview captures the events before they reach the Tauri low-level keyboard hook.

## Solution

Add a document-level keyboard event listener in the React frontend that:
1. Captures F3/F5 key presses
2. Prevents default browser behavior (F5 refresh, F3 find)
3. Applies 200ms debouncing (matching backend)
4. Invokes existing backend commands

## Implementation Summary

### New Files

```
src/hooks/useHotkeyCapture.ts    # Custom hook for hotkey capture
```

### Modified Files

```
app/page.tsx                      # Add useHotkeyCapture hook call
```

### No Backend Changes

The existing `toggle_visibility` and `toggle_mode` commands are reused.

## Hook API

```typescript
/**
 * Captures F3/F5 hotkeys at document level when webview is focused.
 * Prevents default browser behavior and invokes backend commands.
 *
 * @param enabled - Whether to capture hotkeys (typically true in interactive mode)
 */
function useHotkeyCapture(enabled: boolean): void
```

## Usage

```typescript
// In app/page.tsx
import { useHotkeyCapture } from '@/hooks/useHotkeyCapture';

export default function Home() {
  const [state, setState] = useState<OverlayState>(initialState);

  // Capture hotkeys when in interactive mode
  useHotkeyCapture(state.mode === 'windowed');

  // ... rest of component
}
```

## Testing

### Manual Test Cases

1. **F3 in Notes window**
   - Open overlay, create a Notes window
   - Click inside Notes editor (focus webview)
   - Press F3 → Overlay should hide

2. **F5 in Browser window**
   - Open overlay, create a Browser window
   - Click inside browser content (focus webview)
   - Press F5 → Mode should toggle (NOT refresh page)

3. **Debounce verification**
   - Focus webview
   - Rapidly press F3 5 times in 0.5 seconds
   - Should see 2-3 toggles max (debounce working)

4. **Non-interference test**
   - Click outside webview (on desktop)
   - Press F3/F5 → Should still work (low-level hook handles it)

## Key Implementation Details

- Uses `document.addEventListener('keydown', ...)` for global capture
- `useRef` for timestamp-based debouncing (no re-renders)
- `invoke` from `@tauri-apps/api/core` for backend calls
- `e.preventDefault()` and `e.stopPropagation()` to block browser defaults
- Logging with source indication per FR-008/SC-006
