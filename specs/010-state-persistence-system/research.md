# Research: State Persistence System

**Feature**: 010-state-persistence-system
**Date**: 2025-12-19

## Research Tasks

### 1. Tauri App Data Directory Access

**Decision**: Use `app.path().app_data_dir()` from Rust backend for file storage location

**Rationale**:
- Tauri 2.x provides `PathResolver` via `app.path()` to get platform-specific app data directories
- Rust backend can use `std::fs` for all file operations (read, write, delete)
- App data directory is automatically scoped to the application's bundle identifier
- Directory must be manually created at runtime using `std::fs::create_dir_all`

**Implementation**:
```rust
// In Tauri command or setup
let app_data_dir = app.path().app_data_dir()
    .expect("Failed to resolve app data directory");

// Ensure directory exists
std::fs::create_dir_all(&app_data_dir)?;

// File paths
let state_file = app_data_dir.join("state.json");
let window_file = app_data_dir.join(format!("window-{}.json", window_id));
```

**Platform Paths**:
- Windows: `C:\Users\<User>\AppData\Roaming\<bundle-id>\`
- macOS: `~/Library/Application Support/<bundle-id>/`
- Linux: `~/.local/share/<bundle-id>/`

**Alternatives Considered**:
- Frontend-only persistence via localStorage: Rejected - doesn't support file-based hybrid approach
- Tauri FS plugin from frontend: Rejected - adds complexity, Rust backend is cleaner for atomic writes

**Sources**: [Tauri File System Plugin](https://v2.tauri.app/plugin/file-system/), [Tauri Discussions #8786](https://github.com/tauri-apps/tauri/discussions/8786)

---

### 2. State Management Approach

**Decision**: Extend existing React Context (`WindowsContext`) with persistence hooks, no Zustand needed

**Rationale**:
- Project already uses React Context + useReducer pattern in `WindowsContext.tsx`
- Adding Zustand would introduce unnecessary dependency and migration effort
- Persistence can be added as a separate service layer that syncs with existing context
- Custom debounce logic is straightforward to implement

**Implementation Pattern**:
```typescript
// New persistence service wraps Tauri invoke calls
const persistenceService = {
  saveState: (state: PersistedState) => invoke('save_state', { state }),
  loadState: () => invoke<PersistedState | null>('load_state'),
  deleteWindowContent: (id: string) => invoke('delete_window_content', { id }),
};

// usePersistence hook handles debouncing and triggers
function usePersistence(state: WindowsState) {
  const debouncedSave = useMemo(
    () => debounce((s) => persistenceService.saveState(serialize(s)), 500),
    []
  );

  useEffect(() => {
    debouncedSave(state);
  }, [state, debouncedSave]);
}
```

**Alternatives Considered**:
- Zustand with persist middleware: Rejected - would require migrating existing context, overkill for this use case
- Zustand with custom Tauri storage: Interesting but adds dependency; custom storage adapter needed regardless
- Redux Toolkit: Rejected - heavy for this project size

**Sources**: [Zustand Persist Middleware](https://zustand.docs.pmnd.rs/integrations/persisting-store-data)

---

### 3. Single Instance Enforcement

**Decision**: Use `tauri-plugin-single-instance` official plugin

**Rationale**:
- Official Tauri plugin specifically for this purpose
- Handles OS-level mutex/lock automatically
- Provides callback when second instance is attempted
- Can emit event to focus existing window

**Implementation**:
```toml
# Cargo.toml
[dependencies]
tauri-plugin-single-instance = "2.0.0"
```

```rust
// lib.rs
use tauri::Manager;

#[derive(Clone, serde::Serialize)]
struct SingleInstancePayload {
    args: Vec<String>,
    cwd: String,
}

