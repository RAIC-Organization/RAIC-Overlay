"use client";

/**
 * Widgets Context
 *
 * Provides state management for the widget system using React Context
 * and useReducer. This enables transparent, borderless widgets to be
 * opened, moved, resized, and closed. Widgets support flip animation
 * to reveal settings.
 *
 * @feature 027-widget-container
 */

import {
  createContext,
  useContext,
  useReducer,
  useCallback,
  useRef,
  type ReactNode,
} from 'react';
import type {
  WidgetInstance,
  WidgetOpenPayload,
  WidgetType,
} from '@/types/widgets';
import {
  WIDGET_CONSTANTS,
  generateWidgetId,
  clampWidgetOpacity,
  clampWidgetDimensions,
} from '@/types/widgets';

// ============================================================================
// State Types
// ============================================================================

interface WidgetsState {
  widgets: WidgetInstance[];
  activeWidgetId: string | null;
}

// ============================================================================
// Context Value Types
// ============================================================================

export interface WidgetsContextValue {
  widgets: WidgetInstance[];
  activeWidgetId: string | null;
  openWidget: (payload: WidgetOpenPayload) => string;
  closeWidget: (widgetId: string) => void;
  moveWidget: (widgetId: string, x: number, y: number) => void;
  resizeWidget: (widgetId: string, width: number, height: number) => void;
  setWidgetOpacity: (widgetId: string, opacity: number) => void;
  setWidgetFlipped: (widgetId: string, isFlipped: boolean) => void;
  focusWidget: (widgetId: string) => void;
  getStateForPersistence: () => {
    widgets: WidgetInstance[];
    activeWidgetId: string | null;
  };
}

// ============================================================================
// Action Types
// ============================================================================

type WidgetsAction =
  | { type: 'OPEN_WIDGET'; payload: WidgetOpenPayload; id: string }
  | { type: 'CLOSE_WIDGET'; widgetId: string }
  | { type: 'MOVE_WIDGET'; widgetId: string; x: number; y: number }
  | { type: 'RESIZE_WIDGET'; widgetId: string; width: number; height: number }
  | { type: 'SET_WIDGET_OPACITY'; widgetId: string; opacity: number }
  | { type: 'SET_WIDGET_FLIPPED'; widgetId: string; isFlipped: boolean }
  | { type: 'FOCUS_WIDGET'; widgetId: string };

// ============================================================================
// Initial State
// ============================================================================

const initialState: WidgetsState = {
  widgets: [],
  activeWidgetId: null,
};

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Get default dimensions for a widget type.
 */
function getDefaultDimensions(type: WidgetType): { width: number; height: number } {
  switch (type) {
    case 'clock':
      return { width: 200, height: 80 };
    default:
      return { width: WIDGET_CONSTANTS.DEFAULT_WIDTH, height: WIDGET_CONSTANTS.DEFAULT_HEIGHT };
  }
}

/**
 * Get default opacity for a widget type.
 */
function getDefaultOpacity(type: WidgetType): number {
  switch (type) {
    case 'clock':
      return 0.8;
    default:
      return WIDGET_CONSTANTS.DEFAULT_OPACITY;
  }
}

/**
 * Constrain position to keep widget partially visible.
 */
function constrainPosition(
  value: number,
  size: number,
  axis: 'x' | 'y'
): number {
  if (typeof window === 'undefined') return value;

  const viewportSize = axis === 'x' ? window.innerWidth : window.innerHeight;
  const minVisible = WIDGET_CONSTANTS.MIN_VISIBLE_EDGE;

  // Minimum: at least minVisible pixels visible on the positive side
  const min = -size + minVisible;
  // Maximum: at least minVisible pixels visible on the negative side
  const max = viewportSize - minVisible;

  // For y-axis, don't allow going above the container
  if (axis === 'y') {
    return Math.max(0, Math.min(value, max));
  }

  return Math.max(min, Math.min(value, max));
}

// ============================================================================
// Reducer
// ============================================================================

