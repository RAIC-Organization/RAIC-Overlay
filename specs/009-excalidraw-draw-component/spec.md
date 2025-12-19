# Feature Specification: Excalidraw Draw Component

**Feature Branch**: `009-excalidraw-draw-component`
**Created**: 2025-12-19
**Status**: Draft
**Input**: User description: "Create a new App like the Notes but for draw, this v1 of this internal app use excalidraw integrate in the windows for have all the ready tools for draw in a windows, same to Notes add a new button in the menu for open windows for drawing"

## Clarifications

### Session 2025-12-19

- Q: Where should the Draw button be positioned relative to existing menu buttons? → A: Draw button placed after Notes (order: Notes, Draw, Test Windows)

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Open Draw Window from Menu (Priority: P1)

As a user, I want to click a "Draw" button in the main menu to open a new Draw window, so that I can quickly create a drawing workspace within the overlay using Excalidraw's full drawing toolkit.

**Why this priority**: This is the foundational capability that enables the entire Draw feature. Without the ability to create Draw windows via the menu, no other functionality can be accessed.

**Independent Test**: Can be fully tested by clicking the "Draw" button in the main menu (while in interaction mode) and verifying a new window appears containing the Excalidraw drawing canvas with its tools.

**Acceptance Scenarios**:

1. **Given** the overlay is in interaction mode (F5 active), **When** I click the "Draw" button in the main menu, **Then** a new window opens centered on screen with the title "Draw" containing the Excalidraw canvas and drawing tools
2. **Given** I have one Draw window open, **When** I click the "Draw" button again, **Then** a second independent Draw window opens with its own empty canvas
3. **Given** multiple Draw windows are open, **When** I draw in one window, **Then** the drawing appears only in that specific window (not in other Draw windows)

---

### User Story 2 - Draw Using Excalidraw Tools (Priority: P2)

As a user in interaction mode, I want to access and use Excalidraw's full drawing toolkit, so that I can create diagrams, sketches, and visual notes with shapes, lines, text, and freehand drawing.

**Why this priority**: Drawing capabilities are the core value of this feature but depend on the window being created first (P1).

**Independent Test**: Can be tested by opening a Draw window, selecting various tools from the Excalidraw toolbar, and creating drawings on the canvas.

**Acceptance Scenarios**:

1. **Given** a Draw window is open and interaction mode is active, **When** I view the canvas, **Then** I see Excalidraw's toolbar with selection, shapes, lines, arrow, text, and freehand drawing tools
2. **Given** the Excalidraw tools are visible, **When** I select the rectangle tool and draw on the canvas, **Then** a rectangle shape appears on the canvas
3. **Given** I have drawn shapes on the canvas, **When** I use the selection tool to click and drag a shape, **Then** I can move and manipulate the shape
4. **Given** I am drawing with the freehand/pencil tool, **When** I draw strokes on the canvas, **Then** the strokes appear in real-time as I draw

---

### User Story 3 - View Drawings in Non-Interaction Mode (Priority: P3)

As a user in non-interaction mode, I want the Excalidraw toolbar to be hidden so that my drawings are displayed cleanly without editing controls, allowing me to reference my diagrams without visual clutter.

**Why this priority**: Clean display mode enhances usability but the core Draw functionality works without it.

**Independent Test**: Can be tested by creating a Draw window with content, then pressing F5 to exit interaction mode and observing that the toolbar disappears while the drawing remains visible.

**Acceptance Scenarios**:

1. **Given** a Draw window is open with content and the toolbar is visible, **When** I press F5 to exit interaction mode, **Then** the toolbar hides automatically and only the drawing canvas is displayed
2. **Given** a Draw window is in non-interaction mode without toolbar, **When** I press F5 to enter interaction mode, **Then** the toolbar appears automatically for editing
3. **Given** I am in non-interaction mode viewing drawings, **When** I observe the window, **Then** the drawing content remains fully visible and the canvas cannot be edited

---

### User Story 4 - Drawing Content Lost on Window Close (Priority: P4)

As a user, I understand that when I close a Draw window, all content in that window is permanently lost, so that each Draw session is treated as temporary/ephemeral.

**Why this priority**: This is intentional behavior per requirements - drawings are session-only. Lower priority as it's the default behavior when closing windows.

**Independent Test**: Can be tested by creating a Draw window, adding drawings, closing the window, and verifying the content cannot be recovered.

**Acceptance Scenarios**:

