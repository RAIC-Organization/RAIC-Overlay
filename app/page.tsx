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
import { useHydration } from "@/hooks/useHydration";
import { useWindows } from "@/contexts/WindowsContext";
import { NotesContent } from "@/components/windows/NotesContent";
import { DrawContent } from "@/components/windows/DrawContent";
import { BrowserContent } from "@/components/windows/BrowserContent";
import { OverlayState, initialState } from "@/types/overlay";
import type { WindowStructure, WindowContentFile, NotesContent as NotesContentType, DrawContent as DrawContentType, BrowserPersistedContent } from "@/types/persistence";
import { normalizeBrowserContent } from "@/types/persistence";
import type { WindowContentType } from "@/types/windows";
import { persistenceService } from "@/stores/persistenceService";
import {
  OverlayReadyPayload,
  OverlayStateResponse,
  ModeChangePayload,
  TargetWindowChangedPayload,
  ShowErrorModalPayload,
  AutoHideChangedPayload,
} from "@/types/ipc";

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
          componentProps: {
            isInteractive: mode === 'windowed',
            windowId,
            initialUrl: normalizedContent.url,
            initialZoom: normalizedContent.zoom,
            onContentChange: (url: string, zoom: number) => persistence?.onBrowserContentChange?.(windowId, url, zoom),
          },
        });
      }
      // Note: 'test' windows are not persisted (ephemeral)
    }
  }, [windows, windowContents, mode, openWindow, persistence]);

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
}: {
  state: OverlayState;
  errorModal: ErrorModalState;
  onDismissError: () => void;
  hydratedWindows: WindowStructure[];
  hydratedContents: Map<string, WindowContentFile>;
}) {
  return (
    <div className="flex flex-col justify-between h-full relative">
      {/* Window restorer - runs once on mount */}
      <WindowRestorer
        windows={hydratedWindows}
        windowContents={hydratedContents}
        mode={state.mode}
      />

      {/* MainMenu at top - only visible in interactive mode */}
      <MainMenu
        visible={state.visible}
        mode={state.mode}
        targetRect={state.targetRect}
      />

      {/* App icon in top-left corner */}
      <AppIcon visible={state.visible} mode={state.mode} />

      {/* Windows container - renders all windows */}
      <WindowsContainer mode={state.mode} />

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

  // Log hydration warnings/resets
  useEffect(() => {
    if (hydrationError) {
      console.warn('Hydration warning:', hydrationError);
    }
    if (wasReset) {
      console.warn('State was reset to defaults due to version mismatch');
    }
  }, [hydrationError, wasReset]);

  // Apply debug border if NEXT_PUBLIC_DEBUG_BORDER is enabled
  useEffect(() => {
    const debugBorder = process.env.NEXT_PUBLIC_DEBUG_BORDER === "true";
    const root = document.getElementById("root");
    if (root) {
      if (debugBorder) {
        root.classList.add("debug-border");
      } else {
        root.classList.remove("debug-border");
      }
    }
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

    // Delete the window content file if it's a persistable window
    if (contentType === 'notes' || contentType === 'draw' || contentType === 'browser') {
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
        />
      </PersistenceProvider>
    </WindowsProvider>
  );
}
