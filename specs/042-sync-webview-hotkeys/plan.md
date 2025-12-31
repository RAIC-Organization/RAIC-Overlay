# Implementation Plan: Sync Webview Hotkeys with Backend Settings

**Branch**: `042-sync-webview-hotkeys` | **Date**: 2025-12-31 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/042-sync-webview-hotkeys/spec.md`

## Summary

Fix the frontend webview hotkey capture (`useHotkeyCapture.ts`) to use configurable hotkey settings instead of hardcoded F3/F5 keys. The hook must load settings on startup, listen for backend events when settings change, and dynamically update which keys trigger visibility/mode toggles. This ensures consistency between backend low-level keyboard hook and frontend webview capture.

## Technical Context

**Language/Version**: TypeScript 5.7.2 (frontend), Rust 2021 Edition (backend - unchanged)
**Primary Dependencies**: React 19.0.0, Next.js 16.0.10, @tauri-apps/api 2.0.0, motion 12.x
**Storage**: JSON files in Tauri app data directory (user-settings.json via existing persistence)
**Testing**: Manual testing (existing pattern), TypeScript compilation verification
**Testing Justification**: Bug fix with narrow scope (2 files modified). Manual acceptance tests (T028-T033) cover all user stories and edge cases. Automated hotkey testing would require complex Tauri test harness infrastructure not currently in project. This aligns with existing project pattern for UI-focused features.
**Target Platform**: Windows 11 (64-bit)
**Project Type**: Desktop app (Tauri + Next.js frontend)
**Performance Goals**: Hotkey response < 200ms, settings update propagation < 500ms
**Constraints**: 200ms debounce between repeated keypresses, must match backend behavior
**Scale/Scope**: Single user, 2 hotkeys (visibility toggle, mode toggle)

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Status | Evidence |
|-----------|--------|----------|
| **I. Code Quality** | PASS | Changes isolated to `useHotkeyCapture.ts` and minor backend event emission; single responsibility maintained |
| **II. Testing Standards** | PASS | Feature testable via manual acceptance scenarios defined in spec; integration test via user flow |
| **III. User Experience Consistency** | PASS | Fixes inconsistency where hotkeys work differently based on window focus; aligns with user expectations |
| **IV. Performance Requirements** | PASS | 200ms debounce matches backend; 500ms settings propagation target defined |
| **V. Research-First Development** | PASS | Research phase will verify Tauri event patterns and React hook best practices |

**Gate Result**: PASS - Proceed to Phase 0

## Project Structure

### Documentation (this feature)

```text
specs/042-sync-webview-hotkeys/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
├── contracts/           # Phase 1 output (event contracts)
└── tasks.md             # Phase 2 output (/speckit.tasks command)
```

### Source Code (repository root)

```text
src/
├── hooks/
│   └── useHotkeyCapture.ts    # PRIMARY CHANGE: Replace hardcoded keys with settings
├── types/
│   └── user-settings.ts       # EXISTING: HotkeySettings, HotkeyBinding types
├── utils/
│   ├── hotkey-validation.ts   # EXISTING: hotkeyEquals, formatHotkey utilities
│   └── vk-codes.ts            # EXISTING: VK code mappings
├── lib/
│   └── logger.ts              # EXISTING: Tauri logging
└── components/
    └── settings/
        └── SettingsPanel.tsx  # MINOR: May need to trigger event after update_hotkeys

src-tauri/src/
├── user_settings.rs           # CHANGE: Add event emission after update_hotkeys
├── user_settings_types.rs     # EXISTING: Rust types (no changes)
├── keyboard_hook.rs           # EXISTING: Low-level hook (no changes)
└── lib.rs                     # EXISTING: Command registration (no changes)
```

**Structure Decision**: Tauri desktop app with Next.js frontend. Changes primarily in frontend hook with minor backend event emission addition.

## Complexity Tracking

> No constitution violations. Feature is a focused bug fix with minimal scope.

| Aspect | Complexity | Justification |
|--------|------------|---------------|
| Files changed | Low | 2-3 files (hook, settings emit, optional settings panel) |
| New dependencies | None | Uses existing @tauri-apps/api event system |
| New abstractions | None | Extends existing patterns |
| Risk | Low | Isolated change with clear rollback path |

## Constitution Check (Post-Design)

*Re-evaluation after Phase 1 design completion.*

| Principle | Status | Evidence |
|-----------|--------|----------|
| **I. Code Quality** | PASS | Design uses existing patterns (listen/unlisten, useState, useEffect cleanup); no new abstractions |
| **II. Testing Standards** | PASS | Manual test checklist in quickstart.md; TypeScript compilation verifies types |
| **III. User Experience Consistency** | PASS | Design ensures hotkeys work identically regardless of focus state |
| **IV. Performance Requirements** | PASS | 200ms debounce on both frontend and backend; event propagation is near-instant |
| **V. Research-First Development** | PASS | Research documented in research.md; Tauri 2.x and React patterns verified via Context7 |

**Post-Design Gate Result**: PASS - Ready for `/speckit.tasks`

## Generated Artifacts

| Artifact | Path | Description |
|----------|------|-------------|
| Research | [research.md](./research.md) | Tauri events, React patterns, key matching |
| Data Model | [data-model.md](./data-model.md) | Existing entities, new event type |
| Event Contract | [contracts/events.md](./contracts/events.md) | `hotkeys-updated` event specification |
| Quickstart | [quickstart.md](./quickstart.md) | Implementation guide with code snippets |
