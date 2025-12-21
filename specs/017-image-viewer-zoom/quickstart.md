# Quickstart: Image Viewer with Zoom Support

**Feature**: 017-image-viewer-zoom
**Date**: 2025-12-20

## Prerequisites

- Node.js and npm installed
- Existing RAICOverlay project with feature 016-file-viewer-window completed
- Tauri development environment configured

## Quick Setup

### 1. Install Dependencies

```bash
npm install react-zoom-pan-pinch
```

### 2. Create ImageRenderer Component

Create `src/components/windows/renderers/ImageRenderer.tsx`:

```typescript
"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { TransformWrapper, TransformComponent } from "react-zoom-pan-pinch";
import { Loader2 } from "lucide-react";

export interface ImageRendererProps {
  filePath: string;
  zoom: number;
  onZoomChange?: (zoom: number) => void;
}

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

export function ImageRenderer({ filePath, zoom, onZoomChange }: ImageRendererProps) {
  const [imageDataUrl, setImageDataUrl] = useState<string>("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load image file
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

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-destructive">
        <p className="text-sm">Failed to load image</p>
        <p className="text-xs text-muted-foreground mt-1">{error}</p>
      </div>
    );
  }

  return (
    <div className="w-full h-full overflow-hidden bg-muted/30">
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
```

### 3. Update FileType in persistence.ts

In `src/types/persistence.ts`, update the FileType:

```typescript
export type FileType = 'pdf' | 'markdown' | 'image' | 'unknown';
```

And update `detectFileType`:

```typescript
export function detectFileType(filePath: string): FileType {
  const ext = filePath.split('.').pop()?.toLowerCase();
  switch (ext) {
    case 'pdf':
      return 'pdf';
    case 'md':
    case 'markdown':
      return 'markdown';
    case 'png':
    case 'jpg':
    case 'jpeg':
    case 'gif':
    case 'webp':
    case 'bmp':
    case 'svg':
    case 'ico':
      return 'image';
    default:
      return 'unknown';
  }
}
```

### 4. Update FileViewerContent.tsx

Add the ImageRenderer import and case:

```typescript
import { ImageRenderer } from "./renderers/ImageRenderer";

// In renderContent() switch statement:
case "image":
  return <ImageRenderer filePath={filePath} zoom={zoom} />;
```

Update file dialog filters:

```typescript
filters: [
  {
    name: "Supported Files",
    extensions: ["pdf", "md", "markdown", "png", "jpg", "jpeg", "gif", "webp", "bmp", "svg", "ico"],
  },
  // ... existing filters ...
  {
    name: "Image Files",
    extensions: ["png", "jpg", "jpeg", "gif", "webp", "bmp", "svg", "ico"],
  },
],
```

## Verification

1. Run `npm run dev` to start the development server
2. Run `cargo tauri dev` to start the Tauri app
3. Open the File Viewer window
4. Click "Open File" and select an image (PNG, JPG, etc.)
5. Verify:
   - Image displays centered and fit-to-container
   - Mouse wheel zooms in/out
   - Click and drag pans the image
   - Double-click resets the view
   - Toolbar zoom buttons work

## Files Modified

| File | Change |
|------|--------|
| `package.json` | Add `react-zoom-pan-pinch` dependency |
| `src/types/persistence.ts` | Extend FileType, update detectFileType |
| `src/components/windows/FileViewerContent.tsx` | Add ImageRenderer case, update filters |
| `src/components/windows/renderers/ImageRenderer.tsx` | NEW file |
