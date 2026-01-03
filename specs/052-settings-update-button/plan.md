# Implementation Plan: Check for Update Button in Settings Panel

**Branch**: `052-settings-update-button` | **Date**: 2026-01-03 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/052-settings-update-button/spec.md`

## Summary

Add a new "Updates" section to the existing Settings panel that displays the current app version and provides a "Check for Updates" button. When clicked, the button triggers the existing `check_for_updates` Tauri command. If an update is available, the existing update notification window opens. If already up-to-date or an error occurs, inline status messages appear below the button.

## Technical Context

**Language/Version**: TypeScript 5.7.2 (React 19.0.0 frontend), Rust 2021 Edition (Tauri backend - unchanged)
**Primary Dependencies**: React 19.0.0, Next.js 16.x, Tauri 2.x, @tauri-apps/api 2.0.0, motion 12.x, shadcn/ui, Tailwind CSS 4.x, lucide-react
**Storage**: N/A (reuses existing update state persistence)
**Testing**: Manual testing (existing project pattern)
**Target Platform**: Windows 11 (64-bit)
**Project Type**: Tauri desktop application with React frontend
**Performance Goals**: Update check completes within 5 seconds; button loading state visible within 100ms
**Constraints**: Button must be disabled during check; inline messages for status feedback
**Scale/Scope**: Single section addition to Settings panel; ~100 LOC frontend changes

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

### I. Code Quality ✅
- [x] Code will pass static analysis (TypeScript strict mode, ESLint)
- [x] Single responsibility: UpdatesSection component handles only update-related UI
- [x] No code duplication: reuses existing `check_for_updates` command and update window logic
- [x] Self-documenting: descriptive component and state variable names

### II. Testing Standards ✅
- [x] Feature test: manual verification via Settings panel → button click → observe result
- [x] Integration: uses existing Tauri command integration
- [x] Deterministic: same button click produces predictable outcomes

### III. User Experience Consistency ✅
- [x] UI pattern consistent with existing Settings sections (Hotkeys, Startup)
- [x] Error messages clear and actionable (inline text below button)
- [x] Loading indicator provides immediate feedback (spinner on button)
- [x] Visual feedback on state changes (button disabled during check, status messages)

### IV. Performance Requirements ✅
- [x] Response time: button loading state within 100ms (local state change)
- [x] Update check: < 5 seconds under normal network (existing command performance)
- [x] No memory leaks: cleanup on component unmount

### V. Research-First Development ✅
- [x] Existing codebase patterns analyzed (Settings panel, update system)
- [x] No new external dependencies required
- [x] Reuses verified update check implementation

**Gate Status: PASS** - All constitution principles satisfied.

## Project Structure

### Documentation (this feature)

```text
specs/052-settings-update-button/
├── spec.md              # Feature specification
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
└── tasks.md             # Phase 2 output (/speckit.tasks command)
```

### Source Code (repository root)

```text
src/
├── components/
│   └── settings/
│       ├── SettingsPanel.tsx    # MODIFY: Add UpdatesSection
│       └── UpdatesSection.tsx   # CREATE: New component
├── types/
│   └── update.ts               # EXISTS: UpdateCheckResult type
└── lib/
    └── utils.ts                # EXISTS: cn() utility

src-tauri/
└── src/
    ├── update/
    │   ├── checker.rs          # EXISTS: check_for_updates command
    │   └── window.rs           # EXISTS: open_update_window command
    └── lib.rs                  # EXISTS: command registration (no changes needed)

app/
└── settings/
    └── page.tsx               # EXISTS: Settings page (no changes needed)
```

**Structure Decision**: Frontend-only changes. The Tauri backend already has all required commands (`check_for_updates`, `open_update_window`, `get_pending_update`). A new `UpdatesSection.tsx` component will be created and imported into the existing `SettingsPanel.tsx`.

## Complexity Tracking

No violations to justify. This feature:
- Adds a single new component (~80 lines)
- Modifies one existing component (add import + render)
- Uses only existing backend commands
- No new dependencies required
