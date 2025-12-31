# Feature Specification: Sync Webview Hotkeys with Backend Settings

**Feature Branch**: `042-sync-webview-hotkeys`
**Created**: 2025-12-31
**Status**: Draft
**Input**: User description: "The current setting panel permit to change the default F3 and F5 hotkeys, and this work for the low level tauri code, but don't work when the overlay webview is focused, this still use F3 and F5 for default, fix the hotkeys implementation on the front app to use the same keys that the backend for default and setting changes"

## Problem Statement

The application has two hotkey capture mechanisms:
1. **Backend (Rust)**: Low-level keyboard hook that correctly reads user-configured hotkeys from settings
2. **Frontend (Webview)**: Hook that captures keyboard events but is hardcoded to F3/F5 only

When users change hotkeys in the Settings Panel (e.g., from F3 to Ctrl+O), the backend correctly applies the new hotkey, but the frontend webview continues to only capture the hardcoded F3/F5 keys. This creates an inconsistent experience where:
- Hotkeys work correctly when the webview is NOT focused (backend handles it)
- Hotkeys do NOT work when the webview IS focused (frontend still expects F3/F5)

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Configured Hotkeys Work When Overlay is Focused (Priority: P1)

As a user, I want my configured hotkeys to work consistently regardless of whether the overlay window is focused, so that I can reliably toggle the overlay and switch modes using my preferred key combinations.

**Why this priority**: This is the core issue - users configure custom hotkeys but they don't work when interacting with the overlay. This blocks the primary use case of custom hotkey configuration.

**Independent Test**: Can be fully tested by configuring a custom hotkey (e.g., Ctrl+Shift+O), focusing the overlay window, pressing the configured hotkey, and verifying the expected action occurs.

**Acceptance Scenarios**:

1. **Given** a user has configured F3 as the visibility toggle hotkey (default), **When** the user presses F3 while the overlay is focused, **Then** the overlay visibility toggles correctly.

2. **Given** a user has configured Ctrl+Shift+O as the visibility toggle hotkey, **When** the user presses Ctrl+Shift+O while the overlay is focused, **Then** the overlay visibility toggles correctly.

3. **Given** a user has configured F5 as the mode toggle hotkey (default), **When** the user presses F5 while the overlay is focused, **Then** the overlay mode toggles between interactive and click-through.

4. **Given** a user has configured Alt+M as the mode toggle hotkey, **When** the user presses Alt+M while the overlay is focused, **Then** the overlay mode toggles correctly.

---

### User Story 2 - Hotkey Changes Apply Immediately to Webview (Priority: P1)

As a user, I want hotkey changes made in the Settings Panel to take effect immediately in the webview, so that I don't need to restart the application or perform additional steps to use my new hotkeys.

**Why this priority**: Without immediate application, users would be confused when their newly configured hotkeys don't work. This is essential for the hotkey configuration feature to feel responsive.

**Independent Test**: Can be fully tested by changing a hotkey in settings while the overlay is focused, then immediately pressing the new hotkey to verify it works.

**Acceptance Scenarios**:

1. **Given** a user is in the Settings Panel with F3 as the visibility toggle, **When** the user changes it to Ctrl+O and saves, **Then** pressing Ctrl+O in the focused overlay immediately toggles visibility.

2. **Given** a user just changed the visibility toggle from F3 to Ctrl+O, **When** the user presses F3 in the focused overlay, **Then** nothing happens (old hotkey no longer active).

3. **Given** a user changes the mode toggle from F5 to Shift+F5, **When** the user presses Shift+F5 in the focused overlay, **Then** the mode toggles correctly.

---

### User Story 3 - Correct Defaults on Fresh Start (Priority: P2)

As a user, I want the overlay to start with the correct default hotkeys (F3 for visibility, F5 for mode) on first launch, and to load my saved hotkey preferences on subsequent launches.

**Why this priority**: Ensures consistent behavior between first-time users and returning users. Lower priority because most users won't notice this - they'll configure their preferences immediately.

**Independent Test**: Can be tested by launching the application for the first time (or with cleared settings) and verifying F3/F5 work when overlay is focused.

**Acceptance Scenarios**:

1. **Given** a fresh installation with no saved settings, **When** the application starts and the overlay is focused, **Then** F3 toggles visibility and F5 toggles mode.

