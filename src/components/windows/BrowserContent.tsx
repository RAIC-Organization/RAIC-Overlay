"use client";

/**
 * Browser Content Component
 *
 * Renders browser content using native Tauri WebView windows instead of iframe.
 * This bypasses X-Frame-Options restrictions and allows loading any website.
 *
 * @feature 014-browser-component
 * @feature 015-browser-persistence
 * @feature 040-webview-browser
 */

import { useState, useCallback, useRef, useEffect } from "react";
import { BrowserToolbar } from "./BrowserToolbar";
import { clampBrowserZoom } from "@/types/persistence";
import { usePersistenceContext } from "@/contexts/PersistenceContext";
import { useBrowserWebView } from "@/hooks/useBrowserWebView";
import type { BrowserWebViewBounds } from "@/types/browserWebView";

// Browser constants
export const BROWSER_DEFAULTS = {
  DEFAULT_URL: "https://example.com",
  DEFAULT_ZOOM: 100,
  ZOOM_MIN: 10,
  ZOOM_MAX: 200,
  ZOOM_STEP: 10,
} as const;

/**
 * Props for BrowserContent component.
 * Extended with persistence support in 015-browser-persistence.
 */
export interface BrowserContentProps {
  /** Whether the window is in interactive mode */
  isInteractive: boolean;
  /** Window ID for persistence (required for WebView) */
  windowId: string;
  /** Initial URL from persisted state */
  initialUrl?: string;
  /** Initial zoom level from persisted state (10-200) */
  initialZoom?: number;
  /** Callback when browser content changes (for persistence) - passes both url and zoom */
  onContentChange?: (url: string, zoom: number) => void;
}

export function BrowserContent({
  isInteractive,
  windowId,
  initialUrl,
  initialZoom,
  onContentChange,
}: BrowserContentProps) {
  // Get persistence context for fallback when no callback is provided
  const persistence = usePersistenceContext();

  // Initialize state with persisted values or defaults
  // Clamp initialZoom to valid range (handles invalid persisted data)
  const effectiveInitialUrl = initialUrl || BROWSER_DEFAULTS.DEFAULT_URL;
  const effectiveInitialZoom = clampBrowserZoom(
    initialZoom ?? BROWSER_DEFAULTS.DEFAULT_ZOOM
  );

  // T016: Ref for content area placeholder div
  const contentRef = useRef<HTMLDivElement>(null);
  const [initialBounds, setInitialBounds] = useState<BrowserWebViewBounds | undefined>(undefined);
  const [boundsReady, setBoundsReady] = useState(false);

  // Unified content change handler - uses prop callback or falls back to persistence context
  const handleContentChange = useCallback((newUrl: string, newZoom: number) => {
    if (onContentChange) {
      onContentChange(newUrl, newZoom);
    } else if (windowId && persistence?.onBrowserContentChange) {
      persistence.onBrowserContentChange(windowId, newUrl, newZoom);
    }
  }, [windowId, onContentChange, persistence]);

  // Calculate initial bounds from content area on mount
  useEffect(() => {
    if (contentRef.current && !boundsReady) {
      const rect = contentRef.current.getBoundingClientRect();
      if (rect.width > 0 && rect.height > 0) {
        setInitialBounds({
          x: rect.left,
          y: rect.top,
          width: rect.width,
          height: rect.height,
        });
        setBoundsReady(true);
      }
    }
  }, [boundsReady]);

  // T014, T015: Use WebView hook for browser functionality
  const webview = useBrowserWebView({
    windowId,
    initialUrl: effectiveInitialUrl,
    initialZoom: effectiveInitialZoom,
    initialBounds,
    onUrlChange: (url) => {
      handleContentChange(url, webview.zoom);
    },
    onZoomChange: (zoom) => {
      handleContentChange(webview.currentUrl, zoom);
    },
  });

  // T013: No iframe rendering - WebView is a separate native window
  // The content area is just a placeholder that we position the WebView over

  // T033-T035: Sync bounds when content area changes (resize, move, scroll)
  useEffect(() => {
    if (!webview.isReady || !contentRef.current) return;

    // T035: Debounce timer for rapid updates
    let debounceTimer: ReturnType<typeof setTimeout> | null = null;
    const DEBOUNCE_MS = 16; // ~60fps, ensures final position is accurate

    const syncBoundsNow = () => {
      if (!contentRef.current) return;
      const rect = contentRef.current.getBoundingClientRect();
      if (rect.width > 0 && rect.height > 0) {
        webview.syncBounds({
          x: rect.left,
          y: rect.top,
          width: rect.width,
          height: rect.height,
        });
      }
    };

    const debouncedSyncBounds = () => {
      if (debounceTimer) clearTimeout(debounceTimer);
      debounceTimer = setTimeout(syncBoundsNow, DEBOUNCE_MS);
    };

    // T032: Initial sync when WebView is ready
    syncBoundsNow();

    // T033: ResizeObserver for content area size changes
    const resizeObserver = new ResizeObserver(debouncedSyncBounds);
    resizeObserver.observe(contentRef.current);

    // T034: Window resize and scroll listeners (handles window move indirectly)
    window.addEventListener("resize", debouncedSyncBounds);
    window.addEventListener("scroll", debouncedSyncBounds, true);

    return () => {
      if (debounceTimer) clearTimeout(debounceTimer);
      resizeObserver.disconnect();
      window.removeEventListener("resize", debouncedSyncBounds);
      window.removeEventListener("scroll", debouncedSyncBounds, true);
    };
  }, [webview.isReady, webview.syncBounds]);

  // Zoom handlers that use the WebView hook
  const handleZoomIn = useCallback(() => {
    const newZoom = Math.min(
      webview.zoom + BROWSER_DEFAULTS.ZOOM_STEP,
      BROWSER_DEFAULTS.ZOOM_MAX
    );
    webview.setZoom(newZoom);
  }, [webview]);

  const handleZoomOut = useCallback(() => {
    const newZoom = Math.max(
      webview.zoom - BROWSER_DEFAULTS.ZOOM_STEP,
      BROWSER_DEFAULTS.ZOOM_MIN
    );
    webview.setZoom(newZoom);
  }, [webview]);

  return (
    <div className="flex flex-col h-full">
      {isInteractive && (
        <BrowserToolbar
          url={webview.currentUrl}
          canGoBack={webview.canGoBack}
          canGoForward={webview.canGoForward}
          zoom={webview.zoom}
          isLoading={webview.isLoading}
          onNavigate={webview.navigate}
          onBack={webview.goBack}
          onForward={webview.goForward}
          onRefresh={webview.refresh}
          onZoomIn={handleZoomIn}
          onZoomOut={handleZoomOut}
        />
      )}
      {/* T016: Content area placeholder - WebView is positioned over this area */}
      {/* Padding allows window resize handles to be grabbed */}
      <div className="flex-1 overflow-hidden relative p-1">
        {!isInteractive && <div className="absolute inset-1 z-10" />}
        <div
          ref={contentRef}
          className="w-full h-full bg-background/50 flex items-center justify-center text-muted-foreground"
        >
          {!webview.isReady && !webview.error && (
            <span className="text-sm">Loading WebView...</span>
          )}
          {webview.error && (
            <div className="text-center p-4">
              <span className="text-destructive text-sm block">{webview.error.message}</span>
            </div>
          )}
          {webview.isReady && !webview.error && (
            <span className="text-sm opacity-50">
              Content rendered in WebView window
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
