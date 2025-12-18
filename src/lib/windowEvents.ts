/**
 * Window Events System
 *
 * Provides a type-safe event emitter for the decoupled windows system.
 * This enables components to open, close, and focus windows without
 * direct coupling to the WindowsContext.
 *
 * @feature 007-windows-system
 */

import type {
  IWindowEventEmitter,
  WindowEventMap,
  WindowEventType,
} from '@/types/windows';

type Handler<T> = (payload: T) => void;

/**
 * Type-safe event emitter for window events.
 * Implements the pub/sub pattern for decoupled window management.
 */
class WindowEventEmitter implements IWindowEventEmitter {
  private listeners: Map<WindowEventType, Set<Handler<unknown>>> = new Map();

  /**
   * Emit a window event to all subscribers.
   */
  emit<T extends WindowEventType>(event: T, payload: WindowEventMap[T]): void {
    const handlers = this.listeners.get(event);
    if (handlers) {
      handlers.forEach((handler) => {
        handler(payload);
      });
    }
  }

  /**
   * Subscribe to a window event.
   * @returns Unsubscribe function
   */
  on<T extends WindowEventType>(
    event: T,
    handler: (payload: WindowEventMap[T]) => void
  ): () => void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }

    const handlers = this.listeners.get(event)!;
    handlers.add(handler as Handler<unknown>);

    // Return unsubscribe function
    return () => {
      handlers.delete(handler as Handler<unknown>);
      if (handlers.size === 0) {
        this.listeners.delete(event);
      }
    };
  }

  /**
   * Subscribe to a window event for a single emission.
   */
  once<T extends WindowEventType>(
    event: T,
    handler: (payload: WindowEventMap[T]) => void
  ): void {
    const unsubscribe = this.on(event, (payload) => {
      unsubscribe();
      handler(payload);
    });
  }

  /**
   * Remove all listeners for a specific event or all events.
   */
  off<T extends WindowEventType>(event?: T): void {
    if (event) {
      this.listeners.delete(event);
    } else {
      this.listeners.clear();
    }
  }
}

/**
 * Singleton instance of the window event emitter.
 * Use this for emitting and subscribing to window events.
 *
 * @example
 * // Open a window
 * windowEvents.emit('window:open', {
 *   component: MyComponent,
 *   title: 'My Window',
 * });
 *
 * // Subscribe to window close events
 * const unsubscribe = windowEvents.on('window:close', ({ windowId }) => {
 *   console.log('Window closed:', windowId);
 * });
 */
export const windowEvents = new WindowEventEmitter();
