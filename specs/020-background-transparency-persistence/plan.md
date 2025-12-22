# Implementation Plan: Background Transparency Persistence Fix

**Branch**: `020-background-transparency-persistence` | **Date**: 2025-12-22 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/020-background-transparency-persistence/spec.md`

## Summary

Fix the stale closure bug in `PersistenceContext.tsx` that prevents the `backgroundTransparent` property from being persisted to state.json when the toggle is clicked. The fix involves modifying the `onWindowMoved` callback to read the current state at persistence time rather than capturing a potentially stale `windows` array at callback creation time.

## Technical Context

**Language/Version**: TypeScript 5.7.2 (frontend), Rust 2021 Edition (backend - unchanged)
**Primary Dependencies**: React 19.0.0, Next.js 16.x, Tauri 2.x, @tauri-apps/api 2.0.0
**Storage**: JSON files in Tauri app data directory (state.json)
**Testing**: Vitest with @testing-library/react
**Target Platform**: Windows 11 (64-bit)
**Project Type**: Desktop application (Tauri + Next.js)
**Performance Goals**: Persistence must complete within 1 second of toggle action (debounced at 500ms)
**Constraints**: Must not regress existing opacity slider persistence; must handle concurrent state updates
**Scale/Scope**: Single-user desktop application with ephemeral window state

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Status | Notes |
|-----------|--------|-------|
| I. Code Quality | PASS | Fix addresses a clear bug; single responsibility maintained |
| II. Testing Standards | PASS | Existing integration tests should cover persistence; add specific test for backgroundTransparent |
| III. User Experience Consistency | PASS | Fix ensures consistent behavior - settings persist as user expects |
| IV. Performance Requirements | PASS | Uses existing debounce mechanism; no performance regression expected |
| V. Research-First Development | PASS | Root cause already identified via code inspection; React state patterns well understood |

**Gate Result**: All principles satisfied. Proceeding to Phase 0.

## Project Structure

### Documentation (this feature)

```text
specs/020-background-transparency-persistence/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
├── contracts/           # Phase 1 output (empty for this bug fix)
└── tasks.md             # Phase 2 output (/speckit.tasks command)
```

### Source Code (repository root)

```text
src/
├── contexts/
│   ├── WindowsContext.tsx      # Provides windows state and setWindowBackgroundTransparent
│   └── PersistenceContext.tsx  # Contains onWindowMoved callback - FIX LOCATION
├── components/
│   └── windows/
│       ├── Window.tsx          # Wires up onBackgroundTransparentCommit
│       ├── WindowHeader.tsx    # Contains BackgroundToggle integration
│       └── BackgroundToggle.tsx # Toggle UI component
├── lib/
│   └── serialization.ts        # serializeWindow function (already correct)
├── hooks/
│   └── usePersistence.ts       # Debounce and save logic
└── types/
    ├── windows.ts              # WindowInstance type (already has backgroundTransparent)
    └── persistence.ts          # WindowStructure type (already has backgroundTransparent)

app/
└── page.tsx                    # WindowRestorer (already reads backgroundTransparent correctly)
```

**Structure Decision**: Existing structure is correct. The fix is localized to `PersistenceContext.tsx` - specifically the `onWindowMoved` callback that captures stale state.

## Complexity Tracking

No violations. This is a minimal bug fix that:
- Modifies a single callback in PersistenceContext.tsx
- Requires no new dependencies
- Follows existing patterns for state access
