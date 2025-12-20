/**
 * Persistence Types for State Persistence System
 *
 * Defines the TypeScript types for persisted state, matching the Rust
 * types in persistence_types.rs and the data model specification.
 *
 * @feature 010-state-persistence-system
 * @feature 015-browser-persistence
 * @feature 016-file-viewer-window
 */

export const CURRENT_STATE_VERSION = 1;

// ============================================================================
// Persisted State (state.json)
// ============================================================================

export interface PersistedState {
  version: number;
  lastModified: string;
  global: GlobalSettings;
  windows: WindowStructure[];
}

export interface GlobalSettings {
  overlayMode: OverlayMode;
  overlayVisible: boolean;
}

export type OverlayMode = 'windowed' | 'fullscreen';

export interface WindowStructure {
  id: string;
  type: WindowType;
  position: Position;
  size: Size;
  zIndex: number;
  flags: WindowFlags;
  opacity: number;
}

export type WindowType = 'notes' | 'draw' | 'browser' | 'fileviewer';

export interface Position {
  x: number;
  y: number;
}

export interface Size {
  width: number;
  height: number;
}

export interface WindowFlags {
  minimized: boolean;
  maximized: boolean;
}

// ============================================================================
// Window Content (window-{id}.json)
// ============================================================================

export interface WindowContentFile {
  windowId: string;
  type: WindowType;
  content: NotesContent | DrawContent | BrowserPersistedContent | FileViewerPersistedContent;
  lastModified: string;
}

export interface NotesContent {
  type: 'doc';
  content: TipTapNode[];
}

// TipTap node structure (simplified)
export interface TipTapNode {
  type: string;
  content?: TipTapNode[];
  text?: string;
  marks?: { type: string; attrs?: Record<string, unknown> }[];
  attrs?: Record<string, unknown>;
}

export interface DrawContent {
  elements: ExcalidrawElement[];
  appState?: Partial<ExcalidrawAppState>;
}

// Excalidraw types (simplified - use actual types from @excalidraw/excalidraw)
export interface ExcalidrawElement {
  id: string;
  type: string;
  x: number;
  y: number;
  width?: number;
  height?: number;
  [key: string]: unknown;
}

export interface ExcalidrawAppState {
  viewBackgroundColor: string;
  [key: string]: unknown;
}

// ============================================================================
// Browser Content (NEW - 015-browser-persistence)
// ============================================================================

/**
 * Persisted content for Browser windows.
 * Navigation history is NOT persisted (only final URL).
 * @feature 015-browser-persistence
 */
export interface BrowserPersistedContent {
  /** Current URL displayed in the iframe */
  url: string;
  /** Zoom level percentage (10-200) */
  zoom: number;
}

// Browser defaults - aligned with BROWSER_DEFAULTS in BrowserContent.tsx
const BROWSER_ZOOM_MIN = 10;
const BROWSER_ZOOM_MAX = 200;
const BROWSER_DEFAULT_URL = 'https://example.com';
const BROWSER_DEFAULT_ZOOM = 50;

/**
 * Clamp zoom value to valid range (10-200)
 * @feature 015-browser-persistence
 */
export function clampBrowserZoom(zoom: number): number {
  return Math.max(BROWSER_ZOOM_MIN, Math.min(BROWSER_ZOOM_MAX, zoom));
}

/**
 * Validate and normalize BrowserPersistedContent.
 * Returns content with defaults for missing/invalid values.
 * @feature 015-browser-persistence
 */
export function normalizeBrowserContent(
  content: Partial<BrowserPersistedContent> | null | undefined
): BrowserPersistedContent {
  return {
    url: content?.url || BROWSER_DEFAULT_URL,
    zoom: clampBrowserZoom(content?.zoom ?? BROWSER_DEFAULT_ZOOM),
  };
}

/**
 * Default BrowserPersistedContent.
 * @feature 015-browser-persistence
 */
