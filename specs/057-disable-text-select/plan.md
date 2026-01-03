# Implementation Plan: Disable Text Selection

**Branch**: `057-disable-text-select` | **Date**: 2026-01-03 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/057-disable-text-select/spec.md`

## Summary

Disable text selection on UI chrome elements (headers, buttons, labels, menu items) across all Tauri overlay windows to provide a native Windows desktop experience. Text selection must remain functional in content areas where users need to copy/paste (Notes editor, input fields).

**Technical Approach**: Apply CSS `user-select: none` globally to the body element, then explicitly opt-in content areas with `user-select: text` to preserve legitimate text selection functionality.

## Technical Context

**Language/Version**: TypeScript 5.7.2 (React 19.0.0 frontend), CSS (Tailwind CSS 4.x)
**Primary Dependencies**: Next.js 16.x, Tailwind CSS 4.x, React 19.0.0, TipTap 3.13.0, Excalidraw 0.18.0
**Storage**: N/A (pure CSS styling change)
**Testing**: Manual testing (visual verification of text selection behavior)
**Target Platform**: Windows 11 (Tauri 2.x desktop application)
**Project Type**: Desktop application (Tauri + Next.js frontend)
**Performance Goals**: N/A (zero runtime overhead - CSS-only)
**Constraints**: Must not break TipTap editor text selection, input field selection, or Excalidraw text
**Scale/Scope**: Global CSS change affecting all overlay windows

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Status | Notes |
|-----------|--------|-------|
| I. Code Quality | ✅ PASS | Single CSS rule addition; self-documenting; no complexity introduced |
| II. Testing Standards | ✅ PASS | Manual visual testing appropriate for CSS-only change |
| III. User Experience Consistency | ✅ PASS | Aligns with native Windows UX expectations |
| IV. Performance Requirements | ✅ PASS | Zero runtime overhead; CSS-only |
| V. Research-First Development | ✅ PASS | Standard CSS property; no external library research needed |
| Simplicity Standard | ✅ PASS | Simplest possible solution: 2 CSS rules |

**Gate Result**: PASS - Proceeding to Phase 0

**Testing Exception Justification**: Constitution Principle II (Testing Standards) requires integration tests for all features. This feature is granted an exception because:
1. Pure CSS change with zero runtime logic - no code paths to test programmatically
2. Visual verification is the only meaningful test (text selection is a visual/interactive behavior)
3. Automated CSS testing would require browser automation overhead disproportionate to the change
4. Manual verification checklist provided in tasks.md (T003-T005) covers all acceptance criteria

## Project Structure

### Documentation (this feature)

```text
specs/057-disable-text-select/
├── plan.md              # This file
├── research.md          # Phase 0 output (minimal - CSS-only)
├── quickstart.md        # Phase 1 output
└── tasks.md             # Phase 2 output (/speckit.tasks command)
```

### Source Code (repository root)

```text
app/
├── globals.css          # PRIMARY: Add user-select: none to body; opt-in for content areas
└── layout.tsx           # No changes needed

src/
├── styles/
│   ├── sc-theme.css     # No changes needed
│   └── tiptap.css       # May need user-select: text for editor (verify)
└── components/          # No changes needed (CSS handles globally)
```

**Structure Decision**: Minimal change to `app/globals.css` only. The global stylesheet already contains body/html rules and is the appropriate location for this CSS addition.

## Complexity Tracking

> No violations - feature uses simplest possible approach (2 CSS rules).

N/A

