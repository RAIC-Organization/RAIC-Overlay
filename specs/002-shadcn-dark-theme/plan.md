# Implementation Plan: Shadcn Design System Integration with Dark Theme

**Branch**: `002-shadcn-dark-theme` | **Date**: 2025-12-12 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/002-shadcn-dark-theme/spec.md`

## Summary

Integrate shadcn/ui design system into the existing React 19.2 + Vite + Tauri 2.x overlay application. Configure Tailwind CSS as the underlying styling framework, apply a custom dark-mode-only theme using user-provided HSL color values, and refactor the HeaderPanel component to use Tailwind utility classes. The overlay's transparent background behavior must be preserved.

## Technical Context

**Language/Version**: TypeScript 5.7 (React 19.2 frontend), Rust 1.92 (Tauri backend - unchanged)
**Primary Dependencies**: shadcn/ui, Tailwind CSS 4.x, @tailwindcss/vite, clsx, tailwind-merge
**Storage**: N/A (UI theming only)
**Testing**: Vitest (existing), visual verification
**Target Platform**: Windows 11 (64-bit) via Tauri 2.x
**Project Type**: Desktop overlay application (Tauri + React)
**Performance Goals**: N/A (static CSS, no runtime impact)
**Constraints**: Overlay transparency must be preserved; dark mode only (no theme switching)
**Scale/Scope**: 1 component refactor (HeaderPanel), new theme configuration files

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

### I. Code Quality ✅
- [x] Tailwind utility classes are readable and maintainable
- [x] CSS variables follow shadcn naming conventions (self-documenting)
- [x] No code duplication - theme defined once in globals.css

### II. Testing Standards ✅
- [x] Visual verification covers theming (component tests preserved)
- [x] Existing HeaderPanel tests remain valid (behavior unchanged)

### III. User Experience Consistency ✅
- [x] UI patterns consistent (shadcn design system)
- [x] Accessibility preserved (ARIA attributes maintained)
- [x] Dark theme applied consistently across all components

### IV. Performance Requirements ✅
- [x] CSS is static, no runtime theme switching overhead
- [x] Tailwind purges unused styles in production build

### V. Research-First Development ✅
- [x] Context7 used for shadcn/ui documentation (Vite installation)
- [x] Context7 used for Tailwind CSS documentation (Vite plugin)
- [x] Official docs verified for React 19 compatibility approach

### Simplicity Standard ✅
- [x] No ThemeProvider needed (dark mode only = simpler)
- [x] No additional runtime dependencies for theme switching
- [x] Direct CSS variable usage (no abstraction layers)

## Project Structure

### Documentation (this feature)

```text
specs/002-shadcn-dark-theme/
├── plan.md              # This file
├── research.md          # Phase 0 output - installation and config research
├── data-model.md        # Phase 1 output - theme token definitions
├── quickstart.md        # Phase 1 output - setup instructions
├── contracts/           # Phase 1 output - theme CSS contract
│   └── theme-contract.css
└── tasks.md             # Phase 2 output (/speckit.tasks command)
```

### Source Code (repository root)

```text
src/
├── components/
│   ├── ui/              # NEW: shadcn components (added via CLI)
│   └── HeaderPanel.tsx  # MODIFIED: Tailwind classes
├── lib/
│   └── utils.ts         # NEW: cn() utility for class merging
├── styles/
│   └── globals.css      # NEW: Theme variables + Tailwind (replaces overlay.css)
├── types/
│   └── overlay.ts       # UNCHANGED
├── App.tsx              # UNCHANGED
└── main.tsx             # MODIFIED: Import globals.css

tests/
└── components/
    └── HeaderPanel.test.tsx  # UNCHANGED (behavior preserved)

# Root config files
├── vite.config.ts       # MODIFIED: Add Tailwind plugin + path alias
├── tsconfig.json        # MODIFIED: Add path alias
├── components.json      # NEW: shadcn CLI configuration
└── index.html           # MODIFIED: Add class="dark" to <html>
```

**Structure Decision**: Single project structure maintained. This is a frontend-only change within the existing Tauri application. No new directories required beyond `src/lib/` and `src/components/ui/`.

## Complexity Tracking

> No violations - implementation follows Simplicity Standard

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| None | N/A | N/A |

## Implementation Phases

### Phase 1: Foundation Setup
1. Install Tailwind CSS and @tailwindcss/vite plugin
2. Install shadcn utility dependencies (clsx, tailwind-merge)
3. Configure Vite with Tailwind plugin and path aliases
4. Update tsconfig.json with path aliases

### Phase 2: Theme Configuration
1. Create src/styles/globals.css with dark theme CSS variables
2. Create src/lib/utils.ts with cn() helper
3. Add class="dark" to index.html
4. Update main.tsx to import globals.css
5. Ensure overlay transparency rules preserved
6. Initialize shadcn CLI configuration (components.json)

### Phase 3: Component Refactoring
1. Refactor HeaderPanel to use Tailwind utility classes
2. Remove src/styles/overlay.css (migrated to globals.css)
3. Verify visual appearance matches specification

### Phase 4: Verification
1. Run existing tests to confirm behavior preserved
2. Visual verification of dark theme colors
3. Verify overlay transparency still works
4. Test F3 toggle functionality

## Risk Mitigation

| Risk | Mitigation |
|------|------------|
| Tailwind overrides overlay transparency | Add `!important` to transparency rules; load after Tailwind base |
| React 19 peer dependency warnings | Use `--force` flag during shadcn dependency installation |
| Path alias not resolving | Configure both tsconfig.json AND vite.config.ts |
