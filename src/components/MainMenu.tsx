"use client";

import { motion, AnimatePresence, useReducedMotion } from "motion/react";
import { Button } from "@/components/ui/button";
import { ButtonGroup } from "@/components/ui/button-group";
import { OverlayMode } from "@/types/overlay";
import { WindowRect } from "@/types/ipc";
import { windowEvents } from "@/lib/windowEvents";
import { TestWindowContent } from "@/components/windows/TestWindowContent";
import { NotesContent } from "@/components/windows/NotesContent";
import { DrawContent } from "@/components/windows/DrawContent";

interface MainMenuProps {
  visible?: boolean;
  mode?: OverlayMode;
  targetRect?: WindowRect | null;
}

export function MainMenu({
  visible = true,
  mode = "windowed",
  targetRect = null,
}: MainMenuProps) {
  const prefersReducedMotion = useReducedMotion();
  const showHideDuration = prefersReducedMotion ? 0 : 0.3;

  // Only show in windowed (interactive) mode
  const shouldShow = visible && mode === "windowed";

  const handleOpenNotes = () => {
    windowEvents.emit("window:open", {
      component: NotesContent,
      title: "Notes",
      contentType: "notes",
      componentProps: { isInteractive: mode === "windowed" },
    });
  };

  const handleOpenDraw = () => {
    windowEvents.emit("window:open", {
      component: DrawContent,
      title: "Draw",
      contentType: "draw",
      componentProps: { isInteractive: mode === "windowed" },
    });
  };

  const handleTestWindows = () => {
    windowEvents.emit("window:open", {
      component: TestWindowContent,
      title: "Test Windows",
      contentType: "test",
    });
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
          className="bg-transparent flex justify-center gap-2 p-2"
        >
          {/* Windows: Notes & Test Windows */}
          <ButtonGroup>
            <Button variant="secondary" onClick={handleOpenNotes}>
              Notes
            </Button>
            <Button variant="secondary" onClick={handleOpenDraw}>
              Draw
            </Button>
            <Button variant="secondary" onClick={handleTestWindows}>
              Test Windows
            </Button>
          </ButtonGroup>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
