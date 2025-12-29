# Implementation Plan: Fix File Viewer Window Transparency

**Branch**: `035-fix-file-viewer-transparency` | **Date**: 2025-12-29 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/035-fix-file-viewer-transparency/spec.md`

## Summary

Fix the File Viewer window component to respect the `backgroundTransparent` setting in non-interactive mode. Currently, the background transparency setting is passed from the Window component but not propagated through the FileViewerContent component to the individual renderers (PDFRenderer, MarkdownRenderer, ImageRenderer). The fix requires adding the `backgroundTransparent` prop to these components and conditionally applying transparent backgrounds based on the `isInteractive` and `backgroundTransparent` states.

## Technical Context

**Language/Version**: TypeScript 5.7.2, React 19.0.0
**Primary Dependencies**: Next.js 16.x, Tailwind CSS 4.x, pdfjs-dist 5.4, react-markdown 10.1, react-zoom-pan-pinch 3.7
**Storage**: N/A (uses existing persistence system - no changes required)
**Testing**: vitest, @testing-library/react
**Target Platform**: Windows 11 (64-bit) - Tauri 2.x desktop application
**Project Type**: Tauri desktop app with React/Next.js frontend
**Performance Goals**: No visual glitches during mode transitions; instant transparency toggle response
**Constraints**: Must maintain document readability in transparent mode
**Scale/Scope**: 4 files to modify (FileViewerContent + 3 renderers)

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Status | Notes |
|-----------|--------|-------|
| I. Code Quality | PASS | Simple prop propagation pattern; follows existing codebase conventions |
| II. Testing Standards | PASS (Exception) | Visual bug fix with no complex logic. Per constitution: "Unit tests SHOULD be reserved for complex algorithms." Manual verification per quickstart.md covers all acceptance scenarios. No automated tests required. |
| III. User Experience Consistency | PASS | Aligns File Viewer with existing DrawContent transparency behavior |
| IV. Performance Requirements | PASS | No performance impact - conditional CSS class application |
| V. Research-First Development | PASS | Pattern already established in DrawContent.tsx; no new libraries |

**Simplicity Standard Check**:
- ✓ Solution uses simplest approach (prop drilling to child components)
- ✓ No new dependencies required
- ✓ No abstractions needed - follows existing DrawContent pattern
- ✓ YAGNI applied - only fixing the bug, no additional features

## Project Structure

### Documentation (this feature)

```text
specs/035-fix-file-viewer-transparency/
├── spec.md              # Feature specification
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output (N/A for this feature)
├── quickstart.md        # Phase 1 output
└── checklists/
    └── requirements.md  # Quality checklist
```

### Source Code (files to modify)

```text
src/components/windows/
├── FileViewerContent.tsx    # Add backgroundTransparent prop, pass to renderers with isInteractive
└── renderers/
    ├── PDFRenderer.tsx      # Add backgroundTransparent + isInteractive props, conditional bg class
    ├── MarkdownRenderer.tsx # Add backgroundTransparent + isInteractive props, conditional bg class
    └── ImageRenderer.tsx    # Add backgroundTransparent + isInteractive props, conditional bg class
```

**Structure Decision**: No new files required. This is a bug fix that modifies 4 existing component files to propagate the `backgroundTransparent` prop through the component hierarchy.

## Implementation Approach

### Pattern Reference (DrawContent.tsx)

The existing `DrawContent.tsx` demonstrates the correct pattern:

```typescript
// Props interface includes backgroundTransparent
export interface DrawContentProps {
  isInteractive: boolean;
  backgroundTransparent?: boolean;  // Optional prop
}

// Calculate effective transparency
const useTransparentBackground = backgroundTransparent === true && !isInteractive;
```

### Changes Required

1. **FileViewerContent.tsx**:
   - Add `backgroundTransparent?: boolean` to `FileViewerContentProps`
   - Pass prop to PDFRenderer, MarkdownRenderer, ImageRenderer
   - Calculate `isEffectivelyTransparent = backgroundTransparent === true && !isInteractive`
   - Remove background classes from empty/error states when transparent

2. **PDFRenderer.tsx**:
   - Add `backgroundTransparent?: boolean` and `isInteractive?: boolean` to `PDFRendererProps`
   - Calculate `isEffectivelyTransparent = backgroundTransparent === true && !isInteractive`
   - Replace hard-coded `bg-muted/30` with conditional class
   - Apply transparency to page navigation bar when enabled

3. **MarkdownRenderer.tsx**:
   - Add `backgroundTransparent?: boolean` and `isInteractive?: boolean` to `MarkdownRendererProps`
   - Calculate `isEffectivelyTransparent = backgroundTransparent === true && !isInteractive`
   - Ensure outer container removes background when transparent

4. **ImageRenderer.tsx**:
   - Add `backgroundTransparent?: boolean` and `isInteractive?: boolean` to `ImageRendererProps`
   - Calculate `isEffectivelyTransparent = backgroundTransparent === true && !isInteractive`
   - Replace hard-coded `bg-muted/30` with conditional class

### Background Classes to Conditionally Remove

| Component | Current Class | Transparent Replacement |
|-----------|---------------|------------------------|
| PDFRenderer container | `bg-muted/30` | `` (empty) |
| PDFRenderer page nav | `border-b border-border` | Conditional |
| MarkdownRenderer | None explicit | Keep as is |
| ImageRenderer container | `bg-muted/30` | `` (empty) |
| FileViewerContent (empty/error) | Inherit from parent | Remove any implicit bg |

## Complexity Tracking

No constitution violations. This is a minimal bug fix following established patterns.
