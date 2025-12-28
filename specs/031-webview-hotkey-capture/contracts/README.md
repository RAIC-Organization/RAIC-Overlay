# Contracts: Webview Hotkey Capture

**Feature Branch**: `031-webview-hotkey-capture`
**Date**: 2025-12-28

## No New Contracts

This feature does not introduce new API contracts. It reuses existing Tauri commands:

### Existing Commands (Unchanged)

| Command | Location | Description |
|---------|----------|-------------|
| `toggle_visibility` | `src-tauri/src/lib.rs` | Toggle overlay visibility |
| `toggle_mode` | `src-tauri/src/lib.rs` | Toggle overlay mode |

### Existing Response Type

```typescript
// From src/types/ipc.ts
interface OverlayStateResponse {
  visible: boolean;
  mode: 'windowed' | 'fullscreen';
  targetBound: boolean;
  targetName: string;
  targetRect: WindowRect | null;
  autoHidden: boolean;
}
```

### Frontend Integration

The new `useHotkeyCapture` hook invokes these commands directly:

```typescript
import { invoke } from '@tauri-apps/api/core';
import type { OverlayStateResponse } from '@/types/ipc';

// F3 pressed
const result = await invoke<OverlayStateResponse>('toggle_visibility');

// F5 pressed
const result = await invoke<OverlayStateResponse>('toggle_mode');
```

No schema changes or new endpoints required.
