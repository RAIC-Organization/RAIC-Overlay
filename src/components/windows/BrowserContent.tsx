"use client";

/**
 * Browser Content Component
 *
 * Renders an embedded browser (iframe) with navigation controls,
 * zoom functionality, and persistence support.
 *
 * @feature 014-browser-component
 * @feature 015-browser-persistence
 */

import { useState } from "react";
import { BrowserToolbar } from "./BrowserToolbar";
import { clampBrowserZoom } from "@/types/persistence";

// Browser constants
export const BROWSER_DEFAULTS = {
  DEFAULT_URL: "https://example.com",
  DEFAULT_ZOOM: 50,
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
  /** Window ID for persistence (optional) */
  windowId?: string;
  /** Initial URL from persisted state */
  initialUrl?: string;
  /** Initial zoom level from persisted state (10-200) */
  initialZoom?: number;
  /** Callback when URL changes (for persistence) */
  onUrlChange?: (url: string) => void;
  /** Callback when zoom changes (for persistence) */
  onZoomChange?: (zoom: number) => void;
}

export function BrowserContent({
  isInteractive,
  windowId,
  initialUrl,
  initialZoom,
  onUrlChange,
  onZoomChange,
}: BrowserContentProps) {
  // Initialize state with persisted values or defaults
  // Clamp initialZoom to valid range (handles invalid persisted data)
  const effectiveInitialUrl = initialUrl || BROWSER_DEFAULTS.DEFAULT_URL;
  const effectiveInitialZoom = clampBrowserZoom(
    initialZoom ?? BROWSER_DEFAULTS.DEFAULT_ZOOM
  );

  const [url, setUrl] = useState<string>(effectiveInitialUrl);
  const [historyStack, setHistoryStack] = useState<string[]>([effectiveInitialUrl]);
  const [historyIndex, setHistoryIndex] = useState(0);
  const [zoom, setZoom] = useState<number>(effectiveInitialZoom);
  const [isLoading, setIsLoading] = useState(false);
  const [iframeKey, setIframeKey] = useState(0);

  // Normalize URL by adding https:// if no protocol
  const normalizeUrl = (input: string): string => {
    const trimmed = input.trim();
    if (!trimmed) return "";
    if (/^https?:\/\//i.test(trimmed)) {
      return trimmed;
    }
    return `https://${trimmed}`;
  };

  // Navigate to a new URL
  const navigateTo = (newUrl: string) => {
    const normalized = normalizeUrl(newUrl);
    if (!normalized) return;

    // Truncate forward history and add new URL
    const newStack = [...historyStack.slice(0, historyIndex + 1), normalized];
    setHistoryStack(newStack);
    setHistoryIndex(newStack.length - 1);
    setUrl(normalized);
    setIsLoading(true);
  };

  // Go back in history
  const goBack = () => {
    if (historyIndex > 0) {
      const newIndex = historyIndex - 1;
      setHistoryIndex(newIndex);
      setUrl(historyStack[newIndex]);
      setIsLoading(true);
    }
  };

  // Go forward in history
  const goForward = () => {
    if (historyIndex < historyStack.length - 1) {
      const newIndex = historyIndex + 1;
      setHistoryIndex(newIndex);
      setUrl(historyStack[newIndex]);
      setIsLoading(true);
    }
  };

  // Refresh current page
  const refresh = () => {
    setIsLoading(true);
    setIframeKey((prev) => prev + 1);
  };

  // Zoom in
  const zoomIn = () => {
    const newZoom = Math.min(
      zoom + BROWSER_DEFAULTS.ZOOM_STEP,
      BROWSER_DEFAULTS.ZOOM_MAX
    );
    setZoom(newZoom);
    onZoomChange?.(newZoom);
  };

  // Zoom out
  const zoomOut = () => {
    const newZoom = Math.max(
      zoom - BROWSER_DEFAULTS.ZOOM_STEP,
      BROWSER_DEFAULTS.ZOOM_MIN
    );
    setZoom(newZoom);
    onZoomChange?.(newZoom);
  };

  // Handle iframe load - persist URL after page loads
  const handleIframeLoad = () => {
    setIsLoading(false);
    // Persist the URL after the page loads (handles redirects)
    onUrlChange?.(url);
  };

  // Computed navigation states
  const canGoBack = historyIndex > 0;
  const canGoForward = historyIndex < historyStack.length - 1;

  // Calculate zoom transform values
  const scaleValue = zoom / 100;
  const inverseScale = 100 / zoom;

  return (
    <div className="flex flex-col h-full">
      {isInteractive && (
        <BrowserToolbar
          url={url}
          canGoBack={canGoBack}
          canGoForward={canGoForward}
          zoom={zoom}
          isLoading={isLoading}
          onNavigate={navigateTo}
          onBack={goBack}
          onForward={goForward}
          onRefresh={refresh}
          onZoomIn={zoomIn}
          onZoomOut={zoomOut}
        />
      )}
      {/* Padding allows window resize handles to be grabbed */}
      <div className="flex-1 overflow-hidden relative p-1">
        {!isInteractive && <div className="absolute inset-1 z-10" />}
        <div className="w-full h-full overflow-hidden">
          <iframe
            key={iframeKey}
            src={url}
            title="Browser Content"
            className="border-0"
            style={{
              width: `${inverseScale * 100}%`,
              height: `${inverseScale * 100}%`,
              transform: `scale(${scaleValue})`,
              transformOrigin: "0 0",
            }}
            onLoad={handleIframeLoad}
          />
        </div>
      </div>
    </div>
  );
}
