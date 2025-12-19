"use client";

import dynamic from "next/dynamic";
import "@excalidraw/excalidraw/index.css";

export interface DrawContentProps {
  isInteractive: boolean;
}

// Dynamic import Excalidraw with SSR disabled (requires browser APIs)
const Excalidraw = dynamic(
  async () => {
    const mod = await import("@excalidraw/excalidraw");
    return mod.Excalidraw;
  },
  { ssr: false }
);

export function DrawContent({ isInteractive }: DrawContentProps) {
  return (
    <div className="h-full w-full">
      <Excalidraw
        theme="dark"
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
