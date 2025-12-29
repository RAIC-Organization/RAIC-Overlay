# Research: Fix File Viewer Window Transparency

**Feature**: 035-fix-file-viewer-transparency
**Date**: 2025-12-29

## Research Summary

This is a bug fix feature where the implementation pattern is already established in the codebase. No external research was required as the solution follows the existing pattern from `DrawContent.tsx`.

## Findings

### 1. Existing Transparency Pattern (DrawContent.tsx)

**Decision**: Follow the established pattern from DrawContent.tsx for background transparency handling.

**Rationale**: The codebase already has a working implementation of the `backgroundTransparent` prop in `DrawContent.tsx` (feature 033-excalidraw-view-polish). This pattern:
- Accepts `backgroundTransparent?: boolean` as an optional prop
- Calculates effective transparency: `backgroundTransparent === true && !isInteractive`
- Conditionally applies background classes based on the calculated value

**Alternatives Considered**:
- **Context-based approach**: Could use a dedicated TransparencyContext, but this adds unnecessary complexity for a simple prop drill through 2 levels of components.
- **CSS variables**: Could use CSS custom properties, but the current Tailwind class-based approach is simpler and consistent with the rest of the codebase.

### 2. Component Hierarchy Analysis

**Decision**: Prop drilling through FileViewerContent → Individual Renderers

**Rationale**: The component hierarchy is shallow (2 levels):
```
Window.tsx (has backgroundTransparent)
  └─ FileViewerContent.tsx (needs to receive prop)
       ├─ PDFRenderer.tsx (needs prop for bg-muted/30)
       ├─ MarkdownRenderer.tsx (needs prop for consistency)
       └─ ImageRenderer.tsx (needs prop for bg-muted/30)
```

**Alternatives Considered**:
- **Single calculation in FileViewerContent**: Could calculate transparency once and pass only the computed `isEffectivelyTransparent` boolean. However, passing `backgroundTransparent` separately allows renderers to have independent logic if needed in the future.

### 3. Background Classes to Modify

**Decision**: Conditionally remove `bg-muted/30` and related background classes when transparency is enabled.

**Rationale**: Current implementations have hard-coded background classes:
- `PDFRenderer.tsx`: `bg-muted/30` on container (line 198)
- `ImageRenderer.tsx`: `bg-muted/30` on container (line 114)
- `MarkdownRenderer.tsx`: No explicit background class, but parent may contribute

These need conditional application based on:
```typescript
const isEffectivelyTransparent = backgroundTransparent === true && !isInteractive;
const backgroundClass = isEffectivelyTransparent ? '' : 'bg-muted/30';
```

**Alternatives Considered**:
- **Opacity-based transparency**: Using `bg-muted/0` instead of removing the class entirely. This is functionally equivalent but removing the class is cleaner.
- **Wrapper component**: Creating a shared TransparentContainer wrapper. Overkill for 3 components with slightly different needs.

### 4. Edge Cases Handling

**Decision**: Apply transparency consistently to all states (loading, error, empty, content)

**Rationale**: For visual consistency, all FileViewerContent states should respect the transparency setting:
- Loading spinner
- Error messages
- Empty state ("No file selected")
- Actual content renderers

This ensures no visual "flashing" when transitioning between states.

### 5. isInteractive Prop Flow

**Decision**: Pass both `isInteractive` and `backgroundTransparent` to renderers

**Rationale**: The renderers already receive `isInteractive` through props. Adding `backgroundTransparent` maintains the existing pattern. The calculation `backgroundTransparent === true && !isInteractive` ensures:
- Interactive mode: Always shows solid background (for editing visibility)
- Non-interactive mode + transparency enabled: Shows transparent background
- Non-interactive mode + transparency disabled: Shows solid background

## No External Research Required

This feature does not require:
- Context7 lookups (no new libraries)
- Web search (established internal pattern)
- API documentation review (no new APIs)

The solution is fully informed by existing codebase patterns and the constitution's simplicity standard.
