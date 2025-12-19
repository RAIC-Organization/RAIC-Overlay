# Quickstart: State Persistence System

**Feature**: 010-state-persistence-system
**Date**: 2025-12-19

## Overview

This guide provides step-by-step instructions for implementing the state persistence system. Follow the phases in order.

---

## Prerequisites

- Existing RAICOverlay codebase with:
  - React 19.0.0 frontend with WindowsContext
  - Tauri 2.x Rust backend
  - TipTap and Excalidraw components

---

## Phase 1: Backend Setup (Rust)

### Step 1.1: Add Dependencies

```toml
# src-tauri/Cargo.toml
[dependencies]
tauri-plugin-single-instance = "2.0.0"
# chrono is optional - only if using Rust timestamps
# chrono = { version = "0.4", features = ["serde"] }
```

### Step 1.2: Create Persistence Types

Create `src-tauri/src/persistence_types.rs` with the data model types from `data-model.md`.

### Step 1.3: Create Persistence Module

Create `src-tauri/src/persistence.rs`:

```rust
use crate::persistence_types::*;
use std::fs::{self, File};
use std::io::{Read, Write};
use std::path::PathBuf;
use tauri::Manager;

const STATE_FILE: &str = "state.json";
const WINDOW_FILE_PREFIX: &str = "window-";

fn get_app_data_dir(app: &tauri::AppHandle) -> Result<PathBuf, String> {
    app.path()
        .app_data_dir()
        .map_err(|e| format!("Failed to get app data dir: {}", e))
}

fn atomic_write(path: &PathBuf, content: &[u8]) -> Result<(), String> {
    let temp_path = path.with_extension("json.tmp");

    let mut file = File::create(&temp_path)
        .map_err(|e| format!("Failed to create temp file: {}", e))?;

    file.write_all(content)
        .map_err(|e| format!("Failed to write: {}", e))?;

    file.sync_all()
        .map_err(|e| format!("Failed to sync: {}", e))?;

    fs::rename(&temp_path, path)
        .map_err(|e| format!("Failed to rename: {}", e))?;

    Ok(())
}

#[tauri::command]
pub async fn load_state(app: tauri::AppHandle) -> Result<LoadStateResult, String> {
    let data_dir = get_app_data_dir(&app)?;
    let state_path = data_dir.join(STATE_FILE);

    // If no state file exists, return empty result
    if !state_path.exists() {
        return Ok(LoadStateResult {
            success: true,
            state: None,
            window_contents: vec![],
            error: None,
        });
    }

    // Read and parse state file
    let mut file = File::open(&state_path)
        .map_err(|e| format!("Failed to open state file: {}", e))?;

    let mut contents = String::new();
    file.read_to_string(&mut contents)
        .map_err(|e| format!("Failed to read state file: {}", e))?;

    let state: PersistedState = serde_json::from_str(&contents)
        .map_err(|e| format!("Invalid state JSON: {}", e))?;

    // Load window content files
    let mut window_contents = Vec::new();
    for window in &state.windows {
        let content_path = data_dir.join(format!("{}{}.json", WINDOW_FILE_PREFIX, window.id));
        if content_path.exists() {
            if let Ok(mut file) = File::open(&content_path) {
                let mut content_str = String::new();
                if file.read_to_string(&mut content_str).is_ok() {
                    if let Ok(content) = serde_json::from_str::<WindowContentFile>(&content_str) {
                        window_contents.push(content);
                    }
                }
            }
        }
    }

    Ok(LoadStateResult {
        success: true,
        state: Some(state),
        window_contents,
        error: None,
    })
}

#[tauri::command]
pub async fn save_state(
    app: tauri::AppHandle,
    state: PersistedState,
) -> Result<SaveResult, String> {
    let data_dir = get_app_data_dir(&app)?;

    // Ensure directory exists
    fs::create_dir_all(&data_dir)
        .map_err(|e| format!("Failed to create directory: {}", e))?;

    let state_path = data_dir.join(STATE_FILE);

    let json = serde_json::to_string_pretty(&state)
        .map_err(|e| format!("Serialization failed: {}", e))?;

    atomic_write(&state_path, json.as_bytes())?;

    Ok(SaveResult {
        success: true,
        error: None,
    })
}

#[tauri::command]
pub async fn save_window_content(
    app: tauri::AppHandle,
    window_id: String,
    content: WindowContentFile,
) -> Result<SaveResult, String> {
    if window_id != content.window_id {
        return Ok(SaveResult {
            success: false,
            error: Some("Window ID mismatch".to_string()),
        });
    }

    let data_dir = get_app_data_dir(&app)?;
    fs::create_dir_all(&data_dir)
        .map_err(|e| format!("Failed to create directory: {}", e))?;

    let content_path = data_dir.join(format!("{}{}.json", WINDOW_FILE_PREFIX, window_id));

    let json = serde_json::to_string_pretty(&content)
        .map_err(|e| format!("Serialization failed: {}", e))?;

    atomic_write(&content_path, json.as_bytes())?;

    Ok(SaveResult {
        success: true,
        error: None,
    })
}

#[tauri::command]
pub async fn delete_window_content(
    app: tauri::AppHandle,
    window_id: String,
) -> Result<DeleteResult, String> {
    let data_dir = get_app_data_dir(&app)?;
    let content_path = data_dir.join(format!("{}{}.json", WINDOW_FILE_PREFIX, window_id));

    if !content_path.exists() {
        return Ok(DeleteResult {
            success: true,
            existed: false,
            error: None,
        });
    }

    fs::remove_file(&content_path)
        .map_err(|e| format!("Failed to delete: {}", e))?;

    Ok(DeleteResult {
        success: true,
        existed: true,
        error: None,
    })
}
```

