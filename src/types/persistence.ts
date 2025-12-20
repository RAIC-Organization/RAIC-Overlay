/**
 * Persistence Types for State Persistence System
 *
 * Defines the TypeScript types for persisted state, matching the Rust
 * types in persistence_types.rs and the data model specification.
 *
 * @feature 010-state-persistence-system
 * @feature 015-browser-persistence
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

export type WindowType = 'notes' | 'draw' | 'browser';

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
  content: NotesContent | DrawContent | BrowserPersistedContent;
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
