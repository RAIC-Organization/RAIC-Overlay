# Research: External Window Attachment Mode

**Feature**: 004-external-window-attach
**Date**: 2025-12-17
**Status**: Complete

## Research Topics

1. Windows API for window enumeration and focus monitoring
2. Tauri build-time environment variable patterns
3. Window position tracking: polling vs event-driven
4. Tauri window positioning API

---

## 1. Windows API (windows-rs crate)

### Decision
Use the `windows` crate (microsoft/windows-rs) for Windows API access.

### Rationale
- Official Microsoft crate with comprehensive Win32 bindings
- Over 1 million daily downloads, actively maintained (v0.69+ as of 2025)
- Provides type-safe Rust wrappers for all required functions
- Universal raw-dylib support via windows-link crate reduces build complexity

### Required Functions

| Function | Module | Purpose |
|----------|--------|---------|
| `FindWindowW` | `windows::Win32::UI::WindowsAndMessaging` | Find target window by title |
| `EnumWindows` | `windows::Win32::UI::WindowsAndMessaging` | Enumerate all windows for pattern matching |
| `GetWindowTextW` | `windows::Win32::UI::WindowsAndMessaging` | Get window title for pattern matching |
| `GetWindowRect` | `windows::Win32::UI::WindowsAndMessaging` | Get target window position/size |
| `GetForegroundWindow` | `windows::Win32::UI::WindowsAndMessaging` | Detect which window has focus |
| `IsWindow` | `windows::Win32::UI::WindowsAndMessaging` | Validate window handle still exists |

### Cargo.toml Addition

```toml
[dependencies.windows]
version = "0.69"
features = [
    "Win32_Foundation",
    "Win32_UI_WindowsAndMessaging",
]
```

### Alternatives Considered
- `winapi` crate: Older, less ergonomic, requires manual unsafe handling
- Direct FFI: Too low-level, error-prone

