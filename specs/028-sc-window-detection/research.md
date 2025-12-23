# Research: Star Citizen Window Detection Enhancement

**Feature**: 028-sc-window-detection
**Date**: 2025-12-23

## Research Tasks

### 1. Windows API for Window Class Detection

**Decision**: Use `GetClassNameW` from `windows::Win32::UI::WindowsAndMessaging`

**Rationale**:
- Part of the same `windows-rs` crate already in use (v0.62)
- Follows same pattern as existing `GetWindowTextW` usage
- Returns window class name (e.g., "CryENGINE" for Star Citizen)

**Implementation Pattern**:
```rust
use windows::Win32::UI::WindowsAndMessaging::GetClassNameW;

fn get_window_class(hwnd: HWND) -> String {
    unsafe {
        let mut class_name = [0u16; 256];
        let len = GetClassNameW(hwnd, &mut class_name);
        if len > 0 {
            String::from_utf16_lossy(&class_name[..len as usize])
        } else {
            String::new()
        }
    }
}
```

**Cargo.toml Change Required**: None - `Win32_UI_WindowsAndMessaging` feature already enabled

**Alternatives Considered**:
- `GetClassInfoExW` - More complex, returns more info than needed
- `RealGetWindowClass` - For DDE compatibility, not needed here

---

### 2. Windows API for Process Name Detection

**Decision**: Use `GetWindowThreadProcessId` + `OpenProcess` + `QueryFullProcessImageNameW`

**Rationale**:
- `GetWindowThreadProcessId` gets PID from window handle (already partially imported)
- `OpenProcess` opens process for querying
- `QueryFullProcessImageNameW` gets the executable path

**Implementation Pattern**:
```rust
use windows::Win32::Foundation::{CloseHandle, HANDLE};
use windows::Win32::System::Threading::{
    OpenProcess, QueryFullProcessImageNameW, PROCESS_NAME_WIN32, PROCESS_QUERY_LIMITED_INFORMATION,
};
use windows::Win32::UI::WindowsAndMessaging::GetWindowThreadProcessId;

fn get_process_name(hwnd: HWND) -> Option<String> {
    unsafe {
        let mut pid: u32 = 0;
        GetWindowThreadProcessId(hwnd, Some(&mut pid));

        if pid == 0 {
            return None;
        }

        let process = OpenProcess(PROCESS_QUERY_LIMITED_INFORMATION, false, pid).ok()?;

        let mut buffer = [0u16; 260]; // MAX_PATH
        let mut size = buffer.len() as u32;

        let result = QueryFullProcessImageNameW(process, PROCESS_NAME_WIN32, &mut buffer, &mut size);
        let _ = CloseHandle(process);

        if result.is_ok() && size > 0 {
            let path = String::from_utf16_lossy(&buffer[..size as usize]);
            // Extract just the filename
            path.rsplit('\\').next().map(|s| s.to_string())
        } else {
            None
        }
    }
}
```

**Cargo.toml Change Required**: Add features to `windows` dependency:
```toml
windows = { version = "0.62", features = [
    "Win32_Foundation",
    "Win32_UI_WindowsAndMessaging",
    "Win32_System_Threading"  # NEW
] }
```

**Alternatives Considered**:
- `sysinfo` crate - Adds external dependency, overkill for single process lookup
- `GetModuleFileNameExW` - Requires `PROCESS_VM_READ` permission, less reliable

---

### 3. Top-Level Window Verification

**Decision**: Use `GetAncestor` with `GA_ROOT` to verify top-level window

**Rationale**:
- ArkanisOverlay uses `IsTopLevelWindow` which compares window to its root ancestor
- If `GetAncestor(hwnd, GA_ROOT) == hwnd`, window is top-level

**Implementation Pattern**:
```rust
use windows::Win32::UI::WindowsAndMessaging::{GetAncestor, GA_ROOT};

fn is_top_level_window(hwnd: HWND) -> bool {
    unsafe {
        let root = GetAncestor(hwnd, GA_ROOT);
        root == hwnd
    }
}
```

