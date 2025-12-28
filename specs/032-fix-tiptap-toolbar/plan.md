# Implementation Plan: Fix TipTap Notes Toolbar

**Branch**: `032-fix-tiptap-toolbar` | **Date**: 2025-12-28 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/032-fix-tiptap-toolbar/spec.md`

## Summary

Fix the visual styling for TipTap editor headings (H1, H2, H3) and lists (bullet, ordered) in the Notes window. The toolbar buttons correctly invoke TipTap commands, but the content lacks CSS styling because Tailwind's typography plugin is not installed. The fix involves adding custom CSS styles scoped to the TipTap editor container.

## Technical Context

**Language/Version**: TypeScript 5.7.2 (React 19.0.0 frontend)
**Primary Dependencies**: TipTap 3.13.0 (@tiptap/react, @tiptap/starter-kit), Tailwind CSS 4.x, Next.js 16.x
**Storage**: N/A (uses existing persistence system)
**Testing**: Manual visual verification, existing test infrastructure (vitest)
**Target Platform**: Windows 11 (64-bit) via Tauri 2.x
**Project Type**: Web (Tauri desktop app with React/Next.js frontend)
**Performance Goals**: N/A (CSS-only fix)
**Constraints**: Must integrate with existing Star Citizen HUD theme styling
**Scale/Scope**: Single component fix (NotesContent.tsx styling)

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Status | Notes |
|-----------|--------|-------|
| I. Code Quality | PASS | CSS changes follow clean, readable patterns; scoped styling |
| II. Testing Standards | PASS | Visual verification for CSS fix; no complex logic requiring unit tests |
| III. User Experience Consistency | PASS | Fix ensures consistent formatting behavior expected by users |
| IV. Performance Requirements | PASS | No performance impact from CSS styling |
| V. Research-First Development | PASS | Researched TipTap docs and Tailwind typography best practices |

**Gate Status**: PASS - All principles satisfied

## Project Structure

### Documentation (this feature)

```text
specs/032-fix-tiptap-toolbar/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── quickstart.md        # Phase 1 output
└── tasks.md             # Phase 2 output (created by /speckit.tasks)
```

### Source Code (repository root)

```text
src/
├── components/
│   └── windows/
│       ├── NotesContent.tsx    # TipTap editor component (minor update)
│       └── NotesToolbar.tsx    # Toolbar component (no changes needed)
└── styles/
    └── tiptap.css              # NEW: Custom TipTap styling

app/
└── globals.css                 # Import new tiptap.css
```

**Structure Decision**: Single CSS file addition with import in globals.css. No structural changes needed - this is a targeted CSS fix.

## Complexity Tracking

> No violations - simple CSS styling fix

## Design Decision: Styling Approach

### Options Evaluated

| Option | Approach | Pros | Cons |
|--------|----------|------|------|
| A | Install `@tailwindcss/typography` plugin | Standard solution, comprehensive prose styles | Adds dependency, may conflict with SC HUD theme colors |
| B | Custom CSS with `.tiptap` scoped selectors | Full control, theme-consistent, no new deps | More manual CSS to maintain |
| C | Inline styles via TipTap HTMLAttributes config | No CSS files needed | Verbose, harder to maintain, limited styling |

### Decision: Option B - Custom CSS with `.tiptap` scoped selectors

**Rationale**:
1. TipTap documentation recommends `.tiptap` scoped CSS as a best practice
2. Avoids adding new dependencies (Simplicity Standard from Constitution)
3. Allows styling consistent with existing Star Citizen HUD theme
4. Full control over heading sizes, list markers, and colors
5. Research confirmed this is the recommended pattern for TipTap styling

## Implementation Approach

### Phase 1: Add TipTap Custom Styles

Create `src/styles/tiptap.css` with styles for:

1. **Headings** (h1, h2, h3):
   - Distinct font sizes (H1 > H2 > H3 > paragraph)
   - Consistent with SC HUD theme colors
   - Appropriate margins/spacing

2. **Lists** (ul, ol, li):
   - Bullet markers visible (disc style)
   - Numbers visible for ordered lists
   - Proper indentation (left padding)
   - Nested list support

3. **Base Editor Styles**:
   - Focus outline
   - Selection highlighting
   - Placeholder text styling

### Phase 2: Integration

1. Import `tiptap.css` in `app/globals.css`
2. Verify NotesContent.tsx applies `.tiptap` class (already done by TipTap's EditorContent)
3. Remove unused `prose` classes if present (they have no effect without typography plugin)

### Styling Specifications

```css
/* Heading Sizes (relative to base 14px) */
.tiptap h1 { font-size: 1.875rem; }  /* ~26px - clearly largest */
.tiptap h2 { font-size: 1.5rem; }    /* ~21px - medium-large */
.tiptap h3 { font-size: 1.25rem; }   /* ~18px - slightly larger */

/* List Styling */
.tiptap ul { list-style-type: disc; padding-left: 1.5rem; }
.tiptap ol { list-style-type: decimal; padding-left: 1.5rem; }
.tiptap li { margin: 0.25rem 0; }
```

## Risk Assessment

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Styles conflict with existing CSS | Low | Medium | Scope all styles under `.tiptap` selector |
| Theme colors don't match SC HUD | Low | Low | Use CSS variables from existing theme |
| List markers not visible in dark mode | Medium | Medium | Use theme-aware colors (foreground variable) |

## Success Verification

1. Open Notes window in windowed mode
2. Type text and click H1 button → Text should visibly increase in size
3. Click H2, H3 buttons → Each should have distinct, smaller sizes
4. Click bullet list button → Bullet marker (•) should appear
5. Click ordered list button → Number (1.) should appear
6. Add multiple list items → Each should have proper marker/number
7. Toggle heading/list off → Text should return to normal paragraph style
8. Toolbar active states should highlight correctly when cursor is in formatted text
