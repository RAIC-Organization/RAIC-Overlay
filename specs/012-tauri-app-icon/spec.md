# Feature Specification: Tauri App Icon Update

**Feature Branch**: `012-tauri-app-icon`
**Created**: 2025-12-20
**Status**: Draft
**Input**: User description: "change the tauri app icon for the new icon in the nextjs app, check the tauri documentation to know how to generate the image, don't remove the icon from the nextjs app"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Unified App Icon Branding (Priority: P1)

As a user, when I launch the RAICOverlay application, I see the same branded icon in the Windows taskbar, title bar, and system tray as I see within the app's UI, creating a consistent visual identity.

**Why this priority**: Visual brand consistency is essential for professional appearance and user recognition. The current Tauri default icons create a disconnect between the in-app branding and the system-level branding.

**Independent Test**: Can be fully tested by building the application and verifying the icon appears correctly in the Windows taskbar, title bar, and application window, matching the existing in-app icon.

**Acceptance Scenarios**:

1. **Given** the application is installed on Windows, **When** the user views the app in the taskbar, **Then** they see the branded RAIC icon (matching `src/assets/icon.png`)
2. **Given** the application window is open, **When** the user looks at the window title bar, **Then** the small icon in the title bar matches the branded RAIC icon
3. **Given** the application is running, **When** the user views the system tray, **Then** the tray icon displays the branded RAIC icon

---

### User Story 2 - Icon Quality Across Resolutions (Priority: P2)

As a user on any display configuration (standard DPI or high-DPI), I see a crisp, clear application icon without pixelation or blurriness.

**Why this priority**: High-DPI displays are increasingly common, and blurry icons create a poor user experience and unprofessional impression.

**Independent Test**: Can be verified by checking the application icon at various zoom levels and on high-DPI displays to confirm sharpness.

**Acceptance Scenarios**:

1. **Given** the application is displayed on a standard 100% DPI screen, **When** viewing the taskbar icon, **Then** the icon appears sharp and clear
2. **Given** the application is displayed on a 200% DPI (high-resolution) screen, **When** viewing the taskbar icon, **Then** the icon appears sharp without pixelation

---

### Edge Cases

- What happens if the source icon is smaller than required sizes? The generation should fail with a clear error message indicating minimum size requirements
- What happens if the source icon is not square? The Tauri CLI will reject the icon and provide guidance on the requirement

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST use the existing `src/assets/icon.png` as the single source of truth for generating all Tauri app icons
- **FR-002**: System MUST NOT modify or remove the existing `src/assets/icon.png` file used by the Next.js AppIcon component
- **FR-003**: System MUST generate all required Windows icon formats (.ico with layers for 16, 24, 32, 48, 64, and 256 pixels)
- **FR-004**: System MUST generate all required PNG icon sizes for Windows Store (Square30x30, Square44x44, Square71x71, Square89x89, Square107x107, Square142x142, Square150x150, Square284x284, Square310x310, StoreLogo)
- **FR-005**: System MUST generate macOS .icns file for cross-platform build compatibility
- **FR-006**: System MUST generate standard PNG sizes (32x32, 64x64, 128x128, 128x128@2x, icon.png) for desktop platforms
- **FR-007**: System MUST place all generated icons in `src-tauri/icons/` directory, replacing existing default icons
- **FR-008**: System MUST use the Tauri CLI `icon` command for generating icons from the source PNG

### Key Entities

- **Source Icon**: The original branded icon at `src/assets/icon.png` (must be square PNG with transparency, minimum 512x512 pixels recommended)
- **Generated Icon Set**: Collection of platform-specific icons in various sizes and formats stored in `src-tauri/icons/`
- **Tauri Configuration**: `src-tauri/tauri.conf.json` that references the icons in the build process

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: All icon files in `src-tauri/icons/` are replaced with versions derived from the Next.js app icon
- **SC-002**: The Windows .ico file contains proper layers for all required sizes (16, 24, 32, 48, 64, 256 pixels)
- **SC-003**: Running `npm run tauri build` produces an executable with the correct branded icon visible in Windows taskbar
- **SC-004**: The Next.js app continues to display its icon correctly via the AppIcon component without any changes to that code path
- **SC-005**: Visual comparison confirms the taskbar/title bar icon matches the in-app icon appearance

## Assumptions

- The existing source icon `src/assets/icon.png` is square and has transparency (as expected by Tauri CLI)
- The source icon is at least 512x512 pixels to ensure quality at larger sizes (if smaller, the Tauri CLI will still generate icons but quality may be reduced)
- The Tauri CLI `icon` command is available via `npm run tauri icon`
- No changes are needed to `tauri.conf.json` as it already references the default icon paths in `src-tauri/icons/`

## Out of Scope

- Custom icons for mobile platforms (Android/iOS) - desktop-only focus
- Animated or dynamic icons
- Icon theming (dark/light variants)
- Changes to the in-app AppIcon component or its behavior
