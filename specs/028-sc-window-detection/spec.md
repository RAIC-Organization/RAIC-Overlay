# Feature Specification: Star Citizen Window Detection Enhancement

**Feature Branch**: `028-sc-window-detection`
**Created**: 2025-12-23
**Status**: Draft
**Input**: User description: "Implement the same detection method that the ArkanisOverlay for a correct implementation over Star Citizen and add more backend log about fire event by keys and app detection"

## Clarifications

### Session 2025-12-23

- Q: Should detection parameters be hardcoded or user-configurable via settings.toml? → A: Make all three configurable (process name, window class, window title) via settings.toml for advanced users

## Problem Statement

The current overlay window detection system fails to reliably detect and attach to Star Citizen when running in borderless fullscreen mode. The existing implementation uses only window title substring matching, which is insufficient for games like Star Citizen that may have multiple windows with similar names (launcher, crash handler, main game). Additionally, the focus detection silently fails without logging, making debugging difficult.

### Current Issues

1. **Single-point window matching**: Only checks window title, missing RSI Launcher or other windows
2. **Silent focus check failure**: When Star Citizen is detected but focus check fails, no feedback is provided
3. **Insufficient logging**: No visibility into hotkey events, window detection attempts, or focus state changes
4. **Missing window class validation**: Star Citizen uses `CryENGINE` window class which is not verified

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Reliable Game Detection (Priority: P1)

As a user, I want the overlay to correctly identify the Star Citizen game window (not the RSI Launcher or other windows) so that the overlay attaches to the correct window every time.

**Why this priority**: This is the core functionality that enables all other overlay features. Without correct window detection, the overlay is unusable with Star Citizen.

**Independent Test**: Can be fully tested by launching Star Citizen with the RSI Launcher open, pressing F3, and verifying the overlay appears over the game window (not the launcher).

**Acceptance Scenarios**:

1. **Given** Star Citizen is running in borderless mode with RSI Launcher also open, **When** user presses F3, **Then** the overlay attaches to the game window (with CryENGINE class), not the launcher
2. **Given** only RSI Launcher is running (no game), **When** user presses F3, **Then** an error modal displays indicating the game is not running
3. **Given** Star Citizen is running, **When** user presses F3, **Then** the system logs the detected window's process name, window class, and window title

---

### User Story 2 - Hotkey Event Logging (Priority: P2)

As a developer or user debugging issues, I want all hotkey presses (F3, F5) to be logged with their outcomes so that I can understand what the overlay is doing when keys are pressed.

**Why this priority**: Logging is essential for diagnosing issues without requiring code changes or debugging sessions.

**Independent Test**: Can be tested by pressing F3/F5 in various states and reviewing log file for corresponding entries.

**Acceptance Scenarios**:

1. **Given** the overlay application is running, **When** F3 is pressed, **Then** the log file contains an entry showing "F3 pressed" with timestamp and current overlay state
2. **Given** the overlay application is running, **When** F5 is pressed, **Then** the log file contains an entry showing "F5 pressed" with timestamp and mode transition details
3. **Given** Star Citizen is running but not focused, **When** F3 is pressed, **Then** the log shows "Target window found but not focused" with the focused window information

---

### User Story 3 - Window Detection Logging (Priority: P2)

As a developer debugging detection issues, I want detailed logs about window detection attempts including process name, window class, and window title so that I can identify why detection might be failing.

**Why this priority**: Detailed window detection logs enable rapid diagnosis of detection issues without code modifications.

**Independent Test**: Can be tested by triggering window detection and examining logs for complete detection information.

**Acceptance Scenarios**:

1. **Given** the overlay attempts to find a target window, **When** a window matches the title pattern, **Then** the log includes: process name, window class, window title, and whether it passed all validation checks
2. **Given** multiple windows match the title pattern, **When** detection runs, **Then** the log shows all candidates evaluated with their validation results
3. **Given** no matching window is found, **When** detection runs, **Then** the log indicates "No matching window found" with the search pattern used

---

### User Story 4 - Focus State Logging (Priority: P3)

As a user, I want to see in logs why the overlay didn't appear when I pressed F3, specifically whether it was due to the target window not being focused.

**Why this priority**: Focus issues are the most common reason for overlay not appearing; logging makes this transparent.

**Independent Test**: Can be tested by pressing F3 while Star Citizen is running but Alt-Tabbed away, then checking logs.

**Acceptance Scenarios**:

1. **Given** Star Citizen is running but not focused, **When** F3 is pressed, **Then** the log clearly states "Target detected but not focused - overlay not shown" with foreground window information
2. **Given** Star Citizen is running and focused, **When** F3 is pressed, **Then** the log states "Target focused - showing overlay"

---

### User Story 5 - Automatic Game Launch Detection (Priority: P2)

As a user, I want the overlay to automatically detect when Star Citizen launches and be ready to attach, so I don't have to manually time my F3 press or restart the overlay after launching the game.

**Why this priority**: This eliminates user friction - users currently must ensure the overlay is running before the game, or restart the overlay. Automatic detection makes the workflow seamless.

**Independent Test**: Can be fully tested by starting the overlay first, then launching Star Citizen, and verifying the overlay detects the game without user intervention.

**Acceptance Scenarios**:

