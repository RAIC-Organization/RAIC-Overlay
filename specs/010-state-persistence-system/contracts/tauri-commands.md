# Tauri Commands Contract: State Persistence

**Feature**: 010-state-persistence-system
**Date**: 2025-12-19

This document defines the Tauri command API that the frontend will use to interact with the Rust backend for state persistence operations.

## Overview

The backend provides a simple storage layer with four commands:
1. `load_state` - Load persisted state on startup
2. `save_state` - Save current state to disk
3. `save_window_content` - Save individual window content
4. `delete_window_content` - Delete window content file

All business logic (debouncing, triggers, serialization decisions) remains on the frontend.

---

## Commands

### 1. load_state

**Description**: Load the persisted state from disk on application startup.

**Direction**: Frontend → Backend

**Arguments**: None

**Returns**: `LoadStateResult`

```typescript
// Frontend invocation
import { invoke } from '@tauri-apps/api/core';

interface LoadStateResult {
  success: boolean;
  state: PersistedState | null;
  windowContents: WindowContentFile[];
  error?: string;
}

const result = await invoke<LoadStateResult>('load_state');
```

```rust
// Backend implementation signature
#[tauri::command]
async fn load_state(app: tauri::AppHandle) -> Result<LoadStateResult, String>
```

**Behavior**:
1. Read `state.json` from app data directory
2. If file doesn't exist → return `{ success: true, state: null, windowContents: [] }`
3. If file exists but invalid JSON → return `{ success: false, state: null, windowContents: [], error: "..." }`
4. For each window in `state.windows`, read corresponding `window-{id}.json`
5. If window content file missing → include window in state but not in windowContents (logged as warning)
6. Return full state with all loadable window contents

**Error Cases**:
| Condition | Response |
|-----------|----------|
| No state.json exists | `{ success: true, state: null, windowContents: [] }` |
| state.json corrupted | `{ success: false, state: null, windowContents: [], error: "Invalid JSON" }` |
| state.json unreadable (permissions) | `{ success: false, state: null, windowContents: [], error: "Permission denied" }` |
| Window content file missing | Include window structure, omit from windowContents, log warning |
| Window content file corrupted | Omit from windowContents, log warning |

---

### 2. save_state

**Description**: Save the main state file (global settings + window structure).

**Direction**: Frontend → Backend

**Arguments**:
```typescript
interface SaveStateArgs {
  state: PersistedState;
}
```

**Returns**: `SaveResult`

```typescript
// Frontend invocation
interface SaveResult {
  success: boolean;
  error?: string;
}

const result = await invoke<SaveResult>('save_state', {
  state: persistedState
});
```

```rust
// Backend implementation signature
#[tauri::command]
async fn save_state(
    app: tauri::AppHandle,
    state: PersistedState
) -> Result<SaveResult, String>
```

**Behavior**:
1. Ensure app data directory exists (`create_dir_all`)
2. Serialize state to JSON with pretty formatting
3. Write to `state.json.tmp` (temp file)
4. Sync to disk (`sync_all`)
5. Atomic rename `state.json.tmp` → `state.json`
6. Return success

**Error Cases**:
| Condition | Response |
|-----------|----------|
| Directory creation failed | `{ success: false, error: "Failed to create directory" }` |
| Serialization failed | `{ success: false, error: "Serialization error" }` |
| Write failed (disk full) | `{ success: false, error: "Disk full" }` |
| Rename failed | `{ success: false, error: "Failed to complete save" }` |

---

### 3. save_window_content

**Description**: Save content for a specific window to its individual file.

**Direction**: Frontend → Backend

**Arguments**:
```typescript
interface SaveWindowContentArgs {
  windowId: string;
  content: WindowContentFile;
}
```

**Returns**: `SaveResult`

```typescript
// Frontend invocation
const result = await invoke<SaveResult>('save_window_content', {
  windowId: 'win_abc123',
  content: {
    windowId: 'win_abc123',
    type: 'notes',
    content: tiptapJson,
    lastModified: new Date().toISOString()
  }
});
```

```rust
// Backend implementation signature
#[tauri::command]
async fn save_window_content(
    app: tauri::AppHandle,
    window_id: String,
    content: WindowContentFile
) -> Result<SaveResult, String>
```

**Behavior**:
1. Validate `window_id` matches `content.windowId`
2. Ensure app data directory exists
3. Serialize content to JSON with pretty formatting
4. Atomic write to `window-{window_id}.json`
5. Return success

**Error Cases**:
| Condition | Response |
|-----------|----------|
| window_id mismatch | `{ success: false, error: "Window ID mismatch" }` |
| Invalid window_id format | `{ success: false, error: "Invalid window ID" }` |
| Write failed | `{ success: false, error: "Failed to save content" }` |

---

### 4. delete_window_content

**Description**: Delete the content file for a closed window.

**Direction**: Frontend → Backend

**Arguments**:
```typescript
interface DeleteWindowContentArgs {
  windowId: string;
}
```

**Returns**: `DeleteResult`

```typescript
// Frontend invocation
interface DeleteResult {
  success: boolean;
  existed: boolean;
  error?: string;
}

const result = await invoke<DeleteResult>('delete_window_content', {
  windowId: 'win_abc123'
});
```