function widgetsReducer(state: WidgetsState, action: WidgetsAction): WidgetsState {
  switch (action.type) {
    case 'OPEN_WIDGET': {
      const { payload, id } = action;
      const defaults = getDefaultDimensions(payload.type);

      const width = payload.initialWidth ?? defaults.width;
      const height = payload.initialHeight ?? defaults.height;

      // Use provided position or center the widget in the viewport
      let x: number;
      let y: number;

      if (payload.initialX !== undefined && payload.initialY !== undefined) {
        x = payload.initialX;
        y = payload.initialY;
      } else {
        const viewportWidth = typeof window !== 'undefined' ? window.innerWidth : 800;
        const viewportHeight = typeof window !== 'undefined' ? window.innerHeight : 600;
        x = Math.max(0, (viewportWidth - width) / 2);
        y = Math.max(0, (viewportHeight - height) / 2);
      }

      const opacity = clampWidgetOpacity(
        payload.initialOpacity ?? getDefaultOpacity(payload.type)
      );

      const newWidget: WidgetInstance = {
        id,
        type: payload.type,
        x,
        y,
        width,
        height,
        opacity,
        isFlipped: false,
        createdAt: Date.now(),
      };

      return {
        ...state,
        widgets: [...state.widgets, newWidget],
        activeWidgetId: id,
      };
    }

    case 'CLOSE_WIDGET': {
      const { widgetId } = action;
      const filteredWidgets = state.widgets.filter((w) => w.id !== widgetId);

      // If we closed the active widget, activate the most recent remaining widget
      let newActiveId = state.activeWidgetId;
      if (state.activeWidgetId === widgetId) {
        if (filteredWidgets.length > 0) {
          // Find the most recently created widget
          const topWidget = filteredWidgets.reduce((prev, curr) =>
            curr.createdAt > prev.createdAt ? curr : prev
          );
          newActiveId = topWidget.id;
        } else {
          newActiveId = null;
        }
      }

      return {
        ...state,
        widgets: filteredWidgets,
        activeWidgetId: newActiveId,
      };
    }

    case 'MOVE_WIDGET': {
      const { widgetId, x, y } = action;

      const updatedWidgets = state.widgets.map((w) => {
        if (w.id !== widgetId) return w;

        // Apply position constraints
        const constrainedX = constrainPosition(x, w.width, 'x');
        const constrainedY = constrainPosition(y, w.height, 'y');

        return { ...w, x: constrainedX, y: constrainedY };
      });

      return {
        ...state,
        widgets: updatedWidgets,
      };
    }

    case 'RESIZE_WIDGET': {
      const { widgetId, width, height } = action;

      const updatedWidgets = state.widgets.map((w) => {
        if (w.id !== widgetId) return w;

        // Apply size constraints
        const constrained = clampWidgetDimensions(width, height);

        return { ...w, width: constrained.width, height: constrained.height };
      });

      return {
        ...state,
        widgets: updatedWidgets,
      };
    }

    case 'SET_WIDGET_OPACITY': {
      const { widgetId, opacity } = action;
      const clampedOpacity = clampWidgetOpacity(opacity);

      const updatedWidgets = state.widgets.map((w) =>
        w.id === widgetId ? { ...w, opacity: clampedOpacity } : w
      );

      return {
        ...state,
        widgets: updatedWidgets,
      };
    }

    case 'SET_WIDGET_FLIPPED': {
      const { widgetId, isFlipped } = action;

      const updatedWidgets = state.widgets.map((w) =>
        w.id === widgetId ? { ...w, isFlipped } : w
      );

      return {
        ...state,
        widgets: updatedWidgets,
      };
    }

    case 'FOCUS_WIDGET': {
      const { widgetId } = action;
      const widgetExists = state.widgets.some((w) => w.id === widgetId);

      if (!widgetExists) {
        return state;
      }

      return {
        ...state,
        activeWidgetId: widgetId,
      };
    }

    default:
      return state;
  }
}

// ============================================================================
// Context
// ============================================================================

const WidgetsContext = createContext<WidgetsContextValue | null>(null);

// ============================================================================
// Provider
// ============================================================================

interface WidgetsProviderProps {
  children: ReactNode;
}

export function WidgetsProvider({ children }: WidgetsProviderProps) {
  const [state, dispatch] = useReducer(widgetsReducer, initialState);

  // Ref to always have access to current state (avoids stale closures)
  const stateRef = useRef(state);
  stateRef.current = state;

  const openWidget = useCallback((payload: WidgetOpenPayload): string => {
    const id = payload.widgetId ?? generateWidgetId();
    dispatch({ type: 'OPEN_WIDGET', payload, id });
    return id;
  }, []);

  const closeWidget = useCallback((widgetId: string): void => {
    dispatch({ type: 'CLOSE_WIDGET', widgetId });
  }, []);

  const moveWidget = useCallback((widgetId: string, x: number, y: number): void => {
    dispatch({ type: 'MOVE_WIDGET', widgetId, x, y });
  }, []);

  const resizeWidget = useCallback((widgetId: string, width: number, height: number): void => {
    dispatch({ type: 'RESIZE_WIDGET', widgetId, width, height });
  }, []);

  const setWidgetOpacity = useCallback((widgetId: string, opacity: number): void => {
    dispatch({ type: 'SET_WIDGET_OPACITY', widgetId, opacity });
  }, []);

  const setWidgetFlipped = useCallback((widgetId: string, isFlipped: boolean): void => {
    dispatch({ type: 'SET_WIDGET_FLIPPED', widgetId, isFlipped });
  }, []);

  const focusWidget = useCallback((widgetId: string): void => {
    dispatch({ type: 'FOCUS_WIDGET', widgetId });
  }, []);

  // Use stateRef to always get current state, avoiding stale closure issues
  const getStateForPersistence = useCallback(() => {
    return {
      widgets: stateRef.current.widgets,
      activeWidgetId: stateRef.current.activeWidgetId,
    };
  }, []);

  const value: WidgetsContextValue = {
    widgets: state.widgets,
    activeWidgetId: state.activeWidgetId,
    openWidget,
    closeWidget,
    moveWidget,
    resizeWidget,
    setWidgetOpacity,
    setWidgetFlipped,
    focusWidget,
    getStateForPersistence,
  };

  return (
    <WidgetsContext.Provider value={value}>{children}</WidgetsContext.Provider>
  );
}

// ============================================================================
// Hook
// ============================================================================

/**
 * Hook to access the widgets context.
 * @throws Error if used outside of WidgetsProvider
 */
export function useWidgets(): WidgetsContextValue {
  const context = useContext(WidgetsContext);

  if (!context) {
    throw new Error('useWidgets must be used within a WidgetsProvider');
  }

  return context;
}
