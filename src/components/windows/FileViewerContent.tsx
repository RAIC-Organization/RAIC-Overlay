"use client";

/**
 * File Viewer Content Component
 *
 * Main container for file viewing functionality. Handles file selection,
 * type detection, and delegates rendering to appropriate renderer components.
 *
 * @feature 016-file-viewer-window
 */

import { useState, useCallback } from "react";
import { open } from "@tauri-apps/plugin-dialog";
import { FileViewerToolbar } from "./FileViewerToolbar";
import { PDFRenderer } from "./renderers/PDFRenderer";
import { MarkdownRenderer } from "./renderers/MarkdownRenderer";
import {
  clampFileViewerZoom,
  detectFileType,
  FILE_VIEWER_DEFAULTS,
  type FileType,
} from "@/types/persistence";
import { usePersistenceContext } from "@/contexts/PersistenceContext";
import { FileQuestion } from "lucide-react";

/**
 * Props for FileViewerContent component.
 */
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
  /** Callback when file viewer content changes */
  onContentChange?: (filePath: string, fileType: FileType, zoom: number) => void;
}

export function FileViewerContent({
  isInteractive,
  windowId,
  initialFilePath,
  initialFileType,
  initialZoom,
  onContentChange,
}: FileViewerContentProps) {
  // Get persistence context for fallback
  const persistence = usePersistenceContext();

  // Initialize state with persisted values or defaults
  const [filePath, setFilePath] = useState<string>(initialFilePath || "");
  const [fileType, setFileType] = useState<FileType>(initialFileType || "unknown");
  const [zoom, setZoom] = useState<number>(
    clampFileViewerZoom(initialZoom ?? FILE_VIEWER_DEFAULTS.DEFAULT_ZOOM)
  );

  // Unified content change handler
  const handleContentChange = useCallback(
    (newPath: string, newType: FileType, newZoom: number) => {
      if (onContentChange) {
        onContentChange(newPath, newType, newZoom);
      } else if (windowId && persistence?.onFileViewerContentChange) {
        persistence.onFileViewerContentChange(windowId, newPath, newType, newZoom);
      }
    },
    [windowId, onContentChange, persistence]
  );

  // Open file dialog
  const handleOpenFile = useCallback(async () => {
    try {
      const selected = await open({
        multiple: false,
        filters: [
          {
            name: "Supported Files",
            extensions: ["pdf", "md", "markdown"],
          },
          {
            name: "PDF Documents",
            extensions: ["pdf"],
          },
          {
            name: "Markdown Files",
            extensions: ["md", "markdown"],
          },
        ],
      });

      if (selected && typeof selected === "string") {
        const detectedType = detectFileType(selected);
        setFilePath(selected);
        setFileType(detectedType);
        handleContentChange(selected, detectedType, zoom);
      }
    } catch (err) {
      console.error("Failed to open file dialog:", err);
    }
  }, [zoom, handleContentChange]);

  // Zoom handlers
  const handleZoomIn = useCallback(() => {
    const newZoom = Math.min(
      zoom + FILE_VIEWER_DEFAULTS.ZOOM_STEP,
      FILE_VIEWER_DEFAULTS.ZOOM_MAX
    );
    setZoom(newZoom);
    handleContentChange(filePath, fileType, newZoom);
  }, [zoom, filePath, fileType, handleContentChange]);

  const handleZoomOut = useCallback(() => {
    const newZoom = Math.max(
      zoom - FILE_VIEWER_DEFAULTS.ZOOM_STEP,
      FILE_VIEWER_DEFAULTS.ZOOM_MIN
    );
    setZoom(newZoom);
    handleContentChange(filePath, fileType, newZoom);
  }, [zoom, filePath, fileType, handleContentChange]);

  // Render appropriate content based on file type
  const renderContent = () => {
    if (!filePath) {
      return (
        <div className="flex flex-col items-center justify-center h-full text-muted-foreground gap-4">
          <FileQuestion className="h-16 w-16 opacity-50" />
          <p className="text-sm">No file selected</p>
          {isInteractive && (
            <p className="text-xs">Click the folder icon to open a file</p>
          )}
        </div>
      );
    }

    switch (fileType) {
      case "pdf":
        return <PDFRenderer filePath={filePath} zoom={zoom} />;
      case "markdown":
        return <MarkdownRenderer filePath={filePath} zoom={zoom} />;
      case "unknown":
      default:
        return (
          <div className="flex flex-col items-center justify-center h-full text-destructive gap-2">
            <FileQuestion className="h-12 w-12" />
            <p className="text-sm">Unsupported file type</p>
            <p className="text-xs text-muted-foreground">
              Only PDF and Markdown files are supported
            </p>
          </div>
        );
    }
  };

  return (
    <div className="flex flex-col h-full">
      {isInteractive && (
        <FileViewerToolbar
          filePath={filePath}
          fileType={fileType}
          zoom={zoom}
          onOpenFile={handleOpenFile}
          onZoomIn={handleZoomIn}
          onZoomOut={handleZoomOut}
        />
      )}
      <div className="flex-1 overflow-hidden relative">
        {!isInteractive && filePath && (
          <div className="absolute inset-0 z-10 pointer-events-none" />
        )}
        {renderContent()}
      </div>
    </div>
  );
}
