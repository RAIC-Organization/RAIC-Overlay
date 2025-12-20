# Quickstart: File Viewer Window

**Feature**: 016-file-viewer-window
**Date**: 2025-12-20

## Overview

This guide provides step-by-step instructions for implementing the File Viewer Window feature. The implementation follows established patterns from the Browser window (014/015) and integrates with the existing persistence system.

## Prerequisites

1. Ensure you're on the `016-file-viewer-window` branch
2. Install new dependencies:
   ```bash
   npm install pdfjs-dist react-markdown
   ```
3. Verify Tauri plugins are available:
   - `@tauri-apps/plugin-dialog`
   - `@tauri-apps/plugin-fs`

## Implementation Order

### Phase 1: Type Definitions

1. **Update `src/types/windows.ts`**:
   - Add `'fileviewer'` to `WindowContentType` union

2. **Update `src/types/persistence.ts`**:
   - Add `'fileviewer'` to `WindowType` union
   - Add `FileViewerPersistedContent` interface
   - Add to `WindowContentFile.content` union
   - Add helper functions: `clampFileViewerZoom`, `normalizeFileViewerContent`, `isFileViewerContent`
   - Add constants: `FILE_VIEWER_DEFAULTS`, `DEFAULT_FILE_VIEWER_CONTENT`

### Phase 2: Renderers

3. **Create `src/components/windows/renderers/` directory**

4. **Create `ErrorRenderer.tsx`**:
   - Simple component displaying error icon + message
   - Props: `type`, `message`, optional `onRetry`
   - Use lucide-react icons (AlertCircle, FileX, etc.)

5. **Create `PlaceholderRenderer.tsx`**:
   - "No file selected" message with open file button
   - Props: `onOpenFile`

6. **Create `MarkdownRenderer.tsx`**:
   - Import `react-markdown`
   - Apply zoom via CSS transform wrapper
   - Style with Tailwind prose classes

7. **Create `PDFRenderer.tsx`**:
   - Import `pdfjs-dist`
   - Configure worker path
   - Render all pages to canvas elements in scrollable container
   - Apply zoom via viewport scale + CSS transform
   - Handle loading state and errors

### Phase 3: Toolbar

8. **Create `FileViewerToolbar.tsx`**:
   - Follow `BrowserToolbar.tsx` pattern
   - Components: Open File button, file path display, zoom controls
   - Props: `filePath`, `zoom`, `isLoading`, callbacks

### Phase 4: Content Component

9. **Create `FileViewerContent.tsx`**:
   - Follow `BrowserContent.tsx` pattern
   - State: filePath, fileType, content, zoom, isLoading, error
   - File dialog integration with Tauri plugins
   - Renderer selection based on fileType
   - Persistence via context

### Phase 5: Persistence Integration

10. **Update `src/lib/serialization.ts`**:
    - Add `serializeFileViewerContent` function

11. **Update `src/hooks/usePersistence.ts`**:
    - Add `saveFileViewerContentDebounced` function

12. **Update `src/contexts/PersistenceContext.tsx`**:
    - Add `onFileViewerContentChange` to context value
    - Handle 'fileviewer' in window creation/restoration

### Phase 6: Menu Integration

13. **Update `src/components/MainMenu.tsx`**:
    - Add File Viewer option to menu
    - Icon: `FileText` from lucide-react

14. **Update window restoration logic**:
    - Handle 'fileviewer' contentType in restoration flow
    - Pass persisted props to FileViewerContent

## Key Files Reference

| File | Action | Reference |
|------|--------|-----------|
| `src/types/windows.ts` | Modify | Add type |
| `src/types/persistence.ts` | Modify | Add types + helpers |
| `src/components/windows/renderers/ErrorRenderer.tsx` | Create | New |
| `src/components/windows/renderers/PlaceholderRenderer.tsx` | Create | New |
| `src/components/windows/renderers/MarkdownRenderer.tsx` | Create | New |
| `src/components/windows/renderers/PDFRenderer.tsx` | Create | New |
| `src/components/windows/FileViewerToolbar.tsx` | Create | `BrowserToolbar.tsx` |
| `src/components/windows/FileViewerContent.tsx` | Create | `BrowserContent.tsx` |
| `src/lib/serialization.ts` | Modify | `serializeBrowserContent` |
| `src/hooks/usePersistence.ts` | Modify | `saveBrowserContentDebounced` |
| `src/contexts/PersistenceContext.tsx` | Modify | Browser handling |
| `src/components/MainMenu.tsx` | Modify | Add menu item |

## Testing Checklist

- [ ] Can create new File Viewer window from main menu
- [ ] Open File dialog shows and filters to PDF/MD files
- [ ] PDF files render with all pages visible in scroll view
- [ ] Markdown files render with proper formatting
- [ ] Zoom in/out works for both file types
- [ ] Unsupported file types show error message
- [ ] File not found shows error message
- [ ] State persists across app restart (file path, type, zoom)
- [ ] Missing file on restore shows "File not found" error
- [ ] Opening new file replaces current file
- [ ] Placeholder shown when no file is open

## Common Pitfalls

1. **PDF.js Worker**: Must be configured before loading any PDF:
   ```typescript
   import * as pdfjsLib from 'pdfjs-dist';
   pdfjsLib.GlobalWorkerOptions.workerSrc = '/pdf.worker.mjs';
   ```

2. **Binary vs Text Reading**: PDFs need ArrayBuffer, Markdown needs string:
   ```typescript
   // PDF: read as binary
   const buf = new Uint8Array(stat.size);
   await file.read(buf);
   const content = buf.buffer;

   // Markdown: decode as text
   const content = new TextDecoder().decode(buf);
   ```

3. **Zoom Transform Origin**: Use `'0 0'` for consistent behavior:
   ```typescript
   style={{ transform: `scale(${zoom/100})`, transformOrigin: '0 0' }}
   ```

4. **File Path Persistence**: Store absolute paths, check existence on restore.

## Next Steps

After implementation:
1. Run `/speckit.tasks` to generate task list
2. Implement tasks in order
3. Test all acceptance scenarios from spec
4. Update CLAUDE.md with new technology if needed
