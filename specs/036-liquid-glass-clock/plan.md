# Implementation Plan: Liquid Glass Clock Widget

**Branch**: `036-liquid-glass-clock` | **Date**: 2025-12-29 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/036-liquid-glass-clock/spec.md`

## Summary

Apply an Apple-inspired liquid glass text effect to the clock widget, replacing the current white text with blue stroke styling. The effect will use a blue tint (matching the existing UI accent color #3b82f6) and incorporate frosted translucency, backdrop blur, and luminous edge highlights using Tailwind CSS utilities and minimal custom CSS.

## Technical Context

**Language/Version**: TypeScript 5.7.2, React 19.0.0
**Primary Dependencies**: Next.js 16.x, Tailwind CSS 4.x, motion 12.x (existing)
**Storage**: N/A (UI styling only - no persistence changes)
**Testing**: vitest, @testing-library/react
**Target Platform**: Windows 11 (Tauri 2.x overlay window)
**Project Type**: Web/desktop hybrid (Next.js + Tauri)
**Performance Goals**: 60fps rendering, no visual stuttering during 1-second time updates
**Constraints**: Must work on transparent Tauri overlay background, backdrop-blur must not cause excessive GPU usage
**Scale/Scope**: Single component modification (ClockWidgetContent.tsx)

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Status | Notes |
|-----------|--------|-------|
| I. Code Quality | PASS | Simple CSS styling change, single responsibility maintained |
| II. Testing Standards | PASS | Visual styling - manual testing appropriate, automated snapshot tests optional |
| III. User Experience Consistency | PASS | Blue-tinted glass maintains consistency with existing UI accent color |
| IV. Performance Requirements | PASS | Must verify backdrop-blur performance at 1-second updates |
| V. Research-First Development | PASS | Will research Apple liquid glass CSS patterns and Tailwind best practices |

**Quality Gates:**
- Pre-commit: Linting and formatting checks MUST pass
- Pre-merge: No TypeScript errors, visual verification of effect quality
- Pre-deploy: Performance verified (no stuttering during time updates)

**Simplicity Standard:**
- Use Tailwind utilities where possible
- Custom CSS only for effects not achievable with utilities
- No new dependencies required

## Project Structure

### Documentation (this feature)

```text
specs/036-liquid-glass-clock/
├── plan.md              # This file
├── research.md          # Phase 0 output - liquid glass CSS patterns
├── data-model.md        # Phase 1 output - N/A for this feature (no data model)
├── quickstart.md        # Phase 1 output - implementation guide
├── contracts/           # Phase 1 output - N/A for this feature (no APIs)
└── tasks.md             # Phase 2 output (/speckit.tasks command)
```

### Source Code (repository root)

```text
src/
└── components/
    └── widgets/
        └── ClockWidgetContent.tsx    # Primary modification target

app/
└── globals.css                       # May need @import for new styles
```

**Structure Decision**: Minimal footprint - modify existing ClockWidgetContent.tsx component. Create separate liquid-glass.css only if custom CSS exceeds inline complexity threshold. Prefer Tailwind utility classes in component.

## Complexity Tracking

> No Constitution Check violations - no justifications needed.

| Aspect | Approach | Rationale |
|--------|----------|-----------|
| CSS Implementation | Tailwind utilities + minimal custom CSS | Simplest approach per project standards |
| File Changes | Modify existing component only | No new abstractions needed |
| Reusability | CSS class composition | Style can be extracted later if needed |
