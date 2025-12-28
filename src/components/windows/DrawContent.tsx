"use client";

import { useRef, useCallback, useEffect } from "react";
import dynamic from "next/dynamic";
import type { ExcalidrawImperativeAPI, AppState } from "@excalidraw/excalidraw/types";
import "@excalidraw/excalidraw/index.css";

// Use any for Excalidraw elements since the type isn't exported properly
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type ExcalidrawElement = any;

export interface DrawContentProps {
  isInteractive: boolean;
  /** Initial elements from persistence */
  initialElements?: readonly ExcalidrawElement[];
  /** Initial app state from persistence */
  initialAppState?: Partial<AppState>;
  /** Callback when content changes (for persistence) */
  onContentChange?: (elements: readonly ExcalidrawElement[], appState: AppState) => void;
  /** Whether window background should be transparent (only applies in non-interactive mode) @feature 033-excalidraw-view-polish */
  backgroundTransparent?: boolean;
}

// Dynamic import Excalidraw with SSR disabled (requires browser APIs)
const Excalidraw = dynamic(
  async () => {
    const mod = await import("@excalidraw/excalidraw");
    return mod.Excalidraw;
  },
  { ssr: false }
);

export function DrawContent({
  isInteractive,
  initialElements,
  initialAppState,
  onContentChange,
  backgroundTransparent,
}: DrawContentProps) {
  const excalidrawAPIRef = useRef<ExcalidrawImperativeAPI | null>(null);
  const onContentChangeRef = useRef(onContentChange);
  onContentChangeRef.current = onContentChange;

  // Compute effective background color for Excalidraw (033-excalidraw-view-polish)
  // Transparent only applies in non-interactive (view) mode
  const effectiveViewBackgroundColor = (backgroundTransparent && !isInteractive)
    ? "transparent"
    : (initialAppState?.viewBackgroundColor ?? "#1e1e1e");

  // Update Excalidraw background when transparency/mode changes (033-excalidraw-view-polish)
  // initialData only applies on mount, so we need to use the API for dynamic updates
  useEffect(() => {
    if (excalidrawAPIRef.current) {
      excalidrawAPIRef.current.updateScene({
        appState: {
          viewBackgroundColor: effectiveViewBackgroundColor,
        },
      });
    }
  }, [effectiveViewBackgroundColor]);

  const handleChange = useCallback((elements: readonly ExcalidrawElement[], appState: AppState) => {
    if (onContentChangeRef.current) {
      onContentChangeRef.current(elements, appState);
    }
  }, []);

  return (
    <div className="h-full w-full">
      <Excalidraw
        excalidrawAPI={(api) => { excalidrawAPIRef.current = api; }}
        theme="dark"
        viewModeEnabled={!isInteractive}
        initialData={{
          elements: initialElements,
          appState: {
            ...initialAppState,
            viewBackgroundColor: effectiveViewBackgroundColor,
          },
        }}
        onChange={handleChange}
        UIOptions={{
          canvasActions: {
            toggleTheme: false,
            changeViewBackgroundColor: true,
            clearCanvas: true,
            loadScene: false,
            saveToActiveFile: false,
            saveAsImage: false,
            export: false,
          },
        }}
      />
    </div>
  );
}
