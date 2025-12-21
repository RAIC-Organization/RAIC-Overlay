"use client";

/**
 * File Viewer Content Component
 *
 * Main container for file viewing functionality. Handles file selection,
 * type detection, and delegates rendering to appropriate renderer components.
 *
 * @feature 016-file-viewer-window
 */

import { useState, useCallback, useEffect } from "react";
import { open } from "@tauri-apps/plugin-dialog";
import { exists } from "@tauri-apps/plugin-fs";
import { FileViewerToolbar } from "./FileViewerToolbar";
import { PDFRenderer } from "./renderers/PDFRenderer";
import { MarkdownRenderer } from "./renderers/MarkdownRenderer";
import { ImageRenderer } from "./renderers/ImageRenderer";
import {
  clampFileViewerZoom,
  detectFileType,
  FILE_VIEWER_DEFAULTS,
  type FileType,
} from "@/types/persistence";
import { usePersistenceContext } from "@/contexts/PersistenceContext";
import { FileQuestion, FileX2 } from "lucide-react";

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
  const [fileError, setFileError] = useState<string | null>(null);

  // Check if persisted file exists on mount
  useEffect(() => {
    if (!initialFilePath) return;

    const checkFileExists = async () => {
      try {
        const fileExists = await exists(initialFilePath);
        if (!fileExists) {
          setFileError(`File not found: ${initialFilePath}`);
          // Clear the file path since file doesn't exist
          setFilePath("");
          setFileType("unknown");
        }
      } catch (err) {
        console.error("Failed to check file existence:", err);
        setFileError(`Cannot access file: ${initialFilePath}`);
        setFilePath("");
        setFileType("unknown");
      }
    };

    checkFileExists();
  }, [initialFilePath]);

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
            extensions: ["pdf", "md", "markdown", "png", "jpg", "jpeg", "gif", "webp", "bmp", "svg", "ico"],
          },
          {
            name: "PDF Documents",
            extensions: ["pdf"],
          },
          {
            name: "Markdown Files",
            extensions: ["md", "markdown"],
          },
          {
            name: "Image Files",
            extensions: ["png", "jpg", "jpeg", "gif", "webp", "bmp", "svg", "ico"],
          },
        ],
      });

      if (selected && typeof selected === "string") {
        const detectedType = detectFileType(selected);
        setFilePath(selected);
        setFileType(detectedType);
        setFileError(null); // Clear any previous error
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
    // Show error state if file was missing on restore
    if (fileError) {
      return (
        <div className="flex flex-col items-center justify-center h-full text-destructive gap-4">
          <FileX2 className="h-16 w-16 opacity-70" />
          <p className="text-sm font-medium">File Not Found</p>
          <p className="text-xs text-muted-foreground text-center px-4 max-w-md">
            {fileError}
          </p>
          {isInteractive && (
            <p className="text-xs text-muted-foreground">
              Click the folder icon to open a different file
            </p>
          )}
        </div>
      );
    }

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
      case "image":
        return <ImageRenderer filePath={filePath} zoom={zoom} />;
      case "unknown":
      default:
        return (
          <div className="flex flex-col items-center justify-center h-full text-destructive gap-2">
            <FileQuestion className="h-12 w-12" />
            <p className="text-sm">Unsupported file type</p>
            <p className="text-xs text-muted-foreground">
              Only PDF, Markdown, and Image files are supported
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
      {/* Padding allows window resize handles to be grabbed */}
      <div className="flex-1 overflow-hidden relative p-1">
        {!isInteractive && filePath && (
          <div className="absolute inset-1 z-10 pointer-events-none" />
        )}
        <div className="w-full h-full overflow-hidden">
          {renderContent()}
        </div>
      </div>
    </div>
  );
}
