# Implementation Plan: Process Not Found Popup Liquid Glass Style

**Branch**: `037-process-popup-glass` | **Date**: 2025-12-29 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/037-process-popup-glass/spec.md`

## Summary

Refactor the ErrorModal component to match the windows overlay system aesthetic with liquid glass effect, SC theme border with corner accents, window header structure (title left, X close button right), and Orbitron typography. The modal will use existing styling patterns from Window.tsx and sc-theme.css while removing resize/drag functionality.

## Technical Context

**Language/Version**: TypeScript 5.7.2 (React 19.0.0 frontend), Rust 2021 Edition (Tauri backend - unchanged)
**Primary Dependencies**: React 19.0.0, Next.js 16.x, motion 12.x (motion/react), shadcn/ui, Tailwind CSS 4.x, lucide-react (X icon)
**Storage**: N/A (uses existing state persistence system - no changes required)
**Testing**: Visual testing (manual screenshot comparison), accessibility testing (screen reader, keyboard)
**Target Platform**: Windows 11 (64-bit)
**Project Type**: Web (Tauri frontend)
**Performance Goals**: Animation duration < 300ms at 60fps (no frame drops), backdrop-blur renders without visible lag on target hardware (Windows 11, existing liquid-glass-text baseline)
**Constraints**: Modal displays for 5 seconds with countdown, must maintain WCAG 2.1 AA accessibility
**Scale/Scope**: Single component refactor (~120 lines)

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Status | Notes |
|-----------|--------|-------|
| I. Code Quality | PASS | Single component with clear responsibility, reuses existing CSS utilities |
| II. Testing Standards | PASS | Visual testing defined in success criteria (screenshot comparison) |
| III. User Experience Consistency | PASS | Aligns modal with windows overlay system aesthetic |
| IV. Performance Requirements | PASS | Reuses existing backdrop-blur pattern from liquid-glass-text |
| V. Research-First Development | PASS | Existing patterns documented; no new dependencies |

**Simplicity Standard Check:**
- Reuses existing `.sc-corner-accents`, `.sc-glow-transition`, `.liquid-glass-text` patterns
- No new dependencies introduced
- No new abstractions needed - direct CSS class application
- Single file modification (ErrorModal.tsx) + optional CSS additions

## Project Structure

### Documentation (this feature)

```text
specs/037-process-popup-glass/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output (minimal - no data changes)
├── quickstart.md        # Phase 1 output
├── contracts/           # Phase 1 output
│   └── README.md        # CSS contract for ErrorModal styling
└── tasks.md             # Phase 2 output (/speckit.tasks command)
```

### Source Code (repository root)

```text
src/
├── components/
│   └── ErrorModal.tsx           # MODIFY: Restructure with window header, apply liquid glass + SC theme
└── styles/
    └── sc-theme.css             # UNCHANGED: Already has .sc-corner-accents, .sc-glow-transition

app/
└── globals.css                  # OPTIONAL: Add .error-modal-glass if needed (or use inline)
```

**Structure Decision**: Minimal footprint - modify existing ErrorModal.tsx component. Apply existing CSS utilities (sc-corner-accents, sc-glow-transition, liquid-glass-text). Create .error-modal-glass class in globals.css only if inline styles become unwieldy.

## Complexity Tracking

> No violations - no tracking needed. Feature uses existing patterns and utilities.
