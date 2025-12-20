# Implementation Plan: Per-Window Opacity Control

**Branch**: `013-window-opacity-control` | **Date**: 2025-12-20 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/013-window-opacity-control/spec.md`

## Summary

Add per-window opacity control with a slider in the window header (visible in interactive mode only). Each window stores its own opacity value (default 60%, range 10%-100%) which persists across sessions via the existing state persistence system. The opacity remains consistent across interaction/non-interaction modes, replacing the previous automatic 60% transparency behavior.

## Technical Context

**Language/Version**: TypeScript 5.7.2 (frontend), Rust 2021 Edition (Tauri backend)
**Primary Dependencies**: React 19.0.0, Next.js 16.x, motion 12.x, shadcn/ui, Tailwind CSS 4.x, Tauri 2.x
**Storage**: JSON files in Tauri app data directory (extends state.json for window structure)
**Testing**: Manual testing (existing project pattern)
**Target Platform**: Windows 11 (64-bit)
**Project Type**: Desktop application with web frontend
**Performance Goals**: Opacity changes < 50ms visual feedback, slider interaction < 1 second response
**Constraints**: Debounced persistence (500ms after slider adjustment ends)
**Scale/Scope**: Per-window setting, supports up to 20+ concurrent windows

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Status | Notes |
|-----------|--------|-------|
| I. Code Quality | PASS | Extends existing WindowInstance type, uses existing shadcn/ui Slider component |
| II. Testing Standards | PASS | Feature can be tested manually via acceptance scenarios |
| III. User Experience Consistency | PASS | Uses existing header UI pattern, slider with percentage label provides clear feedback |
| IV. Performance Requirements | PASS | Real-time opacity updates (<50ms), debounced persistence (500ms) |
| V. Research-First Development | PASS | Researched shadcn/ui Slider component - see research.md |

### Constitution Re-Check (Post Phase 1 Design)

| Principle | Status | Notes |
|-----------|--------|-------|
| I. Code Quality | PASS | Design follows existing patterns, single responsibility maintained |
| II. Testing Standards | PASS | Acceptance scenarios testable via manual verification |
| III. User Experience Consistency | PASS | Slider in header follows existing UI patterns |
| IV. Performance Requirements | PASS | Real-time updates via CSS opacity, debounced persistence |
| V. Research-First Development | PASS | shadcn/ui Slider component documented in research.md |

**Quality Gates:**
- Pre-commit: TypeScript type checking must pass
- Pre-merge: No runtime errors, opacity persists correctly
- Pre-deploy: Slider accessible, percentage label visible

## Project Structure

### Documentation (this feature)

```text
specs/013-window-opacity-control/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
├── contracts/           # Phase 1 output (internal state contracts)
└── tasks.md             # Phase 2 output (/speckit.tasks command)
```

### Source Code (repository root)

```text
src/
├── components/
│   ├── ui/
│   │   ├── slider.tsx           # NEW: shadcn/ui Slider component
│   │   └── ...
│   └── windows/
│       ├── Window.tsx           # MODIFY: Apply per-window opacity
│       ├── WindowHeader.tsx     # MODIFY: Add opacity slider with percentage label
│       └── OpacitySlider.tsx    # NEW: Opacity slider wrapper component
├── contexts/
│   └── WindowsContext.tsx       # MODIFY: Add opacity to WindowInstance, actions
├── types/
│   ├── windows.ts               # MODIFY: Add opacity property to WindowInstance
│   └── persistence.ts           # MODIFY: Add opacity to WindowStructure
└── lib/
    └── serialization.ts         # MODIFY: Handle opacity serialization

src-tauri/
└── src/
    └── persistence_types.rs     # MODIFY: Add opacity field to WindowStructure
```

**Structure Decision**: Extends existing window system (007) and persistence system (010). Uses single project structure with frontend components and Tauri backend.

## Complexity Tracking

> No constitution violations requiring justification. Feature uses existing patterns.
