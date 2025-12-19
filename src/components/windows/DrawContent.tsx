"use client";

import { useRef, useCallback } from "react";
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
}: DrawContentProps) {
  const excalidrawAPIRef = useRef<ExcalidrawImperativeAPI | null>(null);
  const onContentChangeRef = useRef(onContentChange);
  onContentChangeRef.current = onContentChange;

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
