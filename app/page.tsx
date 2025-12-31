"use client";

/**
 * Main Page Component
 *
 * Entry point for the overlay application. Handles:
 * - State hydration from persistence on startup
 * - Tauri event listeners for visibility/mode toggling
 * - Window restoration from persisted state
 * - Error modal display
 *
 * @feature 003-f3-fullscreen-overlay
 * @feature 010-state-persistence-system
 * @feature 018-window-background-toggle
 * @feature 026-sc-hud-theme
 * @feature 027-widget-container
 * @feature 031-webview-hotkey-capture
 */

import { useEffect, useState, useCallback, useRef } from "react";
import { listen } from "@tauri-apps/api/event";
import { invoke } from "@tauri-apps/api/core";
import { getCurrentWindow, currentMonitor, LogicalPosition } from "@tauri-apps/api/window";
import { AppIcon } from "@/components/AppIcon";
import { ErrorModal } from "@/components/ErrorModal";
import { MainMenu } from "@/components/MainMenu";
import { LoadingScreen } from "@/components/LoadingScreen";
import { WindowsProvider } from "@/contexts/WindowsContext";
import { PersistenceProvider, usePersistenceContext } from "@/contexts/PersistenceContext";
import { WindowsContainer } from "@/components/windows/WindowsContainer";
import { WidgetsProvider } from "@/contexts/WidgetsContext";
import { WidgetsContainer } from "@/components/widgets/WidgetsContainer";
import { useHydration } from "@/hooks/useHydration";
import { useHotkeyCapture } from "@/hooks/useHotkeyCapture";
import { useWindows } from "@/contexts/WindowsContext";
import { NotesContent } from "@/components/windows/NotesContent";
import { DrawContent } from "@/components/windows/DrawContent";
import { BrowserContent } from "@/components/windows/BrowserContent";
import { FileViewerContent } from "@/components/windows/FileViewerContent";
import { OverlayState, initialState } from "@/types/overlay";
import type { WindowStructure, WindowContentFile, NotesContent as NotesContentType, DrawContent as DrawContentType, BrowserPersistedContent, FileViewerPersistedContent, WidgetStructure } from "@/types/persistence";
import { normalizeBrowserContent, normalizeFileViewerContent } from "@/types/persistence";
import type { WindowContentType } from "@/types/windows";
import { useWidgets } from "@/contexts/WidgetsContext";
import { persistenceService } from "@/stores/persistenceService";
import {
  OverlayReadyPayload,
  OverlayStateResponse,
  ModeChangePayload,
  TargetWindowChangedPayload,
  ShowErrorModalPayload,
  AutoHideChangedPayload,
} from "@/types/ipc";
import { forwardConsole, info } from "@/lib/logger";

// Initialize console forwarding on module load
let consoleForwarded = false;
if (typeof window !== 'undefined' && !consoleForwarded) {
  forwardConsole();
  consoleForwarded = true;
  info('Console forwarding initialized');
}

// Error modal state
interface ErrorModalState {
  visible: boolean;
  targetName: string;
  message: string;
  autoDismissMs: number;
}

/**
 * Component that restores windows from hydrated state.
 * Must be inside WindowsProvider and PersistenceProvider to access context.
 */
