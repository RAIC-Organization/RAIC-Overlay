"use client";

/**
 * ErrorModal Component
 *
 * Displays error messages when target process is not found.
 * Styled with liquid glass effect and SC theme to match overlay windows.
 * Features window header with title and X close button.
 * Auto-dismisses after configurable timeout with countdown display.
 *
 * @feature 037-process-popup-glass
 */

import { useEffect, useState, useRef } from "react";
import { motion, AnimatePresence, useReducedMotion } from "motion/react";
import { X } from "lucide-react";

interface ErrorModalProps {
  visible: boolean;
  targetName: string;
  message: string;
  autoDismissMs: number;
  onDismiss: () => void;
}

export function ErrorModal({
  visible,
  targetName,
  message,
  autoDismissMs,
  onDismiss,
}: ErrorModalProps) {
  const [remainingTime, setRemainingTime] = useState(autoDismissMs);
  // Use ref to avoid effect re-running when onDismiss changes
  const onDismissRef = useRef(onDismiss);
  onDismissRef.current = onDismiss;

  // Respect user's reduced motion preference
  const prefersReducedMotion = useReducedMotion();
  const duration = prefersReducedMotion ? 0 : 0.2;

  // Auto-dismiss timer with countdown
  useEffect(() => {
    if (!visible || autoDismissMs <= 0) return;

    setRemainingTime(autoDismissMs);

    const interval = setInterval(() => {
      setRemainingTime((prev) => Math.max(0, prev - 1000));
    }, 1000);

    const timer = setTimeout(() => {
      onDismissRef.current();
    }, autoDismissMs);

    return () => {
      clearTimeout(timer);
      clearInterval(interval);
    };
  }, [visible, autoDismissMs]);

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          key="error-modal"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          transition={{ duration, ease: "easeOut" }}
          className="fixed inset-0 flex items-center justify-center z-50 select-none"
          role="alertdialog"
          aria-modal="true"
          aria-labelledby="error-modal-title"
          aria-describedby="error-modal-description"
        >
          {/* SC-themed container with liquid glass effect */}
          <div className="relative max-w-md w-full mx-4 border border-border rounded-lg overflow-hidden sc-glow-transition sc-corner-accents shadow-glow-sm bg-background/80 backdrop-blur-xl">
            {/* Window header */}
            <div className="flex items-center justify-between px-3 py-2 border-b border-border bg-muted/50">
              <h2
                id="error-modal-title"
                className="font-display text-sm font-medium uppercase tracking-wide truncate"
              >
                {targetName} Not Found
              </h2>
              <button
                onClick={onDismiss}
                className="p-1 rounded sc-glow-transition hover:bg-muted/50 hover:shadow-glow-sm cursor-pointer"
                aria-label="Close"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Content area */}
            <div className="p-6 flex flex-col items-center gap-4">
              {/* Warning icon with blue glow */}
              <div className="w-12 h-12 rounded-full bg-blue-500/10 flex items-center justify-center">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-6 w-6"
                  style={{
                    color: "rgba(59, 130, 246, 0.9)",
                    filter: "drop-shadow(0 0 8px rgba(59, 130, 246, 0.6))",
                  }}
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                  />
                </svg>
              </div>

              {/* Error message */}
              <p
                id="error-modal-description"
                className="font-display text-sm text-muted-foreground text-center"
              >
                {message}
              </p>

              {/* Auto-dismiss countdown */}
              <p className="font-display text-xs text-muted-foreground">
                Auto-dismissing in {Math.ceil(remainingTime / 1000)}s
              </p>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
