# Implementation Plan: Orbitron Font Integration

**Branch**: `021-orbitron-font` | **Date**: 2025-12-22 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/021-orbitron-font/spec.md`

## Summary

Add the Orbitron Google Font to RAICOverlay for UI chrome (headings, menu items, window titles, buttons) while maintaining system fonts for body content. Uses Next.js built-in `next/font/google` for automatic self-hosting, optimal loading with `display: 'swap'`, and seamless Tailwind CSS integration via CSS variables.

## Technical Context

**Language/Version**: TypeScript 5.7.2 (React 19.0.0 frontend), Rust 2021 Edition (Tauri backend - unchanged)
**Primary Dependencies**: Next.js 16.x, React 19.0.0, Tailwind CSS 4.x, next/font/google (built-in)
**Storage**: N/A (font files are self-hosted at build time)
**Testing**: Vitest, visual verification
**Target Platform**: Windows 11 (64-bit) via Tauri
**Project Type**: Desktop application with web frontend
**Performance Goals**: Font loading adds no more than 100ms to initial render (spec SC-002)
**Constraints**: Non-blocking font loading with fallback (spec FR-005)
**Scale/Scope**: All UI chrome elements across existing components

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Status | Notes |
|-----------|--------|-------|
| I. Code Quality | PASS | Single responsibility: font configuration isolated to layout and CSS. No code duplication. |
| II. Testing Standards | PASS | Visual verification covers font rendering. No complex logic requiring unit tests. |
| III. User Experience Consistency | PASS | Font applied consistently to all UI chrome. Fallback ensures readability. |
| IV. Performance Requirements | PASS | `display: 'swap'` ensures text visible immediately. Self-hosting eliminates CDN latency. SC-002 target (≤100ms) achievable. |
| V. Research-First Development | PASS | Context7 used for Next.js 16 font documentation. Current patterns verified. |

**All gates passed. No violations requiring justification.**

## Project Structure

### Documentation (this feature)

```text
specs/021-orbitron-font/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── quickstart.md        # Phase 1 output
└── tasks.md             # Phase 2 output (via /speckit.tasks)
```

### Source Code (repository root)

```text
app/
├── layout.tsx           # MODIFY: Add Orbitron font import and CSS variable
└── globals.css          # MODIFY: Add font-family definitions for UI elements

src/
├── components/          # No changes - font applied via CSS
├── lib/                 # No changes
└── ...
```

**Structure Decision**: Minimal changes to existing structure. Font configuration added to `app/layout.tsx` and `app/globals.css`. All existing component files inherit the font via CSS inheritance and Tailwind utility classes.

## Implementation Approach

### 1. Font Loading Strategy

Use `next/font/google` with CSS variable approach for Tailwind integration:

```typescript
import { Orbitron } from 'next/font/google'

const orbitron = Orbitron({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-orbitron',
  weight: ['400', '500', '600', '700', '800', '900'],
})
```

### 2. CSS Variable Integration

Define font-family in `globals.css` using the CSS variable:

```css
@theme inline {
  --font-display: var(--font-orbitron);
}
```

### 3. Font Application Scope

Apply Orbitron to UI chrome elements via CSS selectors or Tailwind classes:
- Window titles, menu headers: `font-display` class
- Buttons, navigation labels: inherit from parent or explicit class
- Body text, editor content: retain `font-sans` (system fonts)

### 4. Fallback Strategy

Font stack ensures graceful degradation:
```css
--font-orbitron: 'Orbitron', ui-sans-serif, system-ui, sans-serif;
```

## Complexity Tracking

> **No violations requiring justification**

This feature adds:
- 1 new import in layout.tsx
- 1 new CSS variable
- Minor CSS additions for font targeting
- No new dependencies (next/font/google is built-in)
- No architectural changes

## Dependencies

- **next/font/google**: Built into Next.js 16.x, no installation required
- **Orbitron font**: Available in Google Fonts catalog, self-hosted at build time

## Risks & Mitigations

| Risk | Mitigation |
|------|------------|
| Font not loading in Tauri webview | Self-hosting eliminates external requests; fallback stack ensures readability |
| Font looks poor at small sizes | Orbitron applied only to display elements (≥14px); body uses system fonts |
| Flash of unstyled text (FOUT) | `display: 'swap'` shows text immediately with fallback, then swaps |