function WindowRestorer({
  windows,
  windowContents,
  mode,
}: {
  windows: WindowStructure[];
  windowContents: Map<string, WindowContentFile>;
  mode: string;
}) {
  const { openWindow } = useWindows();
  const persistence = usePersistenceContext();
  const restoredRef = useRef(false);

  useEffect(() => {
    // Only restore once
    if (restoredRef.current || windows.length === 0) return;
    restoredRef.current = true;

    // Restore each window
    for (const win of windows) {
      const content = windowContents.get(win.id);
      const windowType = win.type;
      const windowId = win.id;

      // Get the component and initial content based on type
      if (windowType === 'notes') {
        const notesContent = content?.content as NotesContentType | undefined;
        openWindow({
          component: NotesContent,
          title: 'Notes',
          contentType: 'notes',
          windowId,
          initialX: win.position.x,
          initialY: win.position.y,
          initialWidth: win.size.width,
          initialHeight: win.size.height,
          initialZIndex: win.zIndex,
          initialOpacity: win.opacity,
          initialBackgroundTransparent: win.backgroundTransparent ?? false,
          componentProps: {
            isInteractive: mode === 'windowed',
            initialContent: notesContent,
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            onContentChange: (c: any) => persistence?.onNotesContentChange(windowId, c),
          },
        });
      } else if (windowType === 'draw') {
        const drawContent = content?.content as DrawContentType | undefined;
        openWindow({
          component: DrawContent,
          title: 'Draw',
          contentType: 'draw',
          windowId,
          initialX: win.position.x,
          initialY: win.position.y,
          initialWidth: win.size.width,
          initialHeight: win.size.height,
          initialZIndex: win.zIndex,
          initialOpacity: win.opacity,
          initialBackgroundTransparent: win.backgroundTransparent ?? false,
          componentProps: {
            isInteractive: mode === 'windowed',
            initialElements: drawContent?.elements,
            initialAppState: drawContent?.appState,
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            onContentChange: (elements: any[], appState: any) =>
              persistence?.onDrawContentChange(windowId, elements, appState),
          },
        });
      } else if (windowType === 'browser') {
        const browserContent = content?.content as BrowserPersistedContent | undefined;
        const normalizedContent = normalizeBrowserContent(browserContent);
        openWindow({
          component: BrowserContent,
          title: 'Browser',
          contentType: 'browser',
          windowId,
          initialX: win.position.x,
          initialY: win.position.y,
          initialWidth: win.size.width,
          initialHeight: win.size.height,
          initialZIndex: win.zIndex,
          initialOpacity: win.opacity,
          initialBackgroundTransparent: win.backgroundTransparent ?? false,
          componentProps: {
            isInteractive: mode === 'windowed',
            windowId,
            initialUrl: normalizedContent.url,
            initialZoom: normalizedContent.zoom,
            onContentChange: (url: string, zoom: number) => persistence?.onBrowserContentChange?.(windowId, url, zoom),
          },
        });
      } else if (windowType === 'fileviewer') {
        const fileViewerContent = content?.content as FileViewerPersistedContent | undefined;
        const normalizedContent = normalizeFileViewerContent(fileViewerContent);
        openWindow({
          component: FileViewerContent,
          title: 'File Viewer',
          contentType: 'fileviewer',
          windowId,
          initialX: win.position.x,
          initialY: win.position.y,
          initialWidth: win.size.width,
          initialHeight: win.size.height,
          initialZIndex: win.zIndex,
          initialOpacity: win.opacity,
          initialBackgroundTransparent: win.backgroundTransparent ?? false,
          componentProps: {
            isInteractive: mode === 'windowed',
            windowId,
            initialFilePath: normalizedContent.filePath,
            initialFileType: normalizedContent.fileType,
            initialZoom: normalizedContent.zoom,
            onContentChange: (filePath: string, fileType: string, zoom: number) =>
              persistence?.onFileViewerContentChange?.(windowId, filePath, fileType as 'pdf' | 'markdown' | 'unknown', zoom),
          },
        });
      }
      // Note: 'test' windows are not persisted (ephemeral)
      // Note: 'clock' windows removed in 027-widget-container (migrated to widgets)
    }
  }, [windows, windowContents, mode, openWindow, persistence]);

  return null;
}

/**
 * Component that restores widgets from hydrated state.
 * Must be inside WidgetsProvider to access context.
 * @feature 027-widget-container
 */
