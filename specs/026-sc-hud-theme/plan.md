# Implementation Plan: Star Citizen HUD Theme

**Branch**: `026-sc-hud-theme` | **Date**: 2025-12-23 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/026-sc-hud-theme/spec.md`

## Summary

Transform the RAICOverlay application's visual design to match Star Citizen's HUD aesthetic by implementing a comprehensive design token system with cyan/teal primary colors, deep space black backgrounds, subtle glow effects, optional scanlines, and moderate corner accent decorations. The implementation will update existing shadcn/ui components and window chrome styling while maintaining WCAG AA accessibility standards.

## Technical Context

**Language/Version**: TypeScript 5.7.2 (frontend), Rust 2021 Edition (backend - unchanged)
**Primary Dependencies**: React 19.0.0, Next.js 16.x, Tailwind CSS 4.x, shadcn/ui, motion 12.x, class-variance-authority, lucide-react
**Storage**: N/A (CSS-only changes, settings stored via existing persistence system)
**Testing**: vitest, @testing-library/react
**Target Platform**: Windows 11 (Tauri 2.x overlay application)
**Project Type**: Web application (Next.js frontend with Tauri backend)
**Performance Goals**: 60fps UI animations, <100ms interaction feedback
**Constraints**: Visual effects must not degrade overlay performance; WCAG AA contrast ratios required
**Scale/Scope**: ~6 UI components (button, input, slider, card, separator, button-group), 1 window system, 1 main menu, ~15 window content components

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Status | Evidence |
|-----------|--------|----------|
| I. Code Quality | PASS | CSS changes follow existing patterns; design tokens are centralized |
| II. Testing Standards | PASS | Visual changes testable via component tests; no complex logic |
| III. User Experience Consistency | PASS | Single cohesive theme; consistent patterns across all windows |
| IV. Performance Requirements | PASS | CSS effects use performant approaches; optional scanlines |
| V. Research-First Development | PASS | Research phase covers Tailwind 4 theming best practices |

**Simplicity Check**:
- [x] Using existing shadcn/ui component architecture
- [x] Extending existing Tailwind CSS design token system
- [x] No new dependencies required (except optional scanline CSS)
- [x] Single theme variant (no theme switching complexity)

## Project Structure

### Documentation (this feature)

```text
specs/026-sc-hud-theme/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output (design tokens schema)
├── quickstart.md        # Phase 1 output
├── contracts/           # Phase 1 output (theme CSS contract)
└── tasks.md             # Phase 2 output (/speckit.tasks command)
```

### Source Code (repository root)

```text
app/
├── globals.css              # Main CSS - design tokens defined here
└── layout.tsx               # Font imports (Orbitron already configured)

src/
├── components/
│   ├── ui/
│   │   ├── button.tsx       # Update with SC-themed variants and glow effects
│   │   ├── button-group.tsx # Update with SC-themed styling
│   │   ├── card.tsx         # Update with corner accents and borders
│   │   ├── input.tsx        # Update with SC-themed focus states
│   │   ├── slider.tsx       # Update with SC-themed track/thumb
│   │   └── separator.tsx    # Update with SC-themed styling
│   ├── MainMenu.tsx         # Update button styling
│   └── windows/
│       ├── Window.tsx       # Update border/shadow/corner accents
│       ├── WindowHeader.tsx # Update header styling with SC aesthetics
│       └── [content].tsx    # Content components inherit theme
├── lib/
│   └── utils.ts             # Utility functions (cn helper - unchanged)
└── styles/
    └── sc-theme.css         # NEW: Scanline overlay and corner accent styles
```

**Structure Decision**: Extending existing single-project structure. Theme changes are CSS-focused with minimal component modifications. New `sc-theme.css` file for complex CSS effects (scanlines, corner accents) that don't fit in design tokens.

## Complexity Tracking

> No violations - implementation follows simplest approach using existing patterns.

| Aspect | Decision | Rationale |
|--------|----------|-----------|
| Theme file location | globals.css | Consistent with existing setup |
| Scanline implementation | CSS pseudo-elements | No JS overhead, easily toggle-able |
| Corner accents | CSS pseudo-elements | No additional DOM elements needed |
| Glow effects | CSS box-shadow/filter | Native browser support, GPU-accelerated |
