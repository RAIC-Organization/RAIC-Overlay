"use client";

/**
 * File Viewer Toolbar Component
 *
 * Provides file path display, open file button, and zoom controls
 * for the file viewer window.
 *
 * @feature 016-file-viewer-window
 */

import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { FolderOpen, Minus, Plus, FileText, FileType } from "lucide-react";
import type { FileType as ViewerFileType } from "@/types/persistence";

export interface FileViewerToolbarProps {
  /** Current file path (empty if no file loaded) */
  filePath: string;
  /** Detected file type */
  fileType: ViewerFileType;
  /** Current zoom level (10-200) */
  zoom: number;
  /** Callback to open file picker dialog */
  onOpenFile: () => void;
  /** Callback when zoom changes */
  onZoomIn: () => void;
  onZoomOut: () => void;
}

export function FileViewerToolbar({
  filePath,
  fileType,
  zoom,
  onOpenFile,
  onZoomIn,
  onZoomOut,
}: FileViewerToolbarProps) {
  // Get just the filename from the path
  const fileName = filePath ? filePath.split(/[/\\]/).pop() || filePath : "";

  // Get file type icon
  const FileTypeIcon = fileType === "pdf" ? FileType : FileText;

  return (
    <div className="flex items-center gap-1 p-2 border-b border-border">
      {/* Open file button */}
      <Button
        variant="ghost"
        size="icon"
        onClick={onOpenFile}
        className="h-8 w-8"
        title="Open file"
      >
        <FolderOpen className="h-4 w-4" />
      </Button>

      {/* File info display */}
      <div className="flex-1 flex items-center gap-2 min-w-0 px-2">
        {filePath ? (
          <>
            <FileTypeIcon className="h-4 w-4 flex-shrink-0 text-muted-foreground" />
            <span
              className="text-sm truncate"
              title={filePath}
            >
              {fileName}
            </span>
          </>
        ) : (
          <span className="text-sm text-muted-foreground">No file selected</span>
        )}
      </div>

      <Separator orientation="vertical" className="mx-1 h-6" />

      {/* Zoom controls */}
      <Button
        variant="ghost"
        size="icon"
        onClick={onZoomOut}
        disabled={zoom <= 10 || !filePath}
        className="h-8 w-8"
        title="Zoom out"
      >
        <Minus className="h-4 w-4" />
      </Button>
      <span className="w-12 text-center text-sm tabular-nums">{zoom}%</span>
      <Button
        variant="ghost"
        size="icon"
        onClick={onZoomIn}
        disabled={zoom >= 200 || !filePath}
        className="h-8 w-8"
        title="Zoom in"
      >
        <Plus className="h-4 w-4" />
      </Button>
    </div>
  );
}
