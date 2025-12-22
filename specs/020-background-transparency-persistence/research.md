# Research: Background Transparency Persistence Fix

**Feature**: 020-background-transparency-persistence
**Date**: 2025-12-22

## Root Cause Analysis

### Problem Statement

When the user toggles the `backgroundTransparent` setting on a window, the change is not persisted to `state.json`. The opacity slider (which uses the same persistence mechanism) works correctly, suggesting the issue is not with the persistence infrastructure itself.

### Investigation Findings

#### 1. Data Flow Traced

The toggle flow is:
1. `BackgroundToggle.tsx` - User clicks toggle
2. `onChange(newValue)` calls `onBackgroundTransparentChange(transparent)` in Window.tsx
3. `Window.tsx` calls `setWindowBackgroundTransparent(id, transparent)` from WindowsContext
4. `WindowsContext.tsx` dispatches `SET_WINDOW_BACKGROUND_TRANSPARENT` action
5. React state updates (async)
6. `onCommit()` calls `persistence?.onWindowMoved()` in PersistenceContext
7. `onWindowMoved()` calls `saveStateDebounced(windows)`

#### 2. Bug Location Identified

In `PersistenceContext.tsx` (lines 170-172):

```typescript
const onWindowMoved = useCallback(() => {
  saveStateDebounced(windows);  // 'windows' captured at callback creation
}, [windows, saveStateDebounced]);
```

The problem: When `onChange(newValue)` is called followed immediately by `onCommit()`, the React state update from step 4 has not completed yet. The `windows` array passed to `saveStateDebounced` is the OLD array before the `backgroundTransparent` change was applied.

#### 3. Why Opacity Slider Works

Looking at the opacity slider flow:
- `OpacitySlider` uses a two-phase approach: `onChange` for real-time updates, `onCommit` for persistence
- When `onCommit` is called (on slider release), React has had time to process state updates
- The delay between slider movement start and slider release allows React to reconcile state

The background toggle is different:
- It's a single click that immediately calls both `onChange` AND `onCommit` synchronously
- No delay between state dispatch and persistence trigger

#### 4. Verification

The `serializeWindow` function in `serialization.ts` (line 132) correctly includes `backgroundTransparent`:

```typescript
backgroundTransparent: win.backgroundTransparent ?? false,
```

The `WindowStructure` type in `persistence.ts` (line 43) correctly defines the field:

```typescript
backgroundTransparent: boolean;
```

The problem is purely timing - the correct state is never reaching the serialization function.

## Solution Options

### Option A: Read State at Persistence Time (Recommended)

**Decision**: Use a getter function to read current state at debounce execution time, not at callback creation time.

**Implementation**:
Change `onWindowMoved` to call `getStateForPersistence()` instead of capturing `windows`:

```typescript
const onWindowMoved = useCallback(() => {
  const currentState = getStateForPersistence();
  saveStateDebounced(currentState.windows);
}, [getStateForPersistence, saveStateDebounced]);
```

**Rationale**:
- Uses existing `getStateForPersistence()` function already provided by WindowsContext
- Reads current state at the time the debounced function executes (500ms later)
- By then, React has definitely processed all pending state updates
- Minimal code change; follows existing patterns

**Alternatives considered**:

| Alternative | Why Rejected |
|-------------|--------------|
| flushSync before onCommit | Forces synchronous render; bad for performance |
| setTimeout in BackgroundToggle | Hacky workaround; doesn't fix root cause |
| Pass value directly to onCommit | Would require refactoring callback signatures across multiple components |
| Use React 18 startTransition | Doesn't help with the closure capture problem |

### Option B: Debounce Already Delays Execution

The debounce in `usePersistence.ts` (500ms) means the actual save happens later. However, the `windows` array is captured at call time, not execution time. This is why Option A works - it defers state reading to execution time.

## Implementation Impact

### Files to Modify

1. **`src/contexts/PersistenceContext.tsx`** - Change `onWindowMoved` callback to use `getStateForPersistence()`

### Files Unchanged

- `src/components/windows/BackgroundToggle.tsx` - Works correctly
- `src/components/windows/Window.tsx` - Wiring is correct
- `src/components/windows/WindowHeader.tsx` - Wiring is correct
- `src/contexts/WindowsContext.tsx` - Already provides `getStateForPersistence()`
- `src/lib/serialization.ts` - Already serializes `backgroundTransparent`
- `src/hooks/usePersistence.ts` - Debounce logic is correct
- `src/types/*.ts` - Type definitions are correct

### Risk Assessment

| Risk | Mitigation |
|------|------------|
| Opacity slider regression | Same fix applies; verify opacity still persists |
| Performance impact | None - just reading state instead of using closure |
| State consistency | Debounce ensures we save latest state, not stale state |

## Conclusion

The fix is straightforward: modify `onWindowMoved` in `PersistenceContext.tsx` to call `getStateForPersistence()` at invocation time rather than closing over a potentially stale `windows` array. This ensures the debounced save always uses the most current state, fixing both the `backgroundTransparent` issue and preventing any similar race conditions for other state changes.
