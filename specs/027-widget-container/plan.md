# Implementation Plan: Widget Container System

**Branch**: `027-widget-container` | **Date**: 2025-12-23 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/027-widget-container/spec.md`

## Summary

Create a new widget container system parallel to the existing window system. Widgets are transparent, borderless containers that display content (starting with a clock widget). In interaction mode, widgets show corner resize accents, support drag-to-reposition (after 150-200ms hold), and click-to-flip to reveal settings (opacity slider). The backflip animation mimics macOS widget behavior. Widget state (position, size, opacity) persists alongside window state. The existing clock window (feature 023) will be deprecated and removed.

## Technical Context

**Language/Version**: TypeScript 5.7.2 (React 19.0.0 frontend), Rust 2021 Edition (Tauri backend)
**Primary Dependencies**: React 19.0.0, Next.js 16.x, motion 12.x (for animations), shadcn/ui, Tailwind CSS 4.x, Tauri 2.x
**Storage**: JSON files in Tauri app data directory (extends existing state.json + widget-{id}.json pattern)
**Testing**: Manual testing with visual verification, existing test patterns
**Target Platform**: Windows 11 (64-bit)
**Project Type**: Web (Tauri desktop app with React frontend)
**Performance Goals**: Widget operations < 200ms p95, backflip animation 500ms, 60fps during drag/resize
**Constraints**: Must integrate with existing persistence system, must respect interaction mode toggle (F5)
**Scale/Scope**: Single widget type initially (clock), extensible architecture for future widgets

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Status | Notes |
|-----------|--------|-------|
| I. Code Quality | PASS | Will follow existing patterns from window system, single-responsibility components |
| II. Testing Standards | PASS | Component tests for widget container, visual verification for animations |
| III. User Experience Consistency | PASS | Follows existing interaction mode patterns, consistent with window system UX |
| IV. Performance Requirements | PASS | Animation targets defined (500ms backflip), no performance regressions expected |
| V. Research-First Development | PASS | Will use Context7 for motion.dev 3D transform documentation |

**Quality Gates:**
- Pre-commit: Linting and type checking MUST pass
- Pre-merge: All existing tests MUST pass
- Simplicity: Reuse existing persistence patterns, avoid over-abstraction

## Project Structure

### Documentation (this feature)

```text
specs/027-widget-container/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
└── tasks.md             # Phase 2 output (created by /speckit.tasks)
```

### Source Code (repository root)

```text
src/
├── components/
│   ├── widgets/                        # NEW: Widget system components
│   │   ├── WidgetsContainer.tsx        # Widget orchestrator (like WindowsContainer)
│   │   ├── Widget.tsx                  # Individual widget with flip animation
│   │   ├── WidgetSettings.tsx          # Settings panel (back of flip)
│   │   ├── ClockWidgetContent.tsx      # Clock widget content (front of flip)
│   │   └── index.ts                    # Exports
│   ├── MainMenu.tsx                    # MODIFY: Remove clock window, add clock widget
│   └── windows/
│       └── ClockContent.tsx            # REMOVE: Deprecated clock window
├── contexts/
│   ├── WidgetsContext.tsx              # NEW: Widget state management
│   └── WindowsContext.tsx              # EXISTING: No changes needed
├── hooks/
│   └── useWidgetEvents.ts              # NEW: Widget event subscription
├── lib/
│   └── widgetEvents.ts                 # NEW: Widget event emitter
├── types/
│   ├── widgets.ts                      # NEW: Widget TypeScript types
│   └── persistence.ts                  # MODIFY: Add widget persistence types

src-tauri/src/
├── persistence.rs                      # MODIFY: Add widget load/save
├── persistence_types.rs                # MODIFY: Add WidgetStructure type
└── lib.rs                              # MODIFY: Register widget IPC commands

app/
└── page.tsx                            # MODIFY: Add WidgetRestorer component
```

**Structure Decision**: Follows existing window system architecture. Widgets are a parallel system to windows, using the same patterns (event emitter, context, persistence) but with distinct components and types.

## Complexity Tracking

| Exception | Justification | Simpler Alternative Rejected Because |
|-----------|---------------|-------------------------------------|
| Manual testing only (Constitution II) | Visual 3D animation feature | Automated visual regression testing impractical for CSS 3D transforms and flip animations; manual verification is standard practice for animation-heavy UI |

Architecture mirrors existing window system for consistency.
