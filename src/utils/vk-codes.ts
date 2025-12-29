/**
 * Windows Virtual Key code mapping
 * @feature 038-settings-panel
 * @see https://docs.microsoft.com/en-us/windows/win32/inputdev/virtual-key-codes
 */

/**
 * Map of key names to Windows VK codes
 */
export const VK_CODES: Record<string, number> = {
  // Function keys
  F1: 0x70,
  F2: 0x71,
  F3: 0x72,
  F4: 0x73,
  F5: 0x74,
  F6: 0x75,
  F7: 0x76,
  F8: 0x77,
  F9: 0x78,
  F10: 0x79,
  F11: 0x7a,
  F12: 0x7b,

  // Letters (A-Z: 0x41-0x5A)
  A: 0x41,
  B: 0x42,
  C: 0x43,
  D: 0x44,
  E: 0x45,
  F: 0x46,
  G: 0x47,
  H: 0x48,
  I: 0x49,
  J: 0x4a,
  K: 0x4b,
  L: 0x4c,
  M: 0x4d,
  N: 0x4e,
  O: 0x4f,
  P: 0x50,
  Q: 0x51,
  R: 0x52,
  S: 0x53,
  T: 0x54,
  U: 0x55,
  V: 0x56,
  W: 0x57,
  X: 0x58,
  Y: 0x59,
  Z: 0x5a,

  // Numbers (0-9: 0x30-0x39)
  "0": 0x30,
  "1": 0x31,
  "2": 0x32,
  "3": 0x33,
  "4": 0x34,
  "5": 0x35,
  "6": 0x36,
  "7": 0x37,
  "8": 0x38,
  "9": 0x39,

  // Special keys
  SPACE: 0x20,
  ENTER: 0x0d,
  ESCAPE: 0x1b,
  TAB: 0x09,
  BACKSPACE: 0x08,
  DELETE: 0x2e,
  INSERT: 0x2d,
  HOME: 0x24,
  END: 0x23,
  PAGEUP: 0x21,
  PAGEDOWN: 0x22,

  // Arrow keys
  ARROWLEFT: 0x25,
  ARROWUP: 0x26,
  ARROWRIGHT: 0x27,
  ARROWDOWN: 0x28,

  // Numpad
  NUMPAD0: 0x60,
  NUMPAD1: 0x61,
  NUMPAD2: 0x62,
  NUMPAD3: 0x63,
  NUMPAD4: 0x64,
  NUMPAD5: 0x65,
  NUMPAD6: 0x66,
  NUMPAD7: 0x67,
  NUMPAD8: 0x68,
  NUMPAD9: 0x69,
  MULTIPLY: 0x6a,
  ADD: 0x6b,
  SUBTRACT: 0x6d,
  DECIMAL: 0x6e,
  DIVIDE: 0x6f,

  // Punctuation
  SEMICOLON: 0xba,
  EQUAL: 0xbb,
  COMMA: 0xbc,
  MINUS: 0xbd,
  PERIOD: 0xbe,
  SLASH: 0xbf,
  BACKQUOTE: 0xc0,
  BRACKETLEFT: 0xdb,
  BACKSLASH: 0xdc,
  BRACKETRIGHT: 0xdd,
  QUOTE: 0xde,
};

/**
 * Map of VK codes back to key names
 */
export const VK_CODE_TO_NAME: Record<number, string> = Object.fromEntries(
  Object.entries(VK_CODES).map(([name, code]) => [code, name])
);

/**
 * Get VK code from KeyboardEvent.key or KeyboardEvent.code
 * @param key The key name from the keyboard event
 * @returns The VK code or null if not found
 */
export function keyToVkCode(key: string): number | null {
  // Normalize key name to uppercase
  const normalizedKey = key.toUpperCase().replace("KEY", "").replace("DIGIT", "");

  // Direct lookup
  if (VK_CODES[normalizedKey] !== undefined) {
    return VK_CODES[normalizedKey];
  }

  // Handle single letters (A-Z)
  if (normalizedKey.length === 1 && normalizedKey >= "A" && normalizedKey <= "Z") {
    return normalizedKey.charCodeAt(0);
  }

  // Handle digits (0-9)
  if (normalizedKey.length === 1 && normalizedKey >= "0" && normalizedKey <= "9") {
    return normalizedKey.charCodeAt(0);
  }

  return null;
}

/**
 * Get key name from VK code
 * @param vkCode The VK code
 * @returns The key name or null if not found
 */
export function vkCodeToKey(vkCode: number): string | null {
  return VK_CODE_TO_NAME[vkCode] ?? null;
}
