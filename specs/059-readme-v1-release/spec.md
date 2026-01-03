# Feature Specification: README v1.0.0 Release Refactor

**Feature Branch**: `059-readme-v1-release`
**Created**: 2026-01-03
**Status**: Draft
**Input**: User description: "Refactor README.md for end-users with app logo header, Ko-fi button, in-game donation link, feature descriptions, installation guide, controls section, windows/widgets list, screenshots, MIT license, and update version to 1.0.0"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - First-Time User Discovers RAIC Overlay (Priority: P1)

A potential user visits the GitHub repository and wants to quickly understand what RAIC Overlay is, see it in action, and learn how to install it without technical complexity.

**Why this priority**: This is the primary entry point for all users. If users cannot quickly understand and install the overlay, they will leave. The README is the project's first impression.

**Independent Test**: Can be fully tested by visiting the GitHub repository page and verifying the README displays clearly with logo, description, screenshots, and a single-click download link.

**Acceptance Scenarios**:

1. **Given** a user lands on the GitHub repository page, **When** they view the README, **Then** they see the app logo prominently displayed in the header
2. **Given** a user is viewing the README, **When** they scroll to the screenshots section, **Then** they see the in-game overlay screenshot and settings panel screenshot
3. **Given** a user wants to install the overlay, **When** they follow the installation section, **Then** they find a direct link to download the latest release installer

---

### User Story 2 - User Learns Basic Controls (Priority: P2)

A user who has installed RAIC Overlay wants to understand the basic keyboard shortcuts and controls to start using the overlay effectively.

**Why this priority**: After installation, users need to know how to operate the overlay. Without clear controls documentation, users cannot use the product.

**Independent Test**: Can be fully tested by reading the controls section and verifying all keyboard shortcuts are clearly documented with their functions.

**Acceptance Scenarios**:

1. **Given** a user is reading the README, **When** they navigate to the controls section, **Then** they see a clear list of keyboard shortcuts (F3 for toggle visibility, F5 for toggle mode)
2. **Given** a user is reading the controls section, **When** they view the description of each control, **Then** they understand what action each control performs

---

### User Story 3 - User Explores Available Features (Priority: P2)

A user wants to know what windows and widgets are available in the overlay before or after installation to understand the full feature set.

**Why this priority**: Feature discovery helps users get maximum value from the overlay and understand its capabilities.

**Independent Test**: Can be fully tested by reading the windows/widgets section and verifying each feature has a brief, clear description.

**Acceptance Scenarios**:

1. **Given** a user is exploring features, **When** they read the windows section, **Then** they see descriptions of Notes, Draw, Browser, and File Viewer windows
2. **Given** a user is exploring features, **When** they read the widgets section, **Then** they see descriptions of Clock, Session Timer, and Chronometer widgets

---

### User Story 4 - User Wants to Support the Project (Priority: P3)

A user who enjoys RAIC Overlay wants to support the developer through donations or in-game tips.

**Why this priority**: Support options should be visible but not intrusive. This enables sustainability for the project.

**Independent Test**: Can be fully tested by locating the Ko-fi button and in-game tip information in the README.

**Acceptance Scenarios**:

1. **Given** a user wants to donate, **When** they see the support section, **Then** they find a Ko-fi button that links to the developer's Ko-fi page
2. **Given** a user prefers in-game support, **When** they read below the Ko-fi button, **Then** they see the in-game tip option with the developer's Star Citizen nickname "braindaamage" linked to their RSI profile

---

### User Story 5 - User Checks License Information (Priority: P3)

A user wants to verify the licensing terms before using or distributing the overlay.

**Why this priority**: License clarity is important for transparency and legal compliance.

**Independent Test**: Can be fully tested by locating the MIT license section at the bottom of the README.

**Acceptance Scenarios**:

1. **Given** a user wants to check the license, **When** they scroll to the bottom of the README, **Then** they find a clear MIT license statement

---

### Edge Cases

- What happens if a screenshot image fails to load? The README should use descriptive alt text.
- What happens if the release download link becomes outdated? The link should point to the "latest release" page rather than a specific version.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: README MUST display the app logo (from src/assets) centered at the top as a header
- **FR-002**: README MUST include version badge showing "v1.0.0" status and a "Windows 11" platform badge
- **FR-003**: README MUST display the Ko-fi donation button using the provided HTML: `<a href='https://ko-fi.com/Y8Y01QVRYF' target='_blank'><img height='36' style='border:0px;height:36px;' src='https://storage.ko-fi.com/cdn/kofi3.png?v=6' border='0' alt='Buy Me a Coffee at ko-fi.com' /></a>`
- **FR-004**: README MUST include text below Ko-fi button: "or send me a aUEC Tip in game to my nickname" with "braindaamage" as a clickable link to https://robertsspaceindustries.com/en/citizens/braindaamage
- **FR-005**: README MUST include a short description section explaining the overlay is for Star Citizen
- **FR-006**: README MUST provide installation instructions linking to the latest release page at https://github.com/RAIC-Organization/RAIC-Overlay/releases/latest
- **FR-007**: README MUST include a controls section documenting F3 (show/hide) and F5 (toggle mode) shortcuts
- **FR-008**: README MUST list all available windows with brief descriptions: Notes, Draw, Browser, File Viewer
- **FR-009**: README MUST list all available widgets with brief descriptions: Clock, Session Timer, Chronometer
- **FR-010**: README MUST include a screenshots section displaying both images from the /screenshots folder (overlay.png and settings.png)
- **FR-011**: README MUST include MIT license section at the bottom with standard MIT license text
- **FR-012**: README MUST NOT include technical build instructions or development setup (remove all npm/cargo commands)
- **FR-013**: package.json version field MUST be updated from "0.1.0" to "1.0.0"
- **FR-014**: src-tauri/Cargo.toml version field MUST be updated from "0.1.0" to "1.0.0"
- **FR-015**: tauri.conf.json version field MUST be updated to "1.0.0" if present

### Key Entities

- **README.md**: Primary documentation file for end-users, containing logo, support links, features, installation, controls, and license
- **package.json**: Node.js package configuration with version field
- **Cargo.toml**: Rust package configuration with version field
- **Screenshots**: Two image files (overlay.png, settings.png) to be embedded in README

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A new user can understand what RAIC Overlay does within 30 seconds of viewing the README
- **SC-002**: A new user can download and install the overlay by following README instructions in under 2 minutes
- **SC-003**: All keyboard shortcuts are documented and findable within 10 seconds
- **SC-004**: All windows and widgets are listed with descriptions that fit on a single line each
- **SC-005**: The README renders correctly on GitHub with all images and links functional
- **SC-006**: Version numbers show "1.0.0" consistently across package.json, Cargo.toml, and README badges

## Assumptions

- The app logo exists at a suitable location in the repository assets (app-icon.png or similar)
- The screenshots in /screenshots folder are suitable for public display
- The GitHub repository is located at https://github.com/RAIC-Organization/RAIC-Overlay
- Users will download the MSI installer from GitHub releases (not build from source)
- The MIT license is the desired open-source license for this project
