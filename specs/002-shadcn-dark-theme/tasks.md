# Tasks: Shadcn Design System Integration with Dark Theme

**Input**: Design documents from `/specs/002-shadcn-dark-theme/`
**Prerequisites**: plan.md (required), spec.md (required), research.md, data-model.md, contracts/

**Tests**: Visual verification only (no automated test tasks - existing tests preserved)

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Path Conventions

- **Single project**: `src/`, `tests/` at repository root
- Paths follow existing Tauri + React structure from plan.md

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Install dependencies and configure build tools

- [x] T001 Install Tailwind CSS and Vite plugin: `npm install tailwindcss @tailwindcss/vite`
- [x] T002 Install Node types for Vite config: `npm install -D @types/node`
- [x] T003 Install shadcn utility dependencies: `npm install clsx tailwind-merge`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Configure build tools and path aliases - MUST be complete before user stories

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [x] T004 Update vite.config.ts to add Tailwind plugin and path alias in vite.config.ts
- [x] T005 Update tsconfig.json to add `@/*` path alias in tsconfig.json
- [x] T006 Add `class="dark"` to html element in index.html

**Checkpoint**: Build configuration ready - user story implementation can now begin

---

## Phase 3: User Story 1 - Design System Foundation (Priority: P1) 🎯 MVP

**Goal**: shadcn design system is installed and configured with dark theme CSS variables applied to application root

**Independent Test**: Verify CSS variables are applied by inspecting root element in DevTools (e.g., `--background: 224 71.4% 4.1%`)

### Implementation for User Story 1

- [x] T007 [US1] Create src/lib/ directory for shadcn utilities
- [x] T008 [US1] Create cn() utility function in src/lib/utils.ts
- [x] T009 [US1] Create src/styles/globals.css with dark theme CSS variables from contracts/theme-contract.css (must include: --background: 224 71.4% 4.1%, --foreground: 210 20% 98%, --primary: 210 20% 98%, --border: 215 27.9% 16.9%, --radius: 0.5rem per FR-008)
- [x] T010 [US1] Add Tailwind imports and @theme inline directive to src/styles/globals.css
- [x] T011 [US1] Add overlay transparency rules (!important) to src/styles/globals.css
- [x] T012 [US1] Update src/main.tsx to import globals.css instead of overlay.css
- [x] T013 [US1] Create components.json for shadcn CLI configuration at project root

**Checkpoint**: At this point, User Story 1 should be fully functional - dark theme CSS variables visible in DevTools, shadcn imports work

---

## Phase 4: User Story 2 - HeaderPanel Component Refactoring (Priority: P2)

**Goal**: HeaderPanel uses Tailwind utility classes with dark theme colors, all existing functionality preserved

**Independent Test**: Toggle overlay with F3, verify HeaderPanel displays with dark theme colors and retains accessibility attributes

### Implementation for User Story 2

- [x] T014 [US2] Refactor HeaderPanel to use Tailwind classes with theme CSS variables (bg-background, border-border, text-foreground) in src/components/HeaderPanel.tsx
- [x] T015 [US2] Preserve ARIA attributes (role, aria-live, aria-label) in src/components/HeaderPanel.tsx
- [x] T016 [US2] Remove old overlay.css import from src/App.tsx (if still present)
- [x] T017 [US2] Delete src/styles/overlay.css (migrated to globals.css)

**Checkpoint**: At this point, User Stories 1 AND 2 should both work - HeaderPanel shows with dark theme

---

## Phase 5: User Story 3 - Global CSS Theme Application (Priority: P3)

**Goal**: Theme configuration is complete so future components automatically inherit dark theme

**Independent Test**: Add any new element with `className="bg-background text-foreground"` and verify correct colors

### Implementation for User Story 3

- [x] T018 [US3] Verify all standard shadcn CSS variables from contracts/theme-contract.css are defined in src/styles/globals.css (background, foreground, card, popover, primary, secondary, muted, accent, destructive, border, input, ring, radius)
- [x] T019 [US3] Add sidebar variables to src/styles/globals.css (for future shadcn sidebar component)
- [x] T020 [US3] Create src/components/ui/ directory structure for future shadcn components

**Checkpoint**: All user stories complete - theme is production-ready for future development

---

## Phase 6: Polish & Verification

**Purpose**: Final verification and cleanup

- [ ] T021 Run existing tests to confirm behavior preserved: `npm test`
- [ ] T022 Build application to verify no TypeScript errors: `npm run build`
- [ ] T023 Start Tauri dev mode and verify F3 toggle works: `npm run tauri dev`
- [ ] T024 Visual verification: overlay transparency maintained
- [ ] T025 Visual verification: HeaderPanel matches dark theme spec colors

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion - BLOCKS all user stories
- **User Stories (Phase 3+)**: All depend on Foundational phase completion
  - US1 → US2 → US3 (sequential, building on each other)
- **Polish (Phase 6)**: Depends on all user stories being complete

### User Story Dependencies

- **User Story 1 (P1)**: Can start after Foundational (Phase 2) - No dependencies on other stories
- **User Story 2 (P2)**: Depends on US1 (needs theme CSS variables to use in component)
- **User Story 3 (P3)**: Depends on US1 and US2 (verifies theme works globally)

### Within Each User Story

- Create directories before files
- Create utilities before components that use them
- Core configuration before component updates

### Parallel Opportunities

- **Phase 1**: T001, T002, T003 can all run in parallel (independent npm installs)
- **Phase 2**: T004, T005, T006 can all run in parallel (different files)
- **Phase 3 (US1)**: T007-T008 can run in parallel with T009-T011 (different files)
- **Phase 6**: T021, T022 can run in parallel (different commands)

---

## Parallel Example: Phase 1 Setup

```bash
# Launch all dependency installs together:
npm install tailwindcss @tailwindcss/vite &
npm install -D @types/node &
npm install clsx tailwind-merge &
wait
```

## Parallel Example: Phase 2 Foundational

```bash
# Can edit all three config files in parallel:
Task: "Update vite.config.ts to add Tailwind plugin and path alias"
Task: "Update tsconfig.json to add @/* path alias"
Task: "Add class=dark to html element in index.html"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup (install dependencies)
2. Complete Phase 2: Foundational (configure build tools)
3. Complete Phase 3: User Story 1 (theme variables + globals.css)
4. **STOP and VALIDATE**: Check CSS variables in DevTools
5. Continue to US2 for visible proof of theme working

### Incremental Delivery

1. Setup + Foundational → Build system ready
2. User Story 1 → Theme variables applied (invisible but working)
3. User Story 2 → HeaderPanel refactored (visible proof of theme)
4. User Story 3 → Future-proofed for new components
5. Polish → Verified and production-ready

---

## Notes

- No test tasks generated (tests not requested; existing tests preserved)
- Visual verification replaces automated theme tests
- Each user story builds on previous but US1 is independently verifiable via DevTools
- Overlay transparency is critical - verify after each phase
- Use `--force` flag if npm warns about React 19 peer dependencies
