# Feature Specification: File Viewer Window

**Feature Branch**: `016-file-viewer-window`
**Created**: 2025-12-20
**Status**: Draft
**Input**: User description: "Create a new app like Notes, Draw and Browser but for open files, this new app FileViewerWindow have a toolbar for open files and make zoom like the browser app, and inside have diferente file reader render component for each type supported, in this initial approach we will have two file reader reender one for PDFs using PDF.js for makrdown using the read-markdown, use context7 for research the best pattern for this renders, this new FileViewerWindow need to persist between sesions with the path of the file opened, the type and the zoom, when the component is loaded if the file don't exist present an error file not forund inside the render (a file reader render error)"

## Clarifications

### Session 2025-12-20

- Q: How should multi-page PDFs be navigated? → A: Continuous scroll (all pages rendered in scrollable container)

## User Scenarios & Testing *(mandatory)*

### User Story 1 - View PDF Files (Priority: P1)

A user wants to view PDF documents within the overlay application. They click to create a new File Viewer window, use the toolbar to select and open a PDF file from their local filesystem, and view the PDF content rendered inside the window. They can zoom in and out to adjust the viewing size.

**Why this priority**: PDF viewing is a core use case for file viewers. PDFs are widely used for documentation, manuals, and reference materials that users need while working with the overlay.

**Independent Test**: Can be fully tested by opening any PDF file and verifying it renders correctly with zoom controls functional.

**Acceptance Scenarios**:

1. **Given** a File Viewer window is open, **When** the user clicks the "Open File" button and selects a PDF file, **Then** the PDF content renders in the viewer area.
2. **Given** a PDF is displayed in the viewer, **When** the user clicks the zoom in button, **Then** the PDF content increases in size proportionally.
3. **Given** a PDF is displayed in the viewer, **When** the user clicks the zoom out button, **Then** the PDF content decreases in size proportionally.
4. **Given** a PDF is displayed, **When** the user checks the zoom percentage indicator, **Then** it shows the current zoom level accurately.
5. **Given** a multi-page PDF is displayed, **When** the user scrolls within the viewer, **Then** all pages are accessible in a continuous scrollable view.

---

### User Story 2 - View Markdown Files (Priority: P2)

A user wants to view Markdown documents within the overlay application. They open a File Viewer window, select a Markdown file, and see the rendered Markdown content (headings, bold, italic, lists, code blocks, etc.) displayed in the viewer with proper formatting.

**Why this priority**: Markdown is the second most common format for documentation and notes. Supporting Markdown enables users to view README files, documentation, and formatted text files.

**Independent Test**: Can be fully tested by opening a Markdown file and verifying all common Markdown elements render correctly.

**Acceptance Scenarios**:

1. **Given** a File Viewer window is open, **When** the user opens a Markdown file (.md), **Then** the Markdown content renders with proper formatting (headings, bold, italic, lists, code blocks).
2. **Given** a Markdown file is displayed, **When** the user zooms in or out, **Then** the rendered Markdown content scales accordingly.

---

### User Story 3 - Session Persistence (Priority: P3)

A user has opened a file in the File Viewer and configured their preferred zoom level. When they close and reopen the application, the File Viewer window restores with the same file path, detected file type, and zoom level as before.

**Why this priority**: Persistence ensures users don't lose their work context across sessions, consistent with how Browser, Notes, and Draw windows already persist their state.

**Independent Test**: Can be fully tested by opening a file, adjusting zoom, closing the application, reopening it, and verifying state restoration.

**Acceptance Scenarios**:

1. **Given** a File Viewer window with an open file, **When** the application is closed and reopened, **Then** the window reappears with the same file loaded.
2. **Given** a File Viewer window with a custom zoom level, **When** the application is closed and reopened, **Then** the zoom level is preserved.
3. **Given** a File Viewer window with a file that has been moved or deleted, **When** the application is reopened, **Then** the viewer displays a "File not found" error message in the content area.

---

### User Story 4 - File Type Detection (Priority: P4)

The system automatically detects the file type when a user opens a file and selects the appropriate renderer. If the file type is not supported, the system displays an appropriate message.

**Why this priority**: Automatic type detection provides a seamless user experience without requiring users to manually specify file types.

**Independent Test**: Can be fully tested by opening files with different extensions and verifying the correct renderer is used.

