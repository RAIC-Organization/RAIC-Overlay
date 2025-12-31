"use client";

/**
 * Main Menu Component
 *
 * Displays the main menu bar with window creation buttons and settings.
 *
 * @feature 006-main-menu-component
 * @feature 026-sc-hud-theme
 * @feature 027-widget-container
 */

import { motion, AnimatePresence, useReducedMotion } from "motion/react";
import { Button } from "@/components/ui/button";
import { ButtonGroup } from "@/components/ui/button-group";
import { OverlayMode } from "@/types/overlay";
import { WindowRect } from "@/types/ipc";
import { windowEvents } from "@/lib/windowEvents";
import { widgetEvents } from "@/lib/widgetEvents";
import { NotesContent } from "@/components/windows/NotesContent";
import { DrawContent } from "@/components/windows/DrawContent";
import { BrowserContent } from "@/components/windows/BrowserContent";
import { FileViewerContent } from "@/components/windows/FileViewerContent";
import { ScanlineToggle } from "@/components/windows/ScanlineToggle";
import { useLogger } from "@/hooks/useLogger";

interface MainMenuProps {
  visible?: boolean;
  mode?: OverlayMode;
  targetRect?: WindowRect | null;
  /** Scanlines toggle state - feature 026-sc-hud-theme */
  scanlinesEnabled?: boolean;
  /** Callback when scanlines toggle changes - feature 026-sc-hud-theme */
  onScanlinesChange?: (enabled: boolean) => void;
}

export function MainMenu({
  visible = true,
  mode = "windowed",
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  targetRect = null,
  scanlinesEnabled = false,
  onScanlinesChange,
}: MainMenuProps) {
  const prefersReducedMotion = useReducedMotion();
  const showHideDuration = prefersReducedMotion ? 0 : 0.3;
  const log = useLogger("MainMenu");

  // Only show in windowed (interactive) mode
  const shouldShow = visible && mode === "windowed";

  const handleOpenNotes = () => {
    log.info("Opening Notes window");
    windowEvents.emit("window:open", {
      component: NotesContent,
      title: "Notes",
      contentType: "notes",
      componentProps: { isInteractive: mode === "windowed" },
    });
  };

  const handleOpenDraw = () => {
    log.info("Opening Draw window");
    windowEvents.emit("window:open", {
      component: DrawContent,
      title: "Draw",
      contentType: "draw",
      componentProps: { isInteractive: mode === "windowed" },
    });
  };

  const handleOpenBrowser = () => {
    windowEvents.emit("window:open", {
      component: BrowserContent,
      title: "Browser",
      contentType: "browser",
      componentProps: { isInteractive: mode === "windowed" },
    });
  };

  const handleOpenFileViewer = () => {
    windowEvents.emit("window:open", {
      component: FileViewerContent,
      title: "File Viewer",
      contentType: "fileviewer",
      componentProps: { isInteractive: mode === "windowed" },
    });
  };

  // T012: Open clock widget (replaces clock window)
  // @feature 027-widget-container
  const handleOpenClockWidget = () => {
    log.info("Opening Clock widget");
    widgetEvents.emit("widget:open", {
      type: "clock",
    });
  };

  // Handle scanlines toggle - feature 026-sc-hud-theme
  const handleScanlinesChange = (enabled: boolean) => {
    if (onScanlinesChange) {
      onScanlinesChange(enabled);
    }
  };

  return (
    <AnimatePresence>
      {shouldShow && (
        <motion.div
          key="main-menu"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: showHideDuration, ease: "easeOut" }}
          className="bg-transparent flex justify-center items-center gap-2 p-2"
        >
          {/* Apps: Window-based components */}
          <ButtonGroup>
            <Button variant="secondary" onClick={handleOpenNotes}>
              Notes
            </Button>
            <Button variant="secondary" onClick={handleOpenDraw}>
              Draw
            </Button>
            <Button variant="secondary" onClick={handleOpenBrowser}>
              Browser
            </Button>
            <Button variant="secondary" onClick={handleOpenFileViewer}>
              File Viewer
            </Button>
          </ButtonGroup>

          {/* Widgets: Lightweight overlay components */}
          <div className="flex items-center gap-1 ml-2 border-l border-border pl-2">
            <ButtonGroup>
              <Button variant="secondary" onClick={handleOpenClockWidget}>
                Clock
              </Button>
            </ButtonGroup>
          </div>

          {/* Settings: Scanlines toggle - feature 026-sc-hud-theme */}
          <div className="flex items-center gap-1 ml-2 border-l border-border pl-2">
            <ScanlineToggle
              value={scanlinesEnabled}
              onChange={handleScanlinesChange}
              onCommit={() => {/* Persistence handled by parent */}}
            />
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