### Sources
- [windows-rs Documentation](https://microsoft.github.io/windows-docs-rs/doc/windows/Win32/UI/WindowsAndMessaging/)
- [Rust for Windows - Microsoft Learn](https://learn.microsoft.com/en-us/windows/dev-environment/rust/rust-for-windows)

---

## 2. Build-Time Environment Variables

### Decision
Use Rust's `env!()` macro with a `build.rs` script for compile-time validation.

### Rationale
- `env!()` macro embeds environment variable at compile time (not runtime)
- `build.rs` can fail the build if required variable is missing
- No runtime .env file needed - value baked into binary
- Tauri's build system respects standard Cargo build scripts

### Implementation Pattern

**build.rs:**
```rust
fn main() {
    // Fail build if TARGET_WINDOW_NAME not set
    let target = std::env::var("TARGET_WINDOW_NAME")
        .expect("TARGET_WINDOW_NAME environment variable must be set at build time");

    // Pass to Rust code via cargo
    println!("cargo:rustc-env=TARGET_WINDOW_NAME={}", target);

    // Rerun if env changes
    println!("cargo:rerun-if-env-changed=TARGET_WINDOW_NAME");
}
```

**Usage in Rust:**
```rust
const TARGET_WINDOW_NAME: &str = env!("TARGET_WINDOW_NAME");
```

### Alternatives Considered
- Runtime .env file: Exposes configuration to users, not desired
- tauri.conf.json: Better for runtime config, not compile-time
- `dotenvy_macro` crate: Adds dependency, same result as env!()

### Sources
- [Tauri Environment Variables](https://v2.tauri.app/reference/environment-variables/)
- [GitHub Discussion #2873](https://github.com/tauri-apps/tauri/discussions/2873)

---

## 3. Window Position Tracking Strategy

### Decision
Use `SetWinEventHook` with `EVENT_OBJECT_LOCATIONCHANGE` for event-driven updates, with fallback polling for edge cases.

### Rationale
- **Event-driven is more efficient**: No CPU cycles wasted when target window is stationary
- **Immediate response**: Notified as soon as position changes (no polling interval tradeoff)
- **Low latency**: Can achieve <50ms response target easily
- **Microsoft recommended**: Official solution for monitoring window changes without polling

### Implementation Options

**Option A: win_event_hook crate (Recommended)**
- Safe Rust wrapper around SetWinEventHook
- Manages hook lifecycle automatically
- 8k+ downloads, actively maintained
- crates.io: https://crates.io/crates/win_event_hook

**Option B: wineventhook crate**
- Alternative wrapper with similar functionality
- Includes event filtering utilities
- GitHub: https://github.com/OpenByteDev/wineventhook-rs

**Option C: Direct windows-rs API**
- Use `SetWinEventHook` directly from windows crate
- More control but requires manual hook management
- Good if avoiding additional dependencies

### Recommended Approach

Use `win_event_hook` crate for:
- `EVENT_OBJECT_LOCATIONCHANGE`: Position/size changes
- `EVENT_OBJECT_FOCUS`: Focus changes (for auto-hide)
- `EVENT_OBJECT_DESTROY`: Window closed detection

Filter events to target window's process/thread ID for performance.

### Hybrid Strategy
1. Primary: Event hooks for position, size, focus changes
2. Fallback: 100ms polling timer to catch any missed events
3. Validation: Check target window existence on each event

### Performance Notes
- Event hooks require message loop (Tauri provides this)
- Filter by process ID to reduce callback frequency
- Out-of-context events delivered on hook thread (no cross-thread issues)

### Sources
- [SetWinEventHook - Microsoft Learn](https://learn.microsoft.com/en-us/windows/win32/api/winuser/nf-winuser-setwineventhook)
- [Window Monitoring Without Polling - Old New Thing](https://devblogs.microsoft.com/oldnewthing/20210104-00/?p=104656)
- [win_event_hook crate](https://docs.rs/win_event_hook/latest/win_event_hook/)

---

## 4. Tauri Window Positioning API

### Decision
Use `WebviewWindow::set_position()` and `WebviewWindow::set_size()` for overlay positioning.

### Rationale
- Native Tauri APIs, well-integrated with existing codebase
- Already used in window.rs for current positioning logic
- Support both physical and logical pixels (DPI-aware)
- Available on desktop platforms (Windows target)

### Required Methods

| Method | Purpose | Notes |
|--------|---------|-------|
| `set_position(Position)` | Move overlay to target coords | Uses LogicalPosition or PhysicalPosition |
| `set_size(Size)` | Resize overlay to target size | Uses LogicalSize or PhysicalSize |
| `inner_size()` | Get current overlay size | For scale factor calculation |
| `position()` | Get current overlay position | For state comparison |

### Capability Requirements

Add to `capabilities/default.json`:
```json
{
  "permissions": [
    "core:window:allow-set-position",
    "core:window:allow-set-size"
  ]
}
```

### Coordinate System
- Use `PhysicalPosition` and `PhysicalSize` to match Windows API output
- Windows `GetWindowRect` returns screen coordinates in physical pixels
- Tauri handles DPI scaling internally when using Physical types

### Sources
- [WebviewWindow - Tauri Rust Docs](https://docs.rs/tauri/latest/tauri/webview/struct.WebviewWindow.html)
- [Window - Tauri Rust Docs](https://docs.rs/tauri/latest/tauri/window/struct.Window.html)

---

## Summary of Decisions

| Area | Decision | Dependencies Added |
|------|----------|-------------------|
| Windows API | windows-rs crate | `windows = "0.69"` |
| Build-time config | env!() + build.rs | None |
| Position tracking | Event-driven (SetWinEventHook) | `win_event_hook = "0.4"` |
| Overlay positioning | Tauri native API | Capability permissions |

### New Cargo.toml Dependencies

```toml
[dependencies]
windows = { version = "0.69", features = ["Win32_Foundation", "Win32_UI_WindowsAndMessaging"] }
win_event_hook = "0.4"
```

### Constitution Compliance

| Principle | Status |
|-----------|--------|
| V. Research-First Development | PASS - All decisions documented with rationale and alternatives |
| I. Code Quality | PASS - Using established crates, not reinventing |
| IV. Performance | PASS - Event-driven approach meets <50ms target |
