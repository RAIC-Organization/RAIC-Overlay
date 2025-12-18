# Feature Specification: TipTap Notes Component

**Feature Branch**: `008-tiptap-notes-component`
**Created**: 2025-12-18
**Status**: Draft
**Input**: User description: "Create a new component for Notes, this component implement https://tiptap.dev/docs version 3 (latest) for the user can write notes in a windows, add a menu button for add windows notes in the system, when the system is in interactive mode the tiptap auto show the toolbar for editing, when is in non-interactive mode the tiptap auto hide his toolbar, each window the user opens from the menu maintains its own instance state, when the user closes this state is lost with all the data"

## Clarifications

### Session 2025-12-18

- Q: Where should the formatting toolbar be positioned relative to the editor content? → A: Toolbar positioned above the editor content (standard layout)
- Q: Which button group should the Notes button belong to in the main menu? → A: Restructure menu to single group containing Notes (first) and Test Windows (second); remove Option 1, 2, 3 placeholder buttons

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Open Notes Window from Menu (Priority: P1)

As a user, I want to click a "Notes" button in the main menu to open a new Notes window, so that I can quickly create a note-taking workspace within the overlay.

**Why this priority**: This is the foundational capability that enables the entire Notes feature. Without the ability to create Notes windows via the menu, no other functionality can be accessed.

**Independent Test**: Can be fully tested by clicking the "Notes" button in the main menu (while in interaction mode) and verifying a new window appears containing the TipTap rich text editor.

**Acceptance Scenarios**:

1. **Given** the overlay is in interaction mode (F5 active), **When** I click the "Notes" button in the main menu, **Then** a new window opens centered on screen with the title "Notes" containing the TipTap editor
2. **Given** I have one Notes window open, **When** I click the "Notes" button again, **Then** a second independent Notes window opens with its own empty editor
3. **Given** multiple Notes windows are open, **When** I type content in one window, **Then** the content appears only in that specific window (not in other Notes windows)

---

### User Story 2 - Edit Notes with Toolbar in Interaction Mode (Priority: P2)

As a user in interaction mode, I want to see and use the TipTap formatting toolbar, so that I can format my notes with bold, italic, headings, lists, and other rich text features.

**Why this priority**: Rich text editing capabilities are essential for a useful Notes feature but depend on the window being created first (P1).

**Independent Test**: Can be tested by opening a Notes window, entering interaction mode, and verifying the toolbar is visible and functional for formatting text.

**Acceptance Scenarios**:

1. **Given** a Notes window is open and interaction mode is active, **When** I view the editor, **Then** I see a formatting toolbar with common text editing options
2. **Given** the toolbar is visible in interaction mode, **When** I select text and click a formatting button (e.g., Bold), **Then** the selected text is formatted accordingly
3. **Given** I am typing in the editor, **When** I use the toolbar controls, **Then** formatting is applied to my text in real-time
4. **Given** I have formatted text in the editor, **When** I continue typing after the formatted text, **Then** I can choose to continue or discontinue the formatting

---

### User Story 3 - View Notes in Non-Interaction Mode (Priority: P3)

As a user in non-interaction mode, I want the toolbar to be hidden so that my notes are displayed cleanly without editing controls, allowing me to read my notes without visual clutter.

**Why this priority**: Clean display mode enhances usability but the core Notes functionality works without it.

**Independent Test**: Can be tested by creating a Notes window with content, then pressing F5 to exit interaction mode and observing that the toolbar disappears while content remains visible.

**Acceptance Scenarios**:

1. **Given** a Notes window is open with content and the toolbar is visible, **When** I press F5 to exit interaction mode, **Then** the toolbar hides automatically and only the note content is displayed
2. **Given** a Notes window is in non-interaction mode without toolbar, **When** I press F5 to enter interaction mode, **Then** the toolbar appears automatically for editing
3. **Given** I am in non-interaction mode viewing notes, **When** I observe the window, **Then** the note content remains fully readable (not editable)

---

### User Story 4 - Notes Content Lost on Window Close (Priority: P4)

As a user, I understand that when I close a Notes window, all content in that window is permanently lost, so that each Notes session is treated as temporary/ephemeral.

**Why this priority**: This is intentional behavior per requirements - notes are session-only. Lower priority as it's the default behavior when closing windows.

