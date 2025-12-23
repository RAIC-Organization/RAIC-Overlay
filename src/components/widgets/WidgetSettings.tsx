"use client";

/**
 * Widget Settings Component
 *
 * The back-side panel of a widget shown after the backflip animation.
 * Contains an opacity slider and a close button to flip back to content.
 *
 * @feature 027-widget-container
 */

import { useCallback } from 'react';
import { X, Trash2 } from 'lucide-react';

// ============================================================================
// Types
// ============================================================================

interface WidgetSettingsProps {
  widgetId: string;
  opacity: number;
  onOpacityChange: (opacity: number) => void;
  onClose: () => void;
  onCloseWidget: () => void;
}

// ============================================================================
// Component
// ============================================================================

/**
 * Widget settings panel - displayed on the back of the widget flip.
 * Provides opacity control, flip-back button, and widget close button.
 */
export function WidgetSettings({
  opacity,
  onOpacityChange,
  onClose,
  onCloseWidget,
}: WidgetSettingsProps) {
  // Convert 0-1 opacity to 10-100 percentage for display
  const opacityPercent = Math.round(opacity * 100);

  const handleSliderChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const percent = parseInt(e.target.value, 10);
      // Convert percentage (10-100) back to 0.1-1.0 range
      const newOpacity = percent / 100;
      onOpacityChange(newOpacity);
    },
    [onOpacityChange]
  );

  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center p-4 rounded-lg bg-black/80 border border-blue-500/30">
      {/* Close button */}
      <button
        type="button"
        onClick={onClose}
        className="absolute top-2 right-2 p-1 rounded-full bg-blue-500/20 hover:bg-blue-500/40 transition-colors text-blue-400 hover:text-blue-300"
        aria-label="Close settings"
      >
        <X size={16} />
      </button>

      {/* Settings content */}
      <div className="w-full max-w-[200px] space-y-4">
        {/* Opacity control */}
        <div className="space-y-2">
          <label
            htmlFor="widget-opacity-slider"
            className="block text-xs font-medium text-blue-300 uppercase tracking-wider"
          >
            Opacity: {opacityPercent}%
          </label>
          <input
            id="widget-opacity-slider"
            type="range"
            min="10"
            max="100"
            step="5"
            value={opacityPercent}
            onChange={handleSliderChange}
            className="w-full h-2 bg-blue-900/50 rounded-lg appearance-none cursor-pointer
              [&::-webkit-slider-thumb]:appearance-none
              [&::-webkit-slider-thumb]:w-4
              [&::-webkit-slider-thumb]:h-4
              [&::-webkit-slider-thumb]:bg-blue-500
              [&::-webkit-slider-thumb]:rounded-full
              [&::-webkit-slider-thumb]:cursor-pointer
              [&::-webkit-slider-thumb]:hover:bg-blue-400
              [&::-webkit-slider-thumb]:transition-colors
              [&::-moz-range-thumb]:w-4
              [&::-moz-range-thumb]:h-4
              [&::-moz-range-thumb]:bg-blue-500
              [&::-moz-range-thumb]:rounded-full
              [&::-moz-range-thumb]:border-0
              [&::-moz-range-thumb]:cursor-pointer
              [&::-moz-range-thumb]:hover:bg-blue-400"
          />
        </div>

        {/* Visual indicator showing current opacity */}
        <div className="text-center">
          <div
            className="inline-block w-8 h-8 rounded border border-blue-500/50 bg-white"
            style={{ opacity: opacity }}
            aria-hidden="true"
          />
        </div>

        {/* Close widget button */}
        <button
          type="button"
          onClick={onCloseWidget}
          className="flex items-center justify-center gap-2 w-full px-3 py-2 rounded bg-red-500/20 hover:bg-red-500/40 transition-colors text-red-400 hover:text-red-300 text-xs font-medium"
          aria-label="Close widget"
        >
          <Trash2 size={14} />
          Remove Widget
        </button>
      </div>
    </div>
  );
}