2. **Given** a user previously configured Ctrl+O for visibility toggle, **When** the application restarts and the overlay is focused, **Then** Ctrl+O toggles visibility (not F3).

---

### User Story 4 - Hotkeys with Modifiers Work Correctly (Priority: P2)

As a user, I want to use hotkey combinations with modifier keys (Ctrl, Shift, Alt), so that I can choose key combinations that don't conflict with other applications.

**Why this priority**: Modifier support expands the range of available hotkey combinations, making the feature more flexible. Essential for power users but not blocking basic functionality.

**Independent Test**: Can be tested by configuring a hotkey with one or more modifiers and verifying it works when the overlay is focused.

**Acceptance Scenarios**:

1. **Given** a user configures Ctrl+F3 as the visibility toggle, **When** the user presses Ctrl+F3 while overlay is focused, **Then** visibility toggles.

2. **Given** a user configures Ctrl+Shift+Alt+V as the visibility toggle, **When** the user presses all modifiers plus V while overlay is focused, **Then** visibility toggles.

3. **Given** a user configures Ctrl+F3 as the visibility toggle, **When** the user presses only F3 (without Ctrl) while overlay is focused, **Then** nothing happens.

---

### Edge Cases

- **What happens when** the user configures a hotkey that conflicts with browser shortcuts (e.g., Ctrl+R)?
  - The application should prevent this conflict during configuration (existing validation) and the configured hotkey should take precedence within the overlay.

- **What happens when** the user rapidly presses the hotkey multiple times?
  - The system should debounce inputs appropriately (200ms) to prevent unintended multiple triggers.

- **What happens when** the settings file is corrupted or missing hotkey data?
  - The system should fall back to default hotkeys (F3/F5) and continue functioning.

- **What happens when** the user changes hotkeys while the overlay is minimized/hidden?
  - Changes should still be applied and work correctly when the overlay becomes visible/focused again.

- **What happens when** both backend hook and frontend capture detect the same keypress?
  - The system should prevent double-triggering of the same action.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: Frontend webview MUST load hotkey configuration from saved settings on application startup.
- **FR-002**: Frontend webview MUST listen for hotkey configuration change events from the backend.
- **FR-003**: Frontend webview MUST update its hotkey capture to use newly configured keys immediately when settings change.
- **FR-004**: Frontend webview MUST capture keyboard events matching the configured hotkey (key code plus required modifiers).
- **FR-005**: Frontend webview MUST ignore keyboard events that match only the key code but not the required modifiers.
- **FR-006**: Backend MUST emit a notification event when hotkey settings are successfully updated.
- **FR-007**: Frontend MUST stop capturing the old hotkey combination when a new one is configured.
- **FR-008**: System MUST use default hotkeys (F3 for visibility, F5 for mode) when no configuration exists.
- **FR-009**: System MUST prevent the same action from triggering twice when both backend and frontend capture the same keypress. Specifically, the same toggle action MUST NOT execute more than once within a 200ms window for a single physical keypress.

### Key Entities

- **HotkeySettings**: Represents a user's hotkey settings including visibility toggle hotkey and mode toggle hotkey, each with a key code and optional modifier flags (Ctrl, Shift, Alt). (Maps to existing `HotkeySettings` type in `src/types/user-settings.ts`)
- **hotkeys-updated Event**: A Tauri event emitted by the backend when hotkey configuration changes, with `HotkeySettings` as the payload.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: User-configured hotkeys work correctly when the overlay webview is focused, with 100% consistency with behavior when the webview is not focused.
- **SC-002**: Hotkey changes made in the Settings Panel take effect within 500ms without requiring application restart.
- **SC-003**: All modifier key combinations (Ctrl, Shift, Alt, and combinations thereof) are correctly captured and validated by the frontend.
- **SC-004**: Default hotkeys (F3/F5) work on first application launch before any configuration is saved.
- **SC-005**: No double-triggering of actions occurs when both backend and frontend hotkey systems are active.

## Assumptions

- The existing backend low-level keyboard hook implementation is correct and will continue to work as expected (no changes needed to `keyboard_hook.rs`).
- The existing settings persistence system correctly saves and loads hotkey configuration.
- The existing hotkey validation in the Settings Panel prevents invalid or conflicting hotkey configurations.
- The 200ms debounce timing used in the backend is appropriate and should be matched in the frontend.
