"use client";

import { motion, AnimatePresence, useReducedMotion } from "motion/react";
import Image from "next/image";
import iconSrc from "@/assets/icon.png";
import { OverlayMode } from "@/types/overlay";

interface AppIconProps {
  visible?: boolean;
  mode?: OverlayMode;
}

export function AppIcon({ visible = true, mode = "windowed" }: AppIconProps) {
  // Respect user's reduced motion preference
  const prefersReducedMotion = useReducedMotion();

  // Animation durations (0 if reduced motion is preferred)
  const showHideDuration = prefersReducedMotion ? 0 : 0.3;
  const modeChangeDuration = prefersReducedMotion ? 0 : 0.25;

  // Calculate target opacity based on mode
  // fullscreen = 40% opacity, windowed = 100% opacity
  const targetOpacity = mode === "fullscreen" ? 0.4 : 1;

  // pointer-events class for click-through mode
  const pointerEventsClass = mode === "fullscreen" ? "pointer-events-none" : "";

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          key="app-icon"
          data-testid="app-icon-container"
          initial={{ opacity: 0 }}
          animate={{ opacity: targetOpacity }}
          exit={{ opacity: 0 }}
          transition={{
            duration: showHideDuration,
            ease: "easeOut",
          }}
          className={`fixed top-[50px] left-[50px] ${pointerEventsClass}`}
        >
          {/* Inner motion.div for mode opacity transitions */}
          <motion.div
            animate={{ opacity: targetOpacity }}
            transition={{
              duration: modeChangeDuration,
              ease: "easeOut",
            }}
          >
            <Image
              src={iconSrc}
              alt="RAIC Overlay"
              width={50}
              height={50}
              priority
              data-testid="app-icon-image"
            />
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
