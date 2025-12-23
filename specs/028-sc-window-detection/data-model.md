# Data Model: Star Citizen Window Detection Enhancement

**Feature**: 028-sc-window-detection
**Date**: 2025-12-23

## Entities

### WindowCandidate

Represents a window being evaluated during detection.

| Field | Type | Description |
|-------|------|-------------|
| hwnd | u64 | Window handle (stored as u64 for thread safety) |
| process_name | String | Executable name (e.g., "StarCitizen.exe") |
| window_class | String | Window class name (e.g., "CryENGINE") |
| window_title | String | Window title text |
| is_top_level | bool | Whether window is a top-level window |

**Validation Rules**:
- `hwnd` must be non-zero and valid (`IsWindow` returns true)
- `process_name` must be non-empty for valid candidates
- `window_class` must be non-empty for valid candidates

---

### DetectionResult

Outcome of a window detection attempt.

| Field | Type | Description |
|-------|------|-------------|
| success | bool | Whether a valid target window was found |
| matched_window | Option\<WindowCandidate\> | The window that matched (if success) |
| candidates_evaluated | Vec\<WindowCandidate\> | All candidates that were checked |
| search_criteria | SearchCriteria | The criteria used for detection |
| detection_time_ms | u64 | Time taken for detection in milliseconds |

---

### SearchCriteria

Configuration for window detection.

| Field | Type | Description |
|-------|------|-------------|
| process_name | String | Target process name (e.g., "StarCitizen.exe") |
| window_class | String | Target window class (e.g., "CryENGINE") |
| window_title | String | Target window title pattern (e.g., "Star Citizen") |

**Defaults** (Star Citizen):
- `process_name`: "StarCitizen.exe"
- `window_class`: "CryENGINE"
- `window_title`: "Star Citizen"

---

### ProcessMonitorState

State for automatic process lifecycle monitoring.

| Field | Type | Description |
|-------|------|-------------|
| is_monitoring | bool | Whether monitoring thread is active |
| target_process_found | bool | Whether target process is currently running |
| target_hwnd | Option\<u64\> | Current target window handle (if found) |
| last_check_time | u64 | Timestamp of last process check (epoch ms) |
| user_manually_hidden | bool | Whether user explicitly hid overlay via F3 |
| polling_interval_ms | u64 | Interval between process checks |

**State Transitions**:
```
INITIAL -> MONITORING (on startup)
MONITORING -> PROCESS_FOUND (target process detected)
PROCESS_FOUND -> WINDOW_READY (game window with CryENGINE class appears)
WINDOW_READY -> MONITORING (process terminates)
WINDOW_READY -> USER_HIDDEN (user presses F3 to hide)
USER_HIDDEN -> WINDOW_READY (user presses F3 to show, or focus regained)
```

---

### HotkeyEvent

Record of a hotkey press for logging.

| Field | Type | Description |
|-------|------|-------------|
| key_code | String | Key identifier (e.g., "F3", "F5") |
| timestamp | u64 | Epoch timestamp in milliseconds |
| overlay_visible_before | bool | Overlay visibility before action |
| overlay_mode_before | String | Overlay mode before action |
| action_taken | String | Description of action performed |
| outcome | String | Result of the action |

---

## Settings Extension

### FileSettings (settings.toml)

New optional fields added to existing struct:

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| target_process_name | Option\<String\> | "StarCitizen.exe" | Process executable name |
| target_window_class | Option\<String\> | "CryENGINE" | Window class name |
| target_window_title | Option\<String\> | "Star Citizen" | Window title pattern |
| process_monitor_interval_ms | Option\<u64\> | 1000 | Polling interval for process monitoring |

**Example settings.toml**:
```toml
# Window detection settings (optional - defaults to Star Citizen)
target_process_name = "StarCitizen.exe"
target_window_class = "CryENGINE"
target_window_title = "Star Citizen"
process_monitor_interval_ms = 1000

# Existing settings
debug_border = false
log_level = "INFO"
```

---

## Existing Types (Modified)

### TargetWindowError (types.rs)

Add new error variants:

```rust
pub enum TargetWindowError {
    NotFound { pattern: String },           // Existing
    InvalidHandle,                          // Existing
    ProcessNotRunning { process: String },  // NEW: Process exists but not running
    WindowNotReady { process: String },     // NEW: Process running but window not created
    ClassMismatch {                         // NEW: Window found but class doesn't match
        expected: String,
        actual: String,
    },
}
```

---

## Relationships

```
RuntimeSettings (settings.rs)
    └── SearchCriteria (derived from settings)
            └── used by → find_target_window()
                              └── produces → DetectionResult
                                                └── contains → Vec<WindowCandidate>

ProcessMonitorState (process_monitor.rs)
    └── monitors → target process lifecycle
    └── updates → OverlayState.target_binding
    └── emits → Tauri events (target-window-changed, auto-hide-changed)

HotkeyEvent (logged on F3/F5)
    └── recorded by → hotkey.rs handlers
    └── written to → log file via tauri-plugin-log
```

---

## Thread Safety Considerations

- `WindowCandidate.hwnd` stored as `u64` (not raw HWND pointer) for thread safety
- `ProcessMonitorState` uses atomics (`AtomicBool`, `AtomicU64`) for cross-thread access
- Detection runs on background thread, results communicated via Tauri events
- Follows existing pattern from `focus_monitor.rs`
