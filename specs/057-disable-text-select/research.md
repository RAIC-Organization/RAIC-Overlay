# Research: Disable Text Selection

**Feature**: 057-disable-text-select
**Date**: 2026-01-03

## Research Summary

This is a CSS-only feature requiring no external library research. The implementation uses standard CSS `user-select` property which has excellent browser support and is the canonical solution for this requirement.

## Decision 1: CSS Strategy

**Decision**: Apply `user-select: none` globally, opt-in for content areas

**Rationale**:
- Global disable is simpler than selectively disabling each UI component
- Content areas that need selection (editors, inputs) explicitly opt-in
- Matches how native Windows applications handle text selection
- Zero JavaScript required; pure CSS solution

**Alternatives Considered**:
1. **Selective disable per component** - Rejected: Would require touching many component files; higher maintenance burden
2. **JavaScript-based selection prevention** - Rejected: Adds runtime overhead; CSS is sufficient
3. **Tailwind `select-none` utility class** - Considered: Could work but would require modifying many component JSX files; global CSS is cleaner

## Decision 2: Content Area Opt-in Strategy

**Decision**: Use `.tiptap` class and `input, textarea` selectors for opt-in

**Rationale**:
- TipTap editor already uses `.tiptap` class consistently
- Standard form elements (`input`, `textarea`) naturally need text selection
- Excalidraw uses its own internal selection handling within a canvas, unaffected by CSS `user-select`

**Affected Selectors**:
- `.tiptap` - Notes window TipTap editor
- `input` - All input fields (URL bar, settings)
- `textarea` - Any textarea elements
- `[contenteditable="true"]` - Any other editable content areas

## Decision 3: Cursor Style

**Decision**: Let browser handle cursor naturally

**Rationale**:
- `user-select: none` already prevents the text cursor from appearing on UI chrome
- No need for explicit `cursor: default` rules; cleaner implementation
- Inputs and editors will naturally show text cursor when focused

## Implementation Approach

**File**: `app/globals.css`

**Changes**:
1. Add `user-select: none` to `body` selector (alongside existing rules)
2. Add opt-in rule for content areas: `.tiptap, input, textarea, [contenteditable="true"]`

**CSS Impact**:
- 2 new CSS rules
- ~4 lines of CSS added
- Zero JavaScript changes
- Zero component changes required

## Browser Compatibility

| Property | Chrome | Firefox | Safari | Edge |
|----------|--------|---------|--------|------|
| `user-select: none` | ✅ 54+ | ✅ 69+ | ✅ 3+ | ✅ 79+ |
| `user-select: text` | ✅ 54+ | ✅ 69+ | ✅ 3+ | ✅ 79+ |

All target platforms (Tauri WebView on Windows 11) fully support these properties.

## Verification Checklist

After implementation, verify:
- [ ] Window headers: no text selection
- [ ] Button labels: no text selection
- [ ] Menu items: no text selection
- [ ] Settings labels: no text selection
- [ ] Notes editor: text selection works
- [ ] Browser URL bar: text selection works
- [ ] Settings input fields: text selection works
- [ ] Window dragging: still works normally
- [ ] Button clicks: still work normally
