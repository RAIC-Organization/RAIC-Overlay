# Implementation Plan: Excalidraw View Mode Polish

**Branch**: `033-excalidraw-view-polish` | **Date**: 2025-12-28 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/033-excalidraw-view-polish/spec.md`

## Summary

Polish the Excalidraw Draw window by (1) hiding UI controls (menu, zoom, help buttons) in non-interactive/view mode via CSS targeting `.excalidraw--view-mode`, and (2) enabling transparent background integration by syncing Excalidraw's `viewBackgroundColor` with the window system's `backgroundTransparent` prop.

## Technical Context

**Language/Version**: TypeScript 5.7.2, React 19.0.0
**Primary Dependencies**: @excalidraw/excalidraw 0.18.0, Next.js 16.x, Tailwind CSS 4.x
**Storage**: N/A (uses existing persistence system)
**Testing**: Vitest, React Testing Library
**Target Platform**: Windows 11 (Tauri 2.x desktop app)
**Project Type**: Desktop application with web frontend
**Performance Goals**: Mode/transparency transitions < 200ms
**Constraints**: CSS-based UI hiding (no native Excalidraw props available)
**Scale/Scope**: 2 files modified, ~30 lines of code

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

### Pre-Design Check (Phase 0)

| Principle | Status | Notes |
|-----------|--------|-------|
| I. Code Quality | PASS | Minimal changes, single responsibility (CSS hiding + prop sync) |
| II. Testing Standards | PASS | Integration test for mode switching and transparency |
| III. User Experience Consistency | PASS | Predictable behavior: controls hide in passive mode |
| IV. Performance Requirements | PASS | CSS transitions, no runtime overhead |
| V. Research-First Development | PASS | Excalidraw CSS classes verified via Context7 + file inspection |

### Post-Design Check (Phase 1)

| Principle | Status | Notes |
|-----------|--------|-------|
| I. Code Quality | PASS | Single prop addition, ~10 lines CSS, self-documenting |
| II. Testing Standards | PASS | Test cases defined in quickstart.md |
| III. User Experience Consistency | PASS | Consistent with existing window transparency toggle |
| IV. Performance Requirements | PASS | CSS display:none has zero runtime cost |
| V. Research-First Development | PASS | All selectors verified against Excalidraw 0.18.0 CSS |

**Simplicity Standard Check:**
- Solution uses existing CSS patterns and props
- No new dependencies required
- No abstractions or utilities needed
- YAGNI: Only implements what's needed for the two specific issues

## Project Structure

### Documentation (this feature)

```text
specs/033-excalidraw-view-polish/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output (minimal - prop addition only)
├── quickstart.md        # Phase 1 output
└── tasks.md             # Phase 2 output (created by /speckit.tasks)
```

### Source Code (repository root)

```text
src/
├── components/
│   └── windows/
│       └── DrawContent.tsx    # MODIFY: Add backgroundTransparent prop
app/
└── globals.css                # MODIFY: Add Excalidraw view-mode CSS rules
tests/
└── react/
    └── DrawContent.test.tsx   # MODIFY: Add transparency tests
```

**Structure Decision**: Existing single-project structure. Only modifying 2-3 existing files.

## Complexity Tracking

> No violations. Feature is appropriately simple.

| Aspect | Justification |
|--------|---------------|
| CSS-based hiding | Only option - Excalidraw lacks native props for this (verified via docs) |
| Prop drilling | `backgroundTransparent` already exists in window system, just needs forwarding |
