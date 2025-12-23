/**
 * Widget Events System
 *
 * Provides a type-safe event emitter for the decoupled widget system.
 * This enables components to open and close widgets without
 * direct coupling to the WidgetsContext.
 *
 * @feature 027-widget-container
 */

import type {
  IWidgetEventEmitter,
  WidgetEventMap,
  WidgetEventType,
} from '@/types/widgets';

type Handler<T> = (payload: T) => void;

/**
 * Type-safe event emitter for widget events.
 * Implements the pub/sub pattern for decoupled widget management.
 */
class WidgetEventEmitter implements IWidgetEventEmitter {
  private listeners: Map<WidgetEventType, Set<Handler<unknown>>> = new Map();

  /**
   * Emit a widget event to all subscribers.
   */
  emit<T extends WidgetEventType>(event: T, payload: WidgetEventMap[T]): void {
    const handlers = this.listeners.get(event);
    if (handlers) {
      handlers.forEach((handler) => {
        handler(payload);
      });
    }
  }

  /**
   * Subscribe to a widget event.
   * @returns Unsubscribe function
   */
  on<T extends WidgetEventType>(
    event: T,
    handler: (payload: WidgetEventMap[T]) => void
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
   * Subscribe to a widget event for a single emission.
   */
  once<T extends WidgetEventType>(
    event: T,
    handler: (payload: WidgetEventMap[T]) => void
  ): void {
    const unsubscribe = this.on(event, (payload) => {
      unsubscribe();
      handler(payload);
    });
  }

  /**
   * Remove all listeners for a specific event or all events.
   */
  off<T extends WidgetEventType>(event?: T): void {
    if (event) {
      this.listeners.delete(event);
    } else {
      this.listeners.clear();
    }
  }
}

/**
 * Singleton instance of the widget event emitter.
 * Use this for emitting and subscribing to widget events.
 *
 * @example
 * // Open a clock widget
 * widgetEvents.emit('widget:open', { type: 'clock' });
 *
 * // Subscribe to widget close events
 * const unsubscribe = widgetEvents.on('widget:close', ({ widgetId }) => {
 *   console.log('Widget closed:', widgetId);
 * });
 */
export const widgetEvents = new WidgetEventEmitter();
