# Implementation Plan: Buy Me A Coffee Button in Settings Panel

**Branch**: `053-buymeacoffee-button` | **Date**: 2026-01-03 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/053-buymeacoffee-button/spec.md`

## Summary

Add a "Buy Me A Coffee" donation button to the Settings panel, positioned between the Save button and version number. The button opens the donation URL (`https://www.buymeacoffee.com/braindaamage`) in the user's default external browser using the existing `@tauri-apps/plugin-opener` dependency.

## Technical Context

**Language/Version**: TypeScript 5.7.2 (React 19.0.0 frontend), Rust 2021 Edition (Tauri backend - unchanged)
**Primary Dependencies**: React 19.0.0, Next.js 16.x, @tauri-apps/plugin-opener (already installed), Tailwind CSS 4.x, lucide-react (for icons)
**Storage**: N/A (no persistence required - static URL)
**Testing**: Component tests with vitest + @testing-library/react
**Target Platform**: Windows 11 (64-bit)
**Project Type**: Desktop application (Tauri + Next.js)
**Performance Goals**: Button click response < 200ms p95 (instant external browser launch)
**Constraints**: Must open in external browser only (not in-app webview)
**Scale/Scope**: Single component modification (SettingsPanel.tsx)

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Status | Notes |
|-----------|--------|-------|
| I. Code Quality | PASS | Simple feature, single responsibility (button → open URL) |
| II. Testing Standards | PASS | Integration test for button click → URL open behavior |
| III. User Experience Consistency | PASS | Button styled to match existing Settings panel footer |
| IV. Performance Requirements | PASS | Single async call to openUrl, no performance concerns |
| V. Research-First Development | PASS | Using existing `@tauri-apps/plugin-opener` already in codebase |

**Simplicity Standard Check:**
- No new dependencies required (plugin-opener already installed)
- No abstractions needed (direct openUrl call)
- Single file modification (SettingsPanel.tsx)
- YAGNI: No additional features beyond the request

## Project Structure

### Documentation (this feature)

```text
specs/053-buymeacoffee-button/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output (N/A - no data model)
├── quickstart.md        # Phase 1 output
├── contracts/           # Phase 1 output (N/A - no APIs)
└── tasks.md             # Phase 2 output (/speckit.tasks command)
```

### Source Code (repository root)

```text
src/
├── components/
│   └── settings/
│       ├── SettingsPanel.tsx    # Modified: Add BMC button to footer
│       └── BuyMeCoffeeButton.tsx # New: Optional separate component
```

**Structure Decision**: Minimal impact approach - add button directly to SettingsPanel.tsx footer section. A separate component file is optional and only needed if reuse is anticipated (not the case here).

## Complexity Tracking

> No violations - feature is straightforward.

| Aspect | Decision | Rationale |
|--------|----------|-----------|
| Component structure | Inline in SettingsPanel | No reuse anticipated, simpler than separate file |
| Button styling | Match Settings panel theme | Consistency with existing UI |
| External URL opening | Use existing openUrl from plugin-opener | Already used elsewhere in codebase |
