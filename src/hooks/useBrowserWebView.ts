/**
 * Browser WebView Hook
 *
 * Manages the lifecycle of a browser WebView window, including creation,
 * destruction, navigation, and synchronization with the React browser window.
 *
 * @feature 040-webview-browser
 */

import { useState, useEffect, useCallback, useRef } from "react";
import { invoke } from "@tauri-apps/api/core";
import { listen, UnlistenFn } from "@tauri-apps/api/event";
import type {
  BrowserWebViewBounds,
  BrowserUrlChangedEvent,
  BrowserErrorEvent,
  BrowserLoadingEvent,
  UseBrowserWebViewResult,
} from "@/types/browserWebView";
import { debug as logDebug, error as logError, warn as logWarn } from "@/lib/logger";

/**
 * Hook configuration options.
 */
export interface UseBrowserWebViewOptions {
  /** Window ID for the browser window */
  windowId: string;
  /** Initial URL to load */
  initialUrl: string;
  /** Initial zoom level (10-200 percentage) */
  initialZoom: number;
  /** Initial bounds for the WebView */
  initialBounds?: BrowserWebViewBounds;
  /** Callback when URL changes */
  onUrlChange?: (url: string) => void;
  /** Callback when zoom changes */
  onZoomChange?: (zoom: number) => void;
}

/**
 * Hook for managing a browser WebView.
 *
 * Creates a native WebView window on mount and destroys it on unmount.
 * Provides methods for navigation, zoom, and bounds synchronization.
 */
