# Tasks: Browser Component

**Input**: Design documents from `/specs/014-browser-component/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, quickstart.md

**Tests**: Integration tests added per Constitution II requirements.

**Organization**: Tasks grouped by user story for independent implementation.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story (US1-US7)
- Exact file paths included

---

## Phase 1: Setup (Configuration)

**Purpose**: Configure Tauri CSP to allow iframe loading of external websites

- [x] T001 Update CSP configuration in src-tauri/tauri.conf.json to add `frame-src https: http:` directive per research.md

**Checkpoint**: CSP configured - iframes can now load external websites

---

## Phase 2: Foundational (Core Component Structure)

**Purpose**: Create base component files and type definitions that all user stories depend on

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [x] T002 [P] Create BrowserContent component skeleton with props interface in src/components/windows/BrowserContent.tsx
- [x] T003 [P] Create BrowserToolbar component skeleton with props interface in src/components/windows/BrowserToolbar.tsx
- [x] T004 Define BROWSER_DEFAULTS constants (DEFAULT_URL, DEFAULT_ZOOM, ZOOM_MIN, ZOOM_MAX, ZOOM_STEP) in src/components/windows/BrowserContent.tsx

**Checkpoint**: Foundation ready - component files exist with correct interfaces

---

## Phase 3: User Story 1 - Open Browser Window from Menu (Priority: P1) 🎯 MVP

**Goal**: User can click "Browser" button in main menu to open a new Browser window displaying google.com at 50% zoom

**Independent Test**: Click Browser button → window opens with iframe showing google.com at 50% zoom

### Implementation for User Story 1

- [x] T005 [US1] Add BrowserContent import and handleOpenBrowser handler function in src/components/MainMenu.tsx
- [x] T006 [US1] Add Browser button to ButtonGroup after Draw button in src/components/MainMenu.tsx (order: Notes, Draw, Browser, Test Windows)
- [x] T007 [US1] Implement iframe container with CSS transform zoom in src/components/windows/BrowserContent.tsx
- [x] T008 [US1] Implement initial state (url: google.com, zoom: 50, historyStack, historyIndex, isLoading) in src/components/windows/BrowserContent.tsx
- [x] T009 [US1] Style iframe container with overflow:hidden and transform-origin:0 0 in src/components/windows/BrowserContent.tsx

**Checkpoint**: Browser window opens from menu showing google.com at 50% zoom - MVP complete

---

## Phase 4: User Story 2+3 - Address Bar & History Navigation (Priority: P2)

**Goal**: User can enter URLs in address bar and navigate back/forward through browsing history

**Independent Test**: Enter URL → page loads; Navigate to multiple pages → back/forward buttons work

### Implementation for User Story 2 (Address Bar)

- [ ] T010 [US2] Implement address bar input with current URL display in src/components/windows/BrowserToolbar.tsx
- [ ] T011 [US2] Implement URL submission handler (onKeyDown Enter) in src/components/windows/BrowserToolbar.tsx
- [ ] T012 [US2] Implement normalizeUrl function to prepend https:// when missing in src/components/windows/BrowserContent.tsx
- [ ] T013 [US2] Implement navigateTo function (update URL, truncate forward history, add to stack) in src/components/windows/BrowserContent.tsx
- [ ] T014 [US2] Implement loading state with isLoading flag and iframe onLoad handler in src/components/windows/BrowserContent.tsx
- [ ] T015 [US2] Add loading indicator (Loader2 spinner icon) to address bar in src/components/windows/BrowserToolbar.tsx

### Implementation for User Story 3 (History Navigation)

- [ ] T016 [US3] Add back and forward button icons (ArrowLeft, ArrowRight from lucide-react) in src/components/windows/BrowserToolbar.tsx
- [ ] T017 [US3] Implement goBack function (decrement historyIndex, load URL from stack) in src/components/windows/BrowserContent.tsx
- [ ] T018 [US3] Implement goForward function (increment historyIndex, load URL from stack) in src/components/windows/BrowserContent.tsx
- [ ] T019 [US3] Implement canGoBack and canGoForward computed values in src/components/windows/BrowserContent.tsx
- [ ] T020 [US3] Pass canGoBack/canGoForward props and disable buttons when history unavailable in src/components/windows/BrowserToolbar.tsx

**Checkpoint**: Address bar and history navigation fully functional

---

## Phase 5: User Story 4+5 - Refresh & Zoom Controls (Priority: P3)

**Goal**: User can refresh the current page and adjust zoom level using +/- buttons

**Independent Test**: Click refresh → page reloads; Click zoom buttons → content scales and percentage updates

### Implementation for User Story 4 (Refresh)

- [ ] T021 [US4] Add refresh button icon (RotateCw from lucide-react) in src/components/windows/BrowserToolbar.tsx
- [ ] T022 [US4] Implement refresh function (set isLoading true, force iframe reload via key prop) in src/components/windows/BrowserContent.tsx

### Implementation for User Story 5 (Zoom Controls)

- [ ] T023 [US5] Add zoom controls layout (-button, percentage label, +button) using Minus and Plus icons in src/components/windows/BrowserToolbar.tsx
- [ ] T024 [US5] Implement zoomIn function (increment by ZOOM_STEP, cap at ZOOM_MAX) in src/components/windows/BrowserContent.tsx
- [ ] T025 [US5] Implement zoomOut function (decrement by ZOOM_STEP, cap at ZOOM_MIN) in src/components/windows/BrowserContent.tsx
- [ ] T026 [US5] Connect zoom state to iframe CSS transform scale with dimension compensation in src/components/windows/BrowserContent.tsx

**Checkpoint**: Refresh and zoom controls fully functional

---

## Phase 6: User Story 6 - Non-Interaction Mode (Priority: P4)

**Goal**: Toolbar hidden and iframe non-interactive when in non-interaction mode

**Independent Test**: Press F5 to toggle mode → toolbar visibility changes; iframe becomes view-only

### Implementation for User Story 6

- [ ] T027 [US6] Conditionally render BrowserToolbar based on isInteractive prop in src/components/windows/BrowserContent.tsx
- [ ] T028 [US6] Add pointer-events blocking overlay or CSS when isInteractive is false in src/components/windows/BrowserContent.tsx

**Checkpoint**: Non-interaction mode working - toolbar hides, iframe is view-only

---

## Phase 7: User Story 7 - Ephemeral State (Priority: P5)

**Goal**: Confirm browser state is not persisted (default behavior - no implementation needed)

**Independent Test**: Open browser, navigate, close window, reopen → starts fresh at google.com

### Implementation for User Story 7

- [ ] T029 [US7] Verify BrowserContent does NOT integrate with PersistenceContext in src/components/windows/BrowserContent.tsx (code review only)

**Checkpoint**: State is correctly ephemeral - no persistence on close

---

## Phase 7.5: Integration Tests (Constitution Compliance)

**Purpose**: Satisfy Constitution II requirement for integration/component tests

- [ ] T029.1 [P] Create integration test for BrowserContent rendering and initial state in tests/integration/BrowserContent.test.tsx
- [ ] T029.2 [P] Create integration test for BrowserToolbar controls and callbacks in tests/integration/BrowserToolbar.test.tsx

**Checkpoint**: Component tests exist and pass

---

## Phase 8: Polish & Validation

**Purpose**: Final validation and toolbar layout polish

- [ ] T030 Verify toolbar layout order matches spec: [Back][Forward][Refresh][AddressBar][Zoom-][%][Zoom+] in src/components/windows/BrowserToolbar.tsx
- [ ] T031 Style toolbar to match existing NotesToolbar visual patterns in src/components/windows/BrowserToolbar.tsx
- [ ] T032 Test 10 concurrent Browser windows for performance
- [ ] T032.1 Validate performance targets: window open <1s, toolbar toggle <100ms, zoom <100ms per SC-001 to SC-004
- [ ] T033 Run quickstart.md validation checklist

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - start immediately
- **Foundational (Phase 2)**: Depends on Phase 1
- **US1 (Phase 3)**: Depends on Phase 2 - MVP target
- **US2+3 (Phase 4)**: Depends on Phase 3 (needs BrowserContent to exist)
- **US4+5 (Phase 5)**: Depends on Phase 4 (needs toolbar structure)
- **US6 (Phase 6)**: Depends on Phase 3 (needs basic component)
- **US7 (Phase 7)**: No code dependencies - verification only
- **Polish (Phase 8)**: Depends on all phases complete

### User Story Dependencies

| Story | Depends On | Can Parallel With |
|-------|------------|-------------------|
| US1 (P1) | Foundational | None (MVP) |
| US2 (P2) | US1 | US3 (same toolbar) |
| US3 (P2) | US1 | US2 (same toolbar) |
| US4 (P3) | US2/US3 | US5 (same toolbar) |
| US5 (P3) | US2/US3 | US4 (same toolbar) |
| US6 (P4) | US1 | US2-US5 |
| US7 (P5) | None | All (verification) |

### Parallel Opportunities Within Phases

**Phase 2** (all can run in parallel):
```bash
Task: "Create BrowserContent component skeleton in src/components/windows/BrowserContent.tsx"
Task: "Create BrowserToolbar component skeleton in src/components/windows/BrowserToolbar.tsx"
```

**Phase 4** (address bar and history in parallel within their sub-groups):
```bash
# After toolbar structure exists:
Task: "Implement address bar input in BrowserToolbar.tsx"
Task: "Add back and forward button icons in BrowserToolbar.tsx"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup CSP
2. Complete Phase 2: Foundational component files
3. Complete Phase 3: User Story 1 (Browser opens from menu)
4. **STOP and VALIDATE**: Browser window opens with google.com at 50% zoom
5. Deploy/demo if ready

### Incremental Delivery

1. Phase 1+2 → Foundation ready
2. Phase 3 → MVP: Browser opens (value delivered!)
3. Phase 4 → Address bar + history navigation
4. Phase 5 → Refresh + zoom controls
5. Phase 6 → Non-interaction mode polish
6. Phase 7+8 → Validation and polish

---

## Notes

- No new dependencies required - uses existing lucide-react, React state, Tailwind
- Follow NotesContent.tsx and DrawContent.tsx patterns for consistency
- CSP change in Phase 1 is required before iframe can load external sites
- Zoom uses CSS transform: scale() per research.md findings
- History managed via React state (cross-origin limitations prevent iframe history access)
- contentType: "browser" used for window event system
