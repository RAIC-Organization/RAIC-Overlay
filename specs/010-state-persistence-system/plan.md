# Implementation Plan: State Persistence System

**Branch**: `010-state-persistence-system` | **Date**: 2025-12-19 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/010-state-persistence-system/spec.md`

## Summary

Implement a state persistence system where the React frontend maintains all overlay state as the single source of truth in a centralized store. The system uses a hybrid file structure: `state.json` for global settings and window structure, plus separate `window-{id}.json` files for each window's content. The Tauri backend acts as a durable storage layer with save/load/delete commands. State hydration blocks UI render (splash screen) until complete, with automatic debounced persistence triggered by user interactions.

## Technical Context

**Language/Version**: TypeScript 5.7.2 (React 19.0.0 frontend), Rust 2021 Edition (Tauri backend)
**Primary Dependencies**: React 19.0.0, Next.js 16.x, Tauri 2.x, @tauri-apps/api 2.0.0, serde/serde_json (Rust), TipTap 3.13.0, Excalidraw 0.18.0
**Storage**: JSON files in Tauri app data directory (`state.json` + `window-{id}.json`)
**Testing**: Vitest 2.1.0 (frontend), cargo test (backend)
**Target Platform**: Windows 11 (64-bit)
**Project Type**: Desktop application (Tauri - Rust backend + React frontend)
**Performance Goals**: State restore <2s (up to 20 windows), persist operations <500ms
**Constraints**: Single instance enforcement, atomic writes, 500ms debounce for high-frequency changes
**Scale/Scope**: Up to 20 windows typical usage, dozens of windows max

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

### I. Code Quality - ✅ PASS
- TypeScript strict mode already enabled
- ESLint 9.15.0 configured with TypeScript support
- Will follow single responsibility for persistence services
- Will use descriptive names for state types and persistence functions

### II. Testing Standards - ✅ PASS
- Vitest available for frontend integration tests
- cargo test available for backend unit tests
- Will write integration tests for save/load/delete operations
- Will test edge cases: corruption, missing files, version mismatch

### III. User Experience Consistency - ✅ PASS
- Splash/loading screen during hydration (per clarification)
- Clear error messages when state cannot be saved/loaded
- Consistent auto-save behavior (debounced, triggered by user actions)
- No manual save required - automatic persistence

### IV. Performance Requirements - ✅ PASS
- Defined targets: <2s restore, <500ms persist
- Debounce reduces persist operations by 80%
- Will measure and validate performance in tests
- Atomic writes prevent corruption

### V. Research-First Development - ✅ PASS
- Will use Context7 for Tauri app data directory APIs
- Will research serde best practices for versioned JSON
- Will verify Zustand/React state management patterns

### Quality Gates
- Pre-commit: Linting/type checking will pass
- Pre-merge: Tests will cover all acceptance scenarios
- Debounce mechanism testable via timing assertions

### Simplicity Standard
- Use existing WindowsContext pattern as foundation
- Minimal new dependencies (possibly Zustand if needed)
- No encryption (clarified as unnecessary)
- Reset-only versioning (no complex migrations initially)

## Project Structure

### Documentation (this feature)

```text
specs/010-state-persistence-system/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
├── contracts/           # Phase 1 output (Tauri command definitions)
└── tasks.md             # Phase 2 output (/speckit.tasks command)
```

### Source Code (repository root)

```text
src/
├── components/
│   ├── ui/                          # shadcn/ui components
│   ├── windows/
│   │   ├── Window.tsx               # Window frame (existing)
│   │   ├── WindowsContainer.tsx     # Window renderer (existing)
│   │   ├── DrawContent.tsx          # Excalidraw (existing)
│   │   └── NotesContent.tsx         # TipTap editor (existing)
│   ├── MainMenu.tsx                 # Main menu (existing)
│   └── LoadingScreen.tsx            # NEW: Loading screen during hydration
├── contexts/
│   └── WindowsContext.tsx           # Multi-window state (to be enhanced)
├── stores/                          # NEW: Persistence layer
│   ├── persistenceStore.ts          # Centralized state with serialization
│   └── persistenceService.ts        # Tauri IPC wrapper for save/load/delete
├── hooks/
│   ├── useWindowEvents.ts           # Existing event subscription
│   ├── usePersistence.ts            # NEW: Persistence triggers and debounce
│   └── useHydration.ts              # NEW: Startup hydration hook
├── lib/
│   ├── windowEvents.ts              # Event emitter (existing)
│   ├── utils.ts                     # Utilities (existing)
│   └── serialization.ts             # NEW: State serialization/deserialization
└── types/
    ├── windows.ts                   # Window types (existing, to extend)
    ├── ipc.ts                       # Tauri types (existing, to extend)
    ├── overlay.ts                   # Overlay state (existing)
    └── persistence.ts               # NEW: Persistence-specific types

