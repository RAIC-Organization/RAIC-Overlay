# Tasks: Settings Version Display

**Input**: Design documents from `/specs/047-settings-version-display/`
**Prerequisites**: plan.md (required), spec.md (required for user stories), research.md, quickstart.md

**Tests**: Not requested in feature specification - test tasks omitted.

**Organization**: Single user story (P1) modifying one component file.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1)
- Include exact file paths in descriptions

## Path Conventions

- **Tauri desktop app**: `src/` (React frontend), `src-tauri/` (Rust backend)
- This feature only modifies: `src/components/settings/SettingsPanel.tsx`

---

## Phase 1: Setup

**Purpose**: Verify prerequisites are in place

- [x] T001 Verify `@tauri-apps/api` 2.0.0 is installed (check package.json)
- [x] T002 Verify `src/components/settings/SettingsPanel.tsx` exists and has footer section

**Checkpoint**: Prerequisites confirmed - ready for implementation

---

## Phase 2: User Story 1 - View Application Version (Priority: P1) 🎯 MVP

**Goal**: Display the bundled app version in the settings panel footer with small, muted text following standard desktop UI conventions.

**Independent Test**: Open settings panel and verify version (e.g., "v0.1.0") displays at bottom in small, muted text matching `tauri.conf.json` version.

### Implementation for User Story 1

- [x] T003 [US1] Add import for `getVersion` from `@tauri-apps/api/app` in `src/components/settings/SettingsPanel.tsx`
- [x] T004 [US1] Add `appVersion` state variable (`useState<string | null>(null)`) in `src/components/settings/SettingsPanel.tsx`
- [x] T005 [US1] Add `useEffect` to fetch version on mount using `getVersion()` with error handling in `src/components/settings/SettingsPanel.tsx`
- [x] T006 [US1] Add version display JSX in footer section with `text-xs text-muted-foreground font-display` styling in `src/components/settings/SettingsPanel.tsx`
- [x] T007 [US1] Add fallback text "Version unavailable" when version is null in `src/components/settings/SettingsPanel.tsx`

**Checkpoint**: User Story 1 complete - version displays in settings footer

---

## Phase 3: Polish & Verification

**Purpose**: Final validation

- [x] T008 Run `npm run tauri:dev` and open settings panel
- [x] T009 Verify version displays correctly and matches `tauri.conf.json` version field
- [x] T010 Verify styling is consistent with SC HUD theme (small, muted, footer position)

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - verify prerequisites
- **User Story 1 (Phase 2)**: Depends on Setup verification
- **Polish (Phase 3)**: Depends on User Story 1 completion

### Task Dependencies

```text
T001, T002 (parallel verification)
    ↓
T003 → T004 → T005 → T006 → T007 (sequential in same file)
    ↓
T008 → T009 → T010 (sequential verification)
```

### Parallel Opportunities

- T001 and T002 can run in parallel (different checks)
- T003-T007 must be sequential (same file, cumulative changes)
- T008-T010 must be sequential (depends on running app)

---

## Implementation Strategy

### MVP Delivery

1. Complete Phase 1: Setup verification (T001-T002)
2. Complete Phase 2: User Story 1 implementation (T003-T007)
3. Complete Phase 3: Verification (T008-T010)
4. **DONE**: Single component modified, feature complete

### Estimated Scope

- **Files modified**: 1 (`src/components/settings/SettingsPanel.tsx`)
- **Lines added**: ~15 (import, state, effect, JSX)
- **New dependencies**: None (uses existing `@tauri-apps/api`)
- **Rust changes**: None

---

## Notes

- All implementation tasks (T003-T007) modify the same file, so they cannot be parallelized
- This is intentionally minimal - no new files, no Rust changes, no tests needed
- The version comes from `tauri.conf.json` via Tauri's built-in API
- Commit after T007 with message referencing feature 047
