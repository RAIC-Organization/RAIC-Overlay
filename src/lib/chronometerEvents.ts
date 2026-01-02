"use client";

/**
 * Chronometer Event Emitter
 *
 * Simple event emitter for chronometer toggle and reset events.
 * Provides type-safe pub/sub for synchronizing chronometer state
 * across multiple widget instances.
 *
 * @feature 045-chronometer-widget
 */

// ============================================================================
// Types
// ============================================================================

/**
 * Event types for chronometer operations.
 */
export type ChronometerEventType = 'toggle' | 'reset';

/**
 * Event handler callback type.
 */
export type ChronometerEventHandler = () => void;

// ============================================================================
// Event Emitter Implementation
// ============================================================================

/**
 * Map of event type to array of handlers.
 */
const eventHandlers = new Map<ChronometerEventType, Set<ChronometerEventHandler>>();

/**
 * Subscribes a handler to a chronometer event.
 *
 * @param event - The event type to subscribe to
 * @param handler - Callback function to invoke when event is emitted
 * @returns Cleanup function to unsubscribe
 *
 * @example
 * const unsubscribe = chronometerEvents.on('toggle', () => {
 *   console.log('Toggle event received');
 * });
 * // Later...
 * unsubscribe();
 */
function on(event: ChronometerEventType, handler: ChronometerEventHandler): () => void {
  if (!eventHandlers.has(event)) {
    eventHandlers.set(event, new Set());
  }

  const handlers = eventHandlers.get(event)!;
  handlers.add(handler);

  return () => {
    handlers.delete(handler);
    if (handlers.size === 0) {
      eventHandlers.delete(event);
    }
  };
}

/**
 * Emits a chronometer event to all subscribed handlers.
 *
 * @param event - The event type to emit
 *
 * @example
 * chronometerEvents.emit('toggle'); // Start/pause chronometer
 * chronometerEvents.emit('reset');  // Reset to 00:00:00
 */
function emit(event: ChronometerEventType): void {
  const handlers = eventHandlers.get(event);
  if (handlers) {
    handlers.forEach((handler) => handler());
  }
}

/**
 * Removes all handlers for a specific event or all events.
 *
 * @param event - Optional event type to clear, clears all if not provided
 */
function off(event?: ChronometerEventType): void {
  if (event) {
    eventHandlers.delete(event);
  } else {
    eventHandlers.clear();
  }
}

/**
 * Chronometer event emitter for pub/sub pattern.
 *
 * @example
 * // Subscribe to toggle events
 * const unsubscribe = chronometerEvents.on('toggle', handleToggle);
 *
 * // Emit events (from hotkey handlers, etc.)
 * chronometerEvents.emit('toggle');
 * chronometerEvents.emit('reset');
 *
 * // Cleanup
 * unsubscribe();
 */
export const chronometerEvents = {
  on,
  emit,
  off,
};