### Step 1.4: Register Commands

Update `src-tauri/src/lib.rs`:

```rust
mod persistence;
mod persistence_types;

use persistence::{load_state, save_state, save_window_content, delete_window_content};

// In run() function:
.plugin(tauri_plugin_single_instance::init(|app, _argv, _cwd| {
    if let Some(window) = app.get_webview_window("main") {
        let _ = window.set_focus();
        let _ = window.show();
    }
}))
.invoke_handler(tauri::generate_handler![
    // ... existing commands ...
    load_state,
    save_state,
    save_window_content,
    delete_window_content,
])
```

---

## Phase 2: Frontend Types

### Step 2.1: Create Persistence Types

Create `src/types/persistence.ts` with types from `data-model.md`.

### Step 2.2: Create IPC Types

Create `src/types/persistence-ipc.ts`:

```typescript
import type {
  PersistedState,
  WindowContentFile,
} from './persistence';

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

export type { PersistedState, WindowContentFile };
```

---

## Phase 3: Frontend Services

### Step 3.1: Create Persistence Service

Create `src/stores/persistenceService.ts`:

```typescript
import { invoke } from '@tauri-apps/api/core';
import type {
  LoadStateResult,
  SaveResult,
  DeleteResult,
  PersistedState,
  WindowContentFile,
} from '@/types/persistence-ipc';

export const persistenceService = {
  async loadState(): Promise<LoadStateResult> {
    return invoke<LoadStateResult>('load_state');
  },

  async saveState(state: PersistedState): Promise<SaveResult> {
    return invoke<SaveResult>('save_state', { state });
  },

  async saveWindowContent(
    windowId: string,
    content: WindowContentFile
  ): Promise<SaveResult> {
    return invoke<SaveResult>('save_window_content', { windowId, content });
  },

  async deleteWindowContent(windowId: string): Promise<DeleteResult> {
    return invoke<DeleteResult>('delete_window_content', { windowId });
  },
};
```

### Step 3.2: Create Debounce Utility

Create `src/lib/debounce.ts`:

```typescript
export function debounce<T extends (...args: any[]) => void>(
  fn: T,
  delay: number
): T & { cancel: () => void; flush: () => void } {
  let timeoutId: ReturnType<typeof setTimeout> | null = null;
  let lastArgs: Parameters<T> | null = null;

  const debounced = ((...args: Parameters<T>) => {
    lastArgs = args;
    if (timeoutId) clearTimeout(timeoutId);
    timeoutId = setTimeout(() => {
      fn(...args);
      timeoutId = null;
      lastArgs = null;
    }, delay);
  }) as T & { cancel: () => void; flush: () => void };

  debounced.cancel = () => {
    if (timeoutId) clearTimeout(timeoutId);
    timeoutId = null;
    lastArgs = null;
  };

  debounced.flush = () => {
    if (timeoutId && lastArgs) {
      clearTimeout(timeoutId);
      fn(...lastArgs);
      timeoutId = null;
      lastArgs = null;
    }
  };

  return debounced;
}
```

---

## Phase 4: Hydration Hook

### Step 4.1: Create Hydration Hook

Create `src/hooks/useHydration.ts`:

