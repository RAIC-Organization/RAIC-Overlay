# Implementation Plan: File Viewer Window

**Branch**: `016-file-viewer-window` | **Date**: 2025-12-20 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/016-file-viewer-window/spec.md`

## Summary

Implement a new File Viewer window type that allows users to view PDF and Markdown files within the overlay application. The feature follows established patterns from Browser, Notes, and Draw windows, featuring a toolbar with file open and zoom controls, file type-specific renderers (PDF.js for PDFs, react-markdown for Markdown), and full persistence support for file path, type, and zoom level across sessions.

## Technical Context

**Language/Version**: TypeScript 5.7.2 (frontend), Rust 2021 Edition (Tauri backend - unchanged)
**Primary Dependencies**: React 19.0.0, Next.js 16.x, pdfjs-dist (PDF.js), react-markdown, motion 12.x, shadcn/ui, Tailwind CSS 4.x, Tauri 2.x, lucide-react
**Storage**: JSON files in Tauri app data directory (extends existing `state.json` + `window-{id}.json` pattern)
**Testing**: Vitest (if configured), manual testing for UI components
**Target Platform**: Windows 11 (64-bit)
**Project Type**: Tauri desktop application (Rust backend + React frontend)
**Performance Goals**: PDF render < 3s, Markdown render < 2s, zoom response < 100ms (per SC-001, SC-002, SC-003)
**Constraints**: Zoom range 10-200% with 10% increments, file type detection by extension only
**Scale/Scope**: Single-user desktop application, local filesystem access only

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Status | Notes |
|-----------|--------|-------|
| I. Code Quality | ✅ PASS | Will follow existing component patterns (BrowserContent, NotesContent), single responsibility per renderer |
| II. Testing Standards | ✅ PASS | Integration tests will cover file loading, rendering, and persistence flows |
| III. User Experience Consistency | ✅ PASS | Toolbar pattern matches BrowserToolbar, error states are user-friendly, zoom behavior consistent |
| IV. Performance Requirements | ✅ PASS | Performance targets defined in spec (SC-001 to SC-003), will be monitored |
| V. Research-First Development | ✅ PASS | Context7 research completed for PDF.js and react-markdown patterns |

**Gate Result**: All principles satisfied. Proceeding to Phase 0.

## Project Structure

### Documentation (this feature)

```text
specs/016-file-viewer-window/
├── plan.md              # This file (/speckit.plan command output)
├── research.md          # Phase 0 output (/speckit.plan command)
├── data-model.md        # Phase 1 output (/speckit.plan command)
├── quickstart.md        # Phase 1 output (/speckit.plan command)
├── contracts/           # Phase 1 output (/speckit.plan command)
└── tasks.md             # Phase 2 output (/speckit.tasks command)
```

### Source Code (repository root)

```text
src/
├── components/
│   └── windows/
│       ├── FileViewerToolbar.tsx      # New: Toolbar with open file + zoom controls
│       ├── FileViewerContent.tsx      # New: Main container with renderer selection
│       ├── renderers/                  # New: Directory for file renderers
│       │   ├── PDFRenderer.tsx         # New: PDF.js-based PDF renderer
│       │   ├── MarkdownRenderer.tsx    # New: react-markdown renderer
│       │   └── ErrorRenderer.tsx       # New: Error state renderer
│       ├── BrowserToolbar.tsx          # Existing: Reference for toolbar pattern
│       ├── BrowserContent.tsx          # Existing: Reference for content pattern
│       ├── NotesContent.tsx            # Existing: Reference pattern
│       └── DrawContent.tsx             # Existing: Reference pattern
├── contexts/
│   └── PersistenceContext.tsx          # Extend: Add onFileViewerContentChange
├── hooks/
│   └── usePersistence.ts               # Extend: Add file viewer persistence
├── lib/
│   └── serialization.ts                # Extend: Add serializeFileViewerContent
├── types/
│   ├── windows.ts                      # Extend: Add 'fileviewer' to WindowContentType
│   └── persistence.ts                  # Extend: Add FileViewerPersistedContent
└── components/
    └── MainMenu.tsx                    # Extend: Add FileViewer to window creation options
```

**Structure Decision**: Follows existing Tauri + Next.js structure. New components go in `src/components/windows/` following established patterns. Renderers are grouped in a `renderers/` subdirectory for organization.

## Complexity Tracking

No violations requiring justification. The design follows established patterns without introducing unnecessary complexity.
