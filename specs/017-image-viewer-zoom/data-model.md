# Data Model: Image Viewer with Zoom Support

**Feature**: 017-image-viewer-zoom
**Date**: 2025-12-20

## Entities

### 1. FileType (Extended)

**Description**: Enum representing supported file types in the File Viewer.

**Location**: `src/types/persistence.ts`

**Current Definition**:
```typescript
export type FileType = 'pdf' | 'markdown' | 'unknown';
```

**Updated Definition**:
```typescript
export type FileType = 'pdf' | 'markdown' | 'image' | 'unknown';
```

**Validation Rules**:
- Must be one of the defined literal types
- Determined by file extension via `detectFileType()`

---

### 2. ImageRendererProps

**Description**: Props interface for the ImageRenderer component.

**Location**: `src/components/windows/renderers/ImageRenderer.tsx`

**Fields**:

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| filePath | string | Yes | Absolute path to the image file |
| zoom | number | Yes | Zoom level as percentage (10-200) |
| onZoomChange | (zoom: number) => void | No | Callback when internal zoom changes (for toolbar sync) |

**Validation Rules**:
- `filePath`: Must be non-empty string
- `zoom`: Must be between 10 and 200 (clamped by `clampFileViewerZoom()`)

---

### 3. ImageRendererState (Internal)

**Description**: Internal state managed by the ImageRenderer component.

**Fields**:

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| imageDataUrl | string | "" | Base64 data URL of the loaded image |
| isLoading | boolean | true | Whether image is currently loading |
| error | string \| null | null | Error message if loading failed |
| naturalWidth | number | 0 | Natural width of the loaded image |
| naturalHeight | number | 0 | Natural height of the loaded image |

**State Transitions**:

```
Initial State
    │
    ▼
[isLoading: true, imageDataUrl: "", error: null]
    │
    ├── Success ──► [isLoading: false, imageDataUrl: "data:...", error: null]
    │
    └── Failure ──► [isLoading: false, imageDataUrl: "", error: "message"]
```

---

### 4. SupportedImageExtensions

**Description**: Constant array of supported image file extensions.

**Location**: `src/types/persistence.ts`

**Definition**:
```typescript
export const SUPPORTED_IMAGE_EXTENSIONS = [
  'png', 'jpg', 'jpeg', 'gif', 'webp', 'bmp', 'svg', 'ico'
] as const;

export type SupportedImageExtension = typeof SUPPORTED_IMAGE_EXTENSIONS[number];
```

---

### 5. ImageMimeTypes

**Description**: Mapping of file extensions to MIME types for data URL generation.

**Location**: `src/components/windows/renderers/ImageRenderer.tsx` (or utility file)

**Definition**:
```typescript
const IMAGE_MIME_TYPES: Record<string, string> = {
  'png': 'image/png',
  'jpg': 'image/jpeg',
  'jpeg': 'image/jpeg',
  'gif': 'image/gif',
  'webp': 'image/webp',
  'bmp': 'image/bmp',
  'svg': 'image/svg+xml',
  'ico': 'image/x-icon',
};
```

---

## Relationships

```
FileViewerContent
    │
    ├── uses ──► FileType (to determine which renderer)
    │
    └── renders ──► ImageRenderer (when fileType === 'image')
                        │
                        └── uses ──► TransformWrapper/TransformComponent
                                         │
                                         └── wraps ──► <img> element
```

---

## Integration Points

### 1. FileViewerContent.tsx

**Change**: Add ImageRenderer case to the switch statement.

```typescript
switch (fileType) {
  case "pdf":
    return <PDFRenderer filePath={filePath} zoom={zoom} />;
  case "markdown":
    return <MarkdownRenderer filePath={filePath} zoom={zoom} />;
  case "image":  // NEW
    return <ImageRenderer filePath={filePath} zoom={zoom} />;
  case "unknown":
  default:
    return <UnsupportedFileType />;
}
```

### 2. persistence.ts - detectFileType()

**Change**: Add image extension detection.

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

### 3. FileViewerContent.tsx - File Dialog Filters

**Change**: Add image extensions to the file picker dialog.

```typescript
const selected = await open({
  multiple: false,
  filters: [
    {
      name: "Supported Files",
      extensions: ["pdf", "md", "markdown", "png", "jpg", "jpeg", "gif", "webp", "bmp", "svg", "ico"],
    },
    {
      name: "PDF Documents",
      extensions: ["pdf"],
    },
    {
      name: "Markdown Files",
      extensions: ["md", "markdown"],
    },
    {
      name: "Image Files",  // NEW
      extensions: ["png", "jpg", "jpeg", "gif", "webp", "bmp", "svg", "ico"],
    },
  ],
});
```

---

## No Database Changes

This feature uses the existing persistence system (state.json + window-{id}.json). The `FileViewerPersistedContent` interface already supports the new 'image' FileType value without modification:

```typescript
export interface FileViewerPersistedContent {
  filePath: string;    // Works with image paths
  fileType: FileType;  // Now includes 'image'
  zoom: number;        // Works with image zoom (10-200)
}
```