src-tauri/src/
├── main.rs                          # Entry point (existing)
├── lib.rs                           # Commands (to add persistence commands)
├── state.rs                         # OverlayState (existing)
├── types.rs                         # Types (to extend with persistence)
├── persistence.rs                   # NEW: File I/O for state persistence
└── single_instance.rs               # NEW: Single instance enforcement

tests/
├── integration/
│   └── persistence.test.ts          # NEW: Persistence integration tests
└── unit/
    └── serialization.test.ts        # NEW: Serialization unit tests
```

**Structure Decision**: Web application pattern (Tauri = backend, React = frontend). Extends existing `src/` and `src-tauri/src/` directories with new persistence modules.

## Complexity Tracking

No constitution violations requiring justification. Design follows simplicity standard:
- Uses existing React Context pattern
- Minimal new files (persistence layer only)
- No external state management library required (confirmed in research - extend existing Context)
- No encryption complexity
- Reset-only versioning (migration hooks for future)

---

## Constitution Check (Post-Design)

*Re-evaluation after Phase 1 design completion.*

### I. Code Quality - ✅ PASS
- Design uses TypeScript strict mode throughout
- Single responsibility: persistence service handles IPC, hooks handle triggers, types are isolated
- Clear naming: `persistenceService`, `useHydration`, `PersistedState`, `WindowContentFile`
- No code duplication: single `atomic_write` utility for all file operations

### II. Testing Standards - ✅ PASS
- Integration tests planned for save/load/delete cycle
- Edge cases covered in data model: corruption, missing files, version mismatch, orphaned content files
- Manual test checklist in quickstart.md

### III. User Experience Consistency - ✅ PASS
- Loading screen blocks render until hydration complete
- Error handling defined: graceful fallback to defaults on corruption/version mismatch
- Consistent auto-save with 500ms debounce
- Clear visual feedback via existing UI patterns

### IV. Performance Requirements - ✅ PASS
- Targets defined: <2s restore, <500ms persist
- Debounce mechanism specified with trigger mapping
- Atomic writes with sync_all ensure durability
- Parallel loading of window content files for faster startup

### V. Research-First Development - ✅ PASS (Completed)
- Context7 used for Tauri app data directory APIs
- Research documented in research.md
- Decision: extend existing Context (not Zustand) based on research
- Single instance plugin identified and documented

### Simplicity Standard - ✅ PASS
- No new npm dependencies required
- One new Cargo dependency: `tauri-plugin-single-instance`
- Extends existing patterns rather than replacing them
- No over-engineering: reset-only versioning, no encryption

**Gate Status**: ALL GATES PASSED - Ready for task generation

---

## Generated Artifacts

| Artifact | Path | Description |
|----------|------|-------------|
| research.md | `specs/010-state-persistence-system/research.md` | Technology decisions and rationale |
| data-model.md | `specs/010-state-persistence-system/data-model.md` | Entity definitions, TypeScript/Rust types |
| tauri-commands.md | `specs/010-state-persistence-system/contracts/tauri-commands.md` | Backend command API contract |
| quickstart.md | `specs/010-state-persistence-system/quickstart.md` | Step-by-step implementation guide |

**Next Step**: Run `/speckit.tasks` to generate actionable tasks from this plan.
