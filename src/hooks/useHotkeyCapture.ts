"use client";

/**
 * useHotkeyCapture Hook
 *
 * Captures configurable hotkeys at the document level when the webview is focused.
 * This complements the low-level keyboard hook in the Rust backend, which
 * doesn't receive key events when the webview has focus.
 *
 * Features:
 * - Dynamic hotkey configuration from user settings
 * - Real-time updates when settings change via backend event
 * - Prevents default browser behavior for configured hotkeys
 * - 200ms debouncing to match backend behavior
 * - Invokes existing backend commands for state management
 * - Logs actions with source indication for debugging
 *
 * @feature 031-webview-hotkey-capture
 * @feature 042-sync-webview-hotkeys
 */

import { useState, useEffect, useRef } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { listen, UnlistenFn } from '@tauri-apps/api/event';
import { info, debug } from '@/lib/logger';
import type { OverlayStateResponse } from '@/types/ipc';
import type { HotkeySettings, HotkeyBinding, LoadUserSettingsResult } from '@/types/user-settings';
import { DEFAULT_USER_SETTINGS } from '@/types/user-settings';

/** Debounce threshold in milliseconds - matches backend DEBOUNCE_MS constant */
const DEBOUNCE_MS = 200;

/**
 * Compares a KeyboardEvent against a HotkeyBinding configuration.
 * Returns true if the event matches the binding exactly (key + all modifiers).
 *
 * @param event - The KeyboardEvent from the keydown handler
 * @param binding - The HotkeyBinding configuration to match against
 * @returns true if the event matches the binding
 */
function matchesHotkey(event: KeyboardEvent, binding: HotkeyBinding): boolean {
  return (
    event.key === binding.key &&
    event.ctrlKey === binding.ctrl &&
    event.shiftKey === binding.shift &&
    event.altKey === binding.alt
  );
}

/**
 * Captures configurable hotkeys at document level when webview is focused.
 * Loads hotkey configuration from backend settings and listens for changes.
 * Prevents default browser behavior and invokes backend commands.
 *
 * @param enabled - Whether to capture hotkeys (typically true in interactive mode)
 *
 * @example
 * // In app/page.tsx
 * function Home() {
 *   const [state, setState] = useState<OverlayState>(initialState);
 *   // Capture hotkeys when in interactive mode
 *   useHotkeyCapture(state.mode === 'windowed');
 *   // ...
 * }
 */
export function useHotkeyCapture(enabled: boolean): void {
  // Hotkey configuration from user settings
  const [hotkeyConfig, setHotkeyConfig] = useState<HotkeySettings | null>(null);

  // Refs for timestamp-based debouncing - avoids re-renders
  const lastVisibilityPressRef = useRef<number>(0);
  const lastModePressRef = useRef<number>(0);

  // Ref for event listener cleanup
  const unlistenRef = useRef<UnlistenFn | null>(null);

  // Load initial settings on mount
  useEffect(() => {
    let ignore = false;

    const loadSettings = async () => {
      try {
        const result = await invoke<LoadUserSettingsResult>('load_user_settings');
        if (!ignore) {
          if (result.success && result.settings) {
            setHotkeyConfig(result.settings.hotkeys);
            debug('Hotkey settings loaded from user settings');
          } else {
            setHotkeyConfig(DEFAULT_USER_SETTINGS.hotkeys);
            debug('Using default hotkey settings');
          }
        }
      } catch (err) {
        debug(`Failed to load hotkey settings: ${err}`);
        if (!ignore) {
          setHotkeyConfig(DEFAULT_USER_SETTINGS.hotkeys);
        }
      }
    };

    loadSettings();
    return () => { ignore = true; };
  }, []);

  // Listen for settings changes from backend
  useEffect(() => {
    const setupListener = async () => {
      unlistenRef.current = await listen<HotkeySettings>('hotkeys-updated', (event) => {
        info('Hotkeys updated via backend event');
        setHotkeyConfig(event.payload);
      });
    };

    setupListener();
    return () => {
      unlistenRef.current?.();
    };
  }, []);

  // Hotkey capture effect
  useEffect(() => {
    // Skip if hook is disabled or settings not yet loaded
    if (!enabled || !hotkeyConfig) {
      return;
    }

    // Capture config in local const to satisfy TypeScript null check
    const config = hotkeyConfig;

    /**
     * Handles keydown events for configured hotkeys.
     * Prevents default behavior, applies debouncing, and invokes backend commands.
     *
     * Uses capture phase to intercept events BEFORE the webview's native handlers.
     */
    function handleKeyDown(e: KeyboardEvent): void {
      const now = Date.now();

      // Check visibility toggle hotkey
      if (matchesHotkey(e, config.toggleVisibility)) {
        // Always prevent default to block browser behavior
        // Use stopImmediatePropagation to prevent ALL other handlers
        e.preventDefault();
        e.stopImmediatePropagation();

        const elapsed = now - lastVisibilityPressRef.current;
        if (elapsed >= DEBOUNCE_MS) {
          lastVisibilityPressRef.current = now;
          info('Visibility toggle hotkey pressed (webview capture)');

          invoke<OverlayStateResponse>('toggle_visibility').catch((err) => {
            debug(`toggle_visibility failed: ${err} (webview capture)`);
          });
        }
        return;
      }

      // Check mode toggle hotkey
      if (matchesHotkey(e, config.toggleMode)) {
        // Always prevent default to block browser behavior
        // Use stopImmediatePropagation to prevent ALL other handlers
        e.preventDefault();
        e.stopImmediatePropagation();

        const elapsed = now - lastModePressRef.current;
        if (elapsed >= DEBOUNCE_MS) {
          lastModePressRef.current = now;
          info('Mode toggle hotkey pressed (webview capture)');

          invoke<OverlayStateResponse>('toggle_mode').catch((err) => {
            debug(`toggle_mode failed: ${err} (webview capture)`);
          });
        }
        return;
      }
    }

    // Add event listener at document level with capture phase
    // Capture phase runs BEFORE bubble phase, intercepting events before webview handlers
    document.addEventListener('keydown', handleKeyDown, { capture: true });

    // Cleanup on unmount or when config changes (must match capture option)
    return () => {
      document.removeEventListener('keydown', handleKeyDown, { capture: true });
    };
  }, [enabled, hotkeyConfig]);
}
