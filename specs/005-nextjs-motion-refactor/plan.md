# Implementation Plan: Next.js Migration with Motion Animations

**Branch**: `005-nextjs-motion-refactor` | **Date**: 2025-12-18 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/005-nextjs-motion-refactor/spec.md`

## Summary

Migrate the RAIC Overlay frontend from Vite/React to Next.js (static export mode) while preserving full Tauri integration. Add motion.dev (Motion for React) for smooth fade animations on show/hide transitions (F3), opacity mode changes (F5), and error modal entrance/exit. All existing functionality (keyboard shortcuts, window positioning, click-through mode, target window attachment) must be preserved.

## Technical Context

**Language/Version**: TypeScript 5.7.2, Rust 2021 Edition (backend unchanged)
**Primary Dependencies**: Next.js 15.x (static export), React 19.x, motion (motion.dev), shadcn/ui, Tailwind CSS 4.x, Tauri 2.x
**Storage**: N/A (in-memory state only)
**Testing**: vitest (frontend), cargo test (backend unchanged)
**Target Platform**: Windows 11 (64-bit) desktop via Tauri webview
**Project Type**: Desktop application with web frontend (Tauri + Next.js)
**Performance Goals**: 200-400ms show/hide animations, 200-300ms opacity transitions, <500ms startup, <50ms keypress response
**Constraints**: Bundle size increase <150KB from motion.dev, no server-side rendering, static HTML/JS output only
**Scale/Scope**: Single-user desktop overlay application, ~5 React components

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Status | Evidence |
|-----------|--------|----------|
| I. Code Quality | ✅ PASS | TypeScript strict mode, ESLint, existing code patterns preserved |
| II. Testing Standards | ✅ PASS | vitest for component tests, existing test infrastructure retained |
| III. User Experience Consistency | ✅ PASS | shadcn/ui design system retained, consistent animation timing |
| IV. Performance Requirements | ✅ PASS | Defined targets: 200-400ms animations, <500ms startup, <150KB bundle increase |
| V. Research-First Development | ✅ PASS | Research phase will use Context7 for Next.js static export + Tauri patterns |

**Simplicity Standard Check:**
- ✅ Migration uses simplest approach (static export, no SSR complexity)
- ✅ motion.dev justified: required for smooth animations per user request
- ✅ No new abstractions beyond what's needed for animation state
- ✅ YAGNI applied: only fade animations implemented (not slide/scale/spring)

### Constitution Exception: Testing Standards (II)

Animation behavior is primarily visual and requires manual verification. Automated integration tests for animation timing and visual smoothness would be:

1. **Brittle**: Timing-dependent assertions fail inconsistently across environments
2. **Low-value**: Cannot programmatically verify "smooth" perception or visual quality
3. **Redundant**: motion.dev library is extensively tested; we test integration, not the library

**Mitigation**: Manual test tasks verify animation behavior during implementation:
- T042-T044: Show/hide animation verification
- T051-T053: Opacity mode transition verification
- T064-T066: Error modal animation verification

Component rendering tests are deferred to post-MVP if animation issues are reported in production.

*This exception is documented per Constitution Governance: "Violations MUST be documented with justification if exceptions are granted."*

### Constitution Exception: CI Performance Tests (IV)

Performance verification tasks (T071, T072) run manually during development. CI integration for automated performance regression testing is deferred because:

1. **No existing CI pipeline**: Project does not currently have GitHub Actions or equivalent configured
2. **Platform constraints**: Tauri app startup measurement requires Windows runner with GUI capabilities
3. **Bundle size verification**: Can be performed locally via `du -sh out/` or build output inspection

**Mitigation**: Performance regression will be caught during:
- Manual testing (T070-T072)
- Code review (bundle size changes are visible in PR diffs)
- Pre-release validation (quickstart.md checklist)

CI performance automation is recommended as a future infrastructure improvement when CI is established.

## Project Structure

### Documentation (this feature)

```text
specs/005-nextjs-motion-refactor/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
├── contracts/           # Phase 1 output (N/A - no API contracts for UI feature)
└── tasks.md             # Phase 2 output (/speckit.tasks command)
```

### Source Code (repository root)

```text
# Current structure (Vite + React) → Next.js migration
src/                          # Will become app/ or src/ with Next.js structure
├── components/
│   ├── ui/
│   │   └── card.tsx         # shadcn component (preserved)
│   ├── HeaderPanel.tsx      # + motion animations
│   └── ErrorModal.tsx       # + motion animations
├── lib/
│   └── utils.ts             # shadcn utility (preserved)
├── types/
│   ├── ipc.ts               # Tauri IPC types (preserved)
│   └── overlay.ts           # State types (preserved)
├── styles/
│   └── globals.css          # Tailwind globals (preserved)
├── App.tsx                  # → page.tsx or layout
└── main.tsx                 # → Next.js entry point

src-tauri/                   # Unchanged - Rust backend
├── src/
│   ├── main.rs
│   ├── lib.rs
│   ├── hotkey.rs
│   ├── state.rs
│   ├── window.rs
│   ├── target_window.rs
│   ├── focus_monitor.rs
│   └── types.rs
└── tauri.conf.json          # Update frontendDist path

tests/                       # Test structure (preserved)
```

**Structure Decision**: Migrate to Next.js App Router structure with static export. The `src/` directory structure will be reorganized to follow Next.js conventions while preserving component organization. Tauri backend remains completely unchanged.

## Complexity Tracking

> No constitution violations requiring justification.

| Item | Justification |
|------|---------------|
| Next.js migration | Required per user request; static export keeps complexity minimal |
| motion.dev dependency | Required for smooth animations per user request; well-maintained library |
