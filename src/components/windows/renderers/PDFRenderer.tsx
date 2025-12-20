"use client";

/**
 * PDF Renderer Component
 *
 * Renders PDF files using PDF.js with canvas-based rendering.
 * Supports multi-page navigation and zoom functionality.
 *
 * @feature 016-file-viewer-window
 */

import { useEffect, useRef, useState, useCallback } from "react";
import type { PDFDocumentProxy, RenderTask } from "pdfjs-dist";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, Loader2 } from "lucide-react";

export interface PDFRendererProps {
  /** File path to the PDF file */
  filePath: string;
  /** Zoom level as percentage (10-200) */
  zoom: number;
}

export function PDFRenderer({ filePath, zoom }: PDFRendererProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [pdfDoc, setPdfDoc] = useState<PDFDocumentProxy | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const renderTaskRef = useRef<RenderTask | null>(null);

  // Load PDF document (dynamically import pdfjs-dist to avoid SSR issues)
  useEffect(() => {
    if (!filePath) return;

    setIsLoading(true);
    setError(null);
    setCurrentPage(1);

    const loadPdf = async () => {
      try {
        // Dynamically import pdfjs-dist only on client side
        const pdfjs = await import("pdfjs-dist");
        const { readFile } = await import("@tauri-apps/plugin-fs");

        // Configure worker path
        pdfjs.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.mjs";

        // Use Tauri's fs plugin to read the file
        const fileData = await readFile(filePath);

        const loadingTask = pdfjs.getDocument({ data: fileData });
        const pdf = await loadingTask.promise;

        setPdfDoc(pdf);
        setTotalPages(pdf.numPages);
        setIsLoading(false);
      } catch (err) {
        console.error("Failed to load PDF:", err);
        setError(
          err instanceof Error ? err.message : "Failed to load PDF file"
        );
        setIsLoading(false);
      }
    };

    loadPdf();

    return () => {
      if (renderTaskRef.current) {
        renderTaskRef.current.cancel();
      }
    };
  }, [filePath]);

  // Render current page
  useEffect(() => {
    if (!pdfDoc || !canvasRef.current) return;

    const renderPage = async () => {
      // Cancel any ongoing render
      if (renderTaskRef.current) {
        renderTaskRef.current.cancel();
        renderTaskRef.current = null;
      }

      try {
        const page = await pdfDoc.getPage(currentPage);
        const canvas = canvasRef.current;
        if (!canvas) return;

        const context = canvas.getContext("2d");
        if (!context) return;

        // Calculate scale based on zoom percentage
        const scale = zoom / 100;
        const viewport = page.getViewport({ scale });

        // Set canvas dimensions
        canvas.width = viewport.width;
        canvas.height = viewport.height;

        // Render PDF page
        renderTaskRef.current = page.render({
          canvasContext: context,
          viewport: viewport,
          canvas: canvas,
        })
        await renderTaskRef.current.promise;
      } catch (err) {
        // Ignore cancel errors
        if (err instanceof Error && err.name === "RenderingCancelledException") {
          return;
        }
        console.error("Failed to render page:", err);
      }
    };

    renderPage();
  }, [pdfDoc, currentPage, zoom]);

  // Page navigation
  const goToPrevPage = useCallback(() => {
    setCurrentPage((prev) => Math.max(1, prev - 1));
  }, []);

  const goToNextPage = useCallback(() => {
    setCurrentPage((prev) => Math.min(totalPages, prev + 1));
  }, [totalPages]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft" || e.key === "PageUp") {
        goToPrevPage();
      } else if (e.key === "ArrowRight" || e.key === "PageDown") {
        goToNextPage();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [goToPrevPage, goToNextPage]);

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
        <p className="text-sm">Failed to load PDF</p>
        <p className="text-xs text-muted-foreground mt-1">{error}</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Page navigation */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 p-2 border-b border-border">
          <Button
            variant="ghost"
            size="icon"
            onClick={goToPrevPage}
            disabled={currentPage <= 1}
            className="h-8 w-8"
            title="Previous page"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="text-sm tabular-nums">
            {currentPage} / {totalPages}
          </span>
          <Button
            variant="ghost"
            size="icon"
            onClick={goToNextPage}
            disabled={currentPage >= totalPages}
            className="h-8 w-8"
            title="Next page"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      )}

      {/* PDF canvas */}
      <div
        ref={containerRef}
        className="flex-1 overflow-auto flex items-start justify-center p-4 bg-muted/30"
      >
        <canvas ref={canvasRef} className="shadow-md" />
      </div>
    </div>
  );
}
