"use client";

/**
 * Chronometer Widget Settings Component
 *
 * Compact settings panel for the chronometer widget that includes
 * hotkey configuration for start/pause and reset actions.
 *
 * @feature 045-chronometer-widget
 */

import { useState, useCallback, useEffect, KeyboardEvent } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { X, Trash2 } from 'lucide-react';
import type {
  HotkeySettings,
  HotkeyBinding,
  LoadUserSettingsResult,
} from '@/types/user-settings';
import { DEFAULT_USER_SETTINGS } from '@/types/user-settings';
import { keyToVkCode } from '@/utils/vk-codes';
import {
  formatHotkey,
  isModifierKey,
  createBindingFromEvent,
} from '@/utils/hotkey-validation';

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
// Compact Hotkey Input Sub-component
// ============================================================================

interface CompactHotkeyInputProps {
  label: string;
  binding: HotkeyBinding;
  otherBinding?: HotkeyBinding;
  error?: string;
  onChange: (binding: HotkeyBinding) => void;
  onValidationError?: (error: string | null) => void;
}

function CompactHotkeyInput({
  label,
  binding,
  otherBinding,
  error,
  onChange,
  onValidationError,
}: CompactHotkeyInputProps) {
  const [isCapturing, setIsCapturing] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent<HTMLInputElement>) => {
      e.preventDefault();
      e.stopPropagation();

      if (isModifierKey(e.key)) {
        setLocalError("Press key...");
        onValidationError?.("Press key...");
        return;
      }

      const vkCode = keyToVkCode(e.key);
      if (!vkCode) {
        setLocalError("Invalid");
        onValidationError?.("Invalid");
        return;
      }

      const newBinding = createBindingFromEvent(
        e.nativeEvent as unknown as globalThis.KeyboardEvent,
        vkCode
      );

      if (otherBinding) {
        const isDuplicate =
          newBinding.keyCode === otherBinding.keyCode &&
          newBinding.ctrl === otherBinding.ctrl &&
          newBinding.shift === otherBinding.shift &&
          newBinding.alt === otherBinding.alt;

        if (isDuplicate) {
          setLocalError("Duplicate");
          onValidationError?.("Duplicate");
          return;
        }
      }

      setLocalError(null);
      onValidationError?.(null);
      onChange(newBinding);
      setIsCapturing(false);
      (e.target as HTMLInputElement).blur();
    },
    [onChange, otherBinding, onValidationError]
  );

  const displayError = error || localError;

  return (
    <div className="flex items-center justify-between gap-2">
      <span className="text-[10px] text-blue-300 whitespace-nowrap">{label}</span>
      <input
        type="text"
        readOnly
        value={isCapturing ? "..." : formatHotkey(binding)}
        onKeyDown={handleKeyDown}
        onFocus={() => { setIsCapturing(true); setLocalError(null); }}
        onBlur={() => setIsCapturing(false)}
        className={`
          w-20 px-1.5 py-0.5 rounded text-[10px] text-center
          bg-blue-900/40 border cursor-pointer
          focus:outline-none focus:ring-1
          ${displayError
            ? "border-red-500/50 focus:ring-red-500/50"
            : isCapturing
              ? "border-blue-400/50 focus:ring-blue-400/50"
              : "border-blue-500/30 hover:border-blue-400/40"
          }
        `}
      />
    </div>
  );
}

// ============================================================================
// Component
// ============================================================================

/**
 * Chronometer widget settings panel - compact version for widget back face.
 */
