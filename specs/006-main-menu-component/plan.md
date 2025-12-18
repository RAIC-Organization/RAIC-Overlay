# Implementation Plan: MainMenu Component with Grouped Buttons

**Branch**: `006-main-menu-component` | **Date**: 2025-12-18 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/006-main-menu-component/spec.md`

## Summary

Create a new MainMenu component with two button groups (Group 1: Option 1, Option 2; Group 2: Option 3) that appears at the top of the overlay in interactive mode (F5 toggle). The component has a transparent background, uses shadcn button styling, and logs button clicks to console. The existing HeaderPanel moves to the bottom position when MainMenu is visible.

## Technical Context

**Language/Version**: TypeScript 5.7.2, React 19.0.0
**Primary Dependencies**: Next.js 16.x, motion (12.x), shadcn/ui, Tailwind CSS 4.x, Tauri 2.x
**Storage**: N/A (UI component only, uses existing overlay state)
**Testing**: Vitest with @testing-library/react
**Target Platform**: Windows 11 (64-bit) via Tauri desktop app
**Project Type**: Desktop application with Next.js frontend + Tauri backend
**Performance Goals**: Menu appears within 300ms of F5 press (SC-001)
**Constraints**: Transparent background (60%+ visibility of underlying content)
**Scale/Scope**: Single overlay window, 3 buttons in 2 groups

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

### Pre-Design Check (Phase 0)

| Principle | Status | Evidence |
|-----------|--------|----------|
| I. Code Quality | ✅ PASS | Component follows existing patterns (HeaderPanel), TypeScript strict mode, single responsibility |
| II. Testing Standards | ✅ PASS | Component tests planned using Vitest + Testing Library (existing setup) |
| III. User Experience Consistency | ✅ PASS | Uses existing shadcn/ui styling, motion animations consistent with HeaderPanel/ErrorModal |
| IV. Performance Requirements | ✅ PASS | 300ms animation target aligns with existing 0.3s showHideDuration in HeaderPanel |
| V. Research-First Development | ✅ PASS | Research phase will verify shadcn Button component patterns and button group styling |

### Post-Design Re-Check (Phase 1 Complete)

| Principle | Status | Evidence |
|-----------|--------|----------|
| I. Code Quality | ✅ PASS | Design uses established patterns from HeaderPanel; MainMenu follows single responsibility; TypeScript props interfaces defined in data-model.md |
| II. Testing Standards | ✅ PASS | Verification checklist in quickstart.md covers all acceptance criteria; component testable with existing Vitest setup |
| III. User Experience Consistency | ✅ PASS | Research confirmed shadcn ButtonGroup provides proper ARIA attributes (`role="group"`); animation timing matches existing components |
| IV. Performance Requirements | ✅ PASS | 0.3s animation duration confirmed via research; no additional API calls or state management overhead |
| V. Research-First Development | ✅ PASS | research.md documents shadcn Button/ButtonGroup installation, usage patterns, and version-specific considerations; official docs consulted |

**Simplicity Standard Check:**
- ✅ Uses existing overlay mode state (no new state management)
- ✅ Follows established component patterns (HeaderPanel as reference)
- ✅ No new dependencies required (shadcn Button component needs to be added via CLI, but shadcn already in use)
- ✅ Simple prop-based visibility tied to existing `mode` state

## Project Structure

### Documentation (this feature)

```text
specs/006-main-menu-component/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
├── contracts/           # Phase 1 output (N/A for UI-only feature)
└── tasks.md             # Phase 2 output (/speckit.tasks command)
```

### Source Code (repository root)

```text
src/
├── components/
│   ├── ui/
│   │   ├── card.tsx         # Existing shadcn Card
│   │   └── button.tsx       # NEW: shadcn Button (to be added)
│   ├── HeaderPanel.tsx      # MODIFY: Add position prop for top/bottom
│   ├── ErrorModal.tsx       # Existing (unchanged)
│   └── MainMenu.tsx         # NEW: Main menu component
├── lib/
│   └── utils.ts             # Existing cn() utility
└── types/
    ├── ipc.ts               # Existing (unchanged)
    └── overlay.ts           # Existing (unchanged)

app/
└── page.tsx                 # MODIFY: Add MainMenu, update layout for mode-based positioning
```

**Structure Decision**: Single frontend project using existing Next.js + Tauri structure. New MainMenu component follows same pattern as HeaderPanel with motion animations.

## Complexity Tracking

No violations to justify. Implementation uses:
- Existing state management (overlay mode from page.tsx)
- Existing animation library (motion)
- Existing styling system (shadcn/ui + Tailwind)
- Simple component composition
