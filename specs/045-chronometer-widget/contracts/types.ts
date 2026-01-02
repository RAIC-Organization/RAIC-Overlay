/**
 * Chronometer Widget Type Contracts
 * Feature: 045-chronometer-widget
 * Date: 2026-01-02
 *
 * These types define the contracts between frontend and backend.
 * Implementation should match these exactly.
 */

// ============================================================================
// Hotkey Configuration Types
// ============================================================================

/**
 * Represents a single hotkey binding configuration.
 * Must match src-tauri/src/user_settings_types.rs::HotkeyBinding
 */
export interface HotkeyBinding {
  /** Display name of the key (e.g., "T", "F3") */
  key: string;

  /** Windows Virtual Key code (0x00-0xFF) */
  keyCode: number;

  /** Ctrl modifier required */
  ctrl: boolean;

  /** Shift modifier required */
  shift: boolean;

  /** Alt modifier required */
  alt: boolean;
}

/**
 * Extended hotkey settings including chronometer bindings.
 * Must match src-tauri/src/user_settings_types.rs::HotkeySettings
 */
export interface HotkeySettings {
  toggleVisibility: HotkeyBinding;
  toggleMode: HotkeyBinding;
  chronometerStartPause: HotkeyBinding;
  chronometerReset: HotkeyBinding;
}

// ============================================================================
// Chronometer State Types
// ============================================================================

/**
 * Internal runtime state for the chronometer hook.
 * NOT directly persisted - see ChronometerWidgetData for persistence.
 */
export interface ChronometerState {
  /** Whether the chronometer is actively counting */
  isRunning: boolean;

  /** Total elapsed time in milliseconds */
  elapsedMs: number;

  /** Timestamp of last tick (for accurate calculation), null when paused */
  lastTickTimestamp: number | null;
}

/**
 * Persisted widget data for chronometer.
 * Saved in widget-{id}.json pattern.
 */
export interface ChronometerWidgetData {
  /** Elapsed time in milliseconds when widget was saved */
  elapsedMs: number;
}

// ============================================================================
// Command Response Types
// ============================================================================

/**
 * Response from chronometer_start_pause and chronometer_reset commands.
 */
export interface ChronometerStateResponse {
  success: boolean;
  isRunning: boolean;
  elapsedMs: number;
}

/**
 * Response from update_chronometer_hotkeys command.
 */
export interface UpdateHotkeysResult {
  success: boolean;
  error?: string;
}

/**
 * Parameters for update_chronometer_hotkeys command.
 */
export interface UpdateChronometerHotkeysParams {
  startPause: HotkeyBinding;
  reset: HotkeyBinding;
}

// ============================================================================
// Event Payload Types
// ============================================================================

/**
 * Payload for internal chronometer:state-changed event.
 */
export interface ChronometerStateChangedPayload {
  isRunning: boolean;
  elapsedMs: number;
}

// ============================================================================
// Widget Type Extension
// ============================================================================

/**
 * Extended widget type union including 'chronometer'.
 */
export type WidgetType = 'clock' | 'timer' | 'chronometer';

// ============================================================================
// Constants
// ============================================================================

/**
 * Default chronometer hotkey bindings.
 */
export const DEFAULT_CHRONOMETER_HOTKEYS = {
  startPause: {
    key: 'T',
    keyCode: 0x54,
    ctrl: true,
    shift: false,
    alt: false,
  } as HotkeyBinding,

  reset: {
    key: 'Y',
    keyCode: 0x59,
    ctrl: true,
    shift: false,
    alt: false,
  } as HotkeyBinding,
};

/**
 * Virtual key code constants for common keys.
 */
export const VK_CODES = {
  VK_T: 0x54,
  VK_Y: 0x59,
  VK_CONTROL: 0x11,
  VK_SHIFT: 0x10,
  VK_MENU: 0x12, // Alt key
} as const;

/**
 * Chronometer timing constants.
 */
export const CHRONOMETER_CONSTANTS = {
  /** Debounce interval in milliseconds */
  DEBOUNCE_MS: 200,

  /** Display update interval in milliseconds */
  UPDATE_INTERVAL_MS: 1000,

  /** Maximum elapsed time in milliseconds (99:59:59) */
  MAX_ELAPSED_MS: 359999000,
} as const;
