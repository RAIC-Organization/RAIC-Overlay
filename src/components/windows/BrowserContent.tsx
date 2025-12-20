"use client";

import { useState } from "react";
import { BrowserToolbar } from "./BrowserToolbar";

// Browser constants
export const BROWSER_DEFAULTS = {
  DEFAULT_URL: "https://example.com",
  DEFAULT_ZOOM: 50,
  ZOOM_MIN: 10,
  ZOOM_MAX: 200,
  ZOOM_STEP: 10,
} as const;

export interface BrowserContentProps {
  isInteractive: boolean;
}

export function BrowserContent({ isInteractive }: BrowserContentProps) {
  const [url, setUrl] = useState(BROWSER_DEFAULTS.DEFAULT_URL);
  const [historyStack, setHistoryStack] = useState([
    BROWSER_DEFAULTS.DEFAULT_URL,
  ]);
  const [historyIndex, setHistoryIndex] = useState(0);
  const [zoom, setZoom] = useState(BROWSER_DEFAULTS.DEFAULT_ZOOM);
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
    setZoom((prev) =>
      Math.min(prev + BROWSER_DEFAULTS.ZOOM_STEP, BROWSER_DEFAULTS.ZOOM_MAX)
    );
  };

  // Zoom out
  const zoomOut = () => {
    setZoom((prev) =>
      Math.max(prev - BROWSER_DEFAULTS.ZOOM_STEP, BROWSER_DEFAULTS.ZOOM_MIN)
    );
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
      {/* Padding allows window resize handles (8px edges) to be grabbed */}
      <div className="flex-1 overflow-hidden relative p-2">
        {!isInteractive && <div className="absolute inset-2 z-10" />}
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
            onLoad={() => setIsLoading(false)}
          />
        </div>
      </div>
    </div>
  );
}
