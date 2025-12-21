# Feature Specification: Image Viewer with Zoom Support

**Feature Branch**: `017-image-viewer-zoom`
**Created**: 2025-12-20
**Status**: Draft
**Input**: User description: "Add a new render for the file viewer component for render images use the img tag with react-zoom-pan-pinch for manage the zoom"

## Clarifications

### Session 2025-12-20

- Q: How should images be sized when first loaded? → A: Fit-to-container (scale to fit within bounds while preserving aspect ratio)

## User Scenarios & Testing *(mandatory)*

### User Story 1 - View Image Files (Priority: P1)

A user wants to view image files within the File Viewer window. They click the "Open File" button, select an image file (PNG, JPG, GIF, etc.), and the image renders in the viewer area. The image initially displays scaled to fit within the container while preserving aspect ratio, allowing the user to see the entire image at once.

**Why this priority**: Image viewing is a fundamental file viewer capability. Users frequently need to reference images (screenshots, diagrams, graphics) while working with the overlay.

**Independent Test**: Can be fully tested by opening any supported image file and verifying it renders correctly within the viewer.

**Acceptance Scenarios**:

1. **Given** a File Viewer window is open, **When** the user clicks "Open File" and selects a PNG image, **Then** the image renders in the viewer area.
2. **Given** a File Viewer window is open, **When** the user clicks "Open File" and selects a JPG/JPEG image, **Then** the image renders in the viewer area.
3. **Given** a File Viewer window is open, **When** the user clicks "Open File" and selects a GIF image, **Then** the image renders in the viewer area.
4. **Given** a File Viewer window is open, **When** the user clicks "Open File" and selects a WebP image, **Then** the image renders in the viewer area.
5. **Given** an image is loaded, **When** the user views the image, **Then** the image is displayed centered within the viewer container.

---

### User Story 2 - Zoom Image with Mouse Wheel (Priority: P2)

A user wants to zoom in or out on an image to see details or get an overview. They use the mouse scroll wheel while hovering over the image to zoom in and out smoothly. The zoom is centered on the mouse cursor position.

**Why this priority**: Zoom functionality is essential for examining image details or viewing large images at a comfortable scale.

**Independent Test**: Can be fully tested by loading an image and using the mouse wheel to zoom in and out, verifying smooth zoom behavior.

**Acceptance Scenarios**:

1. **Given** an image is displayed, **When** the user scrolls the mouse wheel up over the image, **Then** the image zooms in smoothly.
2. **Given** an image is displayed, **When** the user scrolls the mouse wheel down over the image, **Then** the image zooms out smoothly.
3. **Given** an image is zoomed in, **When** the user continues scrolling up, **Then** the zoom stops at the maximum zoom level.
4. **Given** an image is displayed at minimum zoom, **When** the user scrolls down, **Then** the zoom stops at the minimum zoom level.
5. **Given** an image is displayed, **When** the user zooms with the mouse wheel, **Then** the zoom is centered around the cursor position.

---

### User Story 3 - Pan Zoomed Image (Priority: P3)

A user has zoomed into an image and wants to navigate to a different part of the image. They click and drag to pan across the zoomed image, allowing them to view different areas without zooming out.

**Why this priority**: Panning is essential for navigating large or zoomed images, allowing users to explore different areas of interest.

**Independent Test**: Can be fully tested by zooming into an image, then clicking and dragging to pan around the image.

**Acceptance Scenarios**:

1. **Given** an image is zoomed in, **When** the user clicks and drags on the image, **Then** the image pans in the direction of the drag.
2. **Given** an image is at 100% zoom or less, **When** the image fits within the container, **Then** panning is limited to prevent moving the image out of view.
3. **Given** the user is panning, **When** they release the mouse button, **Then** the image stays at the current pan position.

---

### User Story 4 - Double-Click to Reset View (Priority: P4)

A user has zoomed and panned an image and wants to quickly return to the default view. They double-click on the image to reset it to the initial centered position and default zoom level.

