# Research: Excalidraw Draw Component

**Feature**: 009-excalidraw-draw-component
**Date**: 2025-12-19
**Status**: Complete

## Research Tasks

### 1. Excalidraw Installation & Setup

**Decision**: Use @excalidraw/excalidraw v0.18.0 with --force flag for React 19 compatibility

**Rationale**:
- Official @excalidraw/excalidraw package is the standard React integration
- v0.18.0 is the current stable release (published March 2025)
- React 19 support has peer dependency warnings but works with --force/--legacy-peer-deps
- Known issues with bundled @radix-ui packages (require React 16-18), but functionality works

**Alternatives Considered**:
- Fabric.js: Lower-level canvas library, more manual work for drawing tools
- Konva.js: Good for custom drawings but lacks Excalidraw's complete toolkit
- react-sketch-canvas: Simpler but lacks shape tools, text, arrows
- tldraw: Similar to Excalidraw but different API, less documentation

**Installation Command**:
```bash
npm install @excalidraw/excalidraw --force
```

**Known Issues**:
- Peer dependency warnings with React 19 (GitHub issues #9186, #9253, #9435)
- Works but requires --force or --legacy-peer-deps flag
- Monitor for official React 19 support in future releases

### 2. SSR Compatibility (Next.js)

**Decision**: Use dynamic import with `ssr: false` and wrapper component pattern

**Rationale**:
- Excalidraw is canvas-based and requires browser APIs
- Does not support server-side rendering
- Next.js dynamic import with ssr: false is the documented solution
- Wrapper component allows full API access while maintaining SSR safety

**Implementation Pattern**:
```typescript
// src/components/windows/DrawContent.tsx
"use client";

import { Excalidraw, THEME } from "@excalidraw/excalidraw";
import "@excalidraw/excalidraw/index.css";

interface DrawContentProps {
  isInteractive: boolean;
}

export function DrawContent({ isInteractive }: DrawContentProps) {
  return (
    <div style={{ height: "100%", width: "100%" }}>
      <Excalidraw
        theme={THEME.DARK}
        viewModeEnabled={!isInteractive}
      />
    </div>
  );
}
```

```typescript
// Dynamic import where used (if needed at page level)
import dynamic from "next/dynamic";

const DrawContent = dynamic(
  () => import("./DrawContent").then((mod) => mod.DrawContent),
  { ssr: false }
);
```

### 3. Hiding/Showing Toolbar and UI Controls

**Decision**: Use combination of `viewModeEnabled` prop and `UIOptions` prop

**Rationale**:
- `viewModeEnabled={true}` hides toolbar and shows view-only mode
- `UIOptions` prop allows granular control over specific UI elements
- Matches spec requirement FR-005, FR-006, FR-007 for mode-aware visibility
- Clean prop-based approach, no CSS hacks needed

**Implementation**:
```typescript
<Excalidraw
  viewModeEnabled={!isInteractive}  // Hide all editing UI in non-interactive mode
  UIOptions={{
    canvasActions: {
      toggleTheme: false,         // We control theme externally
      changeViewBackgroundColor: true,
      clearCanvas: true,
      loadScene: false,           // No persistence
      saveToActiveFile: false,    // No persistence
      saveAsImage: false,         // Keep simple for v1
      export: false,              // No export for v1
    },
  }}
/>
```

**Behavior**:
- `viewModeEnabled={true}`: Full read-only mode, minimal UI, no toolbar
- `viewModeEnabled={false}`: Full editing mode with complete toolbar
- Syncs automatically with interaction mode state

### 4. Read-Only/View-Only Mode

**Decision**: Use `viewModeEnabled` prop synced to `isInteractive` prop

**Rationale**:
- Spec requires canvas editable only in interaction mode (FR-013, FR-014)
- TipTap Notes uses same pattern with `editable` prop
- Excalidraw's `viewModeEnabled` is the direct equivalent
- When true: allows zoom/pan but no drawing or editing

**Implementation**:
```typescript
interface DrawContentProps {
  isInteractive: boolean;
}

export function DrawContent({ isInteractive }: DrawContentProps) {
  return (
    <Excalidraw
      viewModeEnabled={!isInteractive}  // Invert: interactive = NOT view-only
    />
  );
}
```

### 5. Dark Theme Integration

**Decision**: Use `THEME.DARK` constant with theme toggle disabled

**Rationale**:
- Spec requires dark theme adaptation (FR-017)
- Application uses dark theme consistently
- Disable user theme toggle to maintain consistency
- THEME enum provides type-safe theme values

**Implementation**:
```typescript
import { Excalidraw, THEME } from "@excalidraw/excalidraw";

<Excalidraw
  theme={THEME.DARK}
  UIOptions={{
    canvasActions: {
      toggleTheme: false,  // Prevent user from changing theme
    },
  }}
/>
```

### 6. Window Integration Pattern

**Decision**: Follow NotesContent.tsx pattern exactly

**Rationale**:
- Consistent with existing codebase patterns (008)
- Props passed through window system (componentProps)
- `isInteractive` prop controls mode-aware behavior
- No direct coupling to window management

**Implementation Pattern**:
```typescript
// DrawContent.tsx
export interface DrawContentProps {
  isInteractive: boolean;
}

export function DrawContent({ isInteractive }: DrawContentProps) {
  // Component implementation
}

// MainMenu.tsx - button handler
const handleOpenDraw = () => {
  windowEvents.emit("window:open", {
    component: DrawContent,
    title: "Draw",
    componentProps: { isInteractive: mode === "windowed" },
  });
};
```

### 7. Multiple Instance Support

**Decision**: Each DrawContent instance creates independent Excalidraw instance

**Rationale**:
- Spec requires independent state per window (FR-004, FR-016)
- Each component mount creates new Excalidraw instance
- No shared state between windows
- Closing window destroys component (ephemeral by design, FR-012)

**Behavior**:
- Each window mount → new Excalidraw instance → independent canvas state
- Window close → component unmount → all drawings lost (FR-012)
- No initialData persistence between sessions

### 8. Container Sizing

**Decision**: Use 100% width/height with flex container

**Rationale**:
- Excalidraw takes 100% of its container dimensions
- Container must have explicit non-zero dimensions
- Follow same flex pattern as NotesContent

**Implementation**:
```typescript
<div className="flex flex-col h-full w-full">
  <div className="flex-1" style={{ minHeight: 0 }}>
    <Excalidraw {...props} />
  </div>
</div>
```

### 9. CSS Import Requirement

**Decision**: Import Excalidraw CSS in component file

**Rationale**:
- Excalidraw requires its CSS file for proper styling
- Import at component level ensures it's only loaded when component is used
- Standard pattern from documentation

**Implementation**:
```typescript
import "@excalidraw/excalidraw/index.css";
```

## Summary

All technical questions resolved. Excalidraw integration follows similar patterns to TipTap Notes with key differences:

| Aspect | Notes (TipTap) | Draw (Excalidraw) |
|--------|----------------|-------------------|
| SSR Handling | `immediatelyRender: false` | dynamic import `ssr: false` |
| Toolbar Control | Conditional render | `viewModeEnabled` prop |
| Read-Only Mode | `editor.setEditable()` | `viewModeEnabled` prop |
| Theme | CSS/prose classes | `theme={THEME.DARK}` |
| Instance | `useEditor` hook | Component mount |

**Key Findings**:
1. Excalidraw v0.18.0 works with React 19 (with --force install)
2. Dynamic import with ssr: false required for Next.js
3. `viewModeEnabled` controls both toolbar visibility AND edit capability
4. THEME.DARK constant for dark theme
5. Container must have explicit dimensions
6. Each component mount = independent drawing state

**Risk Assessment**:
- React 19 peer dependency warnings: LOW (works, monitor for updates)
- Bundle size: MEDIUM (Excalidraw is larger than TipTap)
- SSR: LOW (well-documented solution)

**Sources**:
- [Excalidraw Integration Docs](https://docs.excalidraw.com/docs/@excalidraw/excalidraw/integration)
- [Excalidraw Props API](https://docs.excalidraw.com/docs/@excalidraw/excalidraw/api/props)
- [Excalidraw UIOptions](https://docs.excalidraw.com/docs/@excalidraw/excalidraw/api/props/ui-options)
- [Next.js Discussion #3849](https://github.com/excalidraw/excalidraw/discussions/3849)
- [React 19 Support Issue #9186](https://github.com/excalidraw/excalidraw/issues/9186)
