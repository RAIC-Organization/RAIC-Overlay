# Implementation Plan: Browser Window Persistence

**Branch**: `015-browser-persistence` | **Date**: 2025-12-20 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/015-browser-persistence/spec.md`

## Summary

Extend the existing state persistence system (010) to persist Browser window content (URL and zoom level) alongside the already-persisted window structure (position, size, z-order, opacity). This follows the same pattern used for Notes and Draw windows, storing Browser-specific content in `window-{id}.json` files. The implementation primarily involves extending the WindowType enum, creating a BrowserContent persistence type, and modifying the BrowserContent component to support hydration and trigger persistence on URL/zoom changes.

## Technical Context

**Language/Version**: TypeScript 5.7.2 (React 19.0.0 frontend), Rust 2021 Edition (Tauri backend)
**Primary Dependencies**: React 19.0.0, Next.js 16.x, Tauri 2.x, @tauri-apps/api 2.0.0, serde/serde_json (Rust)
**Storage**: JSON files in Tauri app data directory (extends existing `state.json` + `window-{id}.json` pattern)
**Testing**: Vitest 2.1.0 (frontend), cargo test (backend)
**Target Platform**: Windows 11 (64-bit)
**Project Type**: Desktop application (Tauri - Rust backend + React frontend)
**Performance Goals**: State restore <2s, URL persist <1s, zoom persist <500ms
**Constraints**: Uses existing 500ms debounce for high-frequency changes, URL persistence after page load
**Scale/Scope**: Minimal change - adds new WindowType variant and content structure

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

### I. Code Quality - ✅ PASS
- Extends existing TypeScript strict mode types
- Follows established pattern from Notes/Draw persistence
- Single responsibility: BrowserContent manages browser state, persistence layer handles storage
- Clear naming conventions matching existing codebase

### II. Testing Standards - ✅ PASS
- Will write integration tests for Browser persistence (save/load cycle)
- Follows existing test patterns from 010-state-persistence-system
- Edge cases from spec covered: invalid values, missing files

### III. User Experience Consistency - ✅ PASS
- Matches Notes/Draw behavior exactly (automatic save, restore on launch)
- No new UI elements needed for persistence (transparent to user)
- Error handling: fallback to defaults on invalid data

### IV. Performance Requirements - ✅ PASS
- Uses existing debounce mechanism (500ms)
- URL persistence on page load (not during navigation)
- Meets spec targets: <1s URL persist, <500ms zoom persist

### V. Research-First Development - ✅ PASS
- Leverages existing persistence infrastructure (no new patterns needed)
- Extends proven WindowType/WindowContentFile pattern
- No new libraries or APIs required

### Quality Gates
- Pre-commit: Linting/type checking will pass
- Pre-merge: Tests will cover acceptance scenarios
- No performance regression expected (minimal overhead)

### Simplicity Standard - ✅ PASS
- Minimal changes: add 'browser' to WindowType enum
- Reuses existing persistence service and hooks
- No new dependencies
- No over-engineering: simple URL+zoom storage

## Project Structure

### Documentation (this feature)

```text
specs/015-browser-persistence/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
├── contracts/           # Phase 1 output (N/A - extends existing)
└── tasks.md             # Phase 2 output (/speckit.tasks command)
```

### Source Code (repository root)

```text
src/
├── components/
│   └── windows/
│       └── BrowserContent.tsx    # MODIFY: Add persistence hooks
├── lib/
│   └── serialization.ts          # MODIFY: Add browser type handling
├── types/
│   └── persistence.ts            # MODIFY: Add 'browser' type & BrowserContent

src-tauri/src/
├── persistence_types.rs          # MODIFY: Add Browser variant to WindowType
```

**Structure Decision**: Minimal modification to existing files. No new files needed - extends existing persistence infrastructure.

## Complexity Tracking

No constitution violations. Implementation is deliberately simple:
- Adds one new WindowType variant: 'browser'
- Adds one new content interface: BrowserPersistedContent (url, zoom)
- Modifies BrowserContent.tsx to accept initial state and trigger persistence
- No new files, patterns, or dependencies

---

## Constitution Check (Post-Design)

*Re-evaluation after Phase 1 design completion.*

### I. Code Quality - ✅ PASS
- Extends existing TypeScript types consistently
- BrowserPersistedContent follows NotesContent/DrawContent pattern
- Clear, minimal changes with no code duplication

### II. Testing Standards - ✅ PASS
- Integration test will verify save/load cycle for Browser windows
- Edge cases tested: invalid zoom (clamping), missing content file (defaults)

### III. User Experience Consistency - ✅ PASS
- Transparent to user - same automatic persistence as Notes/Draw
- Fallback to defaults on errors

### IV. Performance Requirements - ✅ PASS
- Leverages existing debounce mechanism
- No additional latency introduced

### V. Research-First Development - ✅ PASS (Completed)
- No external research needed - extends proven internal patterns
- Reviewed existing persistence implementation (010-state-persistence-system)

### Simplicity Standard - ✅ PASS
- Minimal LOC changes across 4 files
- No new dependencies
- No new architectural patterns

**Gate Status**: ALL GATES PASSED - Ready for task generation

---

## Generated Artifacts

| Artifact | Path | Description |
|----------|------|-------------|
| research.md | `specs/015-browser-persistence/research.md` | Analysis of existing persistence patterns |
| data-model.md | `specs/015-browser-persistence/data-model.md` | BrowserPersistedContent type definition |
| quickstart.md | `specs/015-browser-persistence/quickstart.md` | Step-by-step implementation guide |

**Note**: No contracts/ artifact needed - feature extends existing Tauri commands.

**Next Step**: Run `/speckit.tasks` to generate actionable tasks from this plan.
