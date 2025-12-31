# Research: Sync Webview Hotkeys with Backend Settings

**Feature**: 042-sync-webview-hotkeys
**Date**: 2025-12-31
**Status**: Complete

## Research Questions

### 1. Tauri Event System for Backend-to-Frontend Communication

**Question**: How should the backend emit hotkey configuration changes to the frontend?

**Decision**: Use Tauri's global event system with `app.emit()` in Rust and `listen()` in TypeScript.

**Rationale**:
- Tauri 2.x provides `@tauri-apps/api/event` with `listen<T>(eventName, callback)` for type-safe event handling
- Global events (`app.emit()`) are appropriate since hotkey settings affect the entire application
- Pattern already established in codebase: `useBrowserWebView.ts` uses `listen<BrowserUrlChangedEvent>("browser-url-changed", ...)`
- UnlistenFn pattern with `useRef` and cleanup in useEffect is the existing codebase standard

**Implementation Pattern** (from Tauri 2.x docs):
```typescript
// Frontend listener
import { listen, UnlistenFn } from '@tauri-apps/api/event';

const unlistenRef = useRef<UnlistenFn | null>(null);

useEffect(() => {
  const setupListener = async () => {
    unlistenRef.current = await listen<HotkeySettings>('hotkeys-updated', (event) => {
      // event.payload contains HotkeySettings
    });
  };
  setupListener();
  return () => {
    unlistenRef.current?.();
  };
}, []);
```

```rust
// Backend emission
use tauri::{AppHandle, Emitter};

pub fn update_hotkeys(app: &AppHandle, hotkeys: HotkeySettings) -> Result<(), String> {
    // ... update cached settings ...
    app.emit("hotkeys-updated", &hotkeys).map_err(|e| e.to_string())?;
    Ok(())
}
```

**Alternatives Considered**:
- WebviewWindow-specific events (`emit_to`) - Rejected: Settings are global, not per-webview
- Polling backend for settings - Rejected: Inefficient, introduces latency, not reactive
- Frontend state management (Context/Redux) - Partial: Still need event for initial load trigger

---

### 2. React Hook Pattern for Event Listeners with Dynamic Configuration

**Question**: How should `useHotkeyCapture` load initial settings and respond to changes?

**Decision**: Use `useState` for hotkey configuration, load on mount via `invoke`, and update via event listener.

**Rationale**:
- React 19 `useEffect` with cleanup function is the correct pattern for subscriptions
- Store configuration in state so re-renders occur when settings change
- Use `useRef` for debounce timestamps (no re-render needed)
- The `ignore` pattern prevents race conditions during async operations

**Implementation Pattern** (from React docs):
```typescript
export function useHotkeyCapture(enabled: boolean): void {
  const [hotkeyConfig, setHotkeyConfig] = useState<HotkeySettings | null>(null);
  const lastVisibilityPressRef = useRef<number>(0);
  const lastModePressRef = useRef<number>(0);
  const unlistenRef = useRef<UnlistenFn | null>(null);

  // Load initial settings on mount
  useEffect(() => {
    let ignore = false;

    const loadSettings = async () => {
      const result = await invoke<LoadUserSettingsResult>('load_user_settings');
      if (!ignore && result.success && result.settings) {
        setHotkeyConfig(result.settings.hotkeys);
      } else if (!ignore) {
        // Fallback to defaults if loading fails
        setHotkeyConfig(DEFAULT_USER_SETTINGS.hotkeys);
      }
    };

    loadSettings();
    return () => { ignore = true; };
  }, []);

  // Listen for settings changes
  useEffect(() => {
    const setupListener = async () => {
      unlistenRef.current = await listen<HotkeySettings>('hotkeys-updated', (event) => {
        setHotkeyConfig(event.payload);
      });
    };
    setupListener();
    return () => {
      unlistenRef.current?.();
    };
  }, []);

  // Hotkey capture effect (depends on hotkeyConfig and enabled)
  useEffect(() => {
    if (!enabled || !hotkeyConfig) return;
    // ... keydown handler using hotkeyConfig values ...
  }, [enabled, hotkeyConfig]);
}
```

**Alternatives Considered**:
- Single useEffect for everything - Rejected: Violates separation of concerns, harder to test
- useReducer for complex state - Rejected: Overkill for 2-field configuration
- useSyncExternalStore - Rejected: Event-based updates are simpler, no external store needed

---

### 3. Matching Keyboard Events to HotkeyBinding Configuration

**Question**: How should frontend keydown events be matched against HotkeyBinding config?

**Decision**: Compare `event.key` against `binding.key` and check modifier properties directly.

