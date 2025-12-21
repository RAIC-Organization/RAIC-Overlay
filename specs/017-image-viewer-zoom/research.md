# Research: Image Viewer with Zoom Support

**Feature**: 017-image-viewer-zoom
**Date**: 2025-12-20

## Research Tasks Completed

### 1. react-zoom-pan-pinch Library Integration

**Decision**: Use `react-zoom-pan-pinch` library from `@bettertyped/react-zoom-pan-pinch` (npm: `react-zoom-pan-pinch`)

**Rationale**:
- Provides TransformWrapper and TransformComponent for wrapping any content with zoom/pan/pinch capabilities
- Supports mouse wheel zoom, click-and-drag panning, and pinch gestures
- Offers programmatic control via `useControls` hook with `zoomIn()`, `zoomOut()`, `resetTransform()` functions
- Lightweight with no external dependencies
- Well-documented with TypeScript support

**Alternatives Considered**:
- `panzoom`: Pure JavaScript, would require more custom React integration
- Custom implementation: More effort, reinventing existing solution
- CSS transforms only: Limited functionality, no pinch/pan gestures

### 2. Component Architecture Pattern

**Decision**: Follow existing renderer pattern (PDFRenderer, MarkdownRenderer)

**Rationale**:
- Consistent codebase structure
- Same props interface: `filePath: string`, `zoom: number`
- Reuses existing error and loading state patterns
- Integrates with existing FileViewerContent switch statement

**Key Components**:
```typescript
// ImageRenderer props (matches existing pattern)
interface ImageRendererProps {
  filePath: string;  // Absolute path to image file
  zoom: number;      // Zoom level 10-200 (percentage)
}
```

### 3. react-zoom-pan-pinch API Usage

**Decision**: Use TransformWrapper with render prop pattern for toolbar integration

**Key API Elements**:

```typescript
import {
  TransformWrapper,
  TransformComponent,
  useControls,
} from "react-zoom-pan-pinch";

// Basic usage
<TransformWrapper
  initialScale={1}           // Start at 100% (fit-to-container calculated separately)
  minScale={0.1}             // 10% minimum (matches FILE_VIEWER_DEFAULTS.ZOOM_MIN / 100)
  maxScale={2}               // 200% maximum (matches FILE_VIEWER_DEFAULTS.ZOOM_MAX / 100)
  centerOnInit={true}        // Center image initially
  doubleClick={{ mode: "reset" }}  // Double-click resets view (FR-006)
>
  {({ zoomIn, zoomOut, resetTransform, state }) => (
    <>
      {/* Controls can access zoom functions */}
      <TransformComponent>
        <img src={imageDataUrl} alt="" />
      </TransformComponent>
    </>
  )}
</TransformWrapper>

// Programmatic zoom control (for toolbar integration)
const { zoomIn, zoomOut, resetTransform } = useControls();
```

**State Object Structure**:
```typescript
state: {
  previousScale: number;
  scale: number;        // Current zoom level (1 = 100%)
  positionX: number;
  positionY: number;
}
```

### 4. Image Loading Strategy

**Decision**: Load image via Tauri fs plugin, convert to base64 data URL

**Rationale**:
- Consistent with existing file loading patterns (PDF uses readFile, Markdown uses readTextFile)
- `<img>` tag requires a URL source; local file paths don't work in webview
- Base64 data URL works reliably for all image formats

**Implementation Pattern**:
```typescript
const { readFile } = await import("@tauri-apps/plugin-fs");
const fileData = await readFile(filePath);  // Returns Uint8Array

// Convert to base64 data URL
const base64 = btoa(String.fromCharCode(...fileData));
const mimeType = getMimeType(filePath);  // Based on extension
const dataUrl = `data:${mimeType};base64,${base64}`;
```

**MIME Type Mapping**:
| Extension | MIME Type |
|-----------|-----------|
| .png | image/png |
| .jpg, .jpeg | image/jpeg |
| .gif | image/gif |
| .webp | image/webp |
| .bmp | image/bmp |
| .svg | image/svg+xml |
| .ico | image/x-icon |

### 5. Toolbar Zoom Integration

**Decision**: Synchronize react-zoom-pan-pinch scale with toolbar zoom percentage

**Challenge**: The library uses scale (0.1-2.0) while toolbar uses percentage (10-200)

**Solution**:
- Convert toolbar zoom (10-200) to scale: `scale = zoom / 100`
- Convert library scale to toolbar display: `displayZoom = Math.round(state.scale * 100)`
- Use `onTransformed` callback to sync state changes back to parent

**Implementation Approach**:
```typescript
<TransformWrapper
  initialScale={zoom / 100}
  onTransformed={(ref, state) => {
    // Notify parent of zoom change for persistence
    const newZoom = Math.round(state.scale * 100);
    onZoomChange?.(newZoom);
  }}
>
```

### 6. Fit-to-Container Initial Display

**Decision**: Use `centerOnInit={true}` with calculated initial scale based on container/image dimensions

**Rationale**:
- Clarification specified fit-to-container with aspect ratio preservation
- Library's `centerOnInit` handles centering
- Initial scale needs calculation: `Math.min(containerWidth / imageWidth, containerHeight / imageHeight)`

**Implementation Notes**:
- Wait for image to load to get natural dimensions
- Use container ref to get available space
- Calculate fit scale, but respect minScale (0.1) and maxScale (2.0)

### 7. FileType Extension

**Decision**: Add 'image' to FileType union type

**Current FileType**:
```typescript
export type FileType = 'pdf' | 'markdown' | 'unknown';
```

**Updated FileType**:
```typescript
export type FileType = 'pdf' | 'markdown' | 'image' | 'unknown';
```

**detectFileType Extension**:
```typescript
export function detectFileType(filePath: string): FileType {
  const ext = filePath.split('.').pop()?.toLowerCase();
  switch (ext) {
    case 'pdf':
      return 'pdf';
    case 'md':
    case 'markdown':
      return 'markdown';
    case 'png':
    case 'jpg':
    case 'jpeg':
    case 'gif':
    case 'webp':
    case 'bmp':
    case 'svg':
    case 'ico':
      return 'image';
    default:
      return 'unknown';
  }
}
```

## Summary

All research items resolved. The implementation will:

1. Install `react-zoom-pan-pinch` package
2. Create `ImageRenderer.tsx` in `src/components/windows/renderers/`
3. Extend `FileType` and `detectFileType` in `persistence.ts`
4. Update `FileViewerContent.tsx` to render ImageRenderer for image files
5. Update file dialog filters to include image extensions

No blocking issues identified. Ready to proceed to Phase 1 design.
