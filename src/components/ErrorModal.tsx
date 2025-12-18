"use client";

import { useEffect, useState, useRef } from "react";
import { motion, AnimatePresence, useReducedMotion } from "motion/react";
import { Card } from "@/components/ui/card";

// ErrorModal component with entrance/exit animations
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
          <Card className="error-modal p-6 max-w-md mx-4 shadow-2xl">
            <div className="flex flex-col items-center gap-4">
              {/* Error icon */}
              <div className="w-12 h-12 rounded-full bg-destructive/10 flex items-center justify-center">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-6 w-6 text-destructive"
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
              <h2
                id="error-modal-title"
                className="text-lg font-semibold text-card-foreground text-center"
              >
                {targetName} Not Found
              </h2>
              <p
                id="error-modal-description"
                className="text-sm text-muted-foreground text-center"
              >
                {message}
              </p>

              {/* Dismiss button - using plain button with Tailwind styles */}
              <button
                onClick={onDismiss}
                className="mt-2 px-4 py-2 text-sm font-medium rounded-md border border-input bg-background hover:bg-accent hover:text-accent-foreground transition-colors"
              >
                Dismiss
              </button>

              {/* Auto-dismiss indicator */}
              <p className="text-xs text-muted-foreground">
                Auto-dismissing in {Math.ceil(remainingTime / 1000)}s
              </p>
            </div>
          </Card>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
