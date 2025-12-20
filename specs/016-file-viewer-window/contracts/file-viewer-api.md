# File Viewer API Contracts

**Feature**: 016-file-viewer-window
**Date**: 2025-12-20

## Overview

This document defines the internal component APIs for the File Viewer Window feature. Since this is a desktop application (not a web service), these contracts define React component props, context methods, and hook interfaces.

## Component Contracts

### FileViewerToolbar Props

```typescript
export interface FileViewerToolbarProps {
  /** Current file path (displayed in toolbar) */
  filePath: string | null;

  /** Current zoom level (10-200) */
  zoom: number;

  /** Whether a file operation is in progress */
  isLoading: boolean;

  /** Callback when user clicks Open File button */
  onOpenFile: () => void;

  /** Callback when user clicks zoom in */
  onZoomIn: () => void;

  /** Callback when user clicks zoom out */
  onZoomOut: () => void;
}
```

### FileViewerContent Props

```typescript
export interface FileViewerContentProps {
  /** Whether the window is in interactive mode */
  isInteractive: boolean;

  /** Window ID for persistence */
  windowId?: string;

  /** Initial file path from persisted state */
  initialFilePath?: string;

  /** Initial file type from persisted state */
  initialFileType?: FileType;

  /** Initial zoom level from persisted state (10-200) */
  initialZoom?: number;

  /** Callback when file viewer content changes (for persistence) */
  onContentChange?: (filePath: string, fileType: FileType, zoom: number) => void;
}
```

### PDFRenderer Props

```typescript
export interface PDFRendererProps {
  /** PDF file content as ArrayBuffer */
  content: ArrayBuffer;

  /** Current zoom level (10-200) */
  zoom: number;

  /** Callback when an error occurs during rendering */
  onError?: (error: Error) => void;
}
```

### MarkdownRenderer Props

```typescript
export interface MarkdownRendererProps {
  /** Markdown file content as string */
  content: string;

  /** Current zoom level (10-200) */
  zoom: number;
}
```

### ErrorRenderer Props

```typescript
export interface ErrorRendererProps {
  /** Error type for icon/styling selection */
  type: FileViewerErrorType;

  /** User-friendly error message */
  message: string;

  /** Optional: Callback for retry action (if applicable) */
  onRetry?: () => void;
}
```

### PlaceholderRenderer Props

```typescript
export interface PlaceholderRendererProps {
  /** Callback when user clicks to open a file */
  onOpenFile: () => void;
}
```

## Context Extensions

### PersistenceContext (additions)

```typescript
// Add to PersistenceContextValue interface
export interface PersistenceContextValue {
  // ... existing methods ...

  /**
   * Trigger debounced save for file viewer content.
   * @feature 016-file-viewer-window
   */
  onFileViewerContentChange: (
    windowId: string,
    filePath: string,
    fileType: FileType,
    zoom: number
  ) => void;
}
```

## Hook Interfaces

### useFileViewer Hook

```typescript
export interface UseFileViewerOptions {
  /** Window ID for persistence */
  windowId?: string;

  /** Initial state from persistence */
  initialState?: Partial<FileViewerPersistedContent>;

  /** Callback for persistence */
  onContentChange?: (filePath: string, fileType: FileType, zoom: number) => void;
}

export interface UseFileViewerReturn {
  /** Current state */
  state: FileViewerState;

  /** Open file dialog and load selected file */
  openFile: () => Promise<void>;

  /** Zoom in by ZOOM_STEP */
  zoomIn: () => void;

  /** Zoom out by ZOOM_STEP */
  zoomOut: () => void;

  /** Set zoom to specific value */
  setZoom: (zoom: number) => void;
}
```

## Serialization Functions

### serializeFileViewerContent

```typescript
/**
 * Serialize file viewer state for persistence.
 * @param windowId - The window ID
 * @param filePath - Current file path
 * @param fileType - Detected file type
 * @param zoom - Current zoom level
 * @returns WindowContentFile ready for saving
 */
export function serializeFileViewerContent(
  windowId: string,
  filePath: string,
  fileType: FileType,
  zoom: number
): WindowContentFile;
```

### normalizeFileViewerContent

```typescript
/**
 * Validate and normalize FileViewerPersistedContent.
 * Returns content with defaults for missing/invalid values.
 * @param content - Partial or potentially invalid content
 * @returns Normalized FileViewerPersistedContent
 */
export function normalizeFileViewerContent(
  content: Partial<FileViewerPersistedContent> | null | undefined
): FileViewerPersistedContent;
```

## File Operations Contract

### openFileDialog

```typescript
/**
 * Open native file dialog filtered to supported types.
 * @returns Selected file path or null if cancelled
 */
async function openFileDialog(): Promise<string | null>;

// Implementation uses:
// - @tauri-apps/plugin-dialog: open()
// - Filters: [{ name: 'Documents', extensions: ['pdf', 'md', 'markdown'] }]
```

### readFileContent

```typescript
/**
 * Read file content from filesystem.
 * @param filePath - Absolute path to file
 * @param fileType - Type determines binary vs text reading
 * @returns File content (ArrayBuffer for PDF, string for Markdown)
 * @throws FileViewerError on failure
 */
async function readFileContent(
  filePath: string,
  fileType: FileType
): Promise<ArrayBuffer | string>;

// Implementation uses:
// - @tauri-apps/plugin-fs: open(), read(), close()
// - TextDecoder for Markdown files
```

### checkFileExists

```typescript
/**
 * Check if a file exists at the given path.
 * @param filePath - Absolute path to check
 * @returns true if file exists, false otherwise
 */
async function checkFileExists(filePath: string): Promise<boolean>;

// Implementation uses:
// - @tauri-apps/plugin-fs: stat()
```

## Event Contracts

### Window Open Event Payload

For opening a File Viewer window via the event system:

```typescript
// Payload for window:open event
const payload: WindowOpenPayload = {
  component: FileViewerContent,
  title: 'File Viewer',
  contentType: 'fileviewer',
  initialWidth: 600,
  initialHeight: 500,
  componentProps: {
    // Optional: for restored windows
    initialFilePath?: string,
    initialFileType?: FileType,
    initialZoom?: number,
  },
};
```
