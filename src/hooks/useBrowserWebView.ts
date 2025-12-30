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
  /** Initial opacity (0.0-1.0, optional) */
  initialOpacity?: number;
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
    initialOpacity,
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
  const creatingRef = useRef(false); // Guard against duplicate creation

  // Create WebView on mount
  // NOTE: We do NOT destroy WebView in cleanup due to React Strict Mode double-mounting.
  // WebViews are cleaned up when:
  // 1. The browser window is closed (via closeWindow in WindowsContext)
  // 2. The app exits (destroy_all_browser_webviews)
  // The backend create_browser_webview is idempotent - returns existing WebView if already created.
  useEffect(() => {
    let mounted = true;

    const createWebView = async () => {
      // Wait for valid initialBounds before creating WebView
      // This prevents creating at (0,0) before DOM is positioned
      if (!initialBounds) {
        logDebug(`[useBrowserWebView] Waiting for valid bounds for ${windowId}`);
        return;
      }

      // Prevent duplicate creation attempts within the same mount
      if (creatingRef.current) {
        logDebug(`[useBrowserWebView] Creation already in progress for ${windowId}`);
        return;
      }

      // If we already have a webviewId, the WebView exists (idempotent backend)
      if (webviewIdRef.current) {
        logDebug(`[useBrowserWebView] WebView already exists: ${webviewIdRef.current}`);
        setWebviewId(webviewIdRef.current);
        setIsReady(true);
        setIsLoading(false);
        return;
      }

      creatingRef.current = true;

      try {
        logDebug(`[useBrowserWebView] Creating WebView for window ${windowId} at (${initialBounds.x}, ${initialBounds.y})`);

        // Use the valid initialBounds
        const bounds: BrowserWebViewBounds = initialBounds;

        // Convert zoom percentage to factor
        const zoomFactor = initialZoom / 100;

        const id = await invoke<string>("create_browser_webview", {
          windowId,
          initialUrl,
          bounds,
          zoom: zoomFactor,
          opacity: initialOpacity,
        });

        if (!mounted) {
          // Component unmounted during creation - DON'T destroy!
          // The WebView will be reused if component remounts (React Strict Mode)
          logDebug(`[useBrowserWebView] Component unmounted during creation, keeping WebView for reuse`);
          return;
        }

        webviewIdRef.current = id;
        setWebviewId(id);
        setIsReady(true);
        setIsLoading(false);

        logDebug(`[useBrowserWebView] WebView created: ${id}`);
      } catch (err) {
        creatingRef.current = false; // Reset on error so retry is possible
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

    // Cleanup on unmount - DON'T destroy WebView!
    // React Strict Mode causes mount->unmount->mount, and destroying here
    // would kill the WebView that the second mount needs.
    // WebViews are destroyed by WindowsContext when the window is closed.
    return () => {
      mounted = false;
      creatingRef.current = false;
      // Note: We intentionally do NOT destroy the WebView or clear webviewIdRef here
    };
    // initialBounds included so effect re-runs when bounds become valid
    // Backend is idempotent so re-running after WebView exists is safe
  }, [windowId, initialBounds]);

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

  const setIgnoreCursor = useCallback(
    async (ignore: boolean) => {
      if (!webviewId) return;

      try {
        await invoke("set_browser_webview_ignore_cursor", {
          webviewId,
          ignore,
        });
      } catch (err) {
        logError(`[useBrowserWebView] Set ignore cursor failed: ${err}`);
      }
    },
    [webviewId]
  );

  // Explicit destroy function for when the window is closed via UI
  // This is NOT called in useEffect cleanup (React Strict Mode compatibility)
  const destroy = useCallback(async () => {
    const id = webviewIdRef.current;
    if (id) {
      logDebug(`[useBrowserWebView] Explicitly destroying WebView: ${id}`);
      try {
        await invoke("destroy_browser_webview", { webviewId: id });
        webviewIdRef.current = null;
        setWebviewId(null);
        setIsReady(false);
      } catch (err) {
        logError(`[useBrowserWebView] Failed to destroy WebView: ${err}`);
      }
    }
  }, []);

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
    setIgnoreCursor,
    destroy,
  };
}