export const DEFAULT_BROWSER_CONTENT: BrowserPersistedContent = {
  url: BROWSER_DEFAULT_URL,
  zoom: BROWSER_DEFAULT_ZOOM,
};

/**
 * Type guard for BrowserPersistedContent.
 * @feature 015-browser-persistence
 */
export function isBrowserContent(
  content: NotesContent | DrawContent | BrowserPersistedContent | FileViewerPersistedContent
): content is BrowserPersistedContent {
  return 'url' in content && 'zoom' in content;
}

// ============================================================================
// File Viewer Content (NEW - 016-file-viewer-window)
// ============================================================================

/**
 * File type enum for file viewer.
 * @feature 016-file-viewer-window
 */
export type FileType = 'pdf' | 'markdown' | 'unknown';

/**
 * Persisted content for File Viewer windows.
 * @feature 016-file-viewer-window
 */
export interface FileViewerPersistedContent {
  /** Absolute path to the opened file */
  filePath: string;
  /** Detected file type for renderer selection */
  fileType: FileType;
  /** Zoom level percentage (10-200) */
  zoom: number;
}

/**
 * File viewer defaults.
 * @feature 016-file-viewer-window
 */
export const FILE_VIEWER_DEFAULTS = {
  DEFAULT_ZOOM: 100,
  ZOOM_MIN: 10,
  ZOOM_MAX: 200,
  ZOOM_STEP: 10,
} as const;

/**
 * Clamp file viewer zoom value to valid range (10-200)
 * @feature 016-file-viewer-window
 */
export function clampFileViewerZoom(zoom: number): number {
  return Math.max(
    FILE_VIEWER_DEFAULTS.ZOOM_MIN,
    Math.min(FILE_VIEWER_DEFAULTS.ZOOM_MAX, zoom)
  );
}

/**
 * Detect file type from file path extension.
 * @feature 016-file-viewer-window
 */
export function detectFileType(filePath: string): FileType {
  const ext = filePath.split('.').pop()?.toLowerCase();
  switch (ext) {
    case 'pdf':
      return 'pdf';
    case 'md':
    case 'markdown':
      return 'markdown';
    default:
      return 'unknown';
  }
}

/**
 * Validate and normalize FileViewerPersistedContent.
 * Returns content with defaults for missing/invalid values.
 * @feature 016-file-viewer-window
 */
export function normalizeFileViewerContent(
  content: Partial<FileViewerPersistedContent> | null | undefined
): FileViewerPersistedContent {
  return {
    filePath: content?.filePath || '',
    fileType: content?.fileType || 'unknown',
    zoom: clampFileViewerZoom(content?.zoom ?? FILE_VIEWER_DEFAULTS.DEFAULT_ZOOM),
  };
}

/**
 * Default FileViewerPersistedContent.
 * @feature 016-file-viewer-window
 */
export const DEFAULT_FILE_VIEWER_CONTENT: FileViewerPersistedContent = {
  filePath: '',
  fileType: 'unknown',
  zoom: FILE_VIEWER_DEFAULTS.DEFAULT_ZOOM,
};

/**
 * Type guard for FileViewerPersistedContent.
 * @feature 016-file-viewer-window
 */
export function isFileViewerContent(
  content: NotesContent | DrawContent | BrowserPersistedContent | FileViewerPersistedContent
): content is FileViewerPersistedContent {
  return 'filePath' in content && 'fileType' in content && 'zoom' in content;
}

// ============================================================================
// Default Values
// ============================================================================

export const DEFAULT_GLOBAL_SETTINGS: GlobalSettings = {
  overlayMode: 'windowed',
  overlayVisible: false,
};

export const DEFAULT_WINDOW_FLAGS: WindowFlags = {
  minimized: false,
  maximized: false,
};

export const DEFAULT_PERSISTED_STATE: PersistedState = {
  version: CURRENT_STATE_VERSION,
  lastModified: new Date().toISOString(),
  global: DEFAULT_GLOBAL_SETTINGS,
  windows: [],
};
