/**
 * DrawContent Component Props Contract
 * Feature: 033-excalidraw-view-polish
 *
 * This contract defines the expected props interface for the DrawContent component
 * after the view mode polish implementation.
 */

import type { AppState } from "@excalidraw/excalidraw/types";

// Excalidraw element type (not exported by library, use any)
type ExcalidrawElement = unknown;

/**
 * Props for the DrawContent component
 */
export interface DrawContentProps {
  /**
   * Whether the component is in interactive (editing) mode.
   * When false, viewModeEnabled is set on Excalidraw.
   */
  isInteractive: boolean;

  /**
   * Initial drawing elements from persistence.
   * Passed to Excalidraw's initialData.elements.
   */
  initialElements?: readonly ExcalidrawElement[];

  /**
   * Initial app state from persistence.
   * Merged with computed viewBackgroundColor.
   */
  initialAppState?: Partial<AppState>;

  /**
   * Callback when content changes (for persistence).
   * Called on every Excalidraw onChange event.
   */
  onContentChange?: (
    elements: readonly ExcalidrawElement[],
    appState: AppState
  ) => void;

  /**
   * NEW: Whether window background should be transparent.
   *
   * Behavior:
   * - Only applies when isInteractive === false
   * - When true + non-interactive: viewBackgroundColor = "transparent"
   * - When false or interactive: viewBackgroundColor = initialAppState value or "#1e1e1e"
   *
   * @default undefined (falsy, treated as false)
   */
  backgroundTransparent?: boolean;
}

/**
 * Expected behavior matrix for viewBackgroundColor
 *
 * | isInteractive | backgroundTransparent | viewBackgroundColor |
 * |---------------|----------------------|---------------------|
 * | true          | true                 | initialAppState or "#1e1e1e" |
 * | true          | false                | initialAppState or "#1e1e1e" |
 * | false         | true                 | "transparent" |
 * | false         | false                | initialAppState or "#1e1e1e" |
 */
