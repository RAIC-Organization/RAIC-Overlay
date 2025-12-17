"use client";

import { motion, AnimatePresence, useReducedMotion } from "motion/react";
import { Card } from "@/components/ui/card";
import { OverlayMode } from "@/types/overlay";
import { WindowRect } from "@/types/ipc";

// HeaderPanel with motion animations for show/hide and mode transitions
// fullscreen mode = click-through (60% transparent)
// windowed mode = interactive (0% transparent, fully visible)
interface HeaderPanelProps {
  visible?: boolean;
  mode?: OverlayMode;
  targetRect?: WindowRect | null;
}

// Calculate scale factor based on target window size
// This ensures the header panel scales appropriately when attached to different window sizes
function calculateScaleFactor(targetRect: WindowRect | null): number {
  if (!targetRect) return 1;

  // Base dimensions for the header panel
  const baseWidth = 400;
  const baseHeight = 60;

  // Calculate scale based on target window width
  // Clamp between 0.5 and 2.0 to ensure readability
  const widthScale = Math.min(2.0, Math.max(0.5, targetRect.width / baseWidth));

  // For very small windows, also consider height
  const heightScale = Math.min(2.0, Math.max(0.5, targetRect.height / (baseHeight * 3)));

  // Use the smaller of the two scales to ensure it fits
  return Math.min(widthScale, heightScale);
}

export function HeaderPanel({
  visible = true,
  mode = "windowed",
  targetRect = null,
}: HeaderPanelProps) {
  // Respect user's reduced motion preference
  const prefersReducedMotion = useReducedMotion();

  // Animation durations (0 if reduced motion is preferred)
  const showHideDuration = prefersReducedMotion ? 0 : 0.3;
  const modeChangeDuration = prefersReducedMotion ? 0 : 0.25;

  // Calculate target opacity based on mode
  // fullscreen = 40% opacity (60% transparent), windowed = 100% opacity
  const targetOpacity = mode === "fullscreen" ? 0.4 : 1;

  // pointer-events class for click-through mode
  const pointerEventsClass = mode === "fullscreen" ? "pointer-events-none" : "";

  // Calculate scale factor for target window attachment
  const scaleFactor = calculateScaleFactor(targetRect);

  // Card content that will be animated
  const cardContent = (
    <h1
      className="text-card-foreground font-semibold m-0 font-sans"
      style={{
        fontSize: targetRect ? `${1.125 * scaleFactor}rem` : undefined,
      }}
    >
      RAIC Overlay
    </h1>
  );

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          key="header-panel"
          initial={{ opacity: 0 }}
          animate={{ opacity: targetOpacity }}
          exit={{ opacity: 0 }}
          transition={{
            duration: showHideDuration,
            ease: "easeOut",
            // Use faster duration for mode opacity changes
            opacity: { duration: showHideDuration }
          }}
          className={pointerEventsClass}
        >
          {/* Inner motion.div for mode opacity transitions */}
          <motion.div
            animate={{ opacity: targetOpacity }}
            transition={{
              duration: modeChangeDuration,
              ease: "easeOut"
            }}
          >
            {targetRect ? (
              // When attached to target, use a container to center the header at top
              <div className="w-full h-full flex justify-center items-start pt-0">
                <Card
                  className="w-[400px] h-[60px] flex items-center justify-center"
                  role="status"
                  aria-live="polite"
                  aria-label="RAIC Overlay status panel"
                  style={{
                    fontSize: `${scaleFactor}rem`,
                  }}
                >
                  {cardContent}
                </Card>
              </div>
            ) : (
              // Default: no target, render as fixed size
              <Card
                className="w-[400px] h-[60px] flex items-center justify-center text-lg"
                role="status"
                aria-live="polite"
                aria-label="RAIC Overlay status panel"
              >
                {cardContent}
              </Card>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