```rust
// Backend implementation signature
#[tauri::command]
async fn delete_window_content(
    app: tauri::AppHandle,
    window_id: String
) -> Result<DeleteResult, String>
```

**Behavior**:
1. Construct path: `{appDataDir}/window-{window_id}.json`
2. If file exists → delete it → return `{ success: true, existed: true }`
3. If file doesn't exist → return `{ success: true, existed: false }`
4. If deletion fails → return error

**Error Cases**:
| Condition | Response |
|-----------|----------|
| File doesn't exist | `{ success: true, existed: false }` |
| Delete failed (permissions) | `{ success: false, existed: true, error: "Permission denied" }` |
| Invalid window_id | `{ success: false, existed: false, error: "Invalid window ID" }` |

---

## Type Definitions (Shared)

### TypeScript (Frontend)

```typescript
// types/persistence-ipc.ts

export interface LoadStateResult {
  success: boolean;
  state: PersistedState | null;
  windowContents: WindowContentFile[];
  error?: string;
}

export interface SaveResult {
  success: boolean;
  error?: string;
}

export interface DeleteResult {
  success: boolean;
  existed: boolean;
  error?: string;
}

// Re-export from persistence.ts
export type {
  PersistedState,
  WindowContentFile,
  GlobalSettings,
  WindowStructure
} from './persistence';
```

### Rust (Backend)

```rust
// src-tauri/src/persistence_types.rs (additions)

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct LoadStateResult {
    pub success: bool,
    pub state: Option<PersistedState>,
    pub window_contents: Vec<WindowContentFile>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub error: Option<String>,
}

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct SaveResult {
    pub success: bool,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub error: Option<String>,
}

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct DeleteResult {
    pub success: bool,
    pub existed: bool,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub error: Option<String>,
}
```

---

## Frontend Service Layer

```typescript
// stores/persistenceService.ts

import { invoke } from '@tauri-apps/api/core';
import type {
  LoadStateResult,
  SaveResult,
  DeleteResult,
  PersistedState,
  WindowContentFile
} from '@/types/persistence-ipc';

export const persistenceService = {
  /**
   * Load all persisted state on startup
   */
  async loadState(): Promise<LoadStateResult> {
    return invoke<LoadStateResult>('load_state');
  },

  /**
   * Save main state file (global + window structure)
   */
  async saveState(state: PersistedState): Promise<SaveResult> {
    return invoke<SaveResult>('save_state', { state });
  },

  /**
   * Save content for a specific window
   */
  async saveWindowContent(
    windowId: string,
    content: WindowContentFile
  ): Promise<SaveResult> {
    return invoke<SaveResult>('save_window_content', {
      windowId,
      content
    });
  },

  /**
   * Delete content file for a closed window
   */
  async deleteWindowContent(windowId: string): Promise<DeleteResult> {
    return invoke<DeleteResult>('delete_window_content', { windowId });
  },
};
```

---

## Command Registration

```rust
// src-tauri/src/lib.rs

mod persistence;
mod persistence_types;

use persistence::{load_state, save_state, save_window_content, delete_window_content};

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_single_instance::init(|app, _argv, _cwd| {
            // Focus existing window
            if let Some(window) = app.get_webview_window("main") {
                let _ = window.set_focus();
                let _ = window.show();
            }
        }))
        // ... existing plugins ...
        .invoke_handler(tauri::generate_handler![
            // ... existing commands ...
            load_state,
            save_state,
            save_window_content,
            delete_window_content,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
```

---

## Sequence Diagrams

### Startup Hydration

```
Frontend                    Backend
   │                           │
   │  invoke('load_state')     │
   │ ─────────────────────────▶│
   │                           │ Read state.json
   │                           │ Read window-*.json files
   │  LoadStateResult          │
   │ ◀─────────────────────────│
   │                           │
   │ Hydrate state             │
   │ Show UI                   │
```

### Window Creation

```
Frontend                    Backend
   │                           │
   │ User creates window       │
   │                           │
   │ Update in-memory state    │
   │                           │
   │ invoke('save_state')      │
   │ ─────────────────────────▶│
   │                           │ Atomic write state.json
   │  SaveResult               │
   │ ◀─────────────────────────│
   │                           │
   │ invoke('save_window_content')
   │ ─────────────────────────▶│
   │                           │ Atomic write window-{id}.json
   │  SaveResult               │
   │ ◀─────────────────────────│
```

### Window Closure

```
Frontend                    Backend
   │                           │
   │ User closes window        │
   │                           │
   │ Remove from in-memory     │
   │                           │
   │ invoke('delete_window_content')
   │ ─────────────────────────▶│
   │                           │ Delete window-{id}.json
   │  DeleteResult             │
   │ ◀─────────────────────────│
   │                           │
   │ invoke('save_state')      │
   │ ─────────────────────────▶│
   │                           │ Atomic write state.json
   │  SaveResult               │
   │ ◀─────────────────────────│
```

### Debounced Content Save

```
Frontend                    Backend
   │                           │
   │ User types in notes       │
   │ (multiple keystrokes)     │
   │                           │
   │ ─ 500ms debounce ─        │
   │                           │
   │ invoke('save_window_content')
   │ ─────────────────────────▶│
   │                           │ Atomic write window-{id}.json
   │  SaveResult               │
   │ ◀─────────────────────────│
```
