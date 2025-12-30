# Tasks: WebView Browser Architecture

**Input**: Design documents from `/specs/040-webview-browser/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/tauri-commands.md

**Tests**: Integration tests included per Constitution II requirements. Rust tests use cargo test; React tests use vitest.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Path Conventions

- **Rust backend**: `src-tauri/src/`
- **React frontend**: `src/`
- **TypeScript types**: `src/types/`
- **React hooks**: `src/hooks/`
- **React components**: `src/components/`

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization and type definitions shared across all user stories

- [x] T001 [P] Create TypeScript types for browser WebView in src/types/browserWebView.ts
- [x] T002 [P] Create Rust type definitions in src-tauri/src/browser_webview_types.rs
- [x] T003 Register browser_webview_types module in src-tauri/src/lib.rs

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core WebView infrastructure that MUST be complete before ANY user story can be implemented

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [x] T004 Create BrowserWebViewState struct with HashMap and methods in src-tauri/src/browser_webview_types.rs
- [x] T005 Create browser_webview.rs module with create_browser_webview command in src-tauri/src/browser_webview.rs
- [x] T006 Add destroy_browser_webview command in src-tauri/src/browser_webview.rs
- [x] T007 Register browser_webview module and commands in src-tauri/src/lib.rs
- [x] T008 Initialize BrowserWebViewState in app builder in src-tauri/src/lib.rs
- [x] T009 Create useBrowserWebView hook skeleton with create/destroy lifecycle in src/hooks/useBrowserWebView.ts
- [x] T009a [P] Create useBrowserWebView.test.ts skeleton with lifecycle tests in src/hooks/useBrowserWebView.test.ts
- [x] T009b [P] Create browser_webview Rust test module skeleton in src-tauri/src/browser_webview.rs (#[cfg(test)] mod tests)

**Checkpoint**: Foundation ready - WebView can be created and destroyed. User story implementation can now begin.

---

## Phase 3: User Story 1 - Browse Any Website Without Restrictions (Priority: P1) 🎯 MVP

**Goal**: Replace iframe with native WebView to bypass X-Frame-Options restrictions

**Independent Test**: Navigate to google.com, youtube.com, twitter.com, github.com, reddit.com - all should load without frame-blocking errors

### Implementation for User Story 1

- [x] T010 [US1] Configure WebviewWindowBuilder with decorations(false), transparent(true), always_on_top(true) in src-tauri/src/browser_webview.rs
- [x] T010a [US1] Implement WebView z-order tracking for multiple browser windows in src-tauri/src/browser_webview_types.rs
- [x] T011 [US1] Implement WebviewUrl::External URL parsing and validation in src-tauri/src/browser_webview.rs
- [x] T012 [US1] Add popup blocking via on_navigation hook (block javascript: and data: schemes) in src-tauri/src/browser_webview.rs
- [x] T013 [US1] Modify BrowserContent.tsx to remove iframe rendering in src/components/windows/BrowserContent.tsx
- [x] T014 [US1] Add WebView creation call on component mount in src/components/windows/BrowserContent.tsx
- [x] T015 [US1] Add WebView destruction call on component unmount in src/components/windows/BrowserContent.tsx
- [x] T016 [US1] Create content area placeholder div with ref for bounds calculation in src/components/windows/BrowserContent.tsx

### Tests for User Story 1

- [x] T016a [P] [US1] Add integration test: WebView creates successfully with external URL in src-tauri/src/browser_webview.rs
- [x] T016b [P] [US1] Add integration test: WebView loads blocked sites (simulate X-Frame-Options bypass) in src-tauri/src/browser_webview.rs

**Checkpoint**: User Story 1 complete - Browser can load any website (google.com, youtube.com, etc.) without X-Frame-Options errors

---

## Phase 4: User Story 2 - Synchronized Window Controls (Priority: P1)

**Goal**: URL bar, back/forward, refresh, zoom controls work with WebView

**Independent Test**: Type URL and press Enter to navigate, click back/forward buttons, adjust zoom - all affect WebView content

### Implementation for User Story 2

- [x] T017 [P] [US2] Add browser_navigate command in src-tauri/src/browser_webview.rs
- [x] T018 [P] [US2] Add browser_go_back command in src-tauri/src/browser_webview.rs
- [x] T019 [P] [US2] Add browser_go_forward command in src-tauri/src/browser_webview.rs
- [x] T020 [P] [US2] Add browser_refresh command in src-tauri/src/browser_webview.rs
- [x] T021 [P] [US2] Add set_browser_zoom command in src-tauri/src/browser_webview.rs
- [x] T022 [US2] Register new navigation commands in src-tauri/src/lib.rs
- [x] T023 [US2] Add navigate, goBack, goForward, refresh, setZoom methods to useBrowserWebView hook in src/hooks/useBrowserWebView.ts
- [x] T024 [US2] Connect BrowserToolbar onNavigate to hook navigate method in src/components/windows/BrowserContent.tsx
- [x] T025 [US2] Connect BrowserToolbar onBack/onForward to hook methods in src/components/windows/BrowserContent.tsx
- [x] T026 [US2] Connect BrowserToolbar onRefresh to hook method in src/components/windows/BrowserContent.tsx
- [x] T027 [US2] Connect BrowserToolbar zoom controls to hook setZoom method in src/components/windows/BrowserContent.tsx

### Tests for User Story 2

- [x] T027a [P] [US2] Add test: navigate command changes WebView URL in src-tauri/src/browser_webview.rs
- [x] T027b [P] [US2] Add test: useBrowserWebView hook exposes navigation methods in src/hooks/useBrowserWebView.test.ts

**Checkpoint**: User Story 2 complete - All browser controls (navigate, back, forward, refresh, zoom) work with WebView

---

## Phase 5: User Story 3 - Seamless Window Positioning (Priority: P1)

**Goal**: WebView content area follows browser window position and size exactly

**Independent Test**: Move and resize browser window - WebView follows without visible gaps, overlaps, or lag (within 100ms, 2px tolerance)

### Implementation for User Story 3

- [x] T028 [US3] Add sync_browser_webview_bounds command in src-tauri/src/browser_webview.rs
- [x] T029 [US3] Register sync_browser_webview_bounds command in src-tauri/src/lib.rs
- [x] T030 [US3] Add syncBounds method to useBrowserWebView hook in src/hooks/useBrowserWebView.ts
- [x] T031 [US3] Calculate content area bounds using getBoundingClientRect in src/components/windows/BrowserContent.tsx
- [x] T032 [US3] Call syncBounds on initial mount with calculated bounds in src/components/windows/BrowserContent.tsx
- [x] T033 [US3] Add ResizeObserver to detect content area size changes in src/components/windows/BrowserContent.tsx
- [x] T034 [US3] Add window move/resize event listener to sync bounds in src/components/windows/BrowserContent.tsx
- [x] T035 [US3] Implement debounce for rapid move/resize events (final sync must be accurate) in src/components/windows/BrowserContent.tsx

### Tests for User Story 3

- [x] T035a [P] [US3] Add test: sync_browser_webview_bounds updates position/size in src-tauri/src/browser_webview.rs
- [x] T035b [P] [US3] Add test: bounds sync completes within 100ms threshold in src-tauri/src/browser_webview.rs

**Checkpoint**: User Story 3 complete - WebView maintains 2px alignment during and after window move/resize operations

---

## Phase 6: User Story 4 - URL Synchronization from WebView (Priority: P2)

**Goal**: URL bar updates when user clicks links within WebView

**Independent Test**: Click links in WebView content - URL bar updates to show new destination

### Implementation for User Story 4

- [x] T036 [US4] Add on_navigation hook to emit browser-url-changed event in src-tauri/src/browser_webview.rs
- [x] T037 [US4] Include canGoBack/canGoForward in browser-url-changed event payload in src-tauri/src/browser_webview.rs
- [x] T038 [US4] Add event listener for browser-url-changed in useBrowserWebView hook in src/hooks/useBrowserWebView.ts
- [x] T039 [US4] Update currentUrl state when browser-url-changed event received in src/hooks/useBrowserWebView.ts
- [x] T040 [US4] Update canGoBack/canGoForward state from event payload in src/hooks/useBrowserWebView.ts
- [x] T041 [US4] Pass currentUrl from hook to BrowserToolbar URL bar in src/components/windows/BrowserContent.tsx
- [x] T042 [US4] Pass canGoBack/canGoForward to enable/disable back/forward buttons in src/components/windows/BrowserContent.tsx

**Checkpoint**: User Story 4 complete - URL bar reflects WebView navigation within 500ms

---

## Phase 7: User Story 5 - Transparency Synchronization (Priority: P2)

**Goal**: WebView matches browser window opacity setting

**Independent Test**: Adjust browser window opacity slider - both UI chrome and WebView content become more/less transparent together

### Implementation for User Story 5

- [x] T043 [US5] Add setOpacity method to useBrowserWebView hook in src/hooks/useBrowserWebView.ts
- [x] T044 [US5] Create set_browser_webview_opacity command in src-tauri/src/browser_webview.rs
- [x] T045 [US5] Register set_browser_webview_opacity command in src-tauri/src/lib.rs
- [x] T046 [US5] Connect window opacity changes to WebView opacity sync in src/components/windows/BrowserContent.tsx
- [x] T047 [US5] Document WebView transparency limitations (if any) in quickstart.md in specs/040-webview-browser/quickstart.md

**Checkpoint**: User Story 5 complete - WebView opacity matches browser window opacity setting

---

## Phase 8: User Story 6 - Persistence of Browser State (Priority: P2)

**Goal**: URL and zoom level saved and restored between sessions

**Independent Test**: Navigate to URL, adjust zoom, close overlay, reopen - same URL and zoom restored

### Implementation for User Story 6

- [x] T048 [US6] Ensure initialUrl from window content prop is passed to WebView creation in src/components/windows/BrowserContent.tsx
- [x] T049 [US6] Ensure initialZoom from window content prop is passed to WebView creation in src/components/windows/BrowserContent.tsx
- [x] T050 [US6] Add URL change handler that updates window content state (triggers persistence) in src/components/windows/BrowserContent.tsx
- [x] T051 [US6] Add zoom change handler that updates window content state (triggers persistence) in src/components/windows/BrowserContent.tsx
- [x] T052 [US6] Implement debounce for URL persistence to avoid excessive writes in src/hooks/useBrowserWebView.ts

**Checkpoint**: User Story 6 complete - Browser state persists across application restarts with 100% reliability

---

## Phase 9: User Story 7 - WebView Visibility with Overlay State (Priority: P2)

**Goal**: WebView hides/shows with overlay toggle

**Independent Test**: Toggle overlay visibility (F3) - WebView hides/shows in sync

### Implementation for User Story 7

- [x] T053 [US7] Add set_browser_webview_visibility command in src-tauri/src/browser_webview.rs
- [x] T054 [US7] Register set_browser_webview_visibility command in src-tauri/src/lib.rs
- [x] T055 [US7] Add get_all_browser_webview_labels helper to BrowserWebViewState in src-tauri/src/browser_webview_types.rs
- [x] T055a [US7] Add set_all_browser_webviews_visibility command in src-tauri/src/browser_webview.rs
- [x] T056 [US7] Extend toggle_visibility to hide all browser WebViews when overlay hides in src-tauri/src/lib.rs
- [x] T057 [US7] Extend toggle_visibility to show browser WebViews when overlay shows in src-tauri/src/lib.rs
- [x] T058 [US7] Add destroy_all_browser_webviews command for cleanup in src-tauri/src/browser_webview.rs

**Checkpoint**: User Story 7 complete - No orphaned WebView windows after overlay hide or browser close

---

## Phase 10: Error Handling & UI Polish

**Purpose**: Error display and edge case handling across all user stories

- [ ] T059 Add browser-error event emission for navigation failures in src-tauri/src/browser_webview.rs
- [ ] T060 Add browser-loading event emission for loading state in src-tauri/src/browser_webview.rs
- [ ] T061 Add event listener for browser-error in useBrowserWebView hook in src/hooks/useBrowserWebView.ts
- [ ] T062 Add event listener for browser-loading in useBrowserWebView hook in src/hooks/useBrowserWebView.ts
- [ ] T063 Add error state to useBrowserWebView hook in src/hooks/useBrowserWebView.ts
- [ ] T064 Add isLoading state to useBrowserWebView hook in src/hooks/useBrowserWebView.ts
- [ ] T065 Modify BrowserToolbar to show error icon and status text in URL bar area in src/components/windows/BrowserToolbar.tsx
- [ ] T066 Add loading indicator to BrowserToolbar when isLoading is true in src/components/windows/BrowserToolbar.tsx
- [ ] T067 Clear error state when new navigation begins in src/hooks/useBrowserWebView.ts

---

## Phase 11: Polish & Cross-Cutting Concerns

**Purpose**: Improvements that affect multiple user stories

- [ ] T068 Verify URL normalization (auto-add https:// if protocol missing) in src-tauri/src/browser_webview.rs
- [ ] T069 Verify WebView z-order is correct above main overlay and multi-window layering works in src-tauri/src/browser_webview.rs
- [ ] T069a Verify overlay hotkeys (F3, etc.) capture input before WebView receives keyboard events in src-tauri/src/lib.rs
- [ ] T069b Document hotkey priority behavior in specs/040-webview-browser/quickstart.md (confirm existing keyboard hook handles this)
- [ ] T070 Test multiple concurrent browser windows with independent WebViews
- [ ] T071 Verify WebView follows browser window across monitor boundaries
- [ ] T072 Run quickstart.md manual testing checklist in specs/040-webview-browser/quickstart.md

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion - BLOCKS all user stories
- **User Story 1-3 (Phase 3-5)**: All P1 priority - depend on Foundational
  - US1, US2, US3 have some interdependencies due to shared component modifications
  - Recommended order: US1 → US3 → US2 (core WebView, then positioning, then controls)
- **User Story 4-7 (Phase 6-9)**: All P2 priority - depend on US1-3 completion
  - US4, US5, US6, US7 can proceed in parallel after P1 stories complete
- **Error Handling (Phase 10)**: Depends on all user stories being functional
- **Polish (Phase 11)**: Depends on Error Handling completion

### User Story Dependencies

- **User Story 1 (P1)**: Core WebView creation - foundation for all other stories
- **User Story 2 (P1)**: Navigation controls - requires US1 WebView to exist
- **User Story 3 (P1)**: Position sync - requires US1 WebView to exist
- **User Story 4 (P2)**: URL sync - requires US1, US2 (navigation triggers URL changes)
- **User Story 5 (P2)**: Transparency - requires US1, US3 (WebView and positioning)
- **User Story 6 (P2)**: Persistence - requires US1, US2 (URL/zoom from controls)
- **User Story 7 (P2)**: Visibility sync - requires US1 (WebView lifecycle)

### Within Each User Story

- Rust commands before TypeScript hook methods
- Hook methods before component integration
- Component integration last

### Parallel Opportunities

**Phase 1 (All parallel)**:
```
Task: T001 (TypeScript types)
Task: T002 (Rust types)
```

**Phase 4 - US2 (Navigation commands parallel)**:
```
Task: T017 (browser_navigate)
Task: T018 (browser_go_back)
Task: T019 (browser_go_forward)
Task: T020 (browser_refresh)
Task: T021 (set_browser_zoom)
```

**P2 Stories (After P1 completion)**:
```
Parallel track A: US4 (URL sync)
Parallel track B: US5 (Transparency)
Parallel track C: US6 (Persistence)
Parallel track D: US7 (Visibility)
```

---

## Implementation Strategy

### MVP First (User Stories 1-3 Only)

1. Complete Phase 1: Setup (types)
2. Complete Phase 2: Foundational (WebView create/destroy)
3. Complete Phase 3: User Story 1 (browse any website)
4. Complete Phase 5: User Story 3 (positioning)
5. Complete Phase 4: User Story 2 (controls)
6. **STOP and VALIDATE**: Test browsing google.com, youtube.com, github.com
7. Deploy/demo if ready

### Incremental Delivery

1. Complete Setup + Foundational → Foundation ready
2. Add User Story 1 → Test browsing blocked sites → **MVP!**
3. Add User Story 3 → Test window positioning → Demo positioning
4. Add User Story 2 → Test all controls → Feature complete for basic use
5. Add User Stories 4-7 → Full feature parity with iframe version
6. Add Error Handling + Polish → Production ready

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps task to specific user story for traceability
- Each user story should be independently completable and testable
- Commit after each task or logical group
- Stop at any checkpoint to validate story independently
- WebView label convention: `browser-webview-{windowId}`
- Coordinate system: Use logical pixels for all position/size operations