fn main() {
    tauri::Builder::default()
        .plugin(tauri_plugin_single_instance::init(|app, argv, cwd| {
            // Focus the existing window
            if let Some(window) = app.get_webview_window("main") {
                let _ = window.set_focus();
                let _ = window.show();
            }
            // Optionally emit event to frontend
            let _ = app.emit("single-instance", SingleInstancePayload {
                args: argv,
                cwd
            });
        }))
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
```

**Alternatives Considered**:
- Manual file lock implementation: Rejected - error-prone, platform-specific edge cases
- Named mutex via windows-rs: Rejected - Windows-only, plugin handles cross-platform

**Sources**: [Tauri Single Instance Plugin](https://github.com/tauri-apps/plugins-workspace/blob/v2/plugins/single-instance/README.md)

---

### 4. Atomic Write Operations

**Decision**: Write to temp file, then rename (atomic on most filesystems)

**Rationale**:
- Standard pattern for preventing corruption during write operations
- Rename is atomic on POSIX systems and Windows NTFS
- If crash occurs during write, old file remains intact
- Rust's `std::fs::rename` handles this cleanly

**Implementation**:
```rust
use std::fs::{self, File};
use std::io::Write;
use std::path::Path;

fn atomic_write(path: &Path, content: &[u8]) -> std::io::Result<()> {
    let temp_path = path.with_extension("json.tmp");

    // Write to temp file
    let mut file = File::create(&temp_path)?;
    file.write_all(content)?;
    file.sync_all()?; // Ensure data is flushed to disk

    // Atomic rename
    fs::rename(&temp_path, path)?;

    Ok(())
}
```

**Alternatives Considered**:
- Direct write without temp file: Rejected - risk of corruption on crash
- Write-ahead logging (WAL): Rejected - overkill for JSON state files
- SQLite for storage: Rejected - adds complexity, JSON files simpler for debugging

---

### 5. Debounce Implementation

**Decision**: Custom debounce utility on frontend, 500ms default delay

**Rationale**:
- 500ms delay specified in requirements for typing/rapid changes
- Different triggers may need different behaviors (immediate vs. debounced)
- Simple implementation with cleanup on unmount

**Implementation**:
```typescript
// lib/debounce.ts
export function debounce<T extends (...args: any[]) => void>(
  fn: T,
  delay: number
): T & { cancel: () => void } {
  let timeoutId: ReturnType<typeof setTimeout> | null = null;

  const debounced = ((...args: Parameters<T>) => {
    if (timeoutId) clearTimeout(timeoutId);
    timeoutId = setTimeout(() => {
      fn(...args);
      timeoutId = null;
    }, delay);
  }) as T & { cancel: () => void };

  debounced.cancel = () => {
    if (timeoutId) clearTimeout(timeoutId);
    timeoutId = null;
  };

  return debounced;
}
```

**Trigger Mapping**:
| Event | Behavior | Delay |
|-------|----------|-------|
| Window creation | Immediate | 0ms |
| Window closure | Immediate | 0ms |
| Overlay mode change | Immediate | 0ms |
| Drag/resize end | Debounced | 500ms |
| Content change (typing) | Debounced | 500ms |

**Alternatives Considered**:
- lodash.debounce: Rejected - no need for external dependency
- Use requestIdleCallback: Considered - but timing less predictable than setTimeout

---

### 6. State Versioning Strategy

**Decision**: Include version number in state.json, reset to defaults on mismatch, structure for future migrations

**Rationale**:
- Simple integer version in persisted state
- Initial implementation: version mismatch → reset to defaults
- Code structured with migration hooks for future versions

**Implementation**:
```typescript
// types/persistence.ts
interface PersistedState {
  version: number;
  global: GlobalSettings;
  windows: WindowStructure[];
}

const CURRENT_STATE_VERSION = 1;

// Hydration with version check
function hydrateState(persisted: unknown): OverlayState | null {
  if (!isValidPersistedState(persisted)) return null;

  if (persisted.version !== CURRENT_STATE_VERSION) {
    // Future: call migrate(persisted, persisted.version, CURRENT_STATE_VERSION)
    console.warn(`State version mismatch: ${persisted.version} vs ${CURRENT_STATE_VERSION}, resetting`);
    return null; // Reset to defaults
  }

  return deserialize(persisted);
}

// Migration hook structure (for future use)
type Migration = (state: any) => any;
const migrations: Record<number, Migration> = {
  // 1: (state) => ({ ...state, newField: 'default' }),
};
```

**Alternatives Considered**:
- Semantic versioning for state: Rejected - overkill, simple integer sufficient
- No versioning: Rejected - would cause crashes on format changes

---

### 7. Serialization Format for Embedded Applications

**Decision**: TipTap uses JSON (native), Excalidraw uses JSON (elements array)

**Rationale**:
- TipTap editor state is already JSON (`editor.getJSON()`)
- Excalidraw scene is JSON (`excalidrawAPI.getSceneElements()`)
- Both serialize cleanly without custom logic

**Implementation**:
```typescript
// NotesContent serialization
interface NotesContentState {
  type: 'notes';
  content: JSONContent; // TipTap JSON
}

// DrawContent serialization
interface DrawContentState {
  type: 'draw';
  elements: ExcalidrawElement[];
  appState?: Partial<AppState>; // Optional Excalidraw app state
}

// Window content file structure
interface WindowContentFile {
  windowId: string;
  type: 'notes' | 'draw';
  content: NotesContentState | DrawContentState;
  lastModified: string; // ISO timestamp
}
```

**Sources**: TipTap docs (getJSON/setContent), Excalidraw docs (getSceneElements)

---

### 8. Hydration Loading Screen

**Decision**: Simple full-screen loading indicator blocking render until hydration completes

**Rationale**:
- Per clarification: block render until hydrated to prevent visual pop-in
- Target: <2s for typical usage, usually <500ms in practice
- Minimal UI - just loading indicator, no complex splash

**Implementation**:
```typescript
// app/page.tsx
function App() {
  const { isHydrated, error } = useHydration();

  if (!isHydrated) {
    return <LoadingScreen />;
  }

  if (error) {
    // Log error, continue with defaults
    console.error('Hydration failed:', error);
  }

  return <OverlayContent />;
}

// components/LoadingScreen.tsx
function LoadingScreen() {
  return (
    <div className="fixed inset-0 flex items-center justify-center bg-background">
      <div className="animate-pulse text-muted-foreground">Loading...</div>
    </div>
  );
}
```

---

## Summary of Technology Decisions

| Concern | Decision | Rationale |
|---------|----------|-----------|
| Storage Location | Tauri app data dir via Rust | Platform-specific, secure, no frontend permissions needed |
| State Management | Extend existing React Context | Avoid new dependencies, minimal migration |
| Single Instance | tauri-plugin-single-instance | Official plugin, cross-platform |
| Atomic Writes | Temp file + rename | Standard pattern, prevents corruption |
| Debounce | Custom 500ms utility | Simple, matches requirements |
| Versioning | Integer version, reset on mismatch | Simple, migration hooks for future |
| Serialization | Native JSON for TipTap/Excalidraw | Both libraries use JSON natively |
| Loading UX | Blocking splash screen | Per clarification, prevents pop-in |

## Dependencies to Add

**Rust (Cargo.toml)**:
```toml
tauri-plugin-single-instance = "2.0.0"
```

**Frontend (package.json)**:
- No new dependencies required
