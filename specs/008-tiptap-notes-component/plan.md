# Implementation Plan: TipTap Notes Component

**Branch**: `008-tiptap-notes-component` | **Date**: 2025-12-18 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/008-tiptap-notes-component/spec.md`

## Summary

Implement a Notes component using TipTap v3 rich text editor that integrates with the existing windows system. Users can open multiple independent Notes windows from the main menu, edit content with a formatting toolbar in interaction mode, and view content read-only in non-interaction mode. Notes are ephemeral - all content is lost when windows are closed.

**Technical Approach**: Create a `NotesContent` React component wrapping TipTap editor with mode-aware toolbar visibility, add a "Notes" button to MainMenu (restructuring to single button group with Notes + Test Windows), and leverage the existing window event system for window creation.

## Technical Context

**Language/Version**: TypeScript 5.7.2, React 19.0.0, Next.js 16.x
**Primary Dependencies**: @tiptap/react, @tiptap/pm, @tiptap/starter-kit, @tiptap/extension-text-align (new); motion 12.x, shadcn/ui, Tailwind CSS 4.x (existing)
**Storage**: N/A (ephemeral in-memory state only, no persistence)
**Testing**: vitest (existing project test runner)
**Target Platform**: Windows 11 (64-bit) via Tauri 2.x
**Project Type**: Desktop application (Tauri + Next.js hybrid)
**Performance Goals**: <1s window open, <100ms toolbar toggle, <50ms formatting operations
**Constraints**: Support 10+ concurrent Notes windows, SSR compatibility (immediatelyRender: false)
**Scale/Scope**: Single feature addition to existing overlay system

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Status | Notes |
|-----------|--------|-------|
| I. Code Quality | PASS | Component follows existing patterns, single responsibility |
| II. Testing Standards | PASS | Integration tests will verify toolbar visibility and window creation |
| III. User Experience Consistency | PASS | Uses existing shadcn/ui patterns, consistent with windows system |
| IV. Performance Requirements | PASS | Performance targets defined in spec (SC-001 through SC-003) |
| V. Research-First Development | PASS | TipTap v3 documentation researched, patterns verified |
| Simplicity Standard | PASS | Uses existing window system, minimal new abstractions |

**No violations requiring justification.**

## Project Structure

### Documentation (this feature)

\`\`\`text
specs/008-tiptap-notes-component/
├── plan.md              # This file
├── research.md          # Phase 0 output - TipTap research findings
├── data-model.md        # Phase 1 output - Component interfaces
├── quickstart.md        # Phase 1 output - Quick implementation guide
├── contracts/           # Phase 1 output - Component API contracts
└── tasks.md             # Phase 2 output (/speckit.tasks command)
\`\`\`

### Source Code (repository root)

\`\`\`text
src/
├── components/
│   ├── MainMenu.tsx              # MODIFY: Restructure buttons, add Notes button
│   ├── windows/
│   │   ├── Window.tsx            # EXISTING: No changes needed
│   │   ├── WindowsContainer.tsx  # EXISTING: No changes needed
│   │   ├── TestWindowContent.tsx # EXISTING: Reference pattern
│   │   └── NotesContent.tsx      # NEW: TipTap editor component
│   └── ui/
│       └── (shadcn components)   # EXISTING: May use for toolbar buttons
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
\`\`\`

**Structure Decision**: Frontend-only changes within existing Next.js/React structure. No new directories needed - NotesContent.tsx follows TestWindowContent.tsx pattern in \`src/components/windows/\`.

## Complexity Tracking

> No violations - table not applicable.
