# Data Model: File Viewer Window

**Feature**: 016-file-viewer-window
**Date**: 2025-12-20
**Status**: Complete

## Entities

### FileViewerPersistedContent

Represents the persisted state of a File Viewer window, stored in `window-{id}.json`.

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `filePath` | `string` | Yes | Absolute path to the opened file |
| `fileType` | `FileType` | Yes | Detected file type for renderer selection |
| `zoom` | `number` | Yes | Zoom level percentage (10-200) |

**Validation Rules**:
- `filePath`: Non-empty string, absolute path format
- `fileType`: One of `'pdf'`, `'markdown'`, `'unknown'`
- `zoom`: Integer between 10 and 200 inclusive, defaults to 100

**State Transitions**:
- **Empty → File Loaded**: User opens a file via dialog
- **File Loaded → Different File**: User opens a different file (replaces current)
- **File Loaded → Error**: File no longer exists on restore
- **Any → Zoom Changed**: User adjusts zoom level

### FileType (Enum)

Represents the detected type of a file.

| Value | Description | File Extensions |
|-------|-------------|-----------------|
| `'pdf'` | PDF document | `.pdf` |
| `'markdown'` | Markdown document | `.md`, `.markdown` |
| `'unknown'` | Unsupported file type | Any other extension |

### FileViewerState (Runtime)

In-memory state for a File Viewer window component.

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `filePath` | `string \| null` | No | Currently opened file path |
| `fileType` | `FileType` | Yes | Detected or inferred file type |
| `fileContent` | `string \| ArrayBuffer \| null` | No | Loaded file content (text for MD, binary for PDF) |
| `zoom` | `number` | Yes | Current zoom level |
| `isLoading` | `boolean` | Yes | Whether file is currently loading |
| `error` | `FileViewerError \| null` | No | Current error state |

### FileViewerError (Runtime)

Represents error states in the file viewer.

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `type` | `ErrorType` | Yes | Category of error |
| `message` | `string` | Yes | User-friendly error message |

**ErrorType Values**:
- `'file-not-found'`: File path does not exist
- `'unsupported-type'`: File extension not recognized
- `'parse-error'`: File content could not be parsed by renderer
- `'read-error'`: File could not be read (permissions, etc.)

## Relationships

```text
WindowInstance (existing)
    └── contentType: 'fileviewer'
    └── links to → WindowContentFile (existing)
                       └── content: FileViewerPersistedContent

FileViewerContent (component)
    └── manages → FileViewerState (runtime)
    └── renders → PDFRenderer | MarkdownRenderer | ErrorRenderer
    └── persists via → PersistenceContext → FileViewerPersistedContent
```

## Type Definitions

```typescript
// File type enum
export type FileType = 'pdf' | 'markdown' | 'unknown';

// Error type enum
export type FileViewerErrorType =
  | 'file-not-found'
  | 'unsupported-type'
  | 'parse-error'
  | 'read-error';

// Persisted content (for window-{id}.json)
export interface FileViewerPersistedContent {
  filePath: string;
  fileType: FileType;
  zoom: number;
}

// Runtime error state
export interface FileViewerError {
  type: FileViewerErrorType;
  message: string;
}

// Runtime component state
export interface FileViewerState {
  filePath: string | null;
  fileType: FileType;
  fileContent: string | ArrayBuffer | null;
  zoom: number;
  isLoading: boolean;
  error: FileViewerError | null;
}

// Constants
export const FILE_VIEWER_DEFAULTS = {
  DEFAULT_ZOOM: 100,
  ZOOM_MIN: 10,
  ZOOM_MAX: 200,
  ZOOM_STEP: 10,
} as const;

// Validation helper
export function clampFileViewerZoom(zoom: number): number {
  return Math.max(
    FILE_VIEWER_DEFAULTS.ZOOM_MIN,
    Math.min(FILE_VIEWER_DEFAULTS.ZOOM_MAX, zoom)
  );
}

// Type detection helper
export function detectFileType(filePath: string): FileType {
  const ext = filePath.split('.').pop()?.toLowerCase();
  switch (ext) {
    case 'pdf': return 'pdf';
    case 'md':
    case 'markdown': return 'markdown';
    default: return 'unknown';
  }
}

// Default persisted content
export const DEFAULT_FILE_VIEWER_CONTENT: FileViewerPersistedContent = {
  filePath: '',
  fileType: 'unknown',
  zoom: FILE_VIEWER_DEFAULTS.DEFAULT_ZOOM,
};

// Type guard
export function isFileViewerContent(
  content: unknown
): content is FileViewerPersistedContent {
  return (
    typeof content === 'object' &&
    content !== null &&
    'filePath' in content &&
    'fileType' in content &&
    'zoom' in content
  );
}
```

## Extensions to Existing Types

### WindowContentType (src/types/windows.ts)

Add `'fileviewer'` to the existing union:

```typescript
// Before
export type WindowContentType = 'notes' | 'draw' | 'browser' | 'test';

// After
export type WindowContentType = 'notes' | 'draw' | 'browser' | 'fileviewer' | 'test';
```

### WindowContentFile (src/types/persistence.ts)

Extend content union:

```typescript
// Before
export interface WindowContentFile {
  windowId: string;
  type: WindowType;
  content: NotesContent | DrawContent | BrowserPersistedContent;
  lastModified: string;
}

// After (add FileViewerPersistedContent to union)
export interface WindowContentFile {
  windowId: string;
  type: WindowType;
  content: NotesContent | DrawContent | BrowserPersistedContent | FileViewerPersistedContent;
  lastModified: string;
}
```

### WindowType (src/types/persistence.ts)

Add `'fileviewer'`:

```typescript
// Before
export type WindowType = 'notes' | 'draw' | 'browser';

// After
export type WindowType = 'notes' | 'draw' | 'browser' | 'fileviewer';
```
