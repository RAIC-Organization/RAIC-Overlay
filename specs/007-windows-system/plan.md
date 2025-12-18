# Implementation Plan: Decoupled Windows System

**Branch**: `007-windows-system` | **Date**: 2025-12-18 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/007-windows-system/spec.md`

## Summary

Implement a decoupled, event-driven windowing system that allows users to open multiple draggable, resizable windows within the overlay container. Each window acts as a container for arbitrary React components. Windows support two visual modes: interactive (with header, border, close button) and passive (transparent, headerless). The system integrates with the existing F5 interaction mode toggle and MainMenu component.

## Technical Context

**Language/Version**: TypeScript 5.7.2 (React 19.0.0 frontend), Rust 1.92 (Tauri backend - unchanged)
**Primary Dependencies**: React 19.0.0, Next.js 16.x, motion (12.x), shadcn/ui, Tailwind CSS 4.x, Tauri 2.x
**Storage**: N/A (in-memory state only for Phase 1)
**Testing**: Manual testing for Phase 1; component tests recommended for future phases
**Target Platform**: Windows 11 (64-bit)
**Project Type**: Web application (Tauri + Next.js static export)
**Performance Goals**: Window operations respond within 100ms; support 10+ concurrent windows at 60fps
**Constraints**: Must integrate with existing F5 mode toggle; must not interfere with Tauri window management
**Scale/Scope**: Single overlay window with multiple internal virtual windows

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Status | Notes |
|-----------|--------|-------|
| I. Code Quality | ✅ PASS | TypeScript with strict types; single-responsibility components planned |
| II. Testing Standards | ⚠️ DEFERRED | Manual testing for Phase 1; integration tests in future phases |
| III. User Experience Consistency | ✅ PASS | Follows existing shadcn/ui patterns; uses motion.js animations |
| IV. Performance Requirements | ✅ PASS | 60fps target for drag/resize; 100ms mode transitions per spec |
| V. Research-First Development | ✅ PASS | Research phase completed; using established React patterns |

**Gate Result**: PASS (Testing deferred with justification - Phase 1 is exploratory UI work)

**Constitution Exception (II. Testing Standards)**:
Per constitution governance section: "Violations MUST be documented with justification if exceptions are granted."

- **Deferred Requirement**: "Integration/component tests MUST be written for all features before or during implementation"
- **Justification**: Phase 1 is exploratory UI work establishing patterns. Automated tests will be added in Phase 2 once component APIs stabilize.
- **Mitigation**: Manual testing per quickstart.md validates all acceptance scenarios. T029 explicitly validates against documented scenarios.
- **Remediation Timeline**: Component tests to be added before feature exits Draft status.

## Project Structure

### Documentation (this feature)

```text
specs/007-windows-system/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
├── contracts/           # Phase 1 output (event interfaces)
└── tasks.md             # Phase 2 output (created by /speckit.tasks)
```

### Source Code (repository root)

```text
src/
├── components/
│   ├── MainMenu.tsx              # Existing - add "Test Windows" button
│   ├── windows/                   # NEW - Windows system components
│   │   ├── WindowsContainer.tsx   # Container managing all windows
│   │   ├── Window.tsx             # Individual window component
│   │   ├── WindowHeader.tsx       # Header with title and close button
│   │   └── TestWindowContent.tsx  # Test component for validation
│   └── ui/                        # Existing shadcn components
├── contexts/                       # NEW - Context providers
│   └── WindowsContext.tsx         # Windows state management
├── hooks/                          # NEW - Custom hooks
│   └── useWindowEvents.ts         # Event subscription hook
├── types/
│   ├── overlay.ts                 # Existing types
│   ├── ipc.ts                     # Existing IPC types
│   └── windows.ts                 # NEW - Window system types
└── lib/
    └── utils.ts                   # Existing utilities

app/
├── layout.tsx                     # Existing - unchanged
├── page.tsx                       # Existing - integrate WindowsContainer
└── globals.css                    # Existing - add window styles
```

**Structure Decision**: Extends existing single-project structure with new `windows/` component directory and `contexts/` directory for React Context-based state management. This follows the established pattern of feature-specific component groupings.

**Terminology Note**: The `WindowsContainer` component implements the "WindowsManager" entity described in spec.md. These terms refer to the same orchestrator concept.

## Complexity Tracking

No constitution violations requiring justification. The implementation uses:
- React Context for state management (simplest viable solution)
- Standard DOM events for drag/resize (no external drag library needed)
- Existing motion.js for animations (already a dependency)
