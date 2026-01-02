"use client";

/**
 * useChronometer Hook
 *
 * Provides stopwatch functionality for the chronometer widget.
 * Controlled via hotkeys (Ctrl+T for toggle, Ctrl+Y for reset).
 *
 * Features:
 * - Start/pause via toggle function or Tauri event
 * - Reset to 00:00:00 via reset function or Tauri event
 * - Shared singleton state across all widget instances
 * - HH:MM:SS formatted time display (caps at 99:59:59)
 * - Event-based synchronization for multiple instances
 *
 * @feature 045-chronometer-widget
 */

import { useState, useEffect, useRef } from 'react';
import { listen, UnlistenFn } from '@tauri-apps/api/event';
import { debug } from '@/lib/logger';
import { chronometerEvents } from '@/lib/chronometerEvents';

// ============================================================================
// Types
// ============================================================================

/**
 * Internal state for chronometer tracking.
 */
interface ChronometerState {
  /** Whether the chronometer is currently running */
  isRunning: boolean;
  /** Timestamp (Date.now()) when chronometer was last started/resumed */
  lastTickTimestamp: number | null;
  /** Accumulated elapsed time in milliseconds */
  elapsedMs: number;
}

/**
 * Return type for the useChronometer hook.
 */
export interface ChronometerResult {
  /** Whether the chronometer is currently running */
  isRunning: boolean;
  /** Elapsed time in milliseconds */
  elapsedMs: number;
  /** Formatted time string (HH:MM:SS) */
  formattedTime: string;
  /** Toggle start/pause */
  toggle: () => void;
  /** Reset to 00:00:00 */
  reset: () => void;
}

// ============================================================================
// Constants
// ============================================================================

/** Timer update interval in milliseconds */
const UPDATE_INTERVAL_MS = 100;

/** Maximum display time: 99:59:59 in milliseconds */
const MAX_ELAPSED_MS = (99 * 3600 + 59 * 60 + 59) * 1000;

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Formats elapsed milliseconds as HH:MM:SS string.
 * Caps at 99:59:59.
 *
 * @param ms - Elapsed time in milliseconds
 * @returns Formatted time string (HH:MM:SS)
 */
