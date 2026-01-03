// T011: Target window detection and tracking module
// This module provides Windows API integration for finding and tracking target windows
// T013-T022 (028): Updated for three-point verification (process + class + title)

#[cfg(windows)]
use std::cell::Cell;
#[cfg(windows)]
use std::time::Instant;
#[cfg(windows)]
use windows::core::BOOL;
#[cfg(windows)]
use windows::Win32::Foundation::{CloseHandle, HWND, LPARAM};
#[cfg(windows)]
use windows::Win32::System::Threading::{
    OpenProcess, QueryFullProcessImageNameW, PROCESS_NAME_WIN32, PROCESS_QUERY_LIMITED_INFORMATION,
};
#[cfg(windows)]
use windows::Win32::UI::WindowsAndMessaging::{
    EnumWindows, GetAncestor, GetClassNameW, GetForegroundWindow, GetWindowRect, GetWindowTextW,
    GetWindowThreadProcessId, IsWindow, GA_ROOT,
};

use crate::settings;
use crate::core::types::{
    DetectionResult, SearchCriteria, TargetWindowError, WindowCandidate, WindowRect,
};

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
    // T013 (028): Thread-local storage for three-point verification
    static SEARCH_PROCESS: Cell<Option<*const String>> = const { Cell::new(None) };
    static SEARCH_CLASS: Cell<Option<*const String>> = const { Cell::new(None) };
    static CANDIDATES: Cell<Option<*mut Vec<WindowCandidate>>> = const { Cell::new(None) };
}

