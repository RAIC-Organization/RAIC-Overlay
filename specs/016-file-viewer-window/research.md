# Research: File Viewer Window

**Feature**: 016-file-viewer-window
**Date**: 2025-12-20
**Status**: Complete

## Research Topics

### 1. PDF Rendering with PDF.js

**Decision**: Use `pdfjs-dist` package with canvas-based rendering for continuous scroll view.

**Rationale**:
- PDF.js is the industry-standard library for PDF rendering in web applications (developed by Mozilla)
- Canvas-based rendering provides the best performance and visual fidelity
- Continuous scroll mode requires rendering all pages sequentially in a scrollable container
- HiDPI support is built-in via `devicePixelRatio` scaling

**Key Implementation Pattern** (from Context7 research):
```javascript
// Configure worker
pdfjsLib.GlobalWorkerOptions.workerSrc = 'path/to/pdf.worker.mjs';

// Load document
const loadingTask = pdfjsLib.getDocument(url);
const pdf = await loadingTask.promise;

// Render each page to canvas
for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
  const page = await pdf.getPage(pageNum);
  const viewport = page.getViewport({ scale });

  // HiDPI support
  const outputScale = window.devicePixelRatio || 1;
  canvas.width = Math.floor(viewport.width * outputScale);
  canvas.height = Math.floor(viewport.height * outputScale);

  const renderContext = {
    canvasContext: context,
    transform: outputScale !== 1 ? [outputScale, 0, 0, outputScale, 0, 0] : null,
    viewport: viewport,
  };

  await page.render(renderContext);
}
```

**Alternatives Considered**:
- `react-pdf`: Higher-level wrapper, but adds unnecessary abstraction for our simple use case
- `@pdfme/pdfme`: More focused on PDF generation than viewing
- Embedded iframe with browser PDF viewer: No zoom control or consistent styling

### 2. Markdown Rendering with react-markdown

**Decision**: Use `react-markdown` package with default configuration.

**Rationale**:
- Most popular React markdown renderer (remarkjs ecosystem)
- Simple component API: `<Markdown>{content}</Markdown>`
- Supports custom component mapping for styling
- Synchronous rendering sufficient for our use case (no async plugins needed)

**Key Implementation Pattern** (from Context7 research):
```jsx
import Markdown from 'react-markdown';

// Basic usage
<Markdown>{markdownContent}</Markdown>

// With custom styling
<Markdown
  components={{
    h1: 'h2',  // Remap elements
    code: ({ node, ...props }) => (
      <code className="bg-muted p-1 rounded" {...props} />
    ),
  }}
>
  {markdownContent}
</Markdown>
```

**Alternatives Considered**:
- `marked` + `dangerouslySetInnerHTML`: Security concerns, no React integration
- `remark-react`: Lower-level, more setup required
- `MDX`: Overkill for read-only rendering

### 3. Tauri File Dialog and File Reading

**Decision**: Use `@tauri-apps/plugin-dialog` for file selection and `@tauri-apps/plugin-fs` for reading.

**Rationale**:
- Official Tauri plugins with full TypeScript support
- Native file dialogs for better UX
- File filters support for restricting to PDF/Markdown files
- Cross-platform compatibility (Windows, macOS, Linux)

**Key Implementation Pattern** (from Context7 research):
```typescript
import { open } from '@tauri-apps/plugin-dialog';
import { open as openFile, BaseDirectory } from '@tauri-apps/plugin-fs';

// Open file dialog with filters
const filePath = await open({
  multiple: false,
  directory: false,
  filters: [
    { name: 'Documents', extensions: ['pdf', 'md', 'markdown'] }
  ]
});

if (filePath === null) return; // User cancelled

// Read file content
const file = await openFile(filePath, { read: true });
const stat = await file.stat();
const buf = new Uint8Array(stat.size);
await file.read(buf);
const content = new TextDecoder().decode(buf);
await file.close();
```

**Alternatives Considered**:
- Web File API: Limited access to filesystem, requires user gesture each time
- Raw Tauri commands: Plugin provides higher-level abstraction

### 4. File Type Detection

**Decision**: Detect file type by extension (case-insensitive).

**Rationale**:
- Simple and reliable for supported file types
- No need for content-based detection (magic bytes) for PDF/Markdown
- Extension mapping: `.pdf` → PDF, `.md`/`.markdown` → Markdown
- Consistent with user expectations

**Implementation**:
```typescript
type FileType = 'pdf' | 'markdown' | 'unknown';

function detectFileType(filePath: string): FileType {
  const ext = filePath.split('.').pop()?.toLowerCase();
  switch (ext) {
    case 'pdf': return 'pdf';
    case 'md':
    case 'markdown': return 'markdown';
    default: return 'unknown';
  }
}
```

**Alternatives Considered**:
- MIME type detection: Requires additional library, overkill for 2 formats
- Content-based detection: Complex, unnecessary for our use case

### 5. Zoom Implementation

**Decision**: Use CSS transform scale (same pattern as BrowserContent).

**Rationale**:
- Consistent with existing Browser window zoom behavior
- Simple implementation: `transform: scale(zoom / 100)`
- Works for both PDF canvas and Markdown HTML content
- Maintains scroll position during zoom changes

**Implementation Pattern** (from existing BrowserContent):
```typescript
const scaleValue = zoom / 100;
const inverseScale = 100 / zoom;

<div style={{
  width: `${inverseScale * 100}%`,
  height: `${inverseScale * 100}%`,
  transform: `scale(${scaleValue})`,
  transformOrigin: '0 0',
}}>
  {/* Content */}
</div>
```

**Alternatives Considered**:
- Re-rendering PDF at different scales: More expensive, PDF.js handles internal scaling
- Font-size adjustment for Markdown: Inconsistent with PDF behavior

### 6. Persistence Strategy

**Decision**: Extend existing persistence system with new `FileViewerPersistedContent` type.

**Rationale**:
- Follows established pattern from Browser persistence (015-browser-persistence)
- Consistent file format: `window-{id}.json`
- Debounced saves to minimize disk I/O
- Validates file existence on restore

**Data Structure**:
```typescript
interface FileViewerPersistedContent {
  /** Absolute path to the file */
  filePath: string;
  /** Detected file type */
  fileType: 'pdf' | 'markdown' | 'unknown';
  /** Zoom level (10-200) */
  zoom: number;
}
```

**Alternatives Considered**:
- Storing file content: Too large for PDFs, unnecessary since files are local
- Storing only file path: Would need to re-detect type on restore

## Dependencies to Add

| Package | Version | Purpose |
|---------|---------|---------|
| `pdfjs-dist` | latest | PDF rendering |
| `react-markdown` | latest | Markdown rendering |

**Note**: `@tauri-apps/plugin-dialog` and `@tauri-apps/plugin-fs` may already be available in the project. Verify before adding.

## Risks and Mitigations

| Risk | Impact | Mitigation |
|------|--------|------------|
| Large PDF files cause memory issues | Medium | Implement virtual scrolling in future iteration if needed |
| PDF.js worker loading fails | High | Bundle worker with app, provide error fallback |
| File permissions blocked by OS | Medium | Use Tauri's filesystem scope configuration |
| Markdown rendering XSS | Low | react-markdown sanitizes by default |

## Conclusion

All technical decisions are resolved. The implementation follows established patterns in the codebase and uses well-documented, widely-adopted libraries. No NEEDS CLARIFICATION items remain.
