# Feature Specification: Process Not Found Popup Liquid Glass Style

**Feature Branch**: `037-process-popup-glass`
**Created**: 2025-12-29
**Status**: Draft
**Input**: User description: "Refactor the process not found popup style for be more like the windows overlay system, with the same style and a liquid glass effect like the clock windows, and use the same windows overlay typo"

## Clarifications

### Session 2025-12-29

- Q: Should the warning triangle icon be retained, removed, or replaced? → A: Retained with blue glow styling to match the glass theme
- Q: Should popup match windows overlay system structure? → A: Yes - include window header with title and close X icon, SC theme border with corner accents and glow, no resize functionality

## User Scenarios & Testing *(mandatory)*

### User Story 1 - View Liquid Glass Error Popup (Priority: P1)

As a user, when the target process (Star Citizen) is not found and an error popup appears, I want to see the popup styled to match the windows overlay system with a liquid glass effect, window header with title and close button, SC theme border with corner accents, and Orbitron typography, so that error notifications feel cohesive with the rest of the overlay system rather than looking like a separate, inconsistent UI element.

**Why this priority**: This is the core visual change - applying the liquid glass style and window overlay system structure to the error modal. Without this, the feature has no value. The current error modal uses a standard card/dialog style that doesn't match the futuristic overlay aesthetic established by the windows overlay system, clock widget, and main menu.

**Independent Test**: Can be fully tested by pressing F3 when Star Citizen is not running and observing the error popup displays with: (1) window header containing title and X close button, (2) frosted glass background with blue glow effects, (3) SC theme border with corner accents, and (4) Orbitron typography. Delivers immediate visual consistency with the overlay windows system.

**Acceptance Scenarios**:

1. **Given** Star Citizen is not running, **When** I press F3 to show the overlay, **Then** the "Process Not Found" popup displays with a window header containing the title on the left and an X close button on the right
2. **Given** the error popup is visible, **When** I view the popup container, **Then** it displays with SC theme border styling including corner accents and blue glow effect matching other overlay windows
3. **Given** the error popup is visible, **When** I view the title text in the header, **Then** the text displays in the Orbitron font family with uppercase styling matching other overlay window headers
4. **Given** the error popup is visible, **When** I click the X close button, **Then** the popup dismisses (same as clicking the dismiss button or waiting for auto-dismiss)
5. **Given** the error popup is visible, **When** I attempt to resize it by dragging edges, **Then** nothing happens (resize functionality is disabled)

---

### User Story 2 - Readable Error Messages (Priority: P2)

As a user, I want the error message and countdown timer to remain clearly readable against the liquid glass background, so that I can understand what went wrong and how long until the popup auto-dismisses.

**Why this priority**: Visual styling is meaningless if users can't read the error content. This ensures the liquid glass effect doesn't compromise usability.

**Independent Test**: Can be tested by triggering the error popup against various game backgrounds and verifying all text (title, message, countdown, button) remains legible.

**Acceptance Scenarios**:

1. **Given** the error popup is displayed, **When** I read the error message, **Then** the message text has sufficient contrast against the glass background to be easily readable
2. **Given** the error popup is auto-dismissing, **When** I view the countdown timer, **Then** the "Auto-dismissing in Xs" text is clearly visible and readable
3. **Given** the error popup is displayed, **When** viewing against different backgrounds (dark, light, colorful), **Then** the text maintains readability due to the glass effect providing consistent backdrop

---

### Edge Cases

- What happens when the popup displays over very bright backgrounds? The glass background blur and tint should provide sufficient contrast
- What happens when Orbitron font fails to load? Fallback system sans-serif font should still apply and text remains readable
- What happens during the entrance/exit animation? The liquid glass effect should animate smoothly without visual glitches
- What happens on low-performance systems? The glass blur effects should not cause noticeable performance degradation during the 5-second popup display

## Requirements *(mandatory)*

### Functional Requirements

#### Window Structure
- **FR-001**: System MUST display the error modal with a window header matching the overlay windows system structure
- **FR-002**: System MUST display the error title in the header on the left side using Orbitron font with uppercase styling
- **FR-003**: System MUST display an X close button on the right side of the header that dismisses the popup when clicked
- **FR-004**: System MUST NOT provide resize functionality (no resize handles or edge-drag behavior)

