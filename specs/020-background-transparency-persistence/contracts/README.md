# Contracts: Background Transparency Persistence Fix

**Feature**: 020-background-transparency-persistence
**Date**: 2025-12-22

## No New Contracts Required

This is a bug fix feature that modifies internal behavior only. No new APIs, endpoints, or external contracts are introduced.

## Existing Contracts (Unchanged)

The following existing contracts remain unchanged:

### Tauri IPC Commands

- `save_state` - Saves PersistedState to state.json (no change)
- `load_state` - Loads PersistedState from state.json (no change)
- `save_window_content` - Saves window content to window-{id}.json (no change)
- `load_window_content` - Loads window content from window-{id}.json (no change)
- `delete_window_content` - Deletes window-{id}.json (no change)

### Internal Component Contracts

The following callback signatures remain unchanged:

```typescript
// Window.tsx props (unchanged)
interface WindowProps {
  window: WindowInstance;
  isInteractive?: boolean;
  onExitComplete?: () => void;
}

// WindowHeader.tsx props (unchanged)
interface WindowHeaderProps {
  // ...
  backgroundTransparent: boolean;
  onBackgroundTransparentChange: (transparent: boolean) => void;
  onBackgroundTransparentCommit: () => void;
}

// BackgroundToggle.tsx props (unchanged)
interface BackgroundToggleProps {
  value: boolean;
  onChange: (value: boolean) => void;
  onCommit: () => void;
}

// PersistenceContext.tsx interface (unchanged)
interface PersistenceContextValue {
  onWindowMoved: () => void;  // Internal implementation changes, interface stays same
  // ...
}
```

## Summary

The fix modifies only the internal implementation of `onWindowMoved()` in `PersistenceContext.tsx`. The external contract (callback signature `() => void`) remains identical.