```typescript
import { useState, useEffect } from 'react';
import { persistenceService } from '@/stores/persistenceService';
import type { PersistedState, WindowContentFile } from '@/types/persistence';
import { CURRENT_STATE_VERSION, DEFAULT_PERSISTED_STATE } from '@/types/persistence';

interface HydrationResult {
  isHydrated: boolean;
  state: PersistedState;
  windowContents: Map<string, WindowContentFile>;
  error: string | null;
}

export function useHydration(): HydrationResult {
  const [result, setResult] = useState<HydrationResult>({
    isHydrated: false,
    state: DEFAULT_PERSISTED_STATE,
    windowContents: new Map(),
    error: null,
  });

  useEffect(() => {
    async function hydrate() {
      try {
        const loadResult = await persistenceService.loadState();

        if (!loadResult.success) {
          console.error('Failed to load state:', loadResult.error);
          setResult({
            isHydrated: true,
            state: DEFAULT_PERSISTED_STATE,
            windowContents: new Map(),
            error: loadResult.error || 'Unknown error',
          });
          return;
        }

        if (!loadResult.state) {
          // No persisted state, use defaults
          setResult({
            isHydrated: true,
            state: DEFAULT_PERSISTED_STATE,
            windowContents: new Map(),
            error: null,
          });
          return;
        }

        // Version check
        if (loadResult.state.version !== CURRENT_STATE_VERSION) {
          console.warn(
            `State version mismatch: ${loadResult.state.version} vs ${CURRENT_STATE_VERSION}`
          );
          setResult({
            isHydrated: true,
            state: DEFAULT_PERSISTED_STATE,
            windowContents: new Map(),
            error: 'State version mismatch, reset to defaults',
          });
          return;
        }

        // Build window contents map
        const contentMap = new Map<string, WindowContentFile>();
        for (const content of loadResult.windowContents) {
          contentMap.set(content.windowId, content);
        }

        setResult({
          isHydrated: true,
          state: loadResult.state,
          windowContents: contentMap,
          error: null,
        });
      } catch (err) {
        console.error('Hydration error:', err);
        setResult({
          isHydrated: true,
          state: DEFAULT_PERSISTED_STATE,
          windowContents: new Map(),
          error: String(err),
        });
      }
    }

    hydrate();
  }, []);

  return result;
}
```

---

## Phase 5: Loading Screen

### Step 5.1: Create Loading Component

Create `src/components/LoadingScreen.tsx`:

```typescript
export function LoadingScreen() {
  return (
    <div className="fixed inset-0 flex items-center justify-center bg-background">
      <div className="flex flex-col items-center gap-2">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        <span className="text-sm text-muted-foreground">Loading...</span>
      </div>
    </div>
  );
}
```

---

## Phase 6: Integration

### Step 6.1: Update App Entry Point

Update `app/page.tsx` to use hydration:

```typescript
'use client';

import { useHydration } from '@/hooks/useHydration';
import { LoadingScreen } from '@/components/LoadingScreen';
// ... other imports

export default function Home() {
  const { isHydrated, state, windowContents, error } = useHydration();

  if (!isHydrated) {
    return <LoadingScreen />;
  }

  if (error) {
    console.warn('Hydration warning:', error);
  }

  // Pass hydrated state to WindowsProvider
  return (
    <WindowsProvider initialState={state} initialContents={windowContents}>
      {/* ... existing content ... */}
    </WindowsProvider>
  );
}
```

### Step 6.2: Update WindowsContext

Modify `src/contexts/WindowsContext.tsx` to:
1. Accept initial state from hydration
2. Add persistence triggers
3. Implement debounced saves

---

## Phase 7: Testing

### Step 7.1: Manual Test Cases

1. **Fresh start**: Delete app data directory, launch app, verify default state
2. **Save/restore**: Create windows, close app, reopen, verify restoration
3. **Content persistence**: Add content to notes/draw, close app, verify content restored
4. **Window deletion**: Close a window, reopen app, verify window is gone
5. **Corruption handling**: Corrupt state.json manually, verify app starts with defaults
6. **Single instance**: Try to launch app twice, verify first instance gets focus

### Step 7.2: Integration Tests

Create `tests/integration/persistence.test.ts` with tests for:
- Save/load cycle
- Debounce behavior
- Error handling
- Version mismatch

---

## Checklist

- [ ] Rust persistence types created
- [ ] Rust persistence commands implemented
- [ ] Single instance plugin configured
- [ ] Commands registered in lib.rs
- [ ] TypeScript persistence types created
- [ ] Persistence service created
- [ ] Debounce utility created
- [ ] Hydration hook created
- [ ] Loading screen created
- [ ] App entry point updated
- [ ] WindowsContext updated with persistence
- [ ] Manual testing completed
- [ ] Integration tests written

---

## Common Issues

### App data directory not created
Ensure `fs::create_dir_all` is called before any file operations.

### JSON serialization mismatch
Verify `#[serde(rename_all = "camelCase")]` is consistent between Rust and TypeScript.

### Debounce not working
Check that the debounce function is memoized with `useMemo` to prevent recreation.

### State not persisting on close
Ensure `flush()` is called on debounced save when the app is closing.
