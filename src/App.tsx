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
    // T024: Update toggle-overlay handler to call toggle_mode command
    const unlistenToggle = listen("toggle-overlay", async () => {
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

    // T025: Add mode-changed event listener
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
      unlistenToggle.then((f) => f());
      unlistenModeChanged.then((f) => f());
      unlistenReady.then((f) => f());
    };
  }, []);

  // T029: Conditionally render fullscreen overlay container when mode is fullscreen
  // T031: Position HeaderPanel absolutely within fullscreen container
  if (state.mode === 'fullscreen') {
    return (
      <div className="fullscreen-container">
        {/* Transparent overlay background */}
        <div className="fullscreen-overlay" />
        {/* Header panel positioned at top-center */}
        <div className="fullscreen-header-wrapper">
          <HeaderPanel />
        </div>
      </div>
    );
  }

  // Windowed mode: render HeaderPanel directly
  return <HeaderPanel visible={state.visible} />;
}

export default App;