**Rationale**:
- Existing `HotkeyBinding` type has: `key` (string), `keyCode` (number), `ctrl`, `shift`, `alt` (booleans)
- KeyboardEvent provides: `event.key`, `event.ctrlKey`, `event.shiftKey`, `event.altKey`
- Direct property comparison is simpler and more readable than bitwise flags
- Existing `hotkeyEquals()` utility in `hotkey-validation.ts` can be reused for comparison logic

**Implementation Pattern**:
```typescript
function matchesHotkey(event: KeyboardEvent, binding: HotkeyBinding): boolean {
  return (
    event.key === binding.key &&
    event.ctrlKey === binding.ctrl &&
    event.shiftKey === binding.shift &&
    event.altKey === binding.alt
  );
}
```

**Alternatives Considered**:
- Using `event.keyCode` instead of `event.key` - Rejected: `keyCode` is deprecated; `key` is more readable
- Using `event.code` - Rejected: Layout-dependent; `key` represents the character produced
- VK code comparison - Rejected: Unnecessary complexity; `key` comparison works for all cases

---

### 4. Preventing Double-Triggering Between Backend Hook and Frontend Capture

**Question**: How do we prevent the same hotkey press from triggering both backend and frontend handlers?

**Decision**: Accept that both may fire, use debouncing to prevent duplicate actions within 200ms.

**Rationale**:
- Backend low-level hook fires when webview is NOT focused (sends event to frontend)
- Frontend capture fires when webview IS focused (calls `invoke()` directly)
- Only one should fire per keypress in normal operation (mutually exclusive focus states)
- The 200ms debounce on both sides protects against edge cases during focus transitions
- Backend debouncing already uses timestamp comparison; frontend should match this pattern

**Edge Case Analysis**:
- **Normal case**: Focus is clearly in webview OR elsewhere - only one handler fires
- **Edge case**: Focus changes during key-down event - both may fire within <200ms
- **Protection**: Backend and frontend both debounce at 200ms; first trigger wins, second is ignored

**Alternatives Considered**:
- Disable frontend capture when backend hook is active - Rejected: Complex state management, race conditions
- Add explicit coordination token - Rejected: Over-engineering for rare edge case
- Frontend-only handling via events - Rejected: Requires backend changes, increases latency

---

### 5. Backend Event Emission Point

**Question**: Where should the backend emit the `hotkeys-updated` event?

**Decision**: Emit from `update_hotkeys` command after successfully updating the cached settings.

**Rationale**:
- `update_hotkeys` is called by SettingsPanel after user saves settings
- Event should emit AFTER cache update so frontend receives current values
- The `update_hotkeys` command already has access to `HotkeySettings`
- Using `app.emit()` requires `AppHandle`, which can be passed or accessed via state

**Implementation Location**: `src-tauri/src/user_settings.rs` in `update_hotkeys()` function

**Alternatives Considered**:
- Emit from `save_user_settings` - Rejected: `update_hotkeys` is the specific hotkey update path
- Frontend emits after invoke returns - Rejected: Frontend doesn't have updated settings payload until event
- Emit from SettingsPanel component - Rejected: Circular; component would emit to itself

---

## Key Findings Summary

| Topic | Decision | Confidence |
|-------|----------|------------|
| Event system | Global Tauri events (`app.emit` + `listen`) | High |
| React pattern | useState + useEffect with cleanup | High |
| Key matching | Compare `event.key` and modifier booleans | High |
| Double-trigger prevention | 200ms debounce on both sides | High |
| Event emission point | `update_hotkeys` command in Rust | High |

## Existing Code References

| File | Purpose | Relevant Pattern |
|------|---------|------------------|
| `src/hooks/useBrowserWebView.ts` | Event listening | `listen<T>()`, `UnlistenFn`, cleanup refs |
| `src/types/user-settings.ts` | Types | `HotkeySettings`, `HotkeyBinding`, defaults |
| `src/utils/hotkey-validation.ts` | Validation | `hotkeyEquals()`, `formatHotkey()` |
| `src-tauri/src/user_settings.rs` | Backend | `update_hotkeys()` command |
| `src/hooks/useHotkeyCapture.ts` | Current hook | Debounce pattern, capture phase listener |

## Dependencies Verified

- `@tauri-apps/api/event`: `listen`, `UnlistenFn` types available
- `@tauri-apps/api/core`: `invoke` for loading settings
- React 19: `useState`, `useEffect`, `useRef` patterns unchanged
- Existing types: `HotkeySettings`, `HotkeyBinding`, `LoadUserSettingsResult` ready to use
