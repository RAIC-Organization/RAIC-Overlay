"use client";

import { motion, AnimatePresence, useReducedMotion } from "motion/react";
import { Button } from "@/components/ui/button";
import { ButtonGroup } from "@/components/ui/button-group";
import { OverlayMode } from "@/types/overlay";
import { WindowRect } from "@/types/ipc";
import { windowEvents } from "@/lib/windowEvents";
import { TestWindowContent } from "@/components/windows/TestWindowContent";

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

  const handleButtonClick = (buttonName: string) => {
    console.log(`Button clicked: ${buttonName}`);
  };

  const handleTestWindows = () => {
    windowEvents.emit("window:open", {
      component: TestWindowContent,
      title: "Test Windows",
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
          {/* Group 1: Option 1 & Option 2 */}
          <ButtonGroup>
            <Button variant="secondary" onClick={() => handleButtonClick("Option 1")}>
              Option 1
            </Button>
            <Button variant="secondary" onClick={() => handleButtonClick("Option 2")}>
              Option 2
            </Button>
          </ButtonGroup>

          {/* Group 2: Option 3 */}
          <ButtonGroup>
            <Button variant="secondary" onClick={() => handleButtonClick("Option 3")}>
              Option 3
            </Button>
          </ButtonGroup>

          {/* Group 3: Test Windows */}
          <ButtonGroup>
            <Button variant="secondary" onClick={handleTestWindows}>
              Test Windows
            </Button>
          </ButtonGroup>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
