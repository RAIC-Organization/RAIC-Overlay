/**
 * Browser WebView Hook Tests
 *
 * Tests for the useBrowserWebView hook lifecycle and functionality.
 *
 * @feature 040-webview-browser
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, waitFor, act } from "@testing-library/react";
import { useBrowserWebView } from "./useBrowserWebView";

// Mock Tauri APIs
vi.mock("@tauri-apps/api/core", () => ({
  invoke: vi.fn(),
}));

vi.mock("@tauri-apps/api/event", () => ({
  listen: vi.fn(() => Promise.resolve(() => {})),
}));

// Mock logger
vi.mock("@/lib/logger", () => ({
  debug: vi.fn(),
  error: vi.fn(),
  warn: vi.fn(),
  info: vi.fn(),
}));

import { invoke } from "@tauri-apps/api/core";
import { listen } from "@tauri-apps/api/event";

describe("useBrowserWebView", () => {
  const mockInvoke = invoke as ReturnType<typeof vi.fn>;
  const mockListen = listen as ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.clearAllMocks();

    // Default mock implementations
    mockInvoke.mockImplementation((cmd: string) => {
      if (cmd === "create_browser_webview") {
        return Promise.resolve("browser-webview-test-123");
      }
      if (cmd === "destroy_browser_webview") {
        return Promise.resolve();
      }
      return Promise.resolve();
    });

    mockListen.mockImplementation(() => Promise.resolve(() => {}));
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe("T009a: Lifecycle Tests", () => {
    it("should create WebView on mount", async () => {
      const { result } = renderHook(() =>
        useBrowserWebView({
          windowId: "test-window",
          initialUrl: "https://example.com",
          initialZoom: 100,
        })
      );

      await waitFor(() => {
        expect(result.current.isReady).toBe(true);
      });

      expect(mockInvoke).toHaveBeenCalledWith("create_browser_webview", {
        windowId: "test-window",
        initialUrl: "https://example.com",
        bounds: { x: 0, y: 0, width: 400, height: 300 },
        zoom: 1.0,
      });
    });

    it("should destroy WebView on unmount", async () => {
      const { result, unmount } = renderHook(() =>
        useBrowserWebView({
          windowId: "test-window",
          initialUrl: "https://example.com",
          initialZoom: 100,
        })
      );

      await waitFor(() => {
        expect(result.current.isReady).toBe(true);
      });

      unmount();

      await waitFor(() => {
        expect(mockInvoke).toHaveBeenCalledWith("destroy_browser_webview", {
          webviewId: "browser-webview-test-123",
        });
      });
    });

    it("should set up event listeners after creation", async () => {
      const { result } = renderHook(() =>
        useBrowserWebView({
          windowId: "test-window",
          initialUrl: "https://example.com",
          initialZoom: 100,
        })
      );

      await waitFor(() => {
        expect(result.current.isReady).toBe(true);
      });

      // Wait for listeners to be set up
      await waitFor(() => {
        expect(mockListen).toHaveBeenCalledWith(
          "browser-url-changed",
          expect.any(Function)
        );
        expect(mockListen).toHaveBeenCalledWith(
          "browser-error",
          expect.any(Function)
        );
        expect(mockListen).toHaveBeenCalledWith(
          "browser-loading",
          expect.any(Function)
        );
      });
    });

    it("should handle creation failure", async () => {
      mockInvoke.mockImplementation((cmd: string) => {
        if (cmd === "create_browser_webview") {
          return Promise.reject(new Error("Creation failed"));
        }
        return Promise.resolve();
      });

      const { result } = renderHook(() =>
        useBrowserWebView({
          windowId: "test-window",
          initialUrl: "https://example.com",
          initialZoom: 100,
        })
      );

      await waitFor(() => {
        expect(result.current.error).not.toBeNull();
      });

      expect(result.current.isReady).toBe(false);
      expect(result.current.error?.errorType).toBe("webview_error");
    });

    it("should use custom initial bounds", async () => {
      const customBounds = { x: 100, y: 100, width: 800, height: 600 };

      renderHook(() =>
        useBrowserWebView({
          windowId: "test-window",
          initialUrl: "https://example.com",
          initialZoom: 100,
          initialBounds: customBounds,
        })
      );

      await waitFor(() => {
        expect(mockInvoke).toHaveBeenCalledWith("create_browser_webview", {
          windowId: "test-window",
          initialUrl: "https://example.com",
          bounds: customBounds,
          zoom: 1.0,
        });
      });
    });

    it("should convert zoom percentage to factor", async () => {
      renderHook(() =>
        useBrowserWebView({
          windowId: "test-window",
          initialUrl: "https://example.com",
          initialZoom: 150, // 150%
        })
      );

      await waitFor(() => {
        expect(mockInvoke).toHaveBeenCalledWith(
          "create_browser_webview",
          expect.objectContaining({
            zoom: 1.5, // Factor
          })
        );
      });
    });
  });

  describe("T027b: Navigation Tests", () => {
    it("should call navigate command", async () => {
      const { result } = renderHook(() =>
        useBrowserWebView({
          windowId: "test-window",
          initialUrl: "https://example.com",
          initialZoom: 100,
        })
      );

      await waitFor(() => {
        expect(result.current.isReady).toBe(true);
      });

      await act(async () => {
        await result.current.navigate("https://google.com");
      });

      expect(mockInvoke).toHaveBeenCalledWith("browser_navigate", {
        webviewId: "browser-webview-test-123",
        url: "https://google.com",
      });
    });

    it("should call goBack command", async () => {
      const { result } = renderHook(() =>
        useBrowserWebView({
          windowId: "test-window",
          initialUrl: "https://example.com",
          initialZoom: 100,
        })
      );

      await waitFor(() => {
        expect(result.current.isReady).toBe(true);
      });

      await act(async () => {
        await result.current.goBack();
      });

      expect(mockInvoke).toHaveBeenCalledWith("browser_go_back", {
        webviewId: "browser-webview-test-123",
      });
    });

    it("should call goForward command", async () => {
      const { result } = renderHook(() =>
        useBrowserWebView({
          windowId: "test-window",
          initialUrl: "https://example.com",
          initialZoom: 100,
        })
      );

      await waitFor(() => {
        expect(result.current.isReady).toBe(true);
      });

      await act(async () => {
        await result.current.goForward();
      });

      expect(mockInvoke).toHaveBeenCalledWith("browser_go_forward", {
        webviewId: "browser-webview-test-123",
      });
    });

    it("should call refresh command", async () => {
      const { result } = renderHook(() =>
        useBrowserWebView({
          windowId: "test-window",
          initialUrl: "https://example.com",
          initialZoom: 100,
        })
      );

      await waitFor(() => {
        expect(result.current.isReady).toBe(true);
      });

      await act(async () => {
        await result.current.refresh();
      });

      expect(mockInvoke).toHaveBeenCalledWith("browser_refresh", {
        webviewId: "browser-webview-test-123",
      });
    });

    it("should not navigate when WebView not ready", async () => {
      mockInvoke.mockImplementation((cmd: string) => {
        if (cmd === "create_browser_webview") {
          // Never resolves
          return new Promise(() => {});
        }
        return Promise.resolve();
      });

      const { result } = renderHook(() =>
        useBrowserWebView({
          windowId: "test-window",
          initialUrl: "https://example.com",
          initialZoom: 100,
        })
      );

      // Try to navigate before ready
      await act(async () => {
        await result.current.navigate("https://google.com");
      });

      // browser_navigate should not have been called
      expect(mockInvoke).not.toHaveBeenCalledWith(
        "browser_navigate",
        expect.any(Object)
      );
    });
  });

  describe("Zoom Tests", () => {
    it("should call setZoom command with factor", async () => {
      const { result } = renderHook(() =>
        useBrowserWebView({
          windowId: "test-window",
          initialUrl: "https://example.com",
          initialZoom: 100,
        })
      );

      await waitFor(() => {
        expect(result.current.isReady).toBe(true);
      });

      await act(async () => {
        await result.current.setZoom(150);
      });

      expect(mockInvoke).toHaveBeenCalledWith("set_browser_zoom", {
        webviewId: "browser-webview-test-123",
        zoom: 1.5,
      });
    });

    it("should clamp zoom to valid range", async () => {
      const { result } = renderHook(() =>
        useBrowserWebView({
          windowId: "test-window",
          initialUrl: "https://example.com",
          initialZoom: 100,
        })
      );

      await waitFor(() => {
        expect(result.current.isReady).toBe(true);
      });

      // Try zoom above max
      await act(async () => {
        await result.current.setZoom(300);
      });

      expect(mockInvoke).toHaveBeenCalledWith("set_browser_zoom", {
        webviewId: "browser-webview-test-123",
        zoom: 2.0, // Clamped to 200%
      });
    });

    it("should call onZoomChange callback", async () => {
      const onZoomChange = vi.fn();

      const { result } = renderHook(() =>
        useBrowserWebView({
          windowId: "test-window",
          initialUrl: "https://example.com",
          initialZoom: 100,
          onZoomChange,
        })
      );

      await waitFor(() => {
        expect(result.current.isReady).toBe(true);
      });

      await act(async () => {
        await result.current.setZoom(125);
      });

      expect(onZoomChange).toHaveBeenCalledWith(125);
    });
  });

  describe("Bounds Sync Tests", () => {
    it("should call syncBounds command", async () => {
      const { result } = renderHook(() =>
        useBrowserWebView({
          windowId: "test-window",
          initialUrl: "https://example.com",
          initialZoom: 100,
        })
      );

      await waitFor(() => {
        expect(result.current.isReady).toBe(true);
      });

      const bounds = { x: 100, y: 100, width: 800, height: 600 };

      await act(async () => {
        await result.current.syncBounds(bounds);
      });

      expect(mockInvoke).toHaveBeenCalledWith("sync_browser_webview_bounds", {
        webviewId: "browser-webview-test-123",
        bounds,
      });
    });
  });
});
