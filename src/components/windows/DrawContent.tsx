"use client";

import { Excalidraw, THEME } from "@excalidraw/excalidraw";
import "@excalidraw/excalidraw/index.css";

export interface DrawContentProps {
  isInteractive: boolean;
}

export function DrawContent({ isInteractive }: DrawContentProps) {
  return (
    <div className="h-full w-full">
      <Excalidraw
        theme={THEME.DARK}
        viewModeEnabled={!isInteractive}
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
