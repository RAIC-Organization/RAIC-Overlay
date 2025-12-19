# Implementation Plan: App Icon Branding

**Branch**: `011-app-icon-branding` | **Date**: 2025-12-20 | **Spec**: [spec.md](spec.md)
**Input**: Feature specification from `/specs/011-app-icon-branding/spec.md`

## Summary

Replace the existing HeaderPanel component (displaying "RAIC Overlay" text) with a 50x50px app icon positioned in the top-left corner with 50px margins. The icon displays at 100% opacity in interactive (windowed) mode and 40% opacity in non-interactive (fullscreen) mode. The icon follows existing overlay animation patterns using motion/react and maintains click-through behavior in fullscreen mode.

## Technical Context

**Language/Version**: TypeScript 5.7.2 (React 19.0.0 frontend), Rust 2021 Edition (Tauri backend - unchanged)
**Primary Dependencies**: React 19.0.0, Next.js 16.x, motion 12.x, Tailwind CSS 4.x, shadcn/ui
**Storage**: N/A (static asset only)
**Testing**: Vitest + React Testing Library
**Target Platform**: Windows 11 (64-bit) via Tauri 2.x
**Project Type**: Tauri desktop application with Next.js frontend
**Performance Goals**: Icon visible within 100ms of overlay appearing; smooth 60fps opacity transitions
**Constraints**: Icon must not block clicks in fullscreen mode; must respect reduced motion preferences
**Scale/Scope**: 1 component removal, 1 component creation, 1 asset relocation, page.tsx update

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Status | Notes |
|-----------|--------|-------|
| I. Code Quality | PASS | Single-responsibility AppIcon component; descriptive naming; no duplication |
| II. Testing Standards | PASS | Integration tests for icon rendering, positioning, opacity per mode |
| III. User Experience Consistency | PASS | Consistent opacity behavior matching existing overlay patterns; smooth transitions |
| IV. Performance Requirements | PASS | Static image asset; motion animations match existing patterns |
| V. Research-First Development | PASS | No new libraries; follows existing motion/react patterns from HeaderPanel |

**Gate Status**: PASS - All principles satisfied

## Project Structure

### Documentation (this feature)

```text
specs/011-app-icon-branding/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output (minimal - UI only)
├── quickstart.md        # Phase 1 output
└── tasks.md             # Phase 2 output (/speckit.tasks command)
```

### Source Code (repository root)

```text
src/
├── components/
│   ├── AppIcon.tsx          # NEW: App icon component
│   ├── HeaderPanel.tsx      # DELETE: To be removed
│   └── ...
└── assets/
    └── icon.png             # NEW: Moved from temp/Icon.png

app/
└── page.tsx                 # MODIFIED: Replace HeaderPanel with AppIcon

tests/
└── react/
    ├── AppIcon.test.tsx     # NEW: Component tests
    └── HeaderPanel.test.tsx # DELETE: No longer needed
```

**Structure Decision**: Single project structure. New AppIcon component replaces HeaderPanel. Icon asset moved from `temp/` to `src/assets/` for proper bundling.

## Complexity Tracking

> No violations - feature is straightforward component replacement
