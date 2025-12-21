# Implementation Plan: Image Viewer with Zoom Support

**Branch**: `017-image-viewer-zoom` | **Date**: 2025-12-20 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/017-image-viewer-zoom/spec.md`

**Note**: This template is filled in by the `/speckit.plan` command. See `.specify/templates/commands/plan.md` for the execution workflow.

## Summary

Add an ImageRenderer component to the File Viewer window that displays image files (PNG, JPG, GIF, WebP, BMP, SVG, ICO) using the HTML `<img>` tag with react-zoom-pan-pinch library for zoom/pan functionality. The renderer integrates with the existing File Viewer toolbar zoom controls and persists zoom level between sessions.

## Technical Context

**Language/Version**: TypeScript 5.7.2, React 19.0.0
**Primary Dependencies**: react-zoom-pan-pinch (new), @tauri-apps/plugin-fs (existing), lucide-react (existing)
**Storage**: JSON files in Tauri app data directory (existing persistence system)
**Testing**: Manual testing (consistent with existing renderers)
**Target Platform**: Windows 11 (64-bit) via Tauri 2.x
**Project Type**: Tauri desktop application (Rust backend, React frontend)
**Performance Goals**: Image load <1s for files under 10MB, zoom response <50ms, smooth 60fps panning
**Constraints**: Zoom range 10%-200%, fit-to-container initial display, preserve aspect ratio
**Scale/Scope**: Single new renderer component, extends existing FileType enum

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

### I. Code Quality
- [x] **Pass**: Component follows existing renderer pattern (PDFRenderer, MarkdownRenderer)
- [x] **Pass**: Single responsibility: ImageRenderer handles only image display with zoom/pan
- [x] **Pass**: No code duplication - reuses existing FileViewer infrastructure

### II. Testing Standards
- [x] **Pass**: Integration tested via File Viewer workflow
- [x] **Pass**: Feature-focused testing (open image, zoom, pan, reset)

### III. User Experience Consistency
- [x] **Pass**: Follows existing File Viewer toolbar patterns
- [x] **Pass**: Error states consistent with PDF/Markdown renderers
- [x] **Pass**: Loading indicator consistent with existing components

### IV. Performance Requirements
- [x] **Pass**: Performance goals defined (SC-001 through SC-006)
- [x] **Pass**: Image load time target: <1 second for files under 10MB

### V. Research-First Development
- [x] **Pass**: Research react-zoom-pan-pinch library documentation (see research.md)
- [x] **Pass**: Verify current API and integration patterns (TransformWrapper, useControls)

**Gate Status**: PASS (all gates passed)

## Project Structure

### Documentation (this feature)

```text
specs/017-image-viewer-zoom/
├── plan.md              # This file (/speckit.plan command output)
├── research.md          # Phase 0 output (/speckit.plan command)
├── data-model.md        # Phase 1 output (/speckit.plan command)
├── quickstart.md        # Phase 1 output (/speckit.plan command)
├── contracts/           # Phase 1 output (/speckit.plan command)
└── tasks.md             # Phase 2 output (/speckit.tasks command - NOT created by /speckit.plan)
```

### Source Code (repository root)

```text
src/
├── components/
│   └── windows/
│       ├── FileViewerContent.tsx    # Update: add ImageRenderer case
│       ├── FileViewerToolbar.tsx    # Existing (no changes needed)
│       └── renderers/
│           ├── PDFRenderer.tsx      # Existing pattern to follow
│           ├── MarkdownRenderer.tsx # Existing pattern to follow
│           └── ImageRenderer.tsx    # NEW: Image viewer with zoom/pan
└── types/
    └── persistence.ts               # Update: extend FileType, detectFileType
```

**Structure Decision**: Extends existing Tauri desktop app structure. New ImageRenderer component placed in `src/components/windows/renderers/` following established pattern.

## Complexity Tracking

> No violations - feature follows existing patterns with minimal complexity.

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| N/A | N/A | N/A |
