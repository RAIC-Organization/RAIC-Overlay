"use client";

/**
 * Chronometer Widget Settings Component
 *
 * Extended settings panel for the chronometer widget that includes
 * hotkey configuration for start/pause and reset actions.
 *
 * @feature 045-chronometer-widget
 */

import { useState, useCallback, useEffect } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { X, Trash2 } from 'lucide-react';
import { HotkeyInput } from '@/components/settings/HotkeyInput';
import type {
  HotkeySettings,
  HotkeyBinding,
  LoadUserSettingsResult,
} from '@/types/user-settings';
import { DEFAULT_USER_SETTINGS } from '@/types/user-settings';

// ============================================================================
// Types
// ============================================================================

interface ChronometerWidgetSettingsProps {
  widgetId: string;
  opacity: number;
  onOpacityChange: (opacity: number) => void;
  onClose: () => void;
  onCloseWidget: () => void;
}

// ============================================================================
// Constants
// ============================================================================

/** System hotkeys that cannot be used (F3, F5 are reserved for overlay control) */
const RESERVED_KEY_CODES = [
  0x72, // F3 - toggle visibility
  0x74, // F5 - toggle mode
];

// ============================================================================
// Component
// ============================================================================

/**
 * Chronometer widget settings panel - displayed on the back of the widget flip.
 * Provides opacity control, hotkey configuration, flip-back button, and widget close button.
 */
