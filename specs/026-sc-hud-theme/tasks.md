# Tasks: Star Citizen HUD Theme

**Input**: Design documents from `/specs/026-sc-hud-theme/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/

**Tests**: Visual snapshot tests included for core themed components per Constitution II (Testing Standards).

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3, US4)
- Include exact file paths in descriptions

## Path Conventions

- **Frontend**: `app/`, `src/` at repository root
- CSS tokens in `app/globals.css`
- Components in `src/components/`
- Theme utilities in `src/styles/`

---

## Phase 1: Setup (Design Token Foundation)

**Purpose**: Establish the Star Citizen color palette and design tokens that all components will use

- [x] T001 Create SC theme CSS file with base variables and utilities at src/styles/sc-theme.css
- [x] T002 [P] Add Star Citizen color palette CSS variables to :root in app/globals.css
- [x] T003 [P] Add glow shadow tokens to @theme inline block in app/globals.css
- [x] T004 Update shadcn semantic color variables to reference SC palette in app/globals.css
- [x] T005 Add reduced motion media query overrides in app/globals.css

**Checkpoint**: Design tokens ready - all components can now reference the new theme variables

---

## Phase 2: Foundational (Core Theme Utilities)

**Purpose**: Create reusable CSS utilities for corner accents, scanlines, and glow effects that components will use

**CRITICAL**: These utilities must be complete before UI components can apply the full SC aesthetic

- [x] T006 Add scanline overlay CSS with .scanlines-enabled class in src/styles/sc-theme.css
- [x] T007 Add corner accent utility CSS with .sc-corner-accents class in src/styles/sc-theme.css
- [x] T008 Import sc-theme.css into app/globals.css
- [x] T009 Add transition utility classes for glow effects in src/styles/sc-theme.css

**Checkpoint**: Foundation ready - user story implementation can now begin

---

## Phase 3: User Story 1 - Visual Theme Application (Priority: P1) MVP

**Goal**: Users see the Star Citizen-inspired theme applied consistently across all application windows and components

**Independent Test**: Launch the application and verify all UI elements display with cyan/teal color scheme on dark backgrounds, with hover effects showing glow transitions

### Tests for User Story 1

- [x] T010a [P] [US1] Create visual snapshot test for Button variants in src/components/ui/__tests__/button.test.tsx
- [x] T010b [P] [US1] Create visual snapshot test for themed Window component in src/components/windows/__tests__/Window.test.tsx

### Implementation for User Story 1

- [x] T010 [P] [US1] Update Button component with SC-themed variants (default, secondary, ghost, destructive, outline) in src/components/ui/button.tsx
- [x] T011 [P] [US1] Update Card component with SC border colors and elevated background in src/components/ui/card.tsx
- [x] T012 [P] [US1] Update Input component with SC border and background colors in src/components/ui/input.tsx
- [x] T013 [P] [US1] Update Slider component with SC-themed track and thumb colors in src/components/ui/slider.tsx
- [x] T014 [P] [US1] Update Separator component with SC border color in src/components/ui/separator.tsx
- [x] T015 [P] [US1] Update ButtonGroup component with SC-themed styling in src/components/ui/button-group.tsx
- [x] T016 [US1] Verify MainMenu displays correctly with themed buttons in src/components/MainMenu.tsx

**Checkpoint**: User Story 1 complete - base theme applied to all UI components

---

## Phase 4: User Story 2 - Interactive Feedback States (Priority: P2)

**Goal**: Users receive clear visual feedback through hover, focus, active, and disabled states that match the Star Citizen aesthetic

**Independent Test**: Interact with buttons, inputs, and clickable elements to verify state transitions show cyan glow effects and are visible/consistent

### Implementation for User Story 2

- [x] T017 [P] [US2] Add hover glow effect to Button variants using box-shadow in src/components/ui/button.tsx
- [x] T018 [P] [US2] Add focus-visible ring with glow to Button component in src/components/ui/button.tsx
- [x] T019 [P] [US2] Add focus state with cyan border and glow to Input component in src/components/ui/input.tsx
- [x] T020 [P] [US2] Add hover state with glow to Slider thumb in src/components/ui/slider.tsx
- [x] T021 [US2] Verify disabled states show reduced opacity without glow effects across all components

**Checkpoint**: User Story 2 complete - all interactive states have proper SC-themed feedback

---

## Phase 5: User Story 3 - Window Chrome Styling (Priority: P2)

**Goal**: Users see overlay windows with distinctive Star Citizen-style window decorations including header bars, control buttons, corner accents, and border treatments

**Independent Test**: Open any overlay window and examine title bar, close button, resize handles, and border styling for SC aesthetic with corner accents

### Implementation for User Story 3

- [x] T022 [P] [US3] Update Window component with SC border, shadow, and corner accent class in src/components/windows/Window.tsx
- [x] T023 [P] [US3] Update WindowHeader component with SC-themed background and title styling in src/components/windows/WindowHeader.tsx
- [x] T024 [US3] Update WindowHeader close button with SC hover glow effect in src/components/windows/WindowHeader.tsx
- [x] T025 [US3] Add focused window state with brighter border/glow in src/components/windows/Window.tsx
- [x] T026 [US3] Verify corner accents display correctly in interactive mode in src/components/windows/Window.tsx

**Checkpoint**: User Story 3 complete - window chrome fully styled with SC aesthetic

---

## Phase 6: FR-011 - Scanline Toggle Setting (Priority: P3)

**Note**: This phase implements FR-011 (scanline toggle). User Story 4 (Component Design System documentation) from spec.md is deferred to a follow-up feature.

**Goal**: Users can enable/disable optional scanline overlay effect via settings, with the preference persisted

**Independent Test**: Toggle scanline setting and verify overlay appears/disappears, persists across app restart

### Implementation for FR-011

- [x] T027 [FR011] Add scanlinesEnabled field to persistence types in src/types/persistence.ts
- [x] T028 [FR011] Add scanline toggle state to WindowsContext or create ThemeContext in src/contexts/
- [x] T029 [FR011] Create ScanlineToggle component similar to BackgroundToggle in src/components/windows/ScanlineToggle.tsx
- [x] T030 [FR011] Apply scanlines-enabled class to root element based on setting in app/page.tsx or layout
- [x] T031 [FR011] Add ScanlineToggle to settings UI (MainMenu or WindowHeader) in src/components/MainMenu.tsx
- [x] T032 [FR011] Verify scanline persistence saves and loads correctly

**Checkpoint**: FR-011 complete - scanline toggle fully functional

---

## Phase 7: Polish & Cross-Cutting Concerns

**Purpose**: Final verification, accessibility compliance, and performance validation

- [x] T033 Verify WCAG AA contrast ratios (4.5:1) for all text/background combinations
- [x] T034 Test reduced motion preference disables all transitions and scanlines
- [x] T035 Verify all window types (Notes, Draw, Browser, Clock, File Viewer) styled consistently
- [x] T036 Performance check: ensure no lag from glow effects during window drag/resize
- [x] T037 Visual review: compare app appearance against Star Citizen HUD reference images
- [x] T038 Run quickstart.md validation steps

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion - BLOCKS all user stories
- **User Stories (Phase 3-6)**: All depend on Foundational phase completion
  - US1 → US2 → US3 → US4 (sequential by priority)
  - OR US1, US2, US3 can run in parallel if team capacity allows (US4 depends on persistence setup)
- **Polish (Phase 7)**: Depends on all user stories being complete

### User Story Dependencies

- **User Story 1 (P1)**: Can start after Foundational (Phase 2) - No dependencies on other stories
- **User Story 2 (P2)**: Can start after Foundational (Phase 2) - Builds on US1 component updates
- **User Story 3 (P2)**: Can start after Foundational (Phase 2) - Independent of US1/US2
- **User Story 4 (P3)**: Can start after Foundational (Phase 2) - Requires persistence system knowledge

### Within Each User Story

- Component updates marked [P] can run in parallel (different files)
- Verification tasks run after their dependencies complete
- Story complete before moving to next priority

### Parallel Opportunities

- **Phase 1**: T002, T003 can run in parallel (different sections of globals.css)
- **Phase 2**: T006, T007, T009 can run in parallel (same file but different sections)
- **Phase 3 (US1)**: T010-T015 can ALL run in parallel (different component files)
- **Phase 4 (US2)**: T017-T020 can run in parallel (different components/features)
- **Phase 5 (US3)**: T022, T023 can run in parallel (different files)

---

## Parallel Example: User Story 1

```bash
# Launch all component updates for User Story 1 together:
Task: "Update Button component with SC-themed variants in src/components/ui/button.tsx"
Task: "Update Card component with SC border colors in src/components/ui/card.tsx"
Task: "Update Input component with SC border and background in src/components/ui/input.tsx"
Task: "Update Slider component with SC-themed track/thumb in src/components/ui/slider.tsx"
Task: "Update Separator component with SC border color in src/components/ui/separator.tsx"
Task: "Update ButtonGroup component with SC styling in src/components/ui/button-group.tsx"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup (design tokens)
2. Complete Phase 2: Foundational (utilities)
3. Complete Phase 3: User Story 1 (base theme)
4. **STOP and VALIDATE**: Test all components display SC styling
5. Deploy/demo if ready - app has full visual transformation

### Incremental Delivery

1. Complete Setup + Foundational → Foundation ready
2. Add User Story 1 → Test independently → Deploy/Demo (MVP - visual transformation!)
3. Add User Story 2 → Test independently → Deploy/Demo (polished interactions)
4. Add User Story 3 → Test independently → Deploy/Demo (complete window styling)
5. Add User Story 4 → Test independently → Deploy/Demo (optional scanlines)
6. Each story adds visual polish without breaking previous stories

### Sequential Execution (Single Developer)

1. Phase 1: Setup (~4 tasks, ~30 min)
2. Phase 2: Foundational (~4 tasks, ~30 min)
3. Phase 3: US1 (~7 tasks, ~2 hours)
4. Phase 4: US2 (~5 tasks, ~1 hour)
5. Phase 5: US3 (~5 tasks, ~1.5 hours)
6. Phase 6: US4 (~6 tasks, ~1.5 hours)
7. Phase 7: Polish (~6 tasks, ~1 hour)

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps task to specific user story for traceability
- Each user story should be independently completable and testable
- Commit after each task or logical group
- Stop at any checkpoint to validate story independently
- US1 delivers full visual transformation - minimum viable product
- US2-US4 add polish and optional features
