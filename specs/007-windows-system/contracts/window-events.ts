/**
 * Window Events Contract
 *
 * Defines the event-based API for the decoupled windows system.
 * These interfaces establish the contract between event emitters (MainMenu)
 * and subscribers (WindowsContainer).
 *
 * @feature 007-windows-system
 * @date 2025-12-18
 */

import type { ComponentType } from 'react';

// ============================================================================
// Event Payloads
// ============================================================================

/**
 * Payload for opening a new window.
 * Emitted by any component that wants to open a window.
 */
export interface WindowOpenPayload {
  /** React component to render inside the window */
  component: ComponentType<unknown>;

  /** Title displayed in window header (interaction mode only) */
  title: string;

  /** Optional props to pass to the component */
  componentProps?: Record<string, unknown>;

  /** Optional override for initial width (default: 400px) */
  initialWidth?: number;

  /** Optional override for initial height (default: 300px) */
  initialHeight?: number;
}

/**
 * Payload for closing a specific window.
 */
export interface WindowClosePayload {
  /** ID of the window to close */
  windowId: string;
}

/**
 * Payload for focusing a specific window.
 */
export interface WindowFocusPayload {
  /** ID of the window to bring to front */
  windowId: string;
}

// ============================================================================
// Event Type Map
// ============================================================================

/**
 * Map of all window event types to their payloads.
 * Used for type-safe event emission and subscription.
 */
export interface WindowEventMap {
  'window:open': WindowOpenPayload;
  'window:close': WindowClosePayload;
  'window:focus': WindowFocusPayload;
}

/**
 * Union type of all window event names.
 */
export type WindowEventType = keyof WindowEventMap;

// ============================================================================
// Event Emitter Interface
// ============================================================================

/**
 * Type-safe event emitter interface for window events.
 */
export interface WindowEventEmitter {
  /**
   * Emit a window event.
   * @param event - Event type
   * @param payload - Event-specific payload
   */
  emit<T extends WindowEventType>(event: T, payload: WindowEventMap[T]): void;

  /**
   * Subscribe to a window event.
   * @param event - Event type to subscribe to
   * @param handler - Callback function for the event
   * @returns Unsubscribe function
   */
  on<T extends WindowEventType>(
    event: T,
    handler: (payload: WindowEventMap[T]) => void
  ): () => void;

  /**
   * Subscribe to a window event for a single emission.
   * @param event - Event type to subscribe to
   * @param handler - Callback function for the event
   */
  once<T extends WindowEventType>(
    event: T,
    handler: (payload: WindowEventMap[T]) => void
  ): void;

  /**
   * Remove all listeners for a specific event or all events.
   * @param event - Optional event type; if omitted, clears all listeners
   */
  off<T extends WindowEventType>(event?: T): void;
}

// ============================================================================
// Window Instance Interface
// ============================================================================

/**
 * Represents a single window instance in the system.
 */
export interface WindowInstance {
  /** Unique identifier */
  id: string;

  /** Window title */
  title: string;

  /** React component rendered in window body */
  component: ComponentType<unknown>;

  /** Props passed to the component */
  componentProps?: Record<string, unknown>;

  /** X position relative to container (pixels) */
  x: number;

  /** Y position relative to container (pixels) */
  y: number;

  /** Width in pixels */
  width: number;

  /** Height in pixels */
  height: number;

  /** Z-index for stacking order */
  zIndex: number;

  /** Creation timestamp */
  createdAt: number;
}

// ============================================================================
// Windows Context Interface
// ============================================================================

/**
 * Interface for the WindowsContext value.
 * Consumed by components to interact with the windows system.
 */
export interface WindowsContextValue {
  /** All currently open windows */
  windows: WindowInstance[];

  /** ID of the currently focused window */
  activeWindowId: string | null;

  /** Open a new window */
  openWindow: (payload: WindowOpenPayload) => string;

  /** Close a window by ID */
  closeWindow: (windowId: string) => void;

  /** Bring a window to front */
  focusWindow: (windowId: string) => void;

  /** Update window position */
  moveWindow: (windowId: string, x: number, y: number) => void;

  /** Update window size */
  resizeWindow: (windowId: string, width: number, height: number) => void;
}

// ============================================================================
// Constants
// ============================================================================

export const WINDOW_CONSTANTS = {
  MIN_WIDTH: 150,
  MIN_HEIGHT: 100,
  DEFAULT_WIDTH: 400,
  DEFAULT_HEIGHT: 300,
  MIN_VISIBLE_EDGE: 50,
  BASE_Z_INDEX: 100,
  HEADER_HEIGHT: 32,
} as const;
