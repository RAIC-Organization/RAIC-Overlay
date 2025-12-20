"use client";

/**
 * Opacity Slider Component
 *
 * Provides a slider control for adjusting window opacity.
 * Displays the current opacity as a percentage label.
 *
 * @feature 013-window-opacity-control
 */

import { Slider } from "@/components/ui/slider";

interface OpacitySliderProps {
  /** Current opacity value (0.1 to 1.0) */
  value: number;
  /** Callback when value changes during drag */
  onChange: (value: number) => void;
  /** Callback when user commits value (releases slider) */
  onCommit: () => void;
}

export function OpacitySlider({ value, onChange, onCommit }: OpacitySliderProps) {
  return (
    <div className="flex items-center gap-2">
      <Slider
        value={[value * 100]}
        onValueChange={(v) => onChange(v[0] / 100)}
        onValueCommit={onCommit}
        min={10}
        max={100}
        step={1}
        className="w-20"
        aria-label="Window opacity"
      />
      <span className="text-xs tabular-nums w-8 text-muted-foreground">
        {Math.round(value * 100)}%
      </span>
    </div>
  );
}