**Why this priority**: Provides a quick way to reset the view without having to manually zoom out and re-center, improving user experience.

**Independent Test**: Can be fully tested by zooming/panning an image, then double-clicking to verify it resets to default view.

**Acceptance Scenarios**:

1. **Given** an image is zoomed in and panned, **When** the user double-clicks on the image, **Then** the image resets to the default zoom level.
2. **Given** an image is zoomed in and panned, **When** the user double-clicks on the image, **Then** the image resets to the centered position.

---

### Edge Cases

- What happens when the selected image file is corrupted or has an invalid format?
  - The renderer displays an error message indicating the image could not be loaded, similar to the PDF renderer error handling.
- How does the system handle very large images (e.g., high-resolution photos)?
  - The system loads and displays the image using the native `<img>` tag; performance may vary based on image size and system resources.
- What happens when the image file is being written to or locked by another process?
  - The system attempts to load the image; if it fails, an error message is displayed.
- How does the system handle animated GIFs?
  - Animated GIFs are displayed with their animation playing continuously, as the `<img>` tag natively supports GIF animation.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST render image files (PNG, JPG/JPEG, GIF, WebP, BMP, SVG, ICO) when opened in the File Viewer.
- **FR-002**: System MUST use the native HTML `<img>` tag to display images.
- **FR-003**: System MUST use react-zoom-pan-pinch library to provide zoom and pan functionality.
- **FR-004**: System MUST support zooming via mouse wheel scroll.
- **FR-005**: System MUST support panning via click-and-drag when the image is zoomed.
- **FR-006**: System MUST support double-click to reset view to default zoom and center position.
- **FR-007**: System MUST detect image file types based on extension (.png, .jpg, .jpeg, .gif, .webp, .bmp, .svg, .ico).
- **FR-008**: System MUST integrate with the existing File Viewer toolbar zoom controls (zoom in/out buttons should control the image zoom).
- **FR-009**: System MUST initially display images scaled to fit within the container (fit-to-container) while preserving aspect ratio, centered in the viewer.
- **FR-010**: System MUST display an error message if the image fails to load.
- **FR-011**: System MUST support the existing zoom level range (10% to 200%) consistent with other renderers.
- **FR-012**: System MUST persist the zoom level between sessions, consistent with other file types.

### Key Entities

- **ImageRenderer**: New renderer component for image files, following the same pattern as PDFRenderer and MarkdownRenderer.
- **FileType**: Extended to include 'image' type for image file detection.
- **Supported Image Extensions**: PNG, JPG, JPEG, GIF, WebP, BMP, SVG, ICO.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Users can open and view an image file within 1 second of file selection for images under 10MB.
- **SC-002**: Zoom operations respond within 50 milliseconds of user input.
- **SC-003**: Pan operations are smooth with no visible lag during drag movements.
- **SC-004**: 100% of supported image file types (.png, .jpg, .jpeg, .gif, .webp, .bmp, .svg, .ico) are correctly detected and rendered using the image renderer.
- **SC-005**: Toolbar zoom controls successfully update the image zoom level within 100 milliseconds.
- **SC-006**: Image zoom level is correctly restored in 100% of application restarts when the file still exists.

## Assumptions

- The existing File Viewer window infrastructure and persistence system from feature 016 is fully implemented and functional.
- The react-zoom-pan-pinch library will be added as a new dependency to the project.
- The `detectFileType` function in `src/types/persistence.ts` will be extended to detect image file types.
- The `FileType` type will be extended to include 'image' as a valid type.
- The file dialog filters will be updated to include image file extensions.
- The ImageRenderer component will follow the same props pattern as PDFRenderer and MarkdownRenderer (filePath, zoom).
- Images will be loaded using Tauri file system APIs and converted to a data URL or blob URL for display in the `<img>` tag.
- The zoom level from react-zoom-pan-pinch will be synchronized with the toolbar zoom percentage display.
