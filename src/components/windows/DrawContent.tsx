"use client";

import { useRef, useCallback, useEffect, useState } from "react";
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

  // Track when Excalidraw API is ready (033-excalidraw-view-polish)
  const [apiReady, setApiReady] = useState(false);

  // Only use transparent when in view mode (non-interactive) AND backgroundTransparent is enabled
  // (033-excalidraw-view-polish)
  const useTransparentBackground = backgroundTransparent === true && !isInteractive;

  // Apply transparent background when API is ready and transparency is enabled
  // (033-excalidraw-view-polish)
  useEffect(() => {
    if (apiReady && excalidrawAPIRef.current && useTransparentBackground) {
      excalidrawAPIRef.current.updateScene({
        appState: {
          viewBackgroundColor: "transparent",
        },
      });
    }
  }, [apiReady, useTransparentBackground]);

  // Callback when Excalidraw API becomes available
  const handleExcalidrawAPI = useCallback((api: ExcalidrawImperativeAPI) => {
    excalidrawAPIRef.current = api;
    setApiReady(true);
  }, []);

  const handleChange = useCallback((elements: readonly ExcalidrawElement[], appState: AppState) => {
    if (onContentChangeRef.current) {
      onContentChangeRef.current(elements, appState);
    }
  }, []);

  return (
    <div className="h-full w-full">
      <Excalidraw
        excalidrawAPI={handleExcalidrawAPI}
        theme="dark"
        viewModeEnabled={!isInteractive}
        initialData={{
          elements: initialElements,
          appState: initialAppState,
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