**Acceptance Scenarios**:

1. **Given** the user selects a file with `.pdf` extension, **When** the file opens, **Then** the PDF renderer is used automatically.
2. **Given** the user selects a file with `.md` or `.markdown` extension, **When** the file opens, **Then** the Markdown renderer is used automatically.
3. **Given** the user selects a file with an unsupported extension, **When** the file opens, **Then** an "Unsupported file type" message is displayed.

---

### Edge Cases

- What happens when the selected file is too large to render efficiently?
  - The system should attempt to render the file; performance may degrade for very large files. No specific size limit is enforced in this initial implementation.
- How does the system handle a file that is corrupted or has invalid content?
  - The respective renderer (PDF or Markdown) displays an error message within the content area indicating the file could not be parsed.
- What happens when the user opens a file while another file is already open?
  - The new file replaces the currently open file in the same window.
- How does the system handle files with ambiguous extensions (e.g., no extension)?
  - Files without a recognized extension are treated as unsupported, displaying an "Unsupported file type" message.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST provide a File Viewer window type that can be created from the main menu, consistent with Notes, Draw, and Browser windows.
- **FR-002**: System MUST display a toolbar with an "Open File" button that opens a native file picker dialog.
- **FR-003**: System MUST display zoom controls (zoom in, zoom out, zoom percentage display) in the toolbar, similar to the Browser window.
- **FR-004**: System MUST render PDF files using PDF.js library when a PDF file is opened, displaying all pages in a continuous scrollable view.
- **FR-005**: System MUST render Markdown files using react-markdown library when a Markdown file is opened.
- **FR-006**: System MUST automatically detect file type based on file extension (.pdf for PDF, .md/.markdown for Markdown).
- **FR-007**: System MUST display a "File not found" error message within the content area when the persisted file path no longer exists on disk.
- **FR-008**: System MUST display an "Unsupported file type" error message when a file with an unrecognized extension is selected.
- **FR-009**: System MUST persist the file path, detected file type, and zoom level between sessions.
- **FR-010**: System MUST restore the file viewer state (file path, type, zoom) when the application restarts.
- **FR-011**: System MUST update the persisted state when the user opens a new file or changes the zoom level.
- **FR-012**: System MUST support zoom levels from 10% to 200%, with 10% increments, consistent with the Browser window.
- **FR-013**: System MUST display a placeholder state when no file is open (e.g., "No file selected. Click 'Open File' to select a file.").

### Key Entities

- **FileViewerState**: Represents the persisted state of a File Viewer window, containing file path (string), file type (enum: pdf, markdown, unknown), and zoom level (number 10-200).
- **FileRenderer**: Abstract concept for file type-specific rendering components (PDFRenderer, MarkdownRenderer, ErrorRenderer).
- **FileViewerWindow**: A window instance of type 'fileviewer' following the existing WindowInstance pattern from the windows system.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Users can open and view a PDF file within 3 seconds of file selection.
- **SC-002**: Users can open and view a Markdown file within 2 seconds of file selection.
- **SC-003**: Zoom level changes are reflected visually within 100 milliseconds.
- **SC-004**: File Viewer state (path, type, zoom) is correctly restored in 100% of application restarts when the file still exists.
- **SC-005**: 100% of missing files display the "File not found" error message when the application restarts.
- **SC-006**: 100% of files with .pdf extension are rendered using the PDF renderer.
- **SC-007**: 100% of files with .md or .markdown extension are rendered using the Markdown renderer.

## Assumptions

- The application has access to the local filesystem through Tauri's file dialog and file reading APIs (already established in the codebase).
- PDF.js (pdfjs-dist) will be used for PDF rendering, following the canvas-based rendering pattern from the library documentation.
- react-markdown will be used for Markdown rendering, following the simple component pattern from the library documentation.
- The existing persistence system (state.json + window-{id}.json pattern) will be extended to support the new FileViewer content type.
- The existing WindowsContext and PersistenceContext patterns will be followed for state management.
- Zoom behavior will follow the same pattern as the Browser window (10-200%, 10% increments, scale transform).
- The toolbar pattern will follow the BrowserToolbar component structure.
- Default zoom level will be 100% (different from Browser's 50% default, as files benefit from full-size viewing).