1. **Given** the overlay is running and Star Citizen is not running, **When** the user launches Star Citizen and the game window appears, **Then** the system logs "Target process detected: StarCitizen.exe" and begins monitoring for window creation
2. **Given** the overlay is running and monitoring for the game, **When** the Star Citizen game window (CryENGINE class) is created and gains focus, **Then** the overlay automatically shows (same as if F3 was pressed)
3. **Given** Star Citizen is already running when overlay starts, **When** the overlay initializes, **Then** it detects the existing game window and is ready for F3 activation
4. **Given** the overlay is attached to Star Citizen, **When** the game process exits, **Then** the overlay hides and logs "Target process terminated" and resumes monitoring for game launch

---

### Edge Cases

- What happens when Star Citizen window title changes during gameplay (e.g., crash handler)?
  - System should re-validate window class to confirm it's still the game
- How does system handle multiple monitors?
  - Overlay should attach to the same monitor as the game window
- What happens if StarCitizen.exe is running but window hasn't appeared yet?
  - System should indicate "process running but window not ready" and continue monitoring until window appears
- What happens if user has a window titled "Star Citizen Guide" open?
  - Three-point verification should reject it (wrong process, wrong class)
- What happens if Star Citizen crashes and restarts?
  - System should detect process exit, hide overlay, then detect new process launch and re-attach
- What happens if user manually hides overlay (F3) while auto-detection is active?
  - Manual F3 hide should be respected; auto-show only triggers on fresh game launch or when game regains focus after being unfocused
- What is the polling/detection interval for process monitoring?
  - System should check for process start/stop at reasonable intervals (e.g., every 1-2 seconds) to balance responsiveness with CPU usage

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST detect Star Citizen using three-point verification: process name, window class, and window title (all three configurable via settings.toml with defaults: `StarCitizen.exe`, `CryENGINE`, `Star Citizen`)
- **FR-002**: System MUST verify the detected window is a top-level window (not a child window)
- **FR-003**: System MUST log all F3 key press events with timestamp, current overlay state, and outcome
- **FR-004**: System MUST log all F5 key press events with timestamp, mode before, and mode after
- **FR-005**: System MUST log window detection attempts with: search pattern, number of candidates found, and for each candidate: process name, window class, window title, and validation result
- **FR-006**: System MUST log focus state when showing overlay: whether target is focused, and if not, what window is focused instead
- **FR-007**: System MUST show error modal when game process is found but game window is not yet ready
- **FR-008**: System MUST use case-insensitive matching for window title
- **FR-009**: System MUST prioritize CryENGINE window class matches over other matches when multiple candidates exist
- **FR-010**: System MUST log at DEBUG level for routine detection, INFO level for key events, WARN level for detection failures
- **FR-011**: System MUST support optional settings.toml fields (`target_process_name`, `target_window_class`, `target_window_title`) with Star Citizen defaults when not specified
- **FR-012**: System MUST automatically monitor for target process (StarCitizen.exe) launch when overlay starts
- **FR-013**: System MUST detect when target process exits and hide the overlay, then resume monitoring for process launch
- **FR-014**: System MUST log process lifecycle events: "Target process detected", "Target process terminated", "Monitoring for target process"
- **FR-015**: System MUST automatically show overlay when target game window is created and gains focus (unless user has manually hidden via F3)
- **FR-016**: System MUST respect manual user hide (F3) - auto-show only on fresh game launch or focus regain, not continuously
- **FR-017**: System MUST use configurable polling interval for process monitoring (default: 1 second) to balance responsiveness with resource usage

### Key Entities

- **TargetWindow**: Represents a candidate window with process name, window class, window title, and HWND
- **DetectionResult**: Outcome of window detection including success/failure, matched window (if any), and list of all candidates evaluated
- **HotkeyEvent**: Record of a hotkey press including key code, timestamp, and resulting action
- **ProcessMonitorState**: Current state of process monitoring including: is_monitoring, target_process_found, last_check_time, user_manually_hidden

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Overlay correctly attaches to Star Citizen game window in 100% of test cases where game is running and focused (currently failing)
- **SC-002**: Overlay correctly rejects RSI Launcher and other non-game windows in 100% of test cases
- **SC-003**: All F3/F5 key presses result in a corresponding log entry within 50ms of the key press
- **SC-004**: Users can diagnose overlay detection issues using only log file information without developer assistance
- **SC-005**: Window detection completes in under 100ms to maintain responsive hotkey handling
- **SC-006**: Overlay automatically detects game launch within 2 seconds of the game window appearing
- **SC-007**: Overlay automatically hides within 2 seconds of game process termination
- **SC-008**: Process monitoring uses less than 1% CPU during idle monitoring (no game running)

## Assumptions

- Default detection values (`StarCitizen.exe`, `CryENGINE`, `Star Citizen`) work for standard Star Citizen installations
- Advanced users may override detection parameters via settings.toml for edge cases or future game updates
- Users have log level set to at least INFO to see key event logs
- The settings.toml file will include three new optional fields: `target_process_name`, `target_window_class`, `target_window_title`

## Out of Scope

- Support for other games (this is specifically for Star Citizen)
- Hot-reload of detection settings (requires app restart)
- GUI for viewing logs in real-time
- Automatic overlay launch when game starts (overlay must already be running)
