# Feature Specification: Next.js Migration with Motion Animations

**Feature Branch**: `005-nextjs-motion-refactor`
**Created**: 2025-12-17
**Status**: Draft
**Input**: User description: "Refactor the current React app to Next.JS 16 (latest version), continue using shadcn for Design System and add motion.dev for nice transitions, add nice transitions for show and hide the app and when change the opacity"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Smooth App Show/Hide Transitions (Priority: P1)

As a user, when I press F3 to show or hide the overlay, the app should appear and disappear with a smooth, visually pleasing animation instead of an abrupt on/off switch.

**Why this priority**: This is the primary user-facing improvement that directly addresses the core request. Users will immediately notice and benefit from smooth show/hide transitions every time they interact with the overlay.

**Independent Test**: Can be fully tested by pressing F3 to toggle visibility and observing smooth fade-in/fade-out animations with appropriate timing.

**Acceptance Scenarios**:

1. **Given** the overlay is hidden, **When** the user presses F3, **Then** the overlay fades in smoothly with a pleasant animation (not instant appearance)
2. **Given** the overlay is visible, **When** the user presses F3, **Then** the overlay fades out smoothly before hiding completely
3. **Given** any animation is in progress, **When** the user rapidly toggles visibility, **Then** the animation smoothly reverses without visual glitches or jarring transitions

---

### User Story 2 - Smooth Opacity Mode Transitions (Priority: P2)

As a user, when I toggle between fullscreen (click-through) and windowed (interactive) modes using F5, the opacity change should animate smoothly rather than switching instantly.

**Why this priority**: Mode switching is a frequent user action, and smooth opacity transitions enhance the perceived quality of the application. This directly addresses the user's request for opacity change animations.

**Independent Test**: Can be fully tested by pressing F5 to toggle modes while observing smooth opacity transitions from 60% to 100% (or vice versa).

**Acceptance Scenarios**:

1. **Given** the overlay is in windowed mode (fully opaque), **When** the user presses F5, **Then** the opacity smoothly animates to 60% (click-through mode)
2. **Given** the overlay is in fullscreen/click-through mode (60% opacity), **When** the user presses F5, **Then** the opacity smoothly animates to 100% (fully visible)
3. **Given** an opacity animation is in progress, **When** the user presses F5 again, **Then** the animation smoothly transitions in the new direction without jumps

---

### User Story 3 - Error Modal Animation (Priority: P3)

As a user, when an error modal appears (e.g., target window not found), I want it to animate in smoothly and animate out when dismissed, providing visual feedback that matches the overall polish of the application.

**Why this priority**: While less frequent than show/hide and mode toggle, error modals benefit from consistent animation treatment to maintain the professional feel of the application.

**Independent Test**: Can be fully tested by triggering an error condition (e.g., target app not running) and observing the modal's entrance and exit animations.

**Acceptance Scenarios**:

1. **Given** an error condition occurs, **When** the error modal appears, **Then** it animates in with a smooth entrance effect
2. **Given** the error modal is visible, **When** the user clicks Dismiss or the auto-dismiss timer expires, **Then** the modal animates out smoothly before being removed
3. **Given** the countdown timer is running, **When** the user manually dismisses, **Then** the animation completes without delay or visual artifacts

---

### User Story 4 - Framework Migration Preserves Functionality (Priority: P1)

As a user, after the migration to Next.js, all existing functionality must work exactly as before, including keyboard shortcuts (F3, F5), Tauri integration, window positioning, and target window attachment.

**Why this priority**: Migration must not break existing functionality. This is critical because users depend on the current features.

**Independent Test**: Can be fully tested by verifying all existing features work: F3 toggle, F5 mode switch, window positioning, target attachment, error modal auto-dismiss.

**Acceptance Scenarios**:

1. **Given** the migrated application, **When** the user presses F3, **Then** visibility toggles exactly as before (with added animations)
2. **Given** the migrated application, **When** the user presses F5, **Then** mode switches exactly as before (with added animations)
3. **Given** the migrated application, **When** attaching to a target window, **Then** the overlay positions and scales correctly as before
4. **Given** the migrated application, **When** running in click-through mode, **Then** mouse events pass through to underlying windows as before

---

### Edge Cases

- What happens when animations are interrupted by rapid user input? The animation system must handle rapid toggling gracefully without visual glitches.
- How does the system handle window resize during animations? Animations should continue smoothly without visual artifacts.
- What happens if the user toggles visibility during an opacity mode animation? The system should prioritize the most recent action and smoothly transition.
- How does the application behave if motion.dev fails to load or animations fail? The app must fall back gracefully to instant transitions without crashing.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST migrate from Vite/React to Next.js using static export mode (no server-side rendering) while maintaining Tauri integration for the desktop application
- **FR-002**: System MUST continue using shadcn/ui components for the design system (Card, and any future components)
- **FR-003**: System MUST integrate motion.dev (Motion for React) for animation capabilities
- **FR-004**: System MUST animate the overlay show/hide transitions triggered by F3 hotkey
- **FR-005**: System MUST animate opacity transitions when switching between fullscreen and windowed modes via F5 hotkey
- **FR-006**: System MUST animate error modal entrance and exit
- **FR-007**: System MUST preserve all existing Tauri event listeners and invoke commands
- **FR-008**: System MUST preserve keyboard shortcut functionality (F3 visibility toggle, F5 mode toggle)
- **FR-009**: System MUST preserve window positioning logic (center on screen, attach to target window)
- **FR-010**: System MUST preserve click-through functionality in fullscreen mode
- **FR-011**: System MUST handle animation interruptions gracefully (rapid toggling, mid-animation state changes)
- **FR-012**: System MUST fall back to instant transitions if animations fail or motion.dev is unavailable

### Key Entities

- **HeaderPanel**: The main overlay component displaying "RAIC Overlay" text with mode-based opacity and scaling
- **ErrorModal**: Modal component for displaying error messages with auto-dismiss functionality
- **OverlayState**: State object tracking visibility, mode, target binding, and initialization status
- **Animation Configuration**: Settings for transition durations, easing functions, and animation variants. Show/hide transitions use fade style (opacity 0↔1); mode transitions use opacity animation (60%↔100%)

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Show/hide animations complete within 200-400ms, providing a smooth but responsive user experience
- **SC-002**: Opacity mode transitions complete within 200-300ms, feeling smooth without being sluggish
- **SC-003**: All existing keyboard shortcuts (F3, F5) respond within 50ms of keypress (animation may take longer)
- **SC-004**: 100% of existing functionality works identically after migration (Tauri integration, window management, event handling)
- **SC-005**: Application bundle size increases by no more than 150KB after adding motion.dev library
- **SC-006**: Users perceive a "polished" experience from animations without them feeling slow or obstructive
- **SC-007**: Application startup time remains under 500ms (cold start to visible overlay)

## Clarifications

### Session 2025-12-18

- Q: What animation style should be used for show/hide transitions? → A: Fade (opacity transition from 0 to 1 and back)
- Q: What Next.js + Tauri integration approach should be used? → A: Static Export with no server-side rendering (pure client-side, static HTML/JS for Tauri webview)

## Assumptions

- Next.js will be used in static export mode only (no SSR/SSG server required) - generates pure client-side HTML/JS that Tauri's webview loads directly
- motion.dev (Motion for React) is compatible with Next.js and Tauri's webview environment
- The existing shadcn/ui components (Card) will work with the migrated Next.js setup
- Animation durations of 200-400ms provide the optimal balance between smoothness and responsiveness for this use case
- Tauri's window management APIs and event system remain unchanged after frontend framework migration
