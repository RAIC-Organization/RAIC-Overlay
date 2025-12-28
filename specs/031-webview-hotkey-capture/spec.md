# Feature Specification: Webview Hotkey Capture

**Feature Branch**: `031-webview-hotkey-capture`
**Created**: 2025-12-28
**Status**: Draft
**Input**: User description: "Fix a behaviour that occur in interactive mode when the webview is focus, the webview capture the F3 and F5 keys and this are not reach the tauri low level hotkey, so we need to back the behaviour to capture the F3 and F5 keys from the webview when is focuses (in interactive mode) prevent the default behavior and send the event to the backend for change the modes"

## Problem Statement

When the overlay is in interactive mode (windowed) and the user focuses on the webview (the main React application), pressing F3 or F5 keys does not trigger the expected overlay behavior:

- **F3**: Should toggle overlay visibility (show/hide)
- **F5**: Should toggle overlay mode (click-through/interactive)

This occurs because the focused webview captures and consumes the key events before they reach the Tauri low-level keyboard hook. The low-level hook only reliably intercepts keys when the webview is not focused.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - F3 Toggle Visibility in Focused Webview (Priority: P1)

A user is actively interacting with the overlay in interactive mode (e.g., editing notes, using the browser, or drawing). They want to quickly hide the overlay by pressing F3 without clicking outside the webview first.

**Why this priority**: This is the core functionality that is currently broken. Users expect F3 to always toggle visibility regardless of where focus is, matching the behavior when the overlay is not focused.

**Independent Test**: Can be fully tested by focusing any interactive element in the webview (e.g., Notes editor) and pressing F3. The overlay should hide immediately.

**Acceptance Scenarios**:

1. **Given** the overlay is visible in interactive mode with focus on a Notes window, **When** the user presses F3, **Then** the overlay hides within 200ms and the visibility toggle event is sent to the backend
2. **Given** the overlay is visible in interactive mode with focus on the Browser webview, **When** the user presses F3, **Then** the overlay hides and the browser find dialog does not open (default F3 behavior is prevented)
3. **Given** the overlay is hidden, **When** the user presses F3, **Then** the overlay becomes visible (existing behavior via low-level hook continues to work)

---

### User Story 2 - F5 Toggle Mode in Focused Webview (Priority: P1)

A user is actively interacting with the overlay and wants to quickly switch to click-through mode by pressing F5 to see the underlying application without moving their hands from the keyboard.

**Why this priority**: Equally critical as F3 - both hotkeys are essential for seamless overlay control during active use.

**Independent Test**: Can be fully tested by focusing any interactive element and pressing F5. The overlay should switch to fullscreen (click-through) mode.

**Acceptance Scenarios**:

1. **Given** the overlay is in interactive mode with focus on a Draw window, **When** the user presses F5, **Then** the overlay switches to click-through mode (fullscreen) and becomes non-interactive
2. **Given** the overlay is in interactive mode with focus on the main menu, **When** the user presses F5, **Then** the mode toggles and the default browser refresh behavior is prevented
3. **Given** the overlay is in click-through mode, **When** the user presses F5, **Then** the overlay returns to interactive mode (existing behavior via low-level hook continues to work)

---

### User Story 3 - Debouncing Remains Consistent (Priority: P2)

A user rapidly presses F3 or F5 multiple times. The system should debounce these inputs to prevent rapid toggling, matching the existing 200ms debounce behavior in the low-level keyboard hook.

**Why this priority**: Important for consistent user experience but secondary to basic functionality.

**Independent Test**: Can be tested by pressing F3 rapidly 5 times within 500ms. Only 2-3 toggles should occur (matching debounce timing).

**Acceptance Scenarios**:

1. **Given** the overlay is visible in interactive mode, **When** the user presses F3 twice within 100ms, **Then** only one visibility toggle occurs
2. **Given** the overlay is in interactive mode, **When** the user presses F5 three times within 150ms, **Then** only one mode toggle occurs

---

### Edge Cases

- What happens when F3/F5 is pressed during an animation transition? The key event should be processed normally; the animation state does not block hotkey handling.
- How does the system handle F3/F5 when a modal dialog is open (e.g., error modal)? The hotkey should still function to allow the user to hide/dismiss the overlay.
- What happens if the webview is focused but the overlay is already hidden? The F3 press should be handled by the existing low-level hook (webview not visible = not capturing keys).
- How does this interact with components that use F3/F5 for other purposes? Standard browser behavior (F5 = refresh) must be explicitly prevented; no overlay components should use F3/F5 for other purposes.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST capture F3 key events at the webview level when the overlay is in interactive mode and webview is focused
- **FR-002**: System MUST capture F5 key events at the webview level when the overlay is in interactive mode and webview is focused
- **FR-003**: System MUST prevent default browser behavior for F3 and F5 keys when captured (specifically preventing F5 page refresh)
- **FR-004**: System MUST emit the same events (`toggle-visibility` for F3, `toggle-mode` for F5) as the existing low-level keyboard hook or invoke the same backend commands directly
- **FR-005**: System MUST apply the same 200ms debounce logic as the existing keyboard hook to prevent rapid toggling
- **FR-006**: System MUST NOT interfere with the existing low-level keyboard hook when the webview is not focused or overlay is in click-through mode
- **FR-007**: System MUST handle key events during component animations gracefully (process normally without blocking)
- **FR-008**: System MUST log key capture events for debugging consistency with the existing keyboard hook logs

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Users can toggle overlay visibility using F3 regardless of webview focus state with no perceptible delay (under 200ms response time)
- **SC-002**: Users can toggle overlay mode using F5 regardless of webview focus state with no perceptible delay (under 200ms response time)
- **SC-003**: Pressing F5 while the webview is focused never triggers a page refresh
- **SC-004**: The existing low-level keyboard hook continues to function correctly when the webview is not focused (no regression)
- **SC-005**: Key debouncing behavior is consistent whether keys are captured via webview or low-level hook (200ms debounce window)
- **SC-006**: Debug logs clearly indicate which capture mechanism (webview or low-level hook) processed the key event

## Assumptions

- The Tauri webview supports standard DOM keyboard event handling (`keydown` events)
- The existing `toggle-visibility` and `toggle-mode` events emitted from the backend can be reused, or the frontend can invoke the same backend commands directly
- The 200ms debounce constant is acceptable for the webview-level capture (matching the backend hook)
- No other overlay components use F3 or F5 for any purpose (verified by codebase analysis: only PDF renderer references hotkeys but not F3/F5)
