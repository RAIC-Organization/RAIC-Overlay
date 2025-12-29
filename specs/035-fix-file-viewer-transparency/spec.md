# Feature Specification: Fix File Viewer Window Transparency in Non-Interactive Mode

**Feature Branch**: `035-fix-file-viewer-transparency`
**Created**: 2025-12-29
**Status**: Draft
**Input**: User description: "When use the File windows app and load a document and set the background transparent on true, the windows still have a background in non interactive mode, fix this"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - View Documents with Transparent Background (Priority: P1)

As a user viewing documents in the overlay, I want the File Viewer window to respect the "background transparent" setting in non-interactive mode so that I can see through the document viewer to the application underneath while still reading my reference materials.

**Why this priority**: This is the core bug being fixed. Users expect the transparency toggle to work consistently across all window types, and the File Viewer is a key window type for reference materials during gameplay.

**Independent Test**: Can be fully tested by opening a File Viewer, loading any supported file (PDF, Markdown, or image), enabling background transparency, then pressing F3 to enter non-interactive mode and verifying the window background is see-through.

**Acceptance Scenarios**:

1. **Given** a File Viewer window with a PDF loaded and background transparency enabled, **When** the user enters non-interactive mode (F3), **Then** the window background becomes fully transparent, showing only the document content.

2. **Given** a File Viewer window with a Markdown file loaded and background transparency enabled, **When** the user enters non-interactive mode, **Then** the window background becomes fully transparent while the text remains readable.

3. **Given** a File Viewer window with an image loaded and background transparency enabled, **When** the user enters non-interactive mode, **Then** the window background becomes fully transparent with only the image visible.

4. **Given** a File Viewer window with background transparency disabled, **When** the user enters non-interactive mode, **Then** the window retains its solid background as expected.

---

### User Story 2 - Consistent Transparency Behavior Across File Types (Priority: P2)

As a user, I want the transparency behavior to work identically for all supported file types (PDF, Markdown, images) so that I have a predictable and consistent experience regardless of what document type I'm viewing.

**Why this priority**: Users should not experience different behaviors based on file type. Consistency builds trust and reduces confusion.

**Independent Test**: Can be tested by opening three File Viewer windows (one each for PDF, Markdown, and image), enabling transparency on all three, entering non-interactive mode, and verifying all three behave identically.

**Acceptance Scenarios**:

1. **Given** multiple File Viewer windows with different file types (PDF, Markdown, image) all with transparency enabled, **When** the user enters non-interactive mode, **Then** all windows display the same transparent behavior.

---

### User Story 3 - Preserve Transparency Setting Across Sessions (Priority: P3)

As a user, I want my transparency setting for each File Viewer window to persist across application restarts so that I don't have to reconfigure it every time I open the app.

**Why this priority**: The transparency setting should already persist via the existing state persistence system. This ensures the fix doesn't break existing persistence functionality.

**Independent Test**: Can be tested by setting transparency on a File Viewer window, closing and reopening the application, and verifying the setting is restored.

**Acceptance Scenarios**:

1. **Given** a File Viewer window with background transparency enabled and a file loaded, **When** the application is closed and reopened, **Then** the window restores with the same transparency setting and file loaded.

---

### Edge Cases

- What happens when no file is selected and transparency is enabled?
  - The "No file selected" placeholder should also respect transparency, displaying without a background
- What happens when a file fails to load and transparency is enabled?
  - The "File Not Found" error display should also respect transparency
- What happens when switching between interactive and non-interactive modes rapidly?
  - The transparency should toggle correctly without visual glitches

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST apply the background transparency setting to File Viewer windows in non-interactive mode when the setting is enabled
- **FR-002**: System MUST remove all internal backgrounds from the File Viewer content area when background transparency is enabled in non-interactive mode
- **FR-003**: System MUST apply transparent background consistently across all renderer types (PDF, Markdown, Image) within the File Viewer
- **FR-004**: System MUST maintain document readability (text contrast, content visibility) when background transparency is enabled
- **FR-005**: System MUST preserve the existing behavior in interactive mode (solid background regardless of transparency setting)
- **FR-006**: System MUST ensure empty states and error states also respect the background transparency setting

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 100% of File Viewer windows with transparency enabled display transparent backgrounds in non-interactive mode
- **SC-002**: Users can see through the File Viewer window to underlying applications while still reading document content
- **SC-003**: All three supported file types (PDF, Markdown, Image) exhibit identical transparency behavior when the setting is enabled
- **SC-004**: Transparency setting persistence continues to work correctly (no regression from existing functionality)
- **SC-005**: Users can toggle between interactive and non-interactive modes without visual artifacts or incorrect transparency states

## Assumptions

- The existing window transparency infrastructure (`backgroundTransparent` prop, persistence system) works correctly and only needs to be propagated to the File Viewer component hierarchy
- The transparency toggle UI in the window header is functioning correctly (this is a rendering bug, not a toggle bug)
- Performance impact of removing backgrounds is negligible
- Document content (text, images, PDF pages) will remain visible and readable against a transparent background due to the underlying content rendering