**Independent Test**: Can be tested by creating a Notes window, adding content, closing the window, and verifying the content cannot be recovered.

**Acceptance Scenarios**:

1. **Given** a Notes window has content, **When** I close the window using the close button, **Then** all content in that window is permanently lost
2. **Given** I closed a Notes window with content, **When** I open a new Notes window, **Then** it starts empty with no recovery of previous content
3. **Given** multiple Notes windows are open, **When** I close one window, **Then** the other windows retain their independent content

---

### Edge Cases

- What happens when the user opens many Notes windows simultaneously? Each window operates independently; system supports at least 10 concurrent Notes windows.
- What happens if the user pastes very large amounts of text? The editor accepts the content but may show scrollbars within the window content area. No upper limit on content size within reasonable memory constraints.
- What happens when interaction mode toggles rapidly? Toolbar visibility transitions smoothly without flickering or content loss.
- What happens when the window is resized very small? The editor adapts to available space; toolbar may wrap or show overflow indicators at very small sizes.
- What happens if the user tries to edit content in non-interaction mode? The editor content is read-only in non-interaction mode; no editing is possible.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST restructure the main menu to contain a single button group with two buttons: "Notes" (first position) and "Test Windows" (second position)
- **FR-002**: System MUST remove the placeholder buttons (Option 1, Option 2, Option 3) and their original groupings from the main menu
- **FR-003**: System MUST create a new Notes window via the existing window event system when the Notes button is clicked
- **FR-004**: Notes window MUST contain a TipTap v3 rich text editor as its content component
- **FR-005**: Each Notes window MUST maintain its own independent editor state (content, cursor position, formatting)
- **FR-006**: TipTap editor MUST display a formatting toolbar positioned above the editor content when the system is in interaction mode
- **FR-007**: TipTap editor MUST hide the formatting toolbar when the system is in non-interaction mode
- **FR-008**: Toolbar visibility MUST automatically synchronize with the system's interaction mode state
- **FR-009**: Editor MUST support basic text formatting: bold, italic, underline, strikethrough
- **FR-010**: Editor MUST support heading levels (H1, H2, H3)
- **FR-011**: Editor MUST support bulleted and numbered lists
- **FR-012**: Editor MUST support text alignment (left, center, right)
- **FR-013**: When a Notes window is closed, all content MUST be permanently discarded (no persistence)
- **FR-014**: Editor content MUST be editable only when in interaction mode
- **FR-015**: Editor content MUST be read-only (view only) when in non-interaction mode
- **FR-016**: Notes windows MUST use the existing windows system for display, positioning, and management
- **FR-017**: Multiple Notes windows MUST be openable simultaneously, each as an independent instance

### Key Entities

- **NotesComponent**: A React component wrapping the TipTap editor, managing toolbar visibility based on interaction mode, and containing the editor state
- **TipTap Editor Instance**: The rich text editor instance for each Notes window, holding the content and formatting state
- **Toolbar**: The TipTap formatting toolbar containing text formatting controls, conditionally visible based on interaction mode
- **Notes Menu Button**: A button in the main menu that emits a window open event for creating Notes windows

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Users can open a new Notes window within 1 second of clicking the Notes menu button
- **SC-002**: Toolbar visibility changes within 100ms of interaction mode toggle
- **SC-003**: Text formatting operations (bold, italic, etc.) apply within 50ms of user action
- **SC-004**: System supports at least 10 concurrent Notes windows without performance degradation
- **SC-005**: 100% of Notes window close actions result in complete content loss (no persistence)
- **SC-006**: 100% of Notes windows start with an empty editor and functional toolbar (in interaction mode)
- **SC-007**: Users can successfully format text using all toolbar options on first attempt

## Assumptions

- The windows system (007-windows-system) is fully implemented and functional, providing window creation, management, and the event-based opening mechanism
- The main menu component (006-main-menu-component) exists and supports adding new buttons
- The interaction mode state (F5 toggle) is accessible to components for conditional rendering
- TipTap v3 is compatible with the existing React 19.x and Next.js stack
- The existing overlay container provides sufficient space for Notes windows with toolbars
- No data persistence is required - notes are intentionally ephemeral per user request
