import { useEffect, useState } from "react";
import { listen } from "@tauri-apps/api/event";
import { invoke } from "@tauri-apps/api/core";
import { getCurrentWindow, currentMonitor, LogicalPosition } from "@tauri-apps/api/window";
import { HeaderPanel } from "./components/HeaderPanel";
import { OverlayState, initialState } from "./types/overlay";
import { OverlayReadyPayload } from "./types/ipc";
import "./styles/overlay.css";

function App() {
  const [state, setState] = useState<OverlayState>(initialState);

  useEffect(() => {
    // Listen for toggle-overlay event from Rust (F12 press)
    const unlistenToggle = listen("toggle-overlay", () => {
      setState((prev) => {
        const newVisible = !prev.visible;
        // Sync visibility with backend
        invoke("set_visibility", { visible: newVisible }).catch((err: unknown) =>
          console.error("Failed to set visibility:", err)
        );
        return { ...prev, visible: newVisible };
      });
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
      unlistenReady.then((f) => f());
    };
  }, []);

  return <HeaderPanel visible={state.visible} />;
}

export default App;
