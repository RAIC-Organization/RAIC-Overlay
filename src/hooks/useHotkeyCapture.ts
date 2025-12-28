"use client";

/**
 * useHotkeyCapture Hook
 *
 * Captures F3/F5 hotkeys at the document level when the webview is focused.
 * This complements the low-level keyboard hook in the Rust backend, which
 * doesn't receive key events when the webview has focus.
 *
 * Features:
 * - Prevents default browser behavior (F5 refresh, F3 find)
 * - 200ms debouncing to match backend behavior
 * - Invokes existing backend commands for state management
 * - Logs actions with source indication for debugging
 *
 * @feature 031-webview-hotkey-capture
 */

import { useEffect, useRef } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { info, debug } from '@/lib/logger';
import type { OverlayStateResponse } from '@/types/ipc';

/** Debounce threshold in milliseconds - matches backend DEBOUNCE_MS constant */
const DEBOUNCE_MS = 200;

/** Key constants for F3 and F5 */
const KEY_F3 = 'F3';
const KEY_F5 = 'F5';

/**
 * Captures F3/F5 hotkeys at document level when webview is focused.
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
  // Refs for timestamp-based debouncing - avoids re-renders
  const lastF3PressRef = useRef<number>(0);
  const lastF5PressRef = useRef<number>(0);

  useEffect(() => {
    // Skip if hook is disabled (e.g., in click-through mode)
    if (!enabled) {
      return;
    }

    /**
     * Handles keydown events for F3/F5 hotkeys.
     * Prevents default behavior, applies debouncing, and invokes backend commands.
     */
    function handleKeyDown(e: KeyboardEvent): void {
      const now = Date.now();

      // Handle F3: Toggle visibility
      if (e.key === KEY_F3) {
        // Always prevent default to block browser find dialog
        e.preventDefault();
        e.stopPropagation();

        const elapsed = now - lastF3PressRef.current;
        if (elapsed >= DEBOUNCE_MS) {
          lastF3PressRef.current = now;
          info('F3 pressed: toggle visibility requested (webview capture)');

          invoke<OverlayStateResponse>('toggle_visibility').catch((err) => {
            debug(`F3 toggle_visibility failed: ${err} (webview capture)`);
          });
        } else {
          debug(`F3 pressed: debounced (${elapsed}ms since last, threshold=${DEBOUNCE_MS}ms)`);
        }
        return;
      }

      // Handle F5: Toggle mode
      if (e.key === KEY_F5) {
        // Always prevent default to block browser page refresh
        e.preventDefault();
        e.stopPropagation();

        const elapsed = now - lastF5PressRef.current;
        if (elapsed >= DEBOUNCE_MS) {
          lastF5PressRef.current = now;
          info('F5 pressed: toggle mode requested (webview capture)');

          invoke<OverlayStateResponse>('toggle_mode').catch((err) => {
            debug(`F5 toggle_mode failed: ${err} (webview capture)`);
          });
        } else {
          debug(`F5 pressed: debounced (${elapsed}ms since last, threshold=${DEBOUNCE_MS}ms)`);
        }
        return;
      }
    }

    // Add event listener at document level for global capture
    document.addEventListener('keydown', handleKeyDown);

    // Cleanup on unmount or when disabled
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [enabled]);
}
