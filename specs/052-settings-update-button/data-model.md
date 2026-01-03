# Data Model: Check for Update Button in Settings Panel

**Feature**: 052-settings-update-button
**Date**: 2026-01-03

## Overview

This feature introduces no new persistent data structures. It reuses existing types and adds only local UI state within the new component.

---

## Existing Types (Reused)

### UpdateCheckResult (from src/types/update.ts)

```typescript
interface UpdateCheckResult {
  updateAvailable: boolean;
  updateInfo: UpdateInfo | null;
}
```

**Used by**: `check_for_updates` Tauri command return value

### UpdateInfo (from src/types/update.ts)

```typescript
interface UpdateInfo {
  version: string;
  currentVersion: string;
  downloadUrl: string;
  downloadSize: number;
  releaseUrl: string;
}
```

**Used by**: Populated when update is available

---

## New UI State (Component-Local)

### UpdatesSectionState

```typescript
// Local state within UpdatesSection component

interface UpdatesSectionState {
  // Version display
  appVersion: string | null;

  // Check button state
  isChecking: boolean;

  // Inline status message
  status: {
    type: 'idle' | 'success' | 'error';
    message: string;
  };
}
```

**Lifecycle**:
- `appVersion`: Loaded once on mount via `getVersion()`
- `isChecking`: Set true on button click, false on check completion
- `status`: Updated based on check result, cleared on next check attempt

---

## State Transitions

```
┌──────────────────────────────────────────────────────────────────┐
│                        UpdatesSection                            │
├──────────────────────────────────────────────────────────────────┤
│                                                                  │
│  [Mount] ──────────► Load appVersion                             │
│                                                                  │
│  [Button Click] ──► isChecking: true                             │
│                     status: {type: 'idle', message: ''}          │
│                     │                                            │
│                     ▼                                            │
│              invoke('check_for_updates')                         │
│                     │                                            │
│         ┌──────────┴──────────┬──────────────┐                   │
│         ▼                     ▼              ▼                   │
│    [Update Found]       [No Update]      [Error]                 │
│         │                     │              │                   │
│         ▼                     ▼              ▼                   │
│  Backend opens         status: success  status: error            │
│  update window         "Up to date"     "Check failed"           │
│                              │              │                    │
│                              ▼              ▼                    │
│                        isChecking: false                         │
│                                                                  │
└──────────────────────────────────────────────────────────────────┘
```

---

## No Database Changes

- No new tables
- No new JSON files
- No modifications to existing persistence structures

The feature operates entirely with:
1. Existing Tauri commands
2. Existing `UpdateWindowState` (managed by backend)
3. Local React component state (ephemeral)
