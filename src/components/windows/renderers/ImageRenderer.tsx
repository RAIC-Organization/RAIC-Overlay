"use client";

/**
 * Image Renderer Component
 *
 * Renders image files (PNG, JPG, GIF, WebP, BMP, SVG, ICO) using the HTML img tag
 * with react-zoom-pan-pinch for zoom/pan functionality.
 *
 * @feature 017-image-viewer-zoom
 */

import { useEffect, useState } from "react";
import { TransformWrapper, TransformComponent } from "react-zoom-pan-pinch";
import { Loader2 } from "lucide-react";

/**
 * Props for the ImageRenderer component.
 */
export interface ImageRendererProps {
  /** Absolute path to the image file */
  filePath: string;
  /** Zoom level as percentage (10-200) */
  zoom: number;
  /** Callback when internal zoom changes (for toolbar sync) */
  onZoomChange?: (zoom: number) => void;
  /** Whether the window background should be transparent (in non-interactive mode) */
  backgroundTransparent?: boolean;
  /** Whether the window is in interactive mode */
  isInteractive?: boolean;
}

/**
 * MIME type mapping for supported image extensions.
 */
const IMAGE_MIME_TYPES: Record<string, string> = {
  'png': 'image/png',
  'jpg': 'image/jpeg',
  'jpeg': 'image/jpeg',
  'gif': 'image/gif',
  'webp': 'image/webp',
  'bmp': 'image/bmp',
  'svg': 'image/svg+xml',
  'ico': 'image/x-icon',
};

/**
 * ImageRenderer component for displaying image files with zoom and pan support.
 *
 * Features:
 * - Loads images via Tauri fs plugin
 * - Converts to base64 data URL for display
 * - Zoom with mouse wheel (10%-200% range)
 * - Pan by click and drag
 * - Double-click to reset view
 * - Centered initial display with fit-to-container
 *
 * @feature 017-image-viewer-zoom
 */
export function ImageRenderer({ filePath, zoom, onZoomChange, backgroundTransparent, isInteractive }: ImageRendererProps) {
  // Calculate effective transparency: transparent only in non-interactive mode with setting enabled
  const isEffectivelyTransparent = backgroundTransparent === true && !isInteractive;

  const [imageDataUrl, setImageDataUrl] = useState<string>("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load image file via Tauri fs plugin
  useEffect(() => {
    if (!filePath) return;

    setIsLoading(true);
    setError(null);

    const loadImage = async () => {
      try {
        const { readFile } = await import("@tauri-apps/plugin-fs");
        const fileData = await readFile(filePath);

        // Get MIME type from extension
        const ext = filePath.split('.').pop()?.toLowerCase() || '';
        const mimeType = IMAGE_MIME_TYPES[ext] || 'image/png';

        // Convert to base64 data URL
        const base64 = btoa(
          Array.from(fileData).map(byte => String.fromCharCode(byte)).join('')
        );
        const dataUrl = `data:${mimeType};base64,${base64}`;

        setImageDataUrl(dataUrl);
        setIsLoading(false);
      } catch (err) {
        console.error("Failed to load image:", err);
        setError(err instanceof Error ? err.message : "Failed to load image");
        setIsLoading(false);
      }
    };

    loadImage();
  }, [filePath]);

  // Loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-destructive">
        <p className="text-sm">Failed to load image</p>
        <p className="text-xs text-muted-foreground mt-1">{error}</p>
      </div>
    );
  }

  return (
    <div className={`w-full h-full overflow-hidden ${isEffectivelyTransparent ? '' : 'bg-muted/30'}`}>
      <TransformWrapper
        initialScale={zoom / 100}
        minScale={0.1}
        maxScale={2}
        centerOnInit={true}
        doubleClick={{ mode: "reset" }}
        onTransformed={(_, state) => {
          const newZoom = Math.round(state.scale * 100);
          onZoomChange?.(newZoom);
        }}
      >
        <TransformComponent
          wrapperStyle={{ width: "100%", height: "100%" }}
          contentStyle={{ display: "flex", alignItems: "center", justifyContent: "center" }}
        >
          <img
            src={imageDataUrl}
            alt=""
            style={{ maxWidth: "100%", maxHeight: "100%", objectFit: "contain" }}
          />
        </TransformComponent>
      </TransformWrapper>
    </div>
  );
}
