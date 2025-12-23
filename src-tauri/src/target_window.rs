// T011: Target window detection and tracking module
// This module provides Windows API integration for finding and tracking target windows
// T013-T014: Updated to use runtime settings instead of compile-time constants

#[cfg(windows)]
use std::cell::Cell;
#[cfg(windows)]
use windows::core::BOOL;
#[cfg(windows)]
use windows::Win32::Foundation::{HWND, LPARAM};
#[cfg(windows)]
use windows::Win32::UI::WindowsAndMessaging::{
    EnumWindows, GetForegroundWindow, GetWindowRect, GetWindowTextW, IsWindow,
};

use crate::settings;
use crate::types::{TargetWindowError, WindowRect};

/// Get the target window name from runtime settings.
/// This function provides a dynamic accessor that replaces the compile-time constant.
pub fn get_target_window_name() -> &'static str {
    &settings::get_settings().target_window_name
}

// Thread-local storage for found window handle and search pattern (to avoid Send issues)
#[cfg(windows)]
thread_local! {
    static FOUND_HWND: Cell<Option<isize>> = const { Cell::new(None) };
    static SEARCH_PATTERN: Cell<Option<*const String>> = const { Cell::new(None) };
}

// T013-T014: Find target window by pattern matching window titles using runtime settings
#[cfg(windows)]
pub fn find_target_window() -> Result<HWND, TargetWindowError> {
    // Get the target window name from settings
    let target_name = get_target_window_name().to_string();
    let target_name_lower = target_name.to_lowercase();

    // Reset the found handle
    FOUND_HWND.with(|f| f.set(None));
    // Store pattern pointer for callback access
    SEARCH_PATTERN.with(|p| p.set(Some(&target_name_lower as *const String)));

    // Callback for EnumWindows
    unsafe extern "system" fn enum_callback(hwnd: HWND, _lparam: LPARAM) -> BOOL {
        // Get window title
        let mut title = [0u16; 512];
        let len = GetWindowTextW(hwnd, &mut title);

        if len > 0 {
            let title_str = String::from_utf16_lossy(&title[..len as usize]);

            // Get pattern from thread-local storage
            let pattern = SEARCH_PATTERN.with(|p| p.get());
            if let Some(pattern_ptr) = pattern {
                let pattern_str = &*pattern_ptr;
                // Case-insensitive substring match
                if title_str.to_lowercase().contains(pattern_str) {
                    FOUND_HWND.with(|f| f.set(Some(hwnd.0 as isize)));
                    // Stop enumeration
                    return BOOL(0);
                }
            }
        }

        // Continue enumeration
        BOOL(1)
    }

    // Enumerate all windows
    unsafe {
        let _ = EnumWindows(Some(enum_callback), LPARAM(0));
    }

    // Clear the pattern pointer
    SEARCH_PATTERN.with(|p| p.set(None));

    // Return found handle or error
    let found = FOUND_HWND.with(|f| f.get());
    if let Some(hwnd_val) = found {
        return Ok(HWND(hwnd_val as *mut std::ffi::c_void));
    }

    Err(TargetWindowError::NotFound {
        pattern: target_name,
    })
}

// T016: Get window rectangle (position and size)
#[cfg(windows)]
pub fn get_window_rect(hwnd: HWND) -> Result<WindowRect, TargetWindowError> {
    unsafe {
        // Validate handle is still valid
        if !IsWindow(Some(hwnd)).as_bool() {
            return Err(TargetWindowError::InvalidHandle);
        }

        let mut rect = windows::Win32::Foundation::RECT::default();
        if GetWindowRect(hwnd, &mut rect).is_ok() {
            Ok(WindowRect {
                x: rect.left,
                y: rect.top,
                width: (rect.right - rect.left) as u32,
                height: (rect.bottom - rect.top) as u32,
            })
        } else {
            Err(TargetWindowError::InvalidHandle)
        }
    }
}

// T017: Check if target window is focused
#[cfg(windows)]
pub fn is_target_focused(hwnd: HWND) -> bool {
    unsafe {
        let foreground = GetForegroundWindow();
        hwnd == foreground
    }
}

// T017: Check if a window handle is still valid
#[cfg(windows)]
pub fn is_window_valid(hwnd: HWND) -> bool {
    unsafe { IsWindow(Some(hwnd)).as_bool() }
}

// Convert HWND to u64 for atomic storage
#[cfg(windows)]
pub fn hwnd_to_u64(hwnd: HWND) -> u64 {
    hwnd.0 as isize as u64
}

// Convert u64 back to HWND
#[cfg(windows)]
pub fn u64_to_hwnd(value: u64) -> HWND {
    HWND(value as isize as *mut std::ffi::c_void)
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_target_window_name_is_set() {
        // Verify the runtime settings return a non-empty target window name
        assert!(!get_target_window_name().is_empty());
    }
}
