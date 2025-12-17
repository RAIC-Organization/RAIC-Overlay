import { useEffect, useState } from "react";
import { listen } from "@tauri-apps/api/event";
import { invoke } from "@tauri-apps/api/core";
import { getCurrentWindow, currentMonitor, LogicalPosition } from "@tauri-apps/api/window";
import { HeaderPanel } from "./components/HeaderPanel";
import { OverlayState, initialState } from "./types/overlay";
import { OverlayReadyPayload, OverlayStateResponse, ModeChangePayload } from "./types/ipc";

function App() {
  const [state, setState] = useState<OverlayState>(initialState);

  useEffect(() => {
    // F3: Toggle visibility (show/hide)
    const unlistenVisibility = listen("toggle-visibility", async () => {
      try {
        const result = await invoke<OverlayStateResponse>("toggle_visibility");
        setState((prev) => ({
          ...prev,
          visible: result.visible,
          mode: result.mode,
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

    // Position window at top center on mount
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
    };
  }, []);

  // Render HeaderPanel with mode-based opacity
  // fullscreen mode = click-through (60% transparent)
  // windowed mode = interactive (0% transparent, fully visible)
  return <HeaderPanel visible={state.visible} mode={state.mode} />;
}

export default App;