// T013 (028): Get window class name from HWND
#[cfg(windows)]
pub fn get_window_class(hwnd: HWND) -> String {
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

// T014 (028): Get process name from HWND
#[cfg(windows)]
pub fn get_process_name(hwnd: HWND) -> Option<String> {
    unsafe {
        let mut process_id: u32 = 0;
        GetWindowThreadProcessId(hwnd, Some(&mut process_id));

        if process_id == 0 {
            return None;
        }

        let handle = OpenProcess(PROCESS_QUERY_LIMITED_INFORMATION, false, process_id);
        if let Ok(handle) = handle {
            let mut buffer = [0u16; 260];
            let mut size = buffer.len() as u32;

            if QueryFullProcessImageNameW(
                handle,
                PROCESS_NAME_WIN32,
                windows::core::PWSTR(buffer.as_mut_ptr()),
                &mut size,
            )
            .is_ok()
            {
                let _ = CloseHandle(handle);
                let path = String::from_utf16_lossy(&buffer[..size as usize]);
                // Extract just the filename from the full path
                return path.split('\\').next_back().map(|s| s.to_string());
            }
            let _ = CloseHandle(handle);
        }
        None
    }
}

// T015 (028): Check if window is a top-level window
#[cfg(windows)]
pub fn is_top_level_window(hwnd: HWND) -> bool {
    unsafe {
        let root = GetAncestor(hwnd, GA_ROOT);
        hwnd == root
    }
}

// T016 (028): Get window title from HWND
#[cfg(windows)]
fn get_window_title(hwnd: HWND) -> String {
    unsafe {
        let mut title = [0u16; 512];
        let len = GetWindowTextW(hwnd, &mut title);
        if len > 0 {
            String::from_utf16_lossy(&title[..len as usize])
        } else {
            String::new()
        }
    }
}

// T016 (028): Build a WindowCandidate from HWND
#[cfg(windows)]
pub fn build_window_candidate(hwnd: HWND) -> WindowCandidate {
    WindowCandidate {
        hwnd: hwnd_to_u64(hwnd),
        process_name: get_process_name(hwnd).unwrap_or_default(),
        window_class: get_window_class(hwnd),
        window_title: get_window_title(hwnd),
        is_top_level: is_top_level_window(hwnd),
    }
}

// T018, T021 (028): Validate a candidate against search criteria (case-insensitive)
// Note: No #[cfg(windows)] since this is pure logic without Windows API calls
pub fn validate_candidate(candidate: &WindowCandidate, criteria: &SearchCriteria) -> bool {
    // Process name check (case-insensitive)
    let process_match =
        candidate.process_name.to_lowercase() == criteria.process_name.to_lowercase();

    // Window class check (case-insensitive)
    let class_match = candidate.window_class.to_lowercase() == criteria.window_class.to_lowercase();

    // Title check (case-insensitive substring match)
    let title_match = candidate
        .window_title
        .to_lowercase()
        .contains(&criteria.window_title.to_lowercase());

    // Must be top-level window
    let top_level = candidate.is_top_level;

    process_match && class_match && title_match && top_level
}

// T017, T019, T022, T029-T033 (028): Find target window using three-point verification
// Returns DetectionResult with detailed information about the search
#[cfg(windows)]
pub fn find_target_window_verified() -> DetectionResult {
    // T030: Start timing measurement
    let start_time = Instant::now();

    // Build search criteria from settings
    let criteria = SearchCriteria {
        process_name: settings::get_target_process_name().to_string(),
        window_class: settings::get_target_window_class().to_string(),
        window_title: get_target_window_name().to_string(),
    };

    // T033, T004 (030): Log search criteria at TRACE level (per-poll, verbose)
    log::trace!(
        "Starting window detection: process={}, class={}, title={}",
        criteria.process_name,
        criteria.window_class,
        criteria.window_title
    );

    let mut candidates: Vec<WindowCandidate> = Vec::new();
    let mut matched_window: Option<WindowCandidate> = None;

    // Store candidates pointer for callback access
    CANDIDATES.with(|c| c.set(Some(&mut candidates as *mut Vec<WindowCandidate>)));
    SEARCH_PROCESS.with(|p| p.set(Some(&criteria.process_name as *const String)));
    SEARCH_CLASS.with(|c| c.set(Some(&criteria.window_class as *const String)));
    SEARCH_PATTERN.with(|p| p.set(Some(&criteria.window_title as *const String)));

    // Callback for EnumWindows - collects all potential candidates
    unsafe extern "system" fn enum_callback_verified(hwnd: HWND, _lparam: LPARAM) -> BOOL {
        // Only consider windows with titles
        let mut title = [0u16; 512];
        let len = GetWindowTextW(hwnd, &mut title);

        if len > 0 {
            let candidates_ptr = CANDIDATES.with(|c| c.get());
            if let Some(ptr) = candidates_ptr {
                let candidate = build_window_candidate(hwnd);
                (*ptr).push(candidate);
            }
        }

        // Continue enumeration
        BOOL(1)
    }

    // Enumerate all windows
    unsafe {
        let _ = EnumWindows(Some(enum_callback_verified), LPARAM(0));
    }

    // Clear thread-local storage
    CANDIDATES.with(|c| c.set(None));
    SEARCH_PROCESS.with(|p| p.set(None));
    SEARCH_CLASS.with(|c| c.set(None));
    SEARCH_PATTERN.with(|p| p.set(None));

    // T029, T005 (030): Log each candidate at TRACE level (per-poll, verbose)
    for candidate in &candidates {
        let valid = validate_candidate(candidate, &criteria);
        log::trace!(
            "Window candidate: process={}, class={}, title={}, top_level={}, valid={}",
            candidate.process_name,
            candidate.window_class,
            candidate.window_title,
            candidate.is_top_level,
            valid
        );
    }

    // T022: Find matching candidates, prioritizing CryENGINE class
    let mut cryengine_matches: Vec<&WindowCandidate> = Vec::new();
    let mut other_matches: Vec<&WindowCandidate> = Vec::new();

    for candidate in &candidates {
        if validate_candidate(candidate, &criteria) {
            if candidate.window_class.to_lowercase() == "cryengine" {
                cryengine_matches.push(candidate);
            } else {
                other_matches.push(candidate);
            }
        }
    }

    // Prioritize CryENGINE matches over others
    if let Some(best_match) = cryengine_matches.first().or_else(|| other_matches.first()) {
        matched_window = Some((*best_match).clone());
    }

    // T030: Calculate detection time
    let detection_time_ms = start_time.elapsed().as_millis() as u64;

    // T031, T008 (030): Log detection summary at TRACE level (per-poll, verbose)
    // State change events (process detected/terminated) are logged at INFO by callers
    let match_count = cryengine_matches.len() + other_matches.len();
    log::trace!(
        "Detection complete: {} candidates evaluated, {} matched, time={}ms",
        candidates.len(),
        match_count,
        detection_time_ms
    );

    // T032 (030): Detection failure is logged by callers when user takes action (F3)
    // Removed per-poll warn! to avoid log spam - the F3 handler logs "detection failed"

    DetectionResult {
        success: matched_window.is_some(),
        matched_window,
        candidates_evaluated: candidates,
        search_criteria: criteria,
        detection_time_ms,
    }
}

// T013-T014: Find target window by pattern matching window titles using runtime settings
// (Legacy function - kept for backwards compatibility)
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

// T034 (028): Get foreground window info for focus logging
#[cfg(windows)]
pub fn get_foreground_window_info() -> (String, String) {
    unsafe {
        let foreground = GetForegroundWindow();
        if foreground.0.is_null() {
            return ("(none)".to_string(), "(none)".to_string());
        }
        let process_name = get_process_name(foreground).unwrap_or_else(|| "(unknown)".to_string());
        let window_title = get_window_title(foreground);
        (process_name, window_title)
    }
}

// T017, T035 (028): Check if target window is focused with logging
#[cfg(windows)]
pub fn is_target_focused(hwnd: HWND) -> bool {
    unsafe {
        let foreground = GetForegroundWindow();
        let is_focused = hwnd == foreground;

        // T035, T006 (030): Log focus state at TRACE level (per-poll, verbose)
        if is_focused {
            log::trace!("Target window is focused (hwnd={})", hwnd.0 as isize);
        } else {
            let (fg_process, fg_title) = get_foreground_window_info();
            log::trace!(
                "Target window not focused. Foreground: process={}, title={}",
                fg_process,
                fg_title
            );
        }

        is_focused
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

    // T053 (028): Unit tests for validate_candidate()
    #[test]
    fn test_validate_candidate_exact_match() {
        let candidate = WindowCandidate {
            hwnd: 12345,
            process_name: "StarCitizen.exe".to_string(),
            window_class: "CryENGINE".to_string(),
            window_title: "Star Citizen".to_string(),
            is_top_level: true,
        };

        let criteria = SearchCriteria {
            process_name: "StarCitizen.exe".to_string(),
            window_class: "CryENGINE".to_string(),
            window_title: "Star Citizen".to_string(),
        };

        assert!(validate_candidate(&candidate, &criteria));
    }

    #[test]
    fn test_validate_candidate_case_insensitive() {
        let candidate = WindowCandidate {
            hwnd: 12345,
            process_name: "STARCITIZEN.EXE".to_string(),
            window_class: "cryengine".to_string(),
            window_title: "STAR CITIZEN".to_string(),
            is_top_level: true,
        };

        let criteria = SearchCriteria {
            process_name: "starcitizen.exe".to_string(),
            window_class: "CRYENGINE".to_string(),
            window_title: "star citizen".to_string(),
        };

        assert!(validate_candidate(&candidate, &criteria));
    }

    #[test]
    fn test_validate_candidate_title_substring() {
        let candidate = WindowCandidate {
            hwnd: 12345,
            process_name: "StarCitizen.exe".to_string(),
            window_class: "CryENGINE".to_string(),
            window_title: "Star Citizen - Alpha 3.24.1".to_string(),
            is_top_level: true,
        };

        let criteria = SearchCriteria {
            process_name: "StarCitizen.exe".to_string(),
            window_class: "CryENGINE".to_string(),
            window_title: "Star Citizen".to_string(),
        };

        assert!(validate_candidate(&candidate, &criteria));
    }

    #[test]
    fn test_validate_candidate_wrong_process() {
        let candidate = WindowCandidate {
            hwnd: 12345,
            process_name: "RSI Launcher.exe".to_string(),
            window_class: "CryENGINE".to_string(),
            window_title: "Star Citizen".to_string(),
            is_top_level: true,
        };

        let criteria = SearchCriteria {
            process_name: "StarCitizen.exe".to_string(),
            window_class: "CryENGINE".to_string(),
            window_title: "Star Citizen".to_string(),
        };

        assert!(!validate_candidate(&candidate, &criteria));
    }

    #[test]
    fn test_validate_candidate_wrong_class() {
        let candidate = WindowCandidate {
            hwnd: 12345,
            process_name: "StarCitizen.exe".to_string(),
            window_class: "Qt5QWindowIcon".to_string(),
            window_title: "Star Citizen".to_string(),
            is_top_level: true,
        };

        let criteria = SearchCriteria {
            process_name: "StarCitizen.exe".to_string(),
            window_class: "CryENGINE".to_string(),
            window_title: "Star Citizen".to_string(),
        };

        assert!(!validate_candidate(&candidate, &criteria));
    }

    #[test]
    fn test_validate_candidate_not_top_level() {
        let candidate = WindowCandidate {
            hwnd: 12345,
            process_name: "StarCitizen.exe".to_string(),
            window_class: "CryENGINE".to_string(),
            window_title: "Star Citizen".to_string(),
            is_top_level: false, // Not top-level
        };

        let criteria = SearchCriteria {
            process_name: "StarCitizen.exe".to_string(),
            window_class: "CryENGINE".to_string(),
            window_title: "Star Citizen".to_string(),
        };

        assert!(!validate_candidate(&candidate, &criteria));
    }

    #[test]
    fn test_validate_candidate_title_not_found() {
        let candidate = WindowCandidate {
            hwnd: 12345,
            process_name: "StarCitizen.exe".to_string(),
            window_class: "CryENGINE".to_string(),
            window_title: "Loading...".to_string(),
            is_top_level: true,
        };

        let criteria = SearchCriteria {
            process_name: "StarCitizen.exe".to_string(),
            window_class: "CryENGINE".to_string(),
            window_title: "Star Citizen".to_string(),
        };

        assert!(!validate_candidate(&candidate, &criteria));
    }
}
