# Feature Specification: Header Button Group Separation

**Feature Branch**: `041-header-button-groups`
**Created**: 2025-12-31
**Status**: Draft
**Input**: User description: "Remove the test windows button and component and separate the header group buttons by windows apps and widgets"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Visual Separation of Window Types (Priority: P1)

As a user viewing the main menu, I want to see window creation buttons clearly organized into logical groups (Apps vs Widgets) so I can quickly identify and access the type of window I need.

**Why this priority**: This is the core visual improvement that addresses the main user request. Without clear separation, users must scan all buttons to find what they need.

**Independent Test**: Can be fully tested by opening the overlay and visually confirming that Apps buttons (Notes, Draw, Browser, File Viewer) are visually separated from Widget buttons (Clock).

**Acceptance Scenarios**:

1. **Given** the overlay is visible, **When** I look at the main menu header, **Then** I see Apps buttons grouped together and Widget buttons grouped separately with a visible divider between them.
2. **Given** the main menu is displayed, **When** I scan the button groups, **Then** I can identify which group contains "Apps" and which contains "Widgets" without reading every button label.

---

### User Story 2 - Test Windows Button Removal (Priority: P1)

As a user, I should not see the "Test Windows" button in the main menu since it was only used for development validation and provides no user value.

**Why this priority**: Equally critical as P1 - removing unnecessary UI clutter improves the user experience and reduces confusion.

**Independent Test**: Can be tested by opening the overlay and confirming the "Test Windows" button is no longer visible anywhere in the interface.

**Acceptance Scenarios**:

1. **Given** the overlay is visible, **When** I look at all buttons in the main menu, **Then** I do not see a "Test Windows" button.
2. **Given** I search for ways to open a test window, **When** I explore all menu options, **Then** there is no way to open a test window from the UI.

---

### User Story 3 - Clean Codebase (Priority: P2)

As a developer, the test window component and related code should be removed from the codebase so that unused code doesn't accumulate and cause maintenance overhead.

**Why this priority**: Important for codebase health but not user-facing. The UI changes in P1 stories are more immediately impactful.

**Independent Test**: Can be verified by searching the codebase for TestWindowContent references and confirming none exist.

**Acceptance Scenarios**:

1. **Given** I search the codebase, **When** I look for TestWindowContent component, **Then** the file and all references to it are removed.
2. **Given** I examine the window content types, **When** I review the type definitions, **Then** the "test" content type is removed.

---

### Edge Cases

- What happens when there is only one widget type? The Widgets group should still display with a single Clock button.
- How should the visual divider appear on very narrow screens? The divider should remain visible and not collapse or overlap with buttons.
- What if a user has an existing test window open from a previous session? Test windows are ephemeral and not persisted, so this scenario cannot occur.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST remove the "Test Windows" button from the main menu.
- **FR-002**: System MUST remove the TestWindowContent component file from the codebase.
- **FR-003**: System MUST remove the "test" content type from the WindowContentType type definition.
- **FR-004**: System MUST visually separate window creation buttons into two groups: Apps and Widgets.
- **FR-005**: The Apps group MUST contain: Notes, Draw, Browser, and File Viewer buttons.
- **FR-006**: The Widgets group MUST contain: Clock button.
- **FR-007**: A visual divider MUST be displayed between the Apps group and Widgets group.
- **FR-008**: Both button groups MUST maintain the existing ButtonGroup styling and behavior.
- **FR-009**: System MUST remove any imports or references to TestWindowContent from all files.
- **FR-010**: The visual separation style MUST be consistent with the existing settings section separator (left border style).

### Key Entities

- **ButtonGroup (Apps)**: Container for application window buttons (Notes, Draw, Browser, File Viewer).
- **ButtonGroup (Widgets)**: Container for lightweight widget buttons (Clock).
- **Visual Divider**: Border element separating the Apps and Widgets groups, matching existing UI patterns.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Users can identify the Apps vs Widgets button groups within 2 seconds of viewing the menu.
- **SC-002**: The codebase contains zero references to TestWindowContent or the "test" content type.
- **SC-003**: 100% of window creation buttons are organized into their correct category (Apps or Widgets).
- **SC-004**: The visual layout maintains consistency with existing UI patterns (no new visual styles introduced).

## Assumptions

- The existing ButtonGroup component can be used twice in the same header row to create the separation.
- The visual divider will use the same styling pattern as the existing settings section separator (border-l border-border).
- No new dependencies or components are needed for this feature.
- The Clock widget is the only widget type currently, but the Widgets group should accommodate future widget additions.
- All existing button functionality (click handlers, styling, accessibility) remains unchanged.