1. **Given** a Draw window has drawings, **When** I close the window using the close button, **Then** all drawings in that window are permanently lost
2. **Given** I closed a Draw window with drawings, **When** I open a new Draw window, **Then** it starts with an empty canvas with no recovery of previous content
3. **Given** multiple Draw windows are open, **When** I close one window, **Then** the other windows retain their independent drawings

---

### Edge Cases

- What happens when the user opens many Draw windows simultaneously? Each window operates independently; system supports at least 10 concurrent Draw windows.
- What happens if the user creates very complex drawings with many elements? The canvas accepts the content; performance may degrade with extremely complex drawings (hundreds of elements).
- What happens when interaction mode toggles rapidly? Toolbar visibility transitions smoothly without flickering or content loss.
- What happens when the window is resized very small? The canvas adapts to available space; Excalidraw may show zoom controls or scrollbars. Some tools may be truncated in the toolbar at very small sizes.
- What happens if the user tries to draw in non-interaction mode? The canvas is view-only in non-interaction mode; no drawing or editing is possible.
- What happens when panning/zooming the canvas? Excalidraw's built-in pan and zoom controls function normally in interaction mode; disabled in non-interaction mode.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST add a "Draw" button to the main menu button group positioned after Notes and before Test Windows (order: Notes, Draw, Test Windows)
- **FR-002**: System MUST create a new Draw window via the existing window event system when the Draw button is clicked
- **FR-003**: Draw window MUST contain an Excalidraw canvas as its content component
- **FR-004**: Each Draw window MUST maintain its own independent canvas state (drawings, zoom level, pan position)
- **FR-005**: Excalidraw MUST display its toolbar and UI controls when the system is in interaction mode
- **FR-006**: Excalidraw MUST hide its toolbar and UI controls when the system is in non-interaction mode
- **FR-007**: Toolbar visibility MUST automatically synchronize with the system's interaction mode state
- **FR-008**: Canvas MUST support all standard Excalidraw drawing tools: selection, rectangle, ellipse, diamond, arrow, line, freehand/pencil, text
- **FR-009**: Canvas MUST support Excalidraw's color picker and stroke/fill options
- **FR-010**: Canvas MUST support Excalidraw's undo/redo functionality in interaction mode
- **FR-011**: Canvas MUST support pan and zoom controls in interaction mode
- **FR-012**: When a Draw window is closed, all drawings MUST be permanently discarded (no persistence)
- **FR-013**: Canvas MUST be editable only when in interaction mode
- **FR-014**: Canvas MUST be view-only (read-only) when in non-interaction mode
- **FR-015**: Draw windows MUST use the existing windows system for display, positioning, and management
- **FR-016**: Multiple Draw windows MUST be openable simultaneously, each as an independent instance
- **FR-017**: Excalidraw's default theme MUST adapt to the application's dark theme

### Key Entities

- **DrawComponent**: A React component wrapping the Excalidraw canvas, managing toolbar visibility based on interaction mode, and containing the drawing state
- **Excalidraw Instance**: The drawing canvas instance for each Draw window, holding the drawing elements and canvas state
- **Excalidraw Toolbar**: The drawing tool palette and controls, conditionally visible based on interaction mode
- **Draw Menu Button**: A button in the main menu that emits a window open event for creating Draw windows

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Users can open a new Draw window within 1 second of clicking the Draw menu button
- **SC-002**: Toolbar visibility changes within 100ms of interaction mode toggle
- **SC-003**: Drawing operations (shape creation, freehand drawing) appear on canvas within 50ms of user action
- **SC-004**: System supports at least 10 concurrent Draw windows without performance degradation
- **SC-005**: 100% of Draw window close actions result in complete content loss (no persistence)
- **SC-006**: 100% of Draw windows start with an empty canvas and visible toolbar (in interaction mode)
- **SC-007**: Users can successfully draw using all standard Excalidraw tools on first attempt

## Assumptions

- The windows system (007-windows-system) is fully implemented and functional, providing window creation, management, and the event-based opening mechanism
- The main menu component (006-main-menu-component) exists with the restructured button group from feature 008
- The interaction mode state (F5 toggle) is accessible to components for conditional rendering
- Excalidraw React component (@excalidraw/excalidraw) is compatible with the existing React 19.x and Next.js stack
- The existing overlay container provides sufficient space for Draw windows with Excalidraw UI
- No data persistence is required - drawings are intentionally ephemeral per user request
- Excalidraw provides APIs to hide/show its toolbar programmatically
