"use client";

/**
 * Widget Settings Component
 *
 * The back-side panel of a widget shown after the backflip animation.
 * Contains an opacity slider and buttons for flip-back and widget removal.
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
    <div className="absolute inset-0 flex flex-col rounded-lg bg-black/90 border border-blue-500/40 overflow-hidden">
      {/* Header with close button */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-blue-500/30 bg-blue-950/50">
        <span className="text-xs font-medium text-blue-300 uppercase tracking-wider">
          Settings
        </span>
        <button
          type="button"
          onClick={onClose}
          className="p-1 rounded hover:bg-blue-500/30 transition-colors text-blue-400 hover:text-blue-200"
          aria-label="Close settings"
        >
          <X size={14} />
        </button>
      </div>

      {/* Settings content */}
      <div className="flex-1 flex flex-col justify-center p-3 space-y-4">
        {/* Opacity control */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label
              htmlFor="widget-opacity-slider"
              className="text-xs font-medium text-blue-300 uppercase tracking-wider"
            >
              Opacity
            </label>
            <span className="text-xs text-blue-400 tabular-nums">
              {opacityPercent}%
            </span>
          </div>
          <input
            id="widget-opacity-slider"
            type="range"
            min="10"
            max="100"
            step="5"
            value={opacityPercent}
            onChange={handleSliderChange}
            className="w-full h-1.5 bg-blue-900/60 rounded-full appearance-none cursor-pointer
              [&::-webkit-slider-thumb]:appearance-none
              [&::-webkit-slider-thumb]:w-3
              [&::-webkit-slider-thumb]:h-3
              [&::-webkit-slider-thumb]:bg-blue-400
              [&::-webkit-slider-thumb]:rounded-full
              [&::-webkit-slider-thumb]:cursor-pointer
              [&::-webkit-slider-thumb]:hover:bg-blue-300
              [&::-webkit-slider-thumb]:transition-colors
              [&::-webkit-slider-thumb]:shadow-sm
              [&::-moz-range-thumb]:w-3
              [&::-moz-range-thumb]:h-3
              [&::-moz-range-thumb]:bg-blue-400
              [&::-moz-range-thumb]:rounded-full
              [&::-moz-range-thumb]:border-0
              [&::-moz-range-thumb]:cursor-pointer
              [&::-moz-range-thumb]:hover:bg-blue-300"
          />
        </div>
      </div>

      {/* Footer with remove button */}
      <div className="px-3 py-2 border-t border-blue-500/30">
        <button
          type="button"
          onClick={onCloseWidget}
          className="flex items-center justify-center gap-1.5 w-full px-2 py-1.5 rounded bg-red-900/40 hover:bg-red-800/50 border border-red-500/30 hover:border-red-500/50 transition-colors text-red-400 hover:text-red-300 text-xs font-medium"
          aria-label="Remove widget"
        >
          <Trash2 size={12} />
          Remove Widget
        </button>
      </div>
    </div>
  );
}
