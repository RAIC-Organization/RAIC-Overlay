# Implementation Plan: Excalidraw Draw Component

**Branch**: `009-excalidraw-draw-component` | **Date**: 2025-12-19 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/009-excalidraw-draw-component/spec.md`

## Summary

Implement a Draw component using Excalidraw that integrates with the existing windows system. Users can open multiple independent Draw windows from the main menu, use the full Excalidraw drawing toolkit in interaction mode, and view drawings read-only in non-interaction mode. Drawings are ephemeral - all content is lost when windows are closed.

**Technical Approach**: Create a `DrawContent` React component wrapping Excalidraw with mode-aware toolbar visibility via `viewModeEnabled` prop, add a "Draw" button to MainMenu (positioned after Notes, before Test Windows), and leverage the existing window event system for window creation. Follows the same pattern established by NotesContent (008).

## Technical Context

**Language/Version**: TypeScript 5.7.2, React 19.0.0, Next.js 16.x
**Primary Dependencies**: @excalidraw/excalidraw 0.18.0 (new); motion 12.x, shadcn/ui, Tailwind CSS 4.x (existing)
**Storage**: N/A (ephemeral in-memory state only, no persistence)
**Testing**: vitest (existing project test runner)
**Target Platform**: Windows 11 (64-bit) via Tauri 2.x
**Project Type**: Desktop application (Tauri + Next.js hybrid)
**Performance Goals**: <1s window open, <100ms toolbar toggle, <50ms drawing operations
**Constraints**: Support 10+ concurrent Draw windows, SSR compatibility (dynamic import with ssr: false)
**Scale/Scope**: Single feature addition to existing overlay system

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Status | Notes |
|-----------|--------|-------|
| I. Code Quality | PASS | Component follows existing NotesContent pattern, single responsibility |
| II. Testing Standards | PASS | Integration test (T002) verifies component rendering, toolbar visibility, and mode-aware behavior |
| III. User Experience Consistency | PASS | Uses existing shadcn/ui patterns, consistent with windows system |
| IV. Performance Requirements | PASS | Performance targets defined in spec (SC-001 through SC-003) |
| V. Research-First Development | PASS | Excalidraw documentation researched, patterns verified in research.md |
| Simplicity Standard | PASS | Uses existing window system, minimal new abstractions, follows 008 pattern |

**No violations requiring justification.**

## Project Structure

### Documentation (this feature)

```text
specs/009-excalidraw-draw-component/
├── plan.md              # This file
├── research.md          # Phase 0 output - Excalidraw research findings
├── data-model.md        # Phase 1 output - Component interfaces
├── quickstart.md        # Phase 1 output - Quick implementation guide
├── contracts/           # Phase 1 output - Component API contracts
│   └── draw-component.ts
└── tasks.md             # Phase 2 output (/speckit.tasks command)
```

### Source Code (repository root)

```text
src/
├── components/
│   ├── MainMenu.tsx              # MODIFY: Add Draw button between Notes and Test Windows
│   ├── windows/
│   │   ├── Window.tsx            # EXISTING: No changes needed
│   │   ├── WindowsContainer.tsx  # EXISTING: No changes needed
│   │   ├── NotesContent.tsx      # EXISTING: Reference pattern
│   │   ├── DrawContent.tsx       # NEW: Excalidraw wrapper component
│   │   └── __tests__/
│   │       └── DrawContent.test.tsx  # NEW: Integration test
│   └── ui/
│       └── (shadcn components)   # EXISTING: No changes needed
├── contexts/
│   └── WindowsContext.tsx        # EXISTING: No changes needed
├── hooks/
│   └── useWindowEvents.ts        # EXISTING: No changes needed
├── lib/
│   ├── windowEvents.ts           # EXISTING: No changes needed
│   └── utils.ts                  # EXISTING: cn() utility
└── types/
    └── windows.ts                # EXISTING: WindowOpenPayload, etc.

app/
└── page.tsx                      # EXISTING: Passes mode prop, no changes
```

**Structure Decision**: Frontend-only changes within existing Next.js/React structure. No new directories needed - DrawContent.tsx follows NotesContent.tsx pattern in `src/components/windows/`.

## Complexity Tracking

> No violations - table not applicable.