export function ChronometerWidgetSettings({
  opacity,
  onOpacityChange,
  onClose,
  onCloseWidget,
}: ChronometerWidgetSettingsProps) {
  // State for hotkey bindings
  const [startPauseBinding, setStartPauseBinding] = useState<HotkeyBinding>(
    DEFAULT_USER_SETTINGS.hotkeys.chronometerStartPause
  );
  const [resetBinding, setResetBinding] = useState<HotkeyBinding>(
    DEFAULT_USER_SETTINGS.hotkeys.chronometerReset
  );
  const [errors, setErrors] = useState<{
    startPause?: string;
    reset?: string;
  }>({});
  const [isSaving, setIsSaving] = useState(false);
  const [allHotkeys, setAllHotkeys] = useState<HotkeySettings | null>(null);

  // Load current hotkey settings on mount
  useEffect(() => {
    const loadSettings = async () => {
      try {
        const result = await invoke<LoadUserSettingsResult>('load_user_settings');
        if (result.success && result.settings) {
          setStartPauseBinding(result.settings.hotkeys.chronometerStartPause);
          setResetBinding(result.settings.hotkeys.chronometerReset);
          setAllHotkeys(result.settings.hotkeys);
        }
      } catch (err) {
        console.error('Failed to load hotkey settings:', err);
      }
    };
    loadSettings();
  }, []);

  // Convert 0-1 opacity to 10-100 percentage for display
  const opacityPercent = Math.round(opacity * 100);

  const handleSliderChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      e.stopPropagation();
      const percent = parseInt(e.target.value, 10);
      const newOpacity = percent / 100;
      onOpacityChange(newOpacity);
    },
    [onOpacityChange]
  );

  const handleCloseClick = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      e.preventDefault();
      onClose();
    },
    [onClose]
  );

  const handleRemoveClick = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      e.preventDefault();
      onCloseWidget();
    },
    [onCloseWidget]
  );

  // Validate against reserved F3/F5 system hotkeys
  const validateBinding = useCallback(
    (binding: HotkeyBinding, field: 'startPause' | 'reset'): boolean => {
      // Check against reserved keys (F3, F5 without modifiers)
      if (
        RESERVED_KEY_CODES.includes(binding.keyCode) &&
        !binding.ctrl &&
        !binding.shift &&
        !binding.alt
      ) {
        setErrors((prev) => ({
          ...prev,
          [field]: 'F3 and F5 are reserved for overlay control',
        }));
        return false;
      }

      // Check against other overlay hotkeys
      if (allHotkeys) {
        const conflictsWithVisibility =
          binding.keyCode === allHotkeys.toggleVisibility.keyCode &&
          binding.ctrl === allHotkeys.toggleVisibility.ctrl &&
          binding.shift === allHotkeys.toggleVisibility.shift &&
          binding.alt === allHotkeys.toggleVisibility.alt;

        const conflictsWithMode =
          binding.keyCode === allHotkeys.toggleMode.keyCode &&
          binding.ctrl === allHotkeys.toggleMode.ctrl &&
          binding.shift === allHotkeys.toggleMode.shift &&
          binding.alt === allHotkeys.toggleMode.alt;

        if (conflictsWithVisibility || conflictsWithMode) {
          setErrors((prev) => ({
            ...prev,
            [field]: 'Conflicts with overlay hotkey',
          }));
          return false;
        }
      }

      setErrors((prev) => ({
        ...prev,
        [field]: undefined,
      }));
      return true;
    },
    [allHotkeys]
  );

  const handleStartPauseChange = useCallback(
    (binding: HotkeyBinding) => {
      if (validateBinding(binding, 'startPause')) {
        setStartPauseBinding(binding);
      }
    },
    [validateBinding]
  );

  const handleResetChange = useCallback(
    (binding: HotkeyBinding) => {
      if (validateBinding(binding, 'reset')) {
        setResetBinding(binding);
      }
    },
    [validateBinding]
  );

  const handleSaveHotkeys = useCallback(async () => {
    if (errors.startPause || errors.reset || !allHotkeys) return;

    setIsSaving(true);
    try {
      // Create updated hotkey settings
      const updatedHotkeys: HotkeySettings = {
        ...allHotkeys,
        chronometerStartPause: startPauseBinding,
        chronometerReset: resetBinding,
      };

      // Save to disk via full settings update
      const result = await invoke<LoadUserSettingsResult>('load_user_settings');
      if (result.success && result.settings) {
        const updatedSettings = {
          ...result.settings,
          hotkeys: updatedHotkeys,
          lastModified: new Date().toISOString(),
        };
        await invoke('save_user_settings', { settings: updatedSettings });
      }

      // Update runtime hotkeys (triggers hotkeys-updated event)
      await invoke('update_hotkeys', { hotkeys: updatedHotkeys });

      setAllHotkeys(updatedHotkeys);
    } catch (err) {
      console.error('Failed to save chronometer hotkeys:', err);
    } finally {
      setIsSaving(false);
    }
  }, [allHotkeys, startPauseBinding, resetBinding, errors]);

  return (
    <div
      className="absolute inset-0 rounded-lg bg-black/90 border border-blue-500/40 overflow-hidden"
      onPointerDown={(e) => e.stopPropagation()}
      onClick={(e) => e.stopPropagation()}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-blue-500/30 bg-blue-950/50">
        <span className="text-xs font-medium text-blue-300 uppercase tracking-wider">
          Settings
        </span>
        <button
          type="button"
          onClick={handleCloseClick}
          className="p-1 rounded hover:bg-blue-500/30 transition-colors text-blue-400 hover:text-blue-200"
          aria-label="Close settings"
        >
          <X size={14} />
        </button>
      </div>

      {/* Content */}
      <div className="p-3 space-y-3 overflow-y-auto max-h-[calc(100%-80px)]">
        {/* Opacity control */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <label
              htmlFor="chrono-opacity-slider"
              className="text-xs font-medium text-blue-300 uppercase tracking-wider"
            >
              Opacity
            </label>
            <span className="text-xs text-blue-400 tabular-nums">
              {opacityPercent}%
            </span>
          </div>
          <input
            id="chrono-opacity-slider"
            type="range"
            min="10"
            max="100"
            step="5"
            value={opacityPercent}
            onChange={handleSliderChange}
            onPointerDown={(e) => e.stopPropagation()}
            className="w-full h-1.5 bg-blue-900/60 rounded-full appearance-none cursor-pointer
              [&::-webkit-slider-thumb]:appearance-none
              [&::-webkit-slider-thumb]:w-3
              [&::-webkit-slider-thumb]:h-3
              [&::-webkit-slider-thumb]:bg-blue-400
              [&::-webkit-slider-thumb]:rounded-full
              [&::-webkit-slider-thumb]:cursor-pointer
              [&::-webkit-slider-thumb]:hover:bg-blue-300
              [&::-webkit-slider-thumb]:transition-colors
              [&::-moz-range-thumb]:w-3
              [&::-moz-range-thumb]:h-3
              [&::-moz-range-thumb]:bg-blue-400
              [&::-moz-range-thumb]:rounded-full
              [&::-moz-range-thumb]:border-0
              [&::-moz-range-thumb]:cursor-pointer
              [&::-moz-range-thumb]:hover:bg-blue-300"
          />
        </div>

        {/* Hotkey configuration section */}
        <div className="space-y-2 pt-2 border-t border-blue-500/20">
          <span className="text-xs font-medium text-blue-300 uppercase tracking-wider">
            Hotkeys
          </span>

          {/* Start/Pause hotkey */}
          <div className="space-y-1">
            <HotkeyInput
              label="Start/Pause"
              binding={startPauseBinding}
              otherBinding={resetBinding}
              error={errors.startPause}
              onChange={handleStartPauseChange}
              onValidationError={(err) =>
                setErrors((prev) => ({ ...prev, startPause: err || undefined }))
              }
            />
          </div>

          {/* Reset hotkey */}
          <div className="space-y-1">
            <HotkeyInput
              label="Reset"
              binding={resetBinding}
              otherBinding={startPauseBinding}
              error={errors.reset}
              onChange={handleResetChange}
              onValidationError={(err) =>
                setErrors((prev) => ({ ...prev, reset: err || undefined }))
              }
            />
          </div>

          {/* Save hotkeys button */}
          <button
            type="button"
            onClick={handleSaveHotkeys}
            disabled={isSaving || !!errors.startPause || !!errors.reset}
            className={`w-full px-2 py-1.5 rounded text-xs font-medium transition-colors ${
              isSaving || errors.startPause || errors.reset
                ? 'bg-blue-900/30 text-blue-500/50 cursor-not-allowed'
                : 'bg-blue-900/40 hover:bg-blue-800/50 border border-blue-500/30 hover:border-blue-500/50 text-blue-400 hover:text-blue-300'
            }`}
          >
            {isSaving ? 'Saving...' : 'Save Hotkeys'}
          </button>
        </div>

        {/* Remove button */}
        <button
          type="button"
          onClick={handleRemoveClick}
          className="flex items-center justify-center gap-1.5 w-full px-2 py-1.5 rounded bg-red-900/40 hover:bg-red-800/50 border border-red-500/30 hover:border-red-500/50 transition-colors text-red-400 hover:text-red-300 text-xs font-medium"
          aria-label="Remove widget"
        >
          <Trash2 size={12} />
          Remove
        </button>
      </div>
    </div>
  );
}