export function formatChronometerTime(ms: number): string {
  // Cap at maximum display time
  const cappedMs = Math.min(ms, MAX_ELAPSED_MS);

  const totalSeconds = Math.floor(cappedMs / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
}

// ============================================================================
// Singleton State (shared across all hook instances)
// ============================================================================

/**
 * Singleton state to ensure all chronometer widgets show the same time.
 * This avoids drift between multiple instances and saves resources.
 */
let globalState: ChronometerState = {
  isRunning: false,
  lastTickTimestamp: null,
  elapsedMs: 0,
};

/** Listeners that get notified when global state changes */
const listeners = new Set<() => void>();

/** Reference to the global interval, null when not running */
let globalIntervalId: ReturnType<typeof setInterval> | null = null;

/** Track if Tauri event listeners are already set up */
let tauriListenersSetup = false;

/** Track if chronometerEvents listeners are already set up */
let eventEmitterListenersSetup = false;

/** Unlisten functions for cleanup */
let unlistenToggle: UnlistenFn | null = null;
let unlistenReset: UnlistenFn | null = null;
let unsubscribeToggle: (() => void) | null = null;
let unsubscribeReset: (() => void) | null = null;

/**
 * Updates global state and notifies all listeners.
 */
function setGlobalState(updater: (prev: ChronometerState) => ChronometerState): void {
  globalState = updater(globalState);
  listeners.forEach((listener) => listener());
}

/**
 * Starts the global update interval.
 */
function startGlobalInterval(): void {
  if (globalIntervalId !== null) return;

  globalIntervalId = setInterval(() => {
    if (globalState.isRunning && globalState.lastTickTimestamp !== null) {
      const now = Date.now();
      const delta = now - globalState.lastTickTimestamp;
      setGlobalState((prev) => ({
        ...prev,
        elapsedMs: Math.min(prev.elapsedMs + delta, MAX_ELAPSED_MS),
        lastTickTimestamp: now,
      }));
    }
  }, UPDATE_INTERVAL_MS);
}

/**
 * Stops the global update interval.
 */
function stopGlobalInterval(): void {
  if (globalIntervalId !== null) {
    clearInterval(globalIntervalId);
    globalIntervalId = null;
  }
}

/**
 * Toggles the chronometer between running and paused states.
 */
function toggle(): void {
  debug('Chronometer: toggle called');

  if (globalState.isRunning) {
    // Pause: stop interval, preserve elapsed time
    setGlobalState((prev) => ({
      ...prev,
      isRunning: false,
      lastTickTimestamp: null,
    }));
    stopGlobalInterval();
    debug('Chronometer: paused');
  } else {
    // Start/Resume: begin interval with current timestamp
    setGlobalState((prev) => ({
      ...prev,
      isRunning: true,
      lastTickTimestamp: Date.now(),
    }));
    startGlobalInterval();
    debug('Chronometer: started');
  }
}

/**
 * Resets the chronometer to 00:00:00 and stops it.
 */
function reset(): void {
  debug('Chronometer: reset called');

  setGlobalState(() => ({
    isRunning: false,
    lastTickTimestamp: null,
    elapsedMs: 0,
  }));
  stopGlobalInterval();
  debug('Chronometer: reset to 00:00:00');
}

/**
 * Sets up Tauri event listeners for chronometer hotkeys.
 * Only called once when the first hook instance mounts.
 */
async function setupTauriListeners(): Promise<void> {
  if (tauriListenersSetup) return;
  tauriListenersSetup = true;

  try {
    // Listen for chronometer start/pause hotkey from backend
    unlistenToggle = await listen('chronometer-start-pause', () => {
      debug('Chronometer: received chronometer-start-pause event from backend');
      toggle();
    });

    // Listen for chronometer reset hotkey from backend
    unlistenReset = await listen('chronometer-reset', () => {
      debug('Chronometer: received chronometer-reset event from backend');
      reset();
    });

    debug('Chronometer: Tauri event listeners registered');
  } catch (err) {
    debug(`Chronometer: Failed to setup Tauri event listeners - ${err}`);
    tauriListenersSetup = false;
  }
}

/**
 * Sets up chronometerEvents listeners for webview hotkey capture.
 * Only called once when the first hook instance mounts.
 */
function setupEventEmitterListeners(): void {
  if (eventEmitterListenersSetup) return;
  eventEmitterListenersSetup = true;

  // Listen for toggle events from webview hotkey capture
  unsubscribeToggle = chronometerEvents.on('toggle', () => {
    debug('Chronometer: received toggle event from chronometerEvents');
    toggle();
  });

  // Listen for reset events from webview hotkey capture
  unsubscribeReset = chronometerEvents.on('reset', () => {
    debug('Chronometer: received reset event from chronometerEvents');
    reset();
  });

  debug('Chronometer: Event emitter listeners registered');
}

/**
 * Cleans up all event listeners when no more hook instances exist.
 */
function cleanupAllListeners(): void {
  if (listeners.size > 0) return; // Still have active instances

  // Cleanup Tauri listeners
  unlistenToggle?.();
  unlistenReset?.();
  unlistenToggle = null;
  unlistenReset = null;
  tauriListenersSetup = false;

  // Cleanup event emitter listeners
  unsubscribeToggle?.();
  unsubscribeReset?.();
  unsubscribeToggle = null;
  unsubscribeReset = null;
  eventEmitterListenersSetup = false;

  // Stop interval
  stopGlobalInterval();

  debug('Chronometer: All listeners cleaned up');
}

// ============================================================================
// Hook
// ============================================================================

/**
 * Hook that provides chronometer functionality.
 *
 * All instances of this hook share the same global state, ensuring
 * all chronometer widgets display synchronized time.
 *
 * @returns Chronometer state and control functions
 *
 * @example
 * function ChronometerWidget() {
 *   const { isRunning, formattedTime, toggle, reset } = useChronometer();
 *   return (
 *     <div>
 *       <span>{formattedTime}</span>
 *       <button onClick={toggle}>{isRunning ? 'Pause' : 'Start'}</button>
 *       <button onClick={reset}>Reset</button>
 *     </div>
 *   );
 * }
 */
export function useChronometer(): ChronometerResult {
  // Local state that syncs with global state
  const [, forceUpdate] = useState({});

  // Track if this is the first hook instance
  const isFirstMount = useRef(true);

  // Subscribe to global state changes
  useEffect(() => {
    const listener = () => forceUpdate({});
    listeners.add(listener);

    // Setup event listeners on first mount
    if (isFirstMount.current) {
      isFirstMount.current = false;
      setupTauriListeners();
      setupEventEmitterListeners();
    }

    return () => {
      listeners.delete(listener);
      // Cleanup event listeners when last instance unmounts
      cleanupAllListeners();
    };
  }, []);

  return {
    isRunning: globalState.isRunning,
    elapsedMs: globalState.elapsedMs,
    formattedTime: formatChronometerTime(globalState.elapsedMs),
    toggle,
    reset,
  };
}
