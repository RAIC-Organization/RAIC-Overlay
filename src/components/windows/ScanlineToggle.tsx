"use client";

/**
 * Scanline Toggle Component
 *
 * Provides a toggle button for enabling/disabling the scanline overlay effect.
 * Uses the ScanLine icon with visual styling to indicate the current state.
 *
 * @feature 026-sc-hud-theme
 */

import { ScanLine } from "lucide-react";

interface ScanlineToggleProps {
  /** Current scanlines state (true = enabled, false = disabled) */
  value: boolean;
  /** Callback when toggle is clicked */
  onChange: (value: boolean) => void;
  /** Callback when change should be persisted */
  onCommit: () => void;
}

export function ScanlineToggle({ value, onChange, onCommit }: ScanlineToggleProps) {
  const handleClick = () => {
    const newValue = !value;
    onChange(newValue);
    onCommit();
  };

  return (
    <button
      onClick={handleClick}
      className="p-1 rounded sc-glow-transition hover:bg-muted/50 hover:shadow-glow-sm cursor-pointer"
      aria-label={value ? "Disable scanlines" : "Enable scanlines"}
      title={value ? "Scanlines enabled" : "Scanlines disabled"}
    >
      <ScanLine
        className={`h-4 w-4 transition-opacity ${
          value ? "opacity-100 text-primary" : "opacity-50"
        }`}
      />
    </button>
  );
}