**Alternatives Considered**:
- Check `GetParent(hwnd) == NULL` - Less reliable for owned windows
- Check window style flags - More complex, less direct

---

### 4. Process Monitoring for Auto-Detection

**Decision**: Use polling with `EnumProcesses` or process snapshot

**Rationale**:
- Simpler than Windows event hooks
- Existing `focus_monitor.rs` already uses polling pattern (100ms interval)
- 1-second polling interval for process monitoring keeps CPU usage <1%

**Implementation Pattern**:
```rust
use windows::Win32::System::ProcessStatus::EnumProcesses;

fn is_process_running(target_process: &str) -> bool {
    // Check running processes for target
    // Use same pattern as process name detection
}
```

**Alternatives Considered**:
- `WMI` event subscription - Complex, heavyweight
- `SetWinEventHook` for process start - Requires message loop, complex
- Polling is sufficient given 2-second response time requirement

---

### 5. Settings Extension for Configurable Detection Parameters

**Decision**: Extend existing `FileSettings` struct in `settings.rs`

**Rationale**:
- Pattern already established for `target_window_name`
- Follows same optional field with default fallback pattern
- No new configuration mechanism needed

**Implementation Pattern**:
```rust
// In settings.rs FileSettings struct
pub struct FileSettings {
    pub target_window_name: Option<String>,
    pub target_process_name: Option<String>,   // NEW
    pub target_window_class: Option<String>,   // NEW
    pub debug_border: Option<bool>,
    pub log_level: Option<String>,
}

// Defaults in RuntimeSettings
const DEFAULT_PROCESS_NAME: &str = "StarCitizen.exe";
const DEFAULT_WINDOW_CLASS: &str = "CryENGINE";
const DEFAULT_WINDOW_TITLE: &str = "Star Citizen";
```

---

### 6. Logging Best Practices

**Decision**: Use existing `log` crate macros with structured messages

**Rationale**:
- `tauri-plugin-log` already configured
- Follow existing log level conventions in codebase
- Structured format for parseability

**Log Level Guidelines** (from FR-010):
- `DEBUG`: Routine detection cycles, candidate evaluation details
- `INFO`: Key events (F3/F5 pressed, process detected/terminated)
- `WARN`: Detection failures, focus issues

**Message Format Pattern**:
```rust
log::info!("F3 pressed: visible={}, mode={:?}, outcome={}", visible, mode, outcome);
log::debug!("Window candidate: process={}, class={}, title={}, valid={}",
    process_name, window_class, window_title, passes_validation);
log::warn!("Target window found but not focused: foreground={}", foreground_title);
```

---

## Summary of Required Changes

### Cargo.toml
```toml
[target.'cfg(windows)'.dependencies]
windows = { version = "0.62", features = [
    "Win32_Foundation",
    "Win32_UI_WindowsAndMessaging",
    "Win32_System_Threading",      # NEW - for process queries
    "Win32_System_ProcessStatus"   # NEW - for process enumeration
] }
```

### New/Modified Files
| File | Change Type | Description |
|------|-------------|-------------|
| `target_window.rs` | MODIFY | Add three-point verification, window class/process detection |
| `settings.rs` | MODIFY | Add `target_process_name`, `target_window_class` fields |
| `hotkey.rs` | MODIFY | Add logging for F3/F5 press events |
| `lib.rs` | MODIFY | Add logging in `toggle_visibility`/`toggle_mode` |
| `focus_monitor.rs` | MODIFY | Extend for process lifecycle monitoring |
| `types.rs` | MODIFY | Add `WindowCandidate`, `DetectionResult` types |
| `process_monitor.rs` | NEW | Process lifecycle monitoring module |

---

## References

- [windows-rs documentation](https://microsoft.github.io/windows-docs-rs/)
- [ArkanisOverlay GameWindowTracker.cs](https://github.com/ArkanisCorporation/ArkanisOverlay) - Reference implementation
- [Tracking active process in Windows with Rust](https://hellocode.co/blog/post/tracking-active-process-windows-rust/)