export function ChronometerWidgetSettings({
  opacity,
  onOpacityChange,
  onClose,
  onCloseWidget,
}: ChronometerWidgetSettingsProps) {
  const [startPauseBinding, setStartPauseBinding] = useState<HotkeyBinding>(
    DEFAULT_USER_SETTINGS.hotkeys.chronometerStartPause
  );
  const [resetBinding, setResetBinding] = useState<HotkeyBinding>(
    DEFAULT_USER_SETTINGS.hotkeys.chronometerReset
  );
  const [errors, setErrors] = useState<{ startPause?: string; reset?: string }>({});
  const [isSaving, setIsSaving] = useState(false);
  const [allHotkeys, setAllHotkeys] = useState<HotkeySettings | null>(null);

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

  const opacityPercent = Math.round(opacity * 100);

  const handleSliderChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      e.stopPropagation();
      onOpacityChange(parseInt(e.target.value, 10) / 100);
    },
    [onOpacityChange]
  );

  const validateBinding = useCallback(
    (binding: HotkeyBinding, field: 'startPause' | 'reset'): boolean => {
      if (
        RESERVED_KEY_CODES.includes(binding.keyCode) &&
        !binding.ctrl && !binding.shift && !binding.alt
      ) {
        setErrors((prev) => ({ ...prev, [field]: 'Reserved' }));
        return false;
      }

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
          setErrors((prev) => ({ ...prev, [field]: 'Conflict' }));
          return false;
        }
      }

      setErrors((prev) => ({ ...prev, [field]: undefined }));
      return true;
    },
    [allHotkeys]
  );

  const handleSaveHotkeys = useCallback(async () => {
    if (errors.startPause || errors.reset || !allHotkeys) return;

    setIsSaving(true);
    try {
      const updatedHotkeys: HotkeySettings = {
        ...allHotkeys,
        chronometerStartPause: startPauseBinding,
        chronometerReset: resetBinding,
      };

      const result = await invoke<LoadUserSettingsResult>('load_user_settings');
      if (result.success && result.settings) {
        const updatedSettings = {
          ...result.settings,
          hotkeys: updatedHotkeys,
          lastModified: new Date().toISOString(),
        };
        await invoke('save_user_settings', { settings: updatedSettings });
      }

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
      className="absolute inset-0 rounded-lg bg-black/90 border border-blue-500/40 overflow-hidden flex flex-col"
      onPointerDown={(e) => e.stopPropagation()}
      onClick={(e) => e.stopPropagation()}
    >
      {/* Compact Header */}
      <div className="flex items-center justify-between px-2 py-1 border-b border-blue-500/30 bg-blue-950/50 shrink-0">
        <span className="text-[10px] font-medium text-blue-300 uppercase tracking-wider">
          Settings
        </span>
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); e.preventDefault(); onClose(); }}
          className="p-0.5 rounded hover:bg-blue-500/30 transition-colors text-blue-400 hover:text-blue-200"
          aria-label="Close settings"
        >
          <X size={12} />
        </button>
      </div>

      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto p-2 space-y-2">
        {/* Opacity control */}
        <div className="space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-blue-300 uppercase">Opacity</span>
            <span className="text-[10px] text-blue-400 tabular-nums">{opacityPercent}%</span>
          </div>
          <input
            type="range"
            min="10"
            max="100"
            step="5"
            value={opacityPercent}
            onChange={handleSliderChange}
            onPointerDown={(e) => e.stopPropagation()}
            className="w-full h-1 bg-blue-900/60 rounded-full appearance-none cursor-pointer
              [&::-webkit-slider-thumb]:appearance-none
              [&::-webkit-slider-thumb]:w-2.5
              [&::-webkit-slider-thumb]:h-2.5
              [&::-webkit-slider-thumb]:bg-blue-400
              [&::-webkit-slider-thumb]:rounded-full
              [&::-webkit-slider-thumb]:cursor-pointer
              [&::-moz-range-thumb]:w-2.5
              [&::-moz-range-thumb]:h-2.5
              [&::-moz-range-thumb]:bg-blue-400
              [&::-moz-range-thumb]:rounded-full
              [&::-moz-range-thumb]:border-0"
          />
        </div>

        {/* Hotkeys section */}
        <div className="space-y-1.5 pt-1.5 border-t border-blue-500/20">
          <span className="text-[10px] text-blue-300 uppercase">Hotkeys</span>

          <CompactHotkeyInput
            label="Start/Pause"
            binding={startPauseBinding}
            otherBinding={resetBinding}
            error={errors.startPause}
            onChange={(b) => validateBinding(b, 'startPause') && setStartPauseBinding(b)}
            onValidationError={(err) => setErrors((prev) => ({ ...prev, startPause: err || undefined }))}
          />

          <CompactHotkeyInput
            label="Reset"
            binding={resetBinding}
            otherBinding={startPauseBinding}
            error={errors.reset}
            onChange={(b) => validateBinding(b, 'reset') && setResetBinding(b)}
            onValidationError={(err) => setErrors((prev) => ({ ...prev, reset: err || undefined }))}
          />

          <button
            type="button"
            onClick={handleSaveHotkeys}
            disabled={isSaving || !!errors.startPause || !!errors.reset}
            className={`w-full px-1.5 py-1 rounded text-[10px] font-medium transition-colors ${
              isSaving || errors.startPause || errors.reset
                ? 'bg-blue-900/30 text-blue-500/50 cursor-not-allowed'
                : 'bg-blue-900/40 hover:bg-blue-800/50 border border-blue-500/30 text-blue-400'
            }`}
          >
            {isSaving ? 'Saving...' : 'Save'}
          </button>
        </div>

        {/* Remove button */}
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); e.preventDefault(); onCloseWidget(); }}
          className="flex items-center justify-center gap-1 w-full px-1.5 py-1 rounded bg-red-900/40 hover:bg-red-800/50 border border-red-500/30 transition-colors text-red-400 hover:text-red-300 text-[10px] font-medium"
          aria-label="Remove widget"
        >
          <Trash2 size={10} />
          Remove
        </button>
      </div>
    </div>
  );
}
