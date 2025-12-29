/**
 * Hotkey validation utilities
 * @feature 038-settings-panel
 */

import type { HotkeyBinding } from "@/types/user-settings";

/**
 * Reserved key combinations that cannot be assigned
 */
export const RESERVED_COMBINATIONS: string[] = [
  "Ctrl+Alt+Delete",
  "Alt+F4",
  "Ctrl+Escape",
  "Alt+Tab",
  "Ctrl+Alt+Tab",
  "Win+L",
  "Win+D",
  "Win+E",
  "Win+R",
  "Win+Tab",
];

/**
 * Modifier-only keys that are invalid as standalone bindings
 */
export const MODIFIER_KEYS = ["Control", "Shift", "Alt", "Meta"];

/**
 * Validate a hotkey binding
 * @param binding The binding to validate
 * @param otherBinding The other binding to check for duplicates
 * @returns Error message or null if valid
 */
export function validateHotkeyBinding(
  binding: HotkeyBinding,
  otherBinding: HotkeyBinding
): string | null {
  // Check for standalone modifier
  if (MODIFIER_KEYS.includes(binding.key)) {
    return "Cannot use modifier key alone";
  }

  // Check for reserved combination
  const formatted = formatHotkey(binding);
  if (RESERVED_COMBINATIONS.includes(formatted)) {
    return `${formatted} is a reserved system shortcut`;
  }

  // Check for duplicate with other binding
  if (hotkeyEquals(binding, otherBinding)) {
    return "This key is already assigned to another action";
  }

  return null;
}

/**
 * Format hotkey for display
 * @param binding The hotkey binding
 * @returns Human-readable string like "Ctrl+Shift+O" or "F3"
 */
export function formatHotkey(binding: HotkeyBinding): string {
  const parts: string[] = [];
  if (binding.ctrl) parts.push("Ctrl");
  if (binding.shift) parts.push("Shift");
  if (binding.alt) parts.push("Alt");
  parts.push(binding.key);
  return parts.join("+");
}

/**
 * Check if two hotkey bindings are equal
 * @param a First binding
 * @param b Second binding
 * @returns True if bindings are the same key combination
 */
export function hotkeyEquals(a: HotkeyBinding, b: HotkeyBinding): boolean {
  return (
    a.keyCode === b.keyCode &&
    a.ctrl === b.ctrl &&
    a.shift === b.shift &&
    a.alt === b.alt
  );
}

/**
 * Check if a key is a modifier key
 * @param key The key name from KeyboardEvent
 * @returns True if the key is a modifier
 */
export function isModifierKey(key: string): boolean {
  return MODIFIER_KEYS.includes(key);
}

/**
 * Create a hotkey binding from a keyboard event
 * @param event The keyboard event
 * @param vkCode The VK code for the key
 * @returns A HotkeyBinding object
 */
export function createBindingFromEvent(
  event: KeyboardEvent,
  vkCode: number
): HotkeyBinding {
  // Normalize key name for display
  let key = event.key.toUpperCase();

  // Clean up key names for common keys
  if (key === " ") key = "Space";
  if (key.startsWith("ARROW")) key = key.replace("ARROW", "Arrow ");

  return {
    key,
    keyCode: vkCode,
    ctrl: event.ctrlKey,
    shift: event.shiftKey,
    alt: event.altKey,
  };
}