export function useBrowserWebView(options: UseBrowserWebViewOptions): UseBrowserWebViewResult {
  const {
    windowId,
    initialUrl,
    initialZoom,
    initialBounds,
    onUrlChange,
    onZoomChange,
  } = options;

  // State
  const [webviewId, setWebviewId] = useState<string | null>(null);
  const [isReady, setIsReady] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [currentUrl, setCurrentUrl] = useState(initialUrl);
  const [canGoBack, setCanGoBack] = useState(false);
  const [canGoForward, setCanGoForward] = useState(false);
  const [error, setError] = useState<BrowserErrorEvent | null>(null);
  const [zoom, setZoom] = useState(initialZoom);

  // Refs for cleanup
  const unlistenUrlRef = useRef<UnlistenFn | null>(null);
  const unlistenErrorRef = useRef<UnlistenFn | null>(null);
  const unlistenLoadingRef = useRef<UnlistenFn | null>(null);
  const webviewIdRef = useRef<string | null>(null);

  // Create WebView on mount
  useEffect(() => {
    let mounted = true;

    const createWebView = async () => {
      try {
        logDebug(`[useBrowserWebView] Creating WebView for window ${windowId}`);

        // Default bounds if not provided
        const bounds: BrowserWebViewBounds = initialBounds || {
          x: 0,
          y: 0,
          width: 400,
          height: 300,
        };

        // Convert zoom percentage to factor
        const zoomFactor = initialZoom / 100;

        const id = await invoke<string>("create_browser_webview", {
          windowId,
          initialUrl,
          bounds,
          zoom: zoomFactor,
        });

        if (!mounted) {
          // Component unmounted during creation, destroy the WebView
          await invoke("destroy_browser_webview", { webviewId: id });
          return;
        }

        webviewIdRef.current = id;
        setWebviewId(id);
        setIsReady(true);
        setIsLoading(false);

        logDebug(`[useBrowserWebView] WebView created: ${id}`);
      } catch (err) {
        if (mounted) {
          logError(`[useBrowserWebView] Failed to create WebView: ${err}`);
          setError({
            webviewId: "",
            errorType: "webview_error",
            message: `Failed to create WebView: ${err}`,
          });
          setIsLoading(false);
        }
      }
    };

    createWebView();

    // Cleanup on unmount
    return () => {
      mounted = false;

      const id = webviewIdRef.current;
      if (id) {
        logDebug(`[useBrowserWebView] Destroying WebView: ${id}`);
        invoke("destroy_browser_webview", { webviewId: id }).catch((err) => {
          logError(`[useBrowserWebView] Failed to destroy WebView: ${err}`);
        });
      }
    };
  }, [windowId, initialUrl, initialZoom, initialBounds]);

  // Set up event listeners
  useEffect(() => {
    if (!webviewId) return;

    // Listen for URL changes
    const setupListeners = async () => {
      try {
        unlistenUrlRef.current = await listen<BrowserUrlChangedEvent>(
          "browser-url-changed",
          (event) => {
            if (event.payload.webviewId === webviewId) {
              logDebug(`[useBrowserWebView] URL changed: ${event.payload.url}`);
              setCurrentUrl(event.payload.url);
              setCanGoBack(event.payload.canGoBack);
              setCanGoForward(event.payload.canGoForward);
              setError(null);
              onUrlChange?.(event.payload.url);
            }
          }
        );

        unlistenErrorRef.current = await listen<BrowserErrorEvent>(
          "browser-error",
          (event) => {
            if (event.payload.webviewId === webviewId) {
              logWarn(`[useBrowserWebView] Error: ${event.payload.message}`);
              setError(event.payload);
              setIsLoading(false);
            }
          }
        );

        unlistenLoadingRef.current = await listen<BrowserLoadingEvent>(
          "browser-loading",
          (event) => {
            if (event.payload.webviewId === webviewId) {
              setIsLoading(event.payload.isLoading);
              if (event.payload.isLoading) {
                setError(null);
              }
            }
          }
        );
      } catch (err) {
        logError(`[useBrowserWebView] Failed to set up listeners: ${err}`);
      }
    };

    setupListeners();

    // Cleanup listeners
    return () => {
      unlistenUrlRef.current?.();
      unlistenErrorRef.current?.();
      unlistenLoadingRef.current?.();
    };
  }, [webviewId, onUrlChange]);

  // Navigation methods
  const navigate = useCallback(
    async (url: string) => {
      if (!webviewId) {
        logWarn("[useBrowserWebView] Cannot navigate: WebView not ready");
        return;
      }

      try {
        setIsLoading(true);
        setError(null);
        await invoke("browser_navigate", { webviewId, url });
        setCurrentUrl(url);
      } catch (err) {
        logError(`[useBrowserWebView] Navigate failed: ${err}`);
        setError({
          webviewId,
          errorType: "navigation_failed",
          message: `Navigation failed: ${err}`,
        });
        setIsLoading(false);
      }
    },
    [webviewId]
  );

  const goBack = useCallback(async () => {
    if (!webviewId) return;

    try {
      setIsLoading(true);
      await invoke("browser_go_back", { webviewId });
    } catch (err) {
      logError(`[useBrowserWebView] Go back failed: ${err}`);
      setIsLoading(false);
    }
  }, [webviewId]);

  const goForward = useCallback(async () => {
    if (!webviewId) return;

    try {
      setIsLoading(true);
      await invoke("browser_go_forward", { webviewId });
    } catch (err) {
      logError(`[useBrowserWebView] Go forward failed: ${err}`);
      setIsLoading(false);
    }
  }, [webviewId]);

  const refresh = useCallback(async () => {
    if (!webviewId) return;

    try {
      setIsLoading(true);
      setError(null);
      await invoke("browser_refresh", { webviewId });
    } catch (err) {
      logError(`[useBrowserWebView] Refresh failed: ${err}`);
      setIsLoading(false);
    }
  }, [webviewId]);

  const setZoomLevel = useCallback(
    async (newZoom: number) => {
      if (!webviewId) return;

      try {
        // Clamp zoom to valid range
        const clampedZoom = Math.max(10, Math.min(200, newZoom));
        const zoomFactor = clampedZoom / 100;

        await invoke("set_browser_zoom", { webviewId, zoom: zoomFactor });
        setZoom(clampedZoom);
        onZoomChange?.(clampedZoom);
      } catch (err) {
        logError(`[useBrowserWebView] Set zoom failed: ${err}`);
      }
    },
    [webviewId, onZoomChange]
  );

  const syncBounds = useCallback(
    async (bounds: BrowserWebViewBounds) => {
      if (!webviewId) return;

      try {
        await invoke("sync_browser_webview_bounds", { webviewId, bounds });
      } catch (err) {
        logError(`[useBrowserWebView] Sync bounds failed: ${err}`);
      }
    },
    [webviewId]
  );

  const setOpacity = useCallback(
    async (opacity: number) => {
      if (!webviewId) return;

      try {
        // Clamp opacity to valid range
        const clampedOpacity = Math.max(0, Math.min(1, opacity));
        await invoke("set_browser_webview_opacity", {
          webviewId,
          opacity: clampedOpacity,
        });
      } catch (err) {
        logError(`[useBrowserWebView] Set opacity failed: ${err}`);
      }
    },
    [webviewId]
  );

  const setVisibility = useCallback(
    async (visible: boolean) => {
      if (!webviewId) return;

      try {
        await invoke("set_browser_webview_visibility", {
          webviewId,
          visible,
        });
      } catch (err) {
        logError(`[useBrowserWebView] Set visibility failed: ${err}`);
      }
    },
    [webviewId]
  );

  return {
    webviewId,
    isReady,
    isLoading,
    currentUrl,
    canGoBack,
    canGoForward,
    error,
    zoom,
    navigate,
    goBack,
    goForward,
    refresh,
    setZoom: setZoomLevel,
    syncBounds,
    setOpacity,
    setVisibility,
  };
}
