"use client";

import { useEffect, useState, useCallback } from "react";
import { listen } from "@tauri-apps/api/event";
import { invoke } from "@tauri-apps/api/core";
import { getCurrentWindow, currentMonitor, LogicalPosition } from "@tauri-apps/api/window";
import { HeaderPanel } from "@/components/HeaderPanel";
import { ErrorModal } from "@/components/ErrorModal";
import { OverlayState, initialState } from "@/types/overlay";
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

export default function Home() {
  const [state, setState] = useState<OverlayState>(initialState);
  // Error modal state
  const [errorModal, setErrorModal] = useState<ErrorModalState>({
    visible: false,
    targetName: "",
    message: "",
    autoDismissMs: 5000,
  });

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

  // Render HeaderPanel with mode-based opacity
  // fullscreen mode = click-through (60% transparent)
  // windowed mode = interactive (0% transparent, fully visible)
  return (
    <>
      <HeaderPanel
        visible={state.visible}
        mode={state.mode}
        targetRect={state.targetRect}
      />
      {/* Error modal rendering */}
      <ErrorModal
        visible={errorModal.visible}
        targetName={errorModal.targetName}
        message={errorModal.message}
        autoDismissMs={errorModal.autoDismissMs}
        onDismiss={handleDismissError}
      />
    </>
  );
}
