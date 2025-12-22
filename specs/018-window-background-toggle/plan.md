# Implementation Plan: Window Background Toggle

**Branch**: `018-window-background-toggle` | **Date**: 2025-12-21 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/018-window-background-toggle/spec.md`

## Summary

Add a background toggle control (checkbox with transparent icon) to the window header that allows users to switch between solid and transparent background modes for the content area only. The header and toolbox remain solid. The setting persists per-window as part of the existing window state persistence system.

## Technical Context

**Language/Version**: TypeScript 5.7.2 (frontend), Rust 2021 Edition (Tauri backend - unchanged)
**Primary Dependencies**: React 19.0.0, Next.js 16.x, motion 12.x, shadcn/ui, Tailwind CSS 4.x, Tauri 2.x, lucide-react (icons)
**Storage**: JSON files in Tauri app data directory (extends existing `state.json` + `window-{id}.json` pattern)
**Testing**: Manual testing (consistent with existing window system testing approach)
**Target Platform**: Windows 11 (64-bit)
**Project Type**: Desktop application (Tauri + React)
**Performance Goals**: Background changes reflected in <50ms, persistence within 500ms
**Constraints**: Single-click toggle, consistent across interaction/non-interaction modes
**Scale/Scope**: Per-window setting, extends existing 12 functional requirements

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

### I. Code Quality ✅
- [x] Code will pass static analysis (TypeScript strict mode, ESLint)
- [x] Single responsibility: BackgroundToggle component handles only toggle UI
- [x] No duplication: Uses icon toggle button with lucide-react PanelTop icon (per research.md decision)
- [x] Descriptive naming: `backgroundTransparent`, `BackgroundToggle`, `setWindowBackgroundTransparent`

### II. Testing Standards ✅
- [x] Feature testable via manual interaction (consistent with existing window controls)
- [x] Deterministic behavior: Boolean toggle, clear state transitions

**Exception Note**: Manual testing is used instead of automated integration tests. This follows the established pattern for window system features (007, 013) where browser automation infrastructure is not yet configured. The simple boolean toggle with immediate visual feedback is easily verified manually.

### III. User Experience Consistency ✅
- [x] UI pattern consistent with existing opacity slider in header
- [x] Clear visual feedback: Checkbox checked/unchecked state
- [x] State changes provide immediate visual feedback

### IV. Performance Requirements ✅
- [x] <50ms for visual update (immediate CSS change)
- [x] <500ms for persistence (debounced, consistent with opacity slider)
- [x] No memory concerns: Simple boolean property

### V. Research-First Development ✅
- [x] Uses existing shadcn/ui components (Checkbox already in project)
- [x] Pattern follows existing OpacitySlider implementation
- [x] No new external dependencies required

### Simplicity Standard ✅
- [x] Minimal change: Add boolean property + toggle component
- [x] No new abstractions: Extends existing window state pattern
- [x] YAGNI compliant: Only implements requested functionality

## Project Structure

### Documentation (this feature)

```text
specs/018-window-background-toggle/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
├── contracts/           # Phase 1 output (N/A - no API contracts)
└── tasks.md             # Phase 2 output (/speckit.tasks command)
```

### Source Code (repository root)

```text
src/
├── components/
│   └── windows/
│       ├── Window.tsx              # MODIFY: Apply bg-transparent to content area
│       ├── WindowHeader.tsx        # MODIFY: Add BackgroundToggle component
│       ├── OpacitySlider.tsx       # REFERENCE: Pattern for toggle implementation
│       └── BackgroundToggle.tsx    # NEW: Checkbox toggle component
├── contexts/
│   └── WindowsContext.tsx          # MODIFY: Add backgroundTransparent state + action
├── types/
│   ├── windows.ts                  # MODIFY: Add backgroundTransparent to WindowInstance
│   └── persistence.ts              # MODIFY: Add backgroundTransparent to WindowStructure
└── lib/
    └── serialization.ts            # MODIFY: Include backgroundTransparent in serialization
```

**Structure Decision**: Extends existing Tauri + React single-project structure. All changes are additive modifications to existing files, with one new component file.

## Complexity Tracking

> No violations. Implementation uses simplest approach:
> - Single boolean property
> - Single checkbox component
> - Extends existing patterns without new abstractions
