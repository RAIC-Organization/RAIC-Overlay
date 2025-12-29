"use client";

/**
 * HotkeyInput Component
 *
 * Input component for capturing hotkey combinations.
 * Enters listening mode on focus, captures key+modifiers,
 * and validates against duplicates and reserved keys.
 *
 * @feature 038-settings-panel
 */

import { useState, useCallback, KeyboardEvent } from "react";
import type { HotkeyBinding } from "@/types/user-settings";
import { keyToVkCode } from "@/utils/vk-codes";
import {
  formatHotkey,
  isModifierKey,
  createBindingFromEvent,
} from "@/utils/hotkey-validation";

interface HotkeyInputProps {
  label: string;
  binding: HotkeyBinding;
  otherBinding?: HotkeyBinding;
  error?: string;
  onChange: (binding: HotkeyBinding) => void;
  onValidationError?: (error: string | null) => void;
}

export function HotkeyInput({
  label,
  binding,
  otherBinding,
  error,
  onChange,
  onValidationError,
}: HotkeyInputProps) {
  const [isCapturing, setIsCapturing] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);

  // T017: Keyboard event handler for capturing key combinations
  const handleKeyDown = useCallback(
    (e: KeyboardEvent<HTMLInputElement>) => {
      e.preventDefault();
      e.stopPropagation();

      // T019, T049: Reject standalone modifier keys with informative message
      if (isModifierKey(e.key)) {
        // Show temporary hint that user needs to press a non-modifier key
        setLocalError("Hold modifier(s) and press a key");
        onValidationError?.("Hold modifier(s) and press a key");
        return; // Wait for non-modifier key
      }

      // Get VK code
      const vkCode = keyToVkCode(e.key);
      if (!vkCode) {
        setLocalError("Invalid key");
        onValidationError?.("Invalid key");
        return;
      }

      // Create new binding
      const newBinding = createBindingFromEvent(
        e.nativeEvent as unknown as globalThis.KeyboardEvent,
        vkCode
      );

      // T018: Check for duplicate with other binding
      if (otherBinding) {
        const isDuplicate =
          newBinding.keyCode === otherBinding.keyCode &&
          newBinding.ctrl === otherBinding.ctrl &&
          newBinding.shift === otherBinding.shift &&
          newBinding.alt === otherBinding.alt;

        if (isDuplicate) {
          const errMsg = "This key is already assigned to another action";
          setLocalError(errMsg);
          onValidationError?.(errMsg);
          return;
        }
      }

      // T019: Check for reserved combinations
      const formatted = formatHotkey(newBinding);
      const reservedKeys = [
        "Ctrl+Alt+DELETE",
        "Alt+F4",
        "Ctrl+ESCAPE",
        "Alt+TAB",
      ];
      if (reservedKeys.includes(formatted.toUpperCase())) {
        const errMsg = `${formatted} is a reserved system shortcut`;
        setLocalError(errMsg);
        onValidationError?.(errMsg);
        return;
      }

      // Valid binding
      setLocalError(null);
      onValidationError?.(null);
      onChange(newBinding);
      setIsCapturing(false);

      // Blur the input after successful capture
      (e.target as HTMLInputElement).blur();
    },
    [onChange, otherBinding, onValidationError]
  );

  const handleFocus = useCallback(() => {
    setIsCapturing(true);
    setLocalError(null);
  }, []);

  const handleBlur = useCallback(() => {
    setIsCapturing(false);
  }, []);

  const displayError = error || localError;

  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center justify-between gap-4">
        <label className="font-display text-sm text-foreground">{label}</label>
        <input
          type="text"
          readOnly
          value={isCapturing ? "Press a key..." : formatHotkey(binding)}
          onKeyDown={handleKeyDown}
          onFocus={handleFocus}
          onBlur={handleBlur}
          className={`
            w-40 px-3 py-1.5 rounded
            bg-muted/50 border
            font-display text-sm text-center
            focus:outline-none focus:ring-1
            sc-glow-transition cursor-pointer
            ${
              displayError
                ? "border-red-500/50 focus:ring-red-500/50 focus:border-red-500"
                : isCapturing
                  ? "border-primary/50 focus:ring-primary/50 focus:border-primary shadow-glow-sm"
                  : "border-border focus:ring-primary/30 focus:border-primary/50 hover:border-primary/30"
            }
          `}
        />
      </div>
      {/* T018: Duplicate key validation display */}
      {displayError && (
        <p className="text-xs text-red-400 text-right">{displayError}</p>
      )}
    </div>
  );
}
