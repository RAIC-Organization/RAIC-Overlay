/**
 * Browser WebView Types
 *
 * TypeScript type definitions for the WebView browser architecture.
 * Used by useBrowserWebView hook and BrowserContent component.
 *
 * @feature 040-webview-browser
 */

/**
 * Configuration for creating a browser WebView.
 */
export interface BrowserWebViewConfig {
  /** Unique webview label (e.g., "browser-webview-abc123") */
  webviewId: string;
  /** Associated React browser window ID */
  windowId: string;
  /** Initial URL to load */
  initialUrl: string;
  /** Initial zoom level (10-200 percentage) */
  initialZoom: number;
}

/**
 * Position and size for WebView synchronization.
 * All values in logical pixels (DPI-independent).
 */
export interface BrowserWebViewBounds {
  /** X position in logical pixels */
  x: number;
  /** Y position in logical pixels */
  y: number;
  /** Width in logical pixels */
  width: number;
  /** Height in logical pixels */
  height: number;
}

/**
 * Event payload when WebView URL changes.
 * Emitted on link clicks, redirects, and JS navigation.
 */
export interface BrowserUrlChangedEvent {
  /** Source webview label */
  webviewId: string;
  /** New URL after navigation */
  url: string;
  /** Whether back navigation is available */
  canGoBack: boolean;
  /** Whether forward navigation is available */
  canGoForward: boolean;
}

/**
 * Error types for WebView operations.
 */
export type BrowserErrorType =
  | "navigation_failed"
  | "ssl_error"
  | "timeout"
  | "webview_error";

/**
 * Event payload when WebView encounters an error.
 */
export interface BrowserErrorEvent {
  /** Source webview label */
  webviewId: string;
  /** Error category */
  errorType: BrowserErrorType;
  /** Human-readable error message */
  message: string;
}

/**
 * Event payload for loading state changes.
 */
export interface BrowserLoadingEvent {
  /** Source webview label */
  webviewId: string;
  /** Whether the WebView is currently loading */
  isLoading: boolean;
}

/**
 * State returned by useBrowserWebView hook.
 */
export interface UseBrowserWebViewState {
  /** Whether the WebView is currently loading a page */
  isLoading: boolean;
  /** Current URL displayed in the WebView */
  currentUrl: string;
  /** Whether back navigation is available */
  canGoBack: boolean;
  /** Whether forward navigation is available */
  canGoForward: boolean;
  /** Current error, if any */
  error: BrowserErrorEvent | null;
  /** Current zoom level (10-200 percentage) */
  zoom: number;
}

/**
 * Methods returned by useBrowserWebView hook.
 */
export interface UseBrowserWebViewActions {
  /** Navigate to a new URL */
  navigate: (url: string) => Promise<void>;
  /** Go back in history */
  goBack: () => Promise<void>;
  /** Go forward in history */
  goForward: () => Promise<void>;
  /** Refresh current page */
  refresh: () => Promise<void>;
  /** Set zoom level (10-200 percentage) */
  setZoom: (zoom: number) => Promise<void>;
  /** Synchronize WebView bounds with content area */
  syncBounds: (bounds: BrowserWebViewBounds) => Promise<void>;
  /** Set WebView opacity (0.0-1.0) */
  setOpacity: (opacity: number) => Promise<void>;
  /** Set WebView visibility (show/hide) */
  setVisibility: (visible: boolean) => Promise<void>;
  /**
   * Set whether WebView should ignore cursor/mouse events.
   * Used for non-interactive (fullscreen/passive) mode.
   */
  setIgnoreCursor: (ignore: boolean) => Promise<void>;
  /**
   * Bring WebView to the front of z-order.
   * Called when mouse enters the browser component area.
   */
  bringToFront: () => Promise<void>;
  /**
   * Send WebView to the back of z-order (behind other overlay windows).
   * Called when mouse leaves the browser component area.
   */
  sendToBack: () => Promise<void>;
  /**
   * Explicitly destroy the WebView.
   * Called when browser window is closed via UI, NOT during React cleanup.
   * This is separate from useEffect cleanup to support React Strict Mode.
   */
  destroy: () => Promise<void>;
}

/**
 * Complete return type of useBrowserWebView hook.
 */
export interface UseBrowserWebViewResult extends UseBrowserWebViewState, UseBrowserWebViewActions {
  /** Unique WebView ID, null if not yet created */
  webviewId: string | null;
  /** Whether the WebView is ready for use */
  isReady: boolean;
}