function WidgetRestorer({
  widgets,
}: {
  widgets: WidgetStructure[];
}) {
  const { openWidget } = useWidgets();
  const restoredRef = useRef(false);

  useEffect(() => {
    // Only restore once
    if (restoredRef.current || widgets.length === 0) return;
    restoredRef.current = true;

    console.log(`Restoring ${widgets.length} widgets from persisted state`);

    // Restore each widget
    for (const widget of widgets) {
      openWidget({
        type: widget.type,
        widgetId: widget.id,
        initialX: widget.position.x,
        initialY: widget.position.y,
        initialWidth: widget.size.width,
        initialHeight: widget.size.height,
        initialOpacity: widget.opacity,
      });
    }
  }, [widgets, openWidget]);

  return null;
}

/**
 * Main content component that wraps the overlay UI.
 */
function OverlayContent({
  state,
  errorModal,
  onDismissError,
  hydratedWindows,
  hydratedContents,
  hydratedWidgets,
  scanlinesEnabled,
  onScanlinesChange,
}: {
  state: OverlayState;
  errorModal: ErrorModalState;
  onDismissError: () => void;
  hydratedWindows: WindowStructure[];
  hydratedContents: Map<string, WindowContentFile>;
  hydratedWidgets: WidgetStructure[];
  scanlinesEnabled: boolean;
  onScanlinesChange: (enabled: boolean) => void;
}) {
  return (
    <div className="flex flex-col justify-between h-full relative">
      {/* Window restorer - runs once on mount */}
      <WindowRestorer
        windows={hydratedWindows}
        windowContents={hydratedContents}
        mode={state.mode}
      />

      {/* Widget restorer - runs once on mount @feature 027-widget-container */}
      <WidgetRestorer widgets={hydratedWidgets} />

      {/* MainMenu at top - only visible in interactive mode */}
      <MainMenu
        visible={state.visible}
        mode={state.mode}
        targetRect={state.targetRect}
        scanlinesEnabled={scanlinesEnabled}
        onScanlinesChange={onScanlinesChange}
      />

      {/* App icon in top-left corner */}
      <AppIcon visible={state.visible} mode={state.mode} />

      {/* Windows container - renders all windows */}
      <WindowsContainer mode={state.mode} />

      {/* Widgets container - renders all widgets */}
      <WidgetsContainer mode={state.mode} />

      {/* Error modal rendering */}
      <ErrorModal
        visible={errorModal.visible}
        targetName={errorModal.targetName}
        message={errorModal.message}
        autoDismissMs={errorModal.autoDismissMs}
        onDismiss={onDismissError}
      />
    </div>
  );
}

