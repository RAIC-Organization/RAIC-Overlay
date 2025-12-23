/**
 * Widget Types for Widget Container System
 *
 * Defines TypeScript types for widgets - transparent, borderless containers
 * with flip-to-settings animation capability.
 *
 * @feature 027-widget-container
 */

// ============================================================================
// Widget Type Definitions
// ============================================================================

/**
 * Widget content types - extensible for future widgets.
 */
export type WidgetType = 'clock';

/**
 * Runtime widget instance with full state.
 * isFlipped and createdAt are NOT persisted.
 */
export interface WidgetInstance {
  id: string;
  type: WidgetType;
  x: number;
  y: number;
  width: number;
  height: number;
  opacity: number;
  isFlipped: boolean;
  createdAt: number;
}

/**
 * Payload for opening a new widget.
 */
export interface WidgetOpenPayload {
  type: WidgetType;
  initialX?: number;
  initialY?: number;
  initialWidth?: number;
  initialHeight?: number;
  initialOpacity?: number;
  widgetId?: string; // For restoration from persistence
}

/**
 * Payload for closing a widget.
 */
export interface WidgetClosePayload {
  widgetId: string;
}

// ============================================================================
// Widget Event Types
// ============================================================================

/**
 * Event types for widget operations.
 */
export type WidgetEventType = 'widget:open' | 'widget:close';

/**
 * Event map for widget events with typed payloads.
 */
export interface WidgetEventMap {
  'widget:open': WidgetOpenPayload;
  'widget:close': WidgetClosePayload;
}

/**
 * Interface for widget event emitter.
 */
export interface IWidgetEventEmitter {
  emit<T extends WidgetEventType>(event: T, payload: WidgetEventMap[T]): void;
  on<T extends WidgetEventType>(
    event: T,
    handler: (payload: WidgetEventMap[T]) => void
  ): () => void;
  once<T extends WidgetEventType>(
    event: T,
    handler: (payload: WidgetEventMap[T]) => void
  ): void;
  off<T extends WidgetEventType>(event?: T): void;
}

// ============================================================================
// Widget Constants
// ============================================================================

/**
 * Widget system constants for dimensions, timing, and defaults.
 */
export const WIDGET_CONSTANTS = {
  /** Minimum widget width in pixels */
  MIN_WIDTH: 80,
  /** Minimum widget height in pixels */
  MIN_HEIGHT: 60,
  /** Default widget width in pixels */
  DEFAULT_WIDTH: 200,
  /** Default widget height in pixels */
  DEFAULT_HEIGHT: 80,
  /** Minimum visible edge pixels (for visibility constraint) */
  MIN_VISIBLE_EDGE: 30,
  /** Minimum opacity value (10%) */
  MIN_OPACITY: 0.1,
  /** Maximum opacity value (100%) */
  MAX_OPACITY: 1.0,
  /** Default opacity value (60%) */
  DEFAULT_OPACITY: 0.6,
  /** Hold threshold in ms to distinguish click vs drag */
  HOLD_THRESHOLD_MS: 175,
  /** Backflip animation duration in ms */
  FLIP_DURATION_MS: 500,
} as const;

/**
 * Clock widget specific defaults.
 */
export const CLOCK_WIDGET_DEFAULTS = {
  /** Default clock widget width */
  WIDTH: 200,
  /** Default clock widget height */
  HEIGHT: 80,
  /** Default clock widget opacity */
  OPACITY: 0.8,
  /** Clock update interval in ms */
  UPDATE_INTERVAL_MS: 1000,
  /** Minimum font size for clock display */
  MIN_FONT_SIZE: 12,
} as const;

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Generate a unique widget ID.
 */
export function generateWidgetId(): string {
  return `wgt_${crypto.randomUUID()}`;
}

/**
 * Clamp opacity to valid range.
 */
export function clampWidgetOpacity(opacity: number): number {
  return Math.max(
    WIDGET_CONSTANTS.MIN_OPACITY,
    Math.min(WIDGET_CONSTANTS.MAX_OPACITY, opacity)
  );
}

/**
 * Clamp widget dimensions to minimum values.
 */
export function clampWidgetDimensions(
  width: number,
  height: number
): { width: number; height: number } {
  return {
    width: Math.max(WIDGET_CONSTANTS.MIN_WIDTH, width),
    height: Math.max(WIDGET_CONSTANTS.MIN_HEIGHT, height),
  };
}
