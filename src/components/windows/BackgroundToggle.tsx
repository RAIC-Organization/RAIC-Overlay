"use client";

/**
 * Background Toggle Component
 *
 * Provides a toggle button for switching between solid and transparent
 * window content area backgrounds. Uses the PanelTop icon with visual
 * styling to indicate the current state.
 *
 * @feature 018-window-background-toggle
 */

import { PanelTop } from "lucide-react";

interface BackgroundToggleProps {
  /** Current background transparency state (true = transparent, false = solid) */
  value: boolean;
  /** Callback when toggle is clicked */
  onChange: (value: boolean) => void;
  /** Callback when change should be persisted */
  onCommit: () => void;
}

export function BackgroundToggle({ value, onChange, onCommit }: BackgroundToggleProps) {
  const handleClick = () => {
    // Invert the current value
    const newValue = !value;
    onChange(newValue);
    onCommit();
  };

  return (
    <button
      onClick={handleClick}
      className="p-1 rounded hover:bg-muted transition-colors cursor-pointer"
      aria-label={value ? "Switch to solid background" : "Switch to transparent background"}
      title={value ? "Solid background" : "Transparent background"}
    >
      <PanelTop
        className={`h-4 w-4 transition-opacity ${
          value ? "opacity-50" : "opacity-100"
        }`}
      />
    </button>
  );
}
