# Research: Webview Hotkey Capture

**Feature Branch**: `031-webview-hotkey-capture`
**Date**: 2025-12-28

## Research Topics

### 1. React Global Keyboard Event Handling

**Decision**: Use `useEffect` with `document.addEventListener('keydown', handler)` and proper cleanup.

**Rationale**:
- React's official documentation recommends using `useEffect` for subscribing to global DOM events
- The cleanup function (`removeEventListener`) is critical to prevent memory leaks
- Empty dependency array `[]` ensures the listener is added once on mount and removed on unmount
- Using `document` instead of `window` ensures capture before the event bubbles up

**Pattern from React docs**:
```javascript
useEffect(() => {
  function handleKeyDown(e) {
    // Handle key event
  }
  document.addEventListener('keydown', handleKeyDown);
  return () => document.removeEventListener('keydown', handleKeyDown);
}, []);
```

**Alternatives Considered**:
- `onKeyDown` prop on root element: Rejected because it requires the element to have focus
- Third-party hotkey libraries (react-hotkeys, use-hotkeys): Rejected per YAGNI principle - native API is sufficient

### 2. Tauri Invoke API for Frontend-to-Backend Commands

**Decision**: Use `invoke` from `@tauri-apps/api/core` to call existing backend commands.

**Rationale**:
- The project already uses this pattern in `app/page.tsx` for `toggle_visibility` and `toggle_mode` commands
- `invoke` returns a Promise, allowing proper error handling with try/catch
- Existing commands already emit the correct events and update state

**Pattern from Tauri v2 docs**:
```javascript
import { invoke } from '@tauri-apps/api/core';

// Call backend command
invoke('toggle_visibility').then((result) => {
  // Handle result
}).catch((error) => {
  console.error('Failed to toggle visibility:', error);
});
```

**Alternatives Considered**:
- Emit custom events that the backend listens to: Rejected because existing commands already handle state
- Direct state manipulation in frontend only: Rejected because backend must know about state changes

### 3. Debounce Implementation

**Decision**: Use timestamp-based debouncing with `useRef` to store last press time.

**Rationale**:
- Matches the existing 200ms debounce logic in `keyboard_hook.rs`
- Simple, no external dependencies required
- Using `useRef` avoids re-renders and keeps the timestamp mutable across renders
- Timestamp comparison is more reliable than setTimeout-based debouncing for rapid key presses

**Implementation Pattern**:
```javascript
const lastF3Press = useRef<number>(0);
const lastF5Press = useRef<number>(0);
const DEBOUNCE_MS = 200;

function handleKeyDown(e: KeyboardEvent) {
  const now = Date.now();

  if (e.key === 'F3') {
    if (now - lastF3Press.current >= DEBOUNCE_MS) {
      lastF3Press.current = now;
      // Handle F3
    }
  }
}
```

**Alternatives Considered**:
- lodash debounce: Rejected due to unnecessary dependency
- setTimeout-based: Rejected because timestamp comparison is simpler and matches backend pattern

### 4. Preventing Default Browser Behavior

**Decision**: Call `e.preventDefault()` immediately for F3 and F5 keys.

**Rationale**:
- F5 triggers page refresh in browsers - must be prevented
- F3 opens browser find dialog - should be prevented for consistency
- `preventDefault()` must be called synchronously in the event handler
- Check key before calling preventDefault to avoid blocking other keys

**Implementation Pattern**:
```javascript
function handleKeyDown(e: KeyboardEvent) {
  if (e.key === 'F3' || e.key === 'F5') {
    e.preventDefault();
    e.stopPropagation(); // Prevent event from reaching other handlers
    // Process hotkey
  }
}
```

**Alternatives Considered**:
- Only preventing default after debounce check: Rejected because browser would still trigger refresh on debounced presses

### 5. Integration with Existing Event Listeners

**Decision**: Frontend hotkey capture coexists with backend low-level hook; they don't conflict.

**Rationale**:
- When webview is focused: Frontend captures keys, backend hook doesn't receive them (current problem we're fixing)
- When webview is NOT focused: Backend hook captures keys, frontend listener inactive (component not rendered/focused)
- When overlay is hidden: Frontend component is not rendered, only backend hook operates
- No coordination needed - they naturally handle different scenarios

**Key Insight**: The low-level keyboard hook in Rust operates at the OS level. When the webview is focused, it intercepts events but the webview's DOM also receives them. The issue is that the webview consumes the events before they can be processed. By adding a DOM-level handler, we capture the events the webview receives.

### 6. Logging Strategy

**Decision**: Use existing `@/lib/logger` utilities with descriptive messages indicating source.

**Rationale**:
- Consistent with existing codebase logging patterns
- FR-008 requires logging for debugging consistency
- SC-006 requires logs to indicate which mechanism processed the key

**Log Format**:
```javascript
import { info, debug } from '@/lib/logger';

info('F3 pressed: toggle visibility requested (webview capture)');
debug('F5 pressed: debounced (150ms since last, threshold=200ms)');
```

## Summary

All research topics resolved. The implementation approach is:

1. Create a custom hook `useHotkeyCapture` that:
   - Uses `useEffect` to add/remove document keydown listener
   - Checks for F3/F5 keys and prevents default
   - Applies 200ms timestamp-based debouncing with `useRef`
   - Invokes existing backend commands via `@tauri-apps/api/core`
   - Logs actions with source indication

2. Integrate hook into `app/page.tsx` at the top level

3. No backend changes required - reuses existing `toggle_visibility` and `toggle_mode` commands