export default function Home() {
  // Hydration hook - loads persisted state on startup
  const {
    isHydrated,
    state: hydratedState,
    windowContents: hydratedContents,
    widgets: hydratedWidgets,
    error: hydrationError,
    wasReset,
  } = useHydration();

  const [state, setState] = useState<OverlayState>(initialState);
  // Error modal state
  const [errorModal, setErrorModal] = useState<ErrorModalState>({
    visible: false,
    targetName: "",
    message: "",
    autoDismissMs: 5000,
  });
  // Scanlines toggle state - feature 026-sc-hud-theme
  const [scanlinesEnabled, setScanlinesEnabled] = useState(false);

  // Always capture F3/F5 hotkeys to prevent webview refresh
  // Even in click-through mode, if webview retains focus, we must block F5 refresh
  // The backend handles mode/visibility logic appropriately
  // Note: Low-level hook doesn't receive keys when webview is focused, so this is required
  // @feature 031-webview-hotkey-capture
  useHotkeyCapture(true);

  // Log hydration warnings/resets
  useEffect(() => {
    if (hydrationError) {
      console.warn('Hydration warning:', hydrationError);
    }
    if (wasReset) {
      console.warn('State was reset to defaults due to version mismatch');
    }
  }, [hydrationError, wasReset]);

  // Initialize scanlines from hydrated state - feature 026-sc-hud-theme
  useEffect(() => {
    if (isHydrated && hydratedState.global.scanlinesEnabled !== undefined) {
      setScanlinesEnabled(hydratedState.global.scanlinesEnabled);
    }
  }, [isHydrated, hydratedState.global.scanlinesEnabled]);

  // Apply scanlines class to root element - feature 026-sc-hud-theme
  useEffect(() => {
    const root = document.getElementById("root");
    if (root) {
      if (scanlinesEnabled) {
        root.classList.add("scanlines-enabled");
      } else {
        root.classList.remove("scanlines-enabled");
      }
    }
  }, [scanlinesEnabled]);

  // T025-T026: Apply debug border from runtime settings
  useEffect(() => {
    const initDebugBorder = async () => {
      try {
        // Query backend for runtime settings
        const settings = await invoke<{ debugBorder: boolean }>("get_settings_command");
        const root = document.getElementById("root");
        if (root) {
          if (settings.debugBorder) {
            root.classList.add("debug-border");
          } else {
            root.classList.remove("debug-border");
          }
        }
      } catch (error) {
        console.error("Failed to load settings:", error);
        // Fall back to build-time env var if command fails
        const debugBorder = process.env.NEXT_PUBLIC_DEBUG_BORDER === "true";
        const root = document.getElementById("root");
        if (root) {
          if (debugBorder) {
            root.classList.add("debug-border");
          } else {
            root.classList.remove("debug-border");
          }
        }
      }
    };

    initDebugBorder();
  }, []);

  useEffect(() => {
    // F3: Toggle visibility (show/hide)
    const unlistenVisibility = listen("toggle-visibility", async () => {
      try {
        const result = await invoke<OverlayStateResponse>("toggle_visibility");
        setState((prev) => ({
          ...prev,
          visible: result.visible,
          mode: result.mode,
          targetBound: result.targetBound,
          targetName: result.targetName,
          targetRect: result.targetRect,
          autoHidden: result.autoHidden,
        }));
      } catch (err: unknown) {
        console.error("Failed to toggle visibility:", err);
      }
    });

    // F5: Toggle mode (click-through/interactive)
    const unlistenMode = listen("toggle-mode", async () => {
      try {
        const result = await invoke<OverlayStateResponse>("toggle_mode");
        setState((prev) => ({
          ...prev,
          visible: result.visible,
          mode: result.mode,
        }));
      } catch (err: unknown) {
        console.error("Failed to toggle mode:", err);
      }
    });

    // Mode-changed event listener
    const unlistenModeChanged = listen<ModeChangePayload>("mode-changed", (event) => {
      console.log(
        `Mode changed from ${event.payload.previousMode} to ${event.payload.currentMode}`
      );
      setState((prev) => ({
        ...prev,
        mode: event.payload.currentMode,
      }));
    });

    // Listen for overlay-ready event
    const unlistenReady = listen<OverlayReadyPayload>("overlay-ready", (event) => {
      console.log("Overlay ready at position:", event.payload.position);
      setState((prev) => ({ ...prev, initialized: true }));
    });

    // Target window changed event listener
    const unlistenTargetChanged = listen<TargetWindowChangedPayload>(
      "target-window-changed",
      (event) => {
        console.log("Target window changed:", event.payload);
        setState((prev) => ({
          ...prev,
          targetBound: event.payload.bound,
          targetRect: event.payload.rect,
        }));
      }
    );

    // Show error modal event listener
    const unlistenShowError = listen<ShowErrorModalPayload>(
      "show-error-modal",
      (event) => {
        console.log("Show error modal:", event.payload);
        setErrorModal({
          visible: true,
          targetName: event.payload.targetName,
          message: event.payload.message,
          autoDismissMs: event.payload.autoDismissMs,
        });
      }
    );

    // Dismiss error modal event listener
    const unlistenDismissError = listen("dismiss-error-modal", () => {
      setErrorModal((prev) => ({ ...prev, visible: false }));
    });

    // Auto-hide changed event listener
    const unlistenAutoHide = listen<AutoHideChangedPayload>(
      "auto-hide-changed",
      (event) => {
        console.log("Auto-hide changed:", event.payload);
        setState((prev) => ({
          ...prev,
          autoHidden: event.payload.autoHidden,
          visible: !event.payload.autoHidden && prev.visible,
        }));
      }
    );

    // Position window at top center on mount (fallback for non-target mode)
    const positionWindow = async () => {
      try {
        const window = getCurrentWindow();
        const monitor = await currentMonitor();
        if (monitor) {
          const x = Math.floor((monitor.size.width / monitor.scaleFactor - 400) / 2);
          await window.setPosition(new LogicalPosition(x, 0));
        }
      } catch (err: unknown) {
        console.error("Failed to position window:", err);
      }
    };

    positionWindow();

    return () => {
      unlistenVisibility.then((f) => f());
      unlistenMode.then((f) => f());
      unlistenModeChanged.then((f) => f());
      unlistenReady.then((f) => f());
      unlistenTargetChanged.then((f) => f());
      unlistenShowError.then((f) => f());
      unlistenDismissError.then((f) => f());
      unlistenAutoHide.then((f) => f());
    };
  }, []);

  // Handler to dismiss error modal
  const handleDismissError = useCallback(async () => {
    setErrorModal((prev) => ({ ...prev, visible: false }));
    // Hide window if overlay is not actually visible (error modal was shown temporarily)
    // We check state inside setState to get current value without dependency
    setState((currentState) => {
      if (!currentState.visible) {
        // Hide window asynchronously
        getCurrentWindow().hide().catch((err) => {
          console.error("Failed to hide window after error dismiss:", err);
        });
      }
      return currentState; // Don't change state
    });
  }, []);


  // Handle window close for persistence cleanup
  const handleWindowClose = useCallback(async (windowId: string, contentType?: WindowContentType) => {
    console.log(`Window closed: ${windowId} (type: ${contentType})`);

    // For browser windows, destroy the WebView on the backend
    if (contentType === 'browser') {
      const webviewId = `browser-webview-${windowId}`;
      console.log(`Destroying WebView for closed browser window: ${webviewId}`);
      try {
        await invoke('destroy_browser_webview', { webviewId });
      } catch (err) {
        // Ignore errors - WebView might already be destroyed or never created
        console.error(`Failed to destroy WebView: ${err}`);
      }
    }

    // Delete the window content file if it's a persistable window
    if (contentType === 'notes' || contentType === 'draw' || contentType === 'browser' || contentType === 'fileviewer') {
      const deleteResult = await persistenceService.deleteWindowContent(windowId);
      if (!deleteResult.success) {
        console.error('Failed to delete window content:', deleteResult.error);
      }
    }

    // Note: State save is handled by PersistenceContext which detects window removal
  }, []);

  // Show loading screen until hydration completes
  if (!isHydrated) {
    return <LoadingScreen />;
  }

  // Render MainMenu at top, HeaderPanel at bottom when interactive mode
  // fullscreen mode = click-through (60% transparent, MainMenu hidden)
  // windowed mode = interactive (0% transparent, MainMenu visible)
  return (
    <WindowsProvider
      initialPersistedState={hydratedState}
      initialWindowContents={hydratedContents}
      onWindowClose={handleWindowClose}
    >
      <WidgetsProvider>
        <PersistenceProvider
          overlayMode={state.mode as 'windowed' | 'fullscreen'}
          overlayVisible={state.visible}
        >
          <OverlayContent
            state={state}
            errorModal={errorModal}
            onDismissError={handleDismissError}
            hydratedWindows={hydratedState.windows}
            hydratedContents={hydratedContents}
            hydratedWidgets={hydratedWidgets}
            scanlinesEnabled={scanlinesEnabled}
            onScanlinesChange={setScanlinesEnabled}
          />
        </PersistenceProvider>
      </WidgetsProvider>
    </WindowsProvider>
  );
}
