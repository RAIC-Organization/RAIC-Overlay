/**
 * User settings type definitions
 * @feature 038-settings-panel
 */

/**
 * User settings persisted to user-settings.json
 */
export interface UserSettings {
  /** Schema version for migration support */
  version: number;

  /** Hotkey bindings configuration */
  hotkeys: HotkeySettings;

  /** Auto-start with Windows preference */
  autoStart: boolean;

  /** Last modified timestamp (ISO 8601) */
  lastModified: string;
}

/**
 * Hotkey bindings for overlay control
 */
export interface HotkeySettings {
  /** Toggle overlay visibility (default: F3) */
  toggleVisibility: HotkeyBinding;

  /** Toggle overlay mode - passthrough/interactive (default: F5) */
  toggleMode: HotkeyBinding;

  /** Chronometer start/pause (default: Ctrl+T) */
  chronometerStartPause: HotkeyBinding;

  /** Chronometer reset (default: Ctrl+Y) */
  chronometerReset: HotkeyBinding;
}

/**
 * Single hotkey binding configuration
 */
export interface HotkeyBinding {
  /** Primary key code (Windows VK code as string, e.g., "F3", "O") */
  key: string;

  /** Key code as integer (Windows VK_* code) */
  keyCode: number;

  /** Ctrl modifier required */
  ctrl: boolean;

  /** Shift modifier required */
  shift: boolean;

  /** Alt modifier required */
  alt: boolean;
}

/**
 * Default user settings
 */
export const DEFAULT_USER_SETTINGS: UserSettings = {
  version: 1,
  hotkeys: {
    toggleVisibility: {
      key: "F3",
      keyCode: 0x72, // VK_F3
      ctrl: false,
      shift: false,
      alt: false,
    },
    toggleMode: {
      key: "F5",
      keyCode: 0x74, // VK_F5
      ctrl: false,
      shift: false,
      alt: false,
    },
    chronometerStartPause: {
      key: "T",
      keyCode: 0x54, // VK_T
      ctrl: true,
      shift: false,
      alt: false,
    },
    chronometerReset: {
      key: "Y",
      keyCode: 0x59, // VK_Y
      ctrl: true,
      shift: false,
      alt: false,
    },
  },
  autoStart: false,
  lastModified: "",
};

/**
 * Result of loading user settings
 */
export interface LoadUserSettingsResult {
  success: boolean;
  settings: UserSettings | null;
  error?: string;
}

/**
 * Result of saving user settings
 */
export interface SaveUserSettingsResult {
  success: boolean;
  error?: string;
}
