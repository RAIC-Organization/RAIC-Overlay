# Quickstart: Background Transparency Persistence Fix

**Feature**: 020-background-transparency-persistence
**Date**: 2025-12-22

## TL;DR

Fix the stale closure bug in `PersistenceContext.tsx` by reading current state at debounce execution time instead of capturing it at callback creation time.

## The Bug

When user clicks the background transparency toggle:
1. State update is dispatched (async)
2. `onCommit()` immediately calls `persistence?.onWindowMoved()`
3. `onWindowMoved` uses the OLD `windows` array (before state update)
4. State.json is saved with stale data (missing the `backgroundTransparent` change)

## The Fix

**File**: `src/contexts/PersistenceContext.tsx`

**Before** (lines 170-172):
```typescript
const onWindowMoved = useCallback(() => {
  saveStateDebounced(windows);  // Captures stale 'windows'
}, [windows, saveStateDebounced]);
```

**After**:
```typescript
const onWindowMoved = useCallback(() => {
  const currentState = getStateForPersistence();
  saveStateDebounced(currentState.windows);  // Reads fresh state
}, [getStateForPersistence, saveStateDebounced]);
```

## Why This Works

- `getStateForPersistence()` reads the current state from WindowsContext
- The debounce (500ms) ensures the callback executes after React has processed all state updates
- By reading state at execution time (not callback creation), we always get the latest values

## Testing

1. **Manual Test**:
   - Open app, press F5 for windowed mode
   - Create a Notes window
   - Click the background toggle (PanelTop icon next to opacity slider)
   - Wait 1 second
   - Check `%APPDATA%/com.raic.overlay/state.json`
   - Verify window has `"backgroundTransparent": true`

2. **Restart Test**:
   - Toggle background to transparent
   - Close app
   - Reopen app
   - Verify window appears with transparent background

## Files Changed

| File | Change |
|------|--------|
| `src/contexts/PersistenceContext.tsx` | Update `onWindowMoved` to use `getStateForPersistence()` |

## Time Estimate

This is a 1-line fix (plus updating the dependency array). Implementation time: ~5 minutes.
