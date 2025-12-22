# Implementation Plan: System Clock Window

**Branch**: `023-system-clock-window` | **Date**: 2025-12-22 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/023-system-clock-window/spec.md`

## Summary

Implement a new transparent clock window that displays system time in 24-hour format (HH:MM:SS) with white text and blue text-stroke for contrast. The window integrates with the existing overlay window system, supporting drag-to-position, resize with auto-scaling text, click-through on transparent areas, and state persistence across sessions.

## Technical Context

**Language/Version**: TypeScript 5.7.2 (React 19.0.0 frontend), Rust 2021 Edition (Tauri backend - unchanged)
**Primary Dependencies**: React 19.0.0, Next.js 16.x, Tailwind CSS 4.x, motion 12.x, shadcn/ui, Tauri 2.x
**Storage**: JSON files in Tauri app data directory (extends existing `state.json` + `window-{id}.json` pattern)
**Testing**: Manual testing (consistent with existing window components)
**Target Platform**: Windows 11 (64-bit)
**Project Type**: Desktop application with frontend (Next.js) + backend (Tauri/Rust)
**Performance Goals**: Time updates every second with <100ms visual response on resize
**Constraints**: Click-through transparency, auto-scaling text, no window chrome
**Scale/Scope**: Single window type addition to existing overlay system

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

### I. Code Quality
- [x] **Static analysis**: Will pass TypeScript type checking and linting
- [x] **Single responsibility**: ClockContent component focuses only on time display
- [x] **No duplication**: Reuses existing Window wrapper, persistence patterns, and event system
- [x] **Self-documenting**: Component and function names clearly describe purpose

### II. Testing Standards
- [x] **Integration focus**: Window integration testable through existing patterns
- [x] **Feature testing**: Time display, resize scaling, and persistence are testable outcomes
- [x] **Deterministic**: Time can be mocked for consistent testing

### III. User Experience Consistency
- [x] **UI consistency**: Follows existing window patterns (menu button, drag, resize)
- [x] **Clear feedback**: Time updates visibly every second
- [x] **Accessibility**: Text scales for readability; high contrast (white on blue border)

### IV. Performance Requirements
- [x] **Response time**: <100ms for resize visual feedback
- [x] **Resource efficiency**: Single setInterval, minimal re-renders
- [x] **No regressions**: Isolated component, no impact on other windows

### V. Research-First Development
- [x] **Documentation verified**: Tailwind CSS text-shadow, CSS -webkit-text-stroke researched
- [x] **Patterns identified**: Existing window component patterns documented
- [x] **Best practices**: Auto-scaling text via viewport units or container-based sizing

**Gate Status**: PASS - No violations

## Project Structure

### Documentation (this feature)

```text
specs/023-system-clock-window/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
├── contracts/           # Phase 1 output (N/A - no API contracts)
└── tasks.md             # Phase 2 output (/speckit.tasks command)
```

### Source Code (repository root)

```text
src/
├── components/
│   └── windows/
│       ├── Window.tsx              # Existing - reuse
│       ├── WindowHeader.tsx        # Existing - reuse
│       └── ClockContent.tsx        # NEW - clock display component
├── types/
│   ├── windows.ts                  # MODIFY - add 'clock' to WindowContentType
│   └── persistence.ts              # MODIFY - add 'clock' to WindowType
├── lib/
│   └── serialization.ts            # MODIFY - add serializeClockContent() (optional, for consistency)
└── app/
    └── page.tsx                    # MODIFY - add clock restoration in WindowRestorer

src-tauri/src/
└── persistence_types.rs            # MODIFY - add Clock variant to WindowType enum
```

**Note**: ClockToolbar.tsx not needed (clock has no interactive controls). PersistenceContext.tsx not modified (clock has no content state - window structure persistence handled automatically).

**Structure Decision**: Follows existing Tauri + Next.js desktop application structure. New clock component integrates into existing `src/components/windows/` directory following established patterns (NotesContent, DrawContent, BrowserContent).

## Complexity Tracking

> One documented exception to Constitution principles.

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| II. Testing Standards - Manual testing only | Clock component is pure UI with no business logic (time display, styling). Follows precedent of existing window components (NotesContent, DrawContent, BrowserContent) which use manual testing. Integration tests would test React/browser time APIs, not feature logic. | Automated tests would mock Date/setInterval, testing framework behavior rather than feature correctness. Manual verification is more effective for visual styling requirements. |
