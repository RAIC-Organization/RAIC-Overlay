"use client";

/**
 * useSessionTimer Hook
 *
 * Tracks session duration by listening to target process lifecycle events.
 * The timer starts when the target process is detected and resets when
 * a new session begins (process restart).
 *
 * Features:
 * - Subscribes to Tauri target-process-detected/terminated events
 * - Updates elapsed time every 1000ms while session is running
 * - Provides formatted time string (HH:MM:SS with >24h support)
 * - Shared state across all timer widget instances
 *
 * @feature 044-session-timer-widget
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import { listen, UnlistenFn } from '@tauri-apps/api/event';
import { debug } from '@/lib/logger';

// ============================================================================
// Types
// ============================================================================

/**
 * Payload from target process events emitted by the Rust backend.
 */
interface ProcessEventPayload {
  process_name: string;
  detected: boolean;
}

/**
 * Internal state for session timer tracking.
 */
interface SessionTimerState {
  /** Whether the target process is currently running */
  isRunning: boolean;
  /** Timestamp (Date.now()) when current session started, null if no session */
  sessionStartTime: number | null;
  /** Current elapsed time in milliseconds (updated every second while running) */
  elapsedMs: number;
  /** Elapsed time from the last completed session (displayed when stopped) */
  lastSessionMs: number;
}

/**
 * Return type for the useSessionTimer hook.
 */
export interface SessionTimerResult {
  /** Whether the target process is currently running */
  isRunning: boolean;
  /** Milliseconds to display (current elapsed or last session) */
  displayMs: number;
  /** Formatted time string (HH:MM:SS) */
  formattedTime: string;
}

// ============================================================================
// Constants
// ============================================================================

/** Timer update interval in milliseconds */
const UPDATE_INTERVAL_MS = 1000;

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Formats elapsed milliseconds as HH:MM:SS string.
 * Supports hours greater than 24 (e.g., "36:15:42").
 *
 * @param ms - Elapsed time in milliseconds
 * @returns Formatted time string (HH:MM:SS)
 */
export function formatElapsedTime(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
}

// ============================================================================
// Singleton State (shared across all hook instances)
// ============================================================================

/**
 * Singleton state to ensure all timer widgets show the same time.
 * This avoids drift between multiple instances and saves resources.
 */
let globalState: SessionTimerState = {
  isRunning: false,
  sessionStartTime: null,
  elapsedMs: 0,
  lastSessionMs: 0,
};

/** Listeners that get notified when global state changes */
const listeners = new Set<() => void>();

/** Reference to the global interval, null when not running */
let globalIntervalId: ReturnType<typeof setInterval> | null = null;

/** Track if event listeners are already set up */
let eventListenersSetup = false;

/** Unlisten functions for cleanup */
let unlistenDetected: UnlistenFn | null = null;
let unlistenTerminated: UnlistenFn | null = null;

/**
 * Updates global state and notifies all listeners.
 */
function setGlobalState(updater: (prev: SessionTimerState) => SessionTimerState): void {
  globalState = updater(globalState);
  listeners.forEach((listener) => listener());
}

/**
 * Starts the global update interval.
 */
function startGlobalInterval(): void {
  if (globalIntervalId !== null) return;

  globalIntervalId = setInterval(() => {
    if (globalState.isRunning && globalState.sessionStartTime !== null) {
      setGlobalState((prev) => ({
        ...prev,
        elapsedMs: Date.now() - (prev.sessionStartTime ?? Date.now()),
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
 * Sets up Tauri event listeners for process lifecycle.
 * Only called once when the first hook instance mounts.
 */
async function setupEventListeners(): Promise<void> {
  if (eventListenersSetup) return;
  eventListenersSetup = true;

  try {
    // Listen for target process detection
    unlistenDetected = await listen<ProcessEventPayload>('target-process-detected', (event) => {
      debug(`Session timer: Process detected - ${event.payload.process_name}`);
      setGlobalState(() => ({
        isRunning: true,
        sessionStartTime: Date.now(),
        elapsedMs: 0,
        lastSessionMs: 0,
      }));
      startGlobalInterval();
    });

    // Listen for target process termination
    unlistenTerminated = await listen<ProcessEventPayload>('target-process-terminated', (event) => {
      debug(`Session timer: Process terminated - ${event.payload.process_name}`);
      setGlobalState((prev) => ({
        ...prev,
        isRunning: false,
        sessionStartTime: null,
        lastSessionMs: prev.elapsedMs,
      }));
      stopGlobalInterval();
    });

    debug('Session timer: Event listeners registered');
  } catch (err) {
    debug(`Session timer: Failed to setup event listeners - ${err}`);
    eventListenersSetup = false;
  }
}

/**
 * Cleans up event listeners when no more hook instances exist.
 */
function cleanupEventListeners(): void {
  if (listeners.size > 0) return; // Still have active instances

  unlistenDetected?.();
  unlistenTerminated?.();
  unlistenDetected = null;
  unlistenTerminated = null;
  eventListenersSetup = false;
  stopGlobalInterval();
  debug('Session timer: Event listeners cleaned up');
}

// ============================================================================
// Hook
// ============================================================================

/**
 * Hook that tracks session duration based on target process lifecycle.
 *
 * All instances of this hook share the same global state, ensuring
 * all timer widgets display synchronized time.
 *
 * @returns Session timer state including formatted time string
 *
 * @example
 * function SessionTimerWidget() {
 *   const { isRunning, formattedTime } = useSessionTimer();
 *   return <span>{formattedTime}</span>;
 * }
 */
export function useSessionTimer(): SessionTimerResult {
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
      setupEventListeners();
    }

    return () => {
      listeners.delete(listener);
      // Cleanup event listeners when last instance unmounts
      cleanupEventListeners();
    };
  }, []);

  // Calculate display value
  const displayMs = globalState.isRunning ? globalState.elapsedMs : globalState.lastSessionMs;

  return {
    isRunning: globalState.isRunning,
    displayMs,
    formattedTime: formatElapsedTime(displayMs),
  };
}