#### Visual Styling
- **FR-005**: System MUST apply SC theme border styling with corner accents and blue glow effect matching other overlay windows
- **FR-006**: System MUST apply liquid glass effect to the modal background (frosted translucency, backdrop blur, blue-tinted glow)
- **FR-007**: System MUST render all text using the Orbitron font family
- **FR-008**: System MUST retain the warning triangle icon and apply blue glow styling to match the theme
- **FR-009**: System MUST remove the current card-based styling and dismiss button, replacing with the window header X button

#### Content & Functionality
- **FR-010**: System MUST display the error message and countdown timer in the content area below the header
- **FR-011**: System MUST ensure all text remains readable against the glass background
- **FR-012**: System MUST preserve existing error modal functionality (auto-dismiss timer, entrance/exit animations)
- **FR-013**: System MUST maintain accessibility features (ARIA attributes, keyboard navigation, focus management)

### Key Entities

- **ErrorModal Component**: The existing React component (`src/components/ErrorModal.tsx`) that displays process-not-found errors, to be restructured with window header and restyled with liquid glass effect
- **Window Header Style**: The visual structure from overlay windows (title on left, X button on right) to be adapted for the error modal without drag/resize functionality
- **SC Theme Border**: The corner accents and glow border styling used by overlay windows to be applied to the error modal
- **Liquid Glass Style**: The frosted glass aesthetic (frosted translucency, backdrop blur, blue glow) to be applied to the modal background
- **Orbitron Typography**: The existing font family (feature 021) applied to all modal text including header title

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Error popup structure matches overlay windows (header with title on left, X close button on right, content area below)
- **SC-002**: Error popup border and corner accents visually match other overlay windows (screenshot comparison)
- **SC-003**: Error popup displays liquid glass effect (frosted background, blue glow, translucency visible in screenshot comparison)
- **SC-004**: All text in the error popup (header title, message, countdown) uses Orbitron font family
- **SC-005**: Header title displays in uppercase with matching styling to other window headers
- **SC-006**: Error popup text remains readable against 5 different background colors/images (white, black, blue, gradient, screenshot of Star Citizen launcher)
- **SC-007**: X close button dismisses popup immediately when clicked
- **SC-008**: Edge/corner dragging does not resize the popup (verified by attempting resize gestures)
- **SC-009**: Entrance and exit animations complete smoothly without visual artifacts or stuttering
- **SC-010**: Existing accessibility features pass automated testing (screen reader announcements, keyboard dismiss functionality)

## Assumptions

- The existing `.liquid-glass-text` CSS class from feature 036 provides the core glass styling that can be reused or adapted for the modal
- The SC theme border styling (corner accents, glow effects) from the Window component can be applied to the error modal
- The window header structure (title left, X button right) from WindowHeader can be adapted for the error modal
- The Orbitron font is already loaded and available via the `font-orbitron` CSS class (feature 021)
- The existing ErrorModal component will be restructured to include a window header but preserve animation and dismiss logic
- The warning triangle icon will be retained and styled with blue glow to match the liquid glass theme
- The 5-second auto-dismiss behavior and countdown display will remain unchanged
- The error modal will be a fixed-size popup (no drag-to-move or resize functionality needed)
- **Testing exemption**: This is a CSS-only visual refactor with no logic changes to the ErrorModal component. Existing functional behavior (auto-dismiss timer, animations, accessibility) remains unchanged and covered by manual validation. Visual changes are verified via screenshot comparison per success criteria SC-001 through SC-006. No new automated tests are required per Constitution II exception for visual-only changes.

## Out of Scope

- Applying liquid glass styling to other modals or dialogs in the application
- Adding new error types or messages
- Changing the error modal trigger behavior or conditions
- Custom user configuration of the glass effect intensity or colors
- Adding sounds or haptic feedback to the error notification
- Drag-to-move functionality for the error popup
- Resize functionality for the error popup
- Opacity slider or background transparency toggle (unlike regular windows)
