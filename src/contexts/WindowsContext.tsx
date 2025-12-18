"use client";

/**
 * Windows Context
 *
 * Provides state management for the windowing system using React Context
 * and useReducer. This enables multiple windows to be opened, moved,
 * resized, focused, and closed.
 *
 * @feature 007-windows-system
 */

import {
  createContext,
  useContext,
  useReducer,
  useCallback,
  type ReactNode,
} from 'react';
import type {
  WindowInstance,
  WindowsState,
  WindowsContextValue,
  WindowOpenPayload,
} from '@/types/windows';
import { WINDOW_CONSTANTS } from '@/types/windows';

// ============================================================================
// Action Types
// ============================================================================

type WindowsAction =
  | { type: 'OPEN_WINDOW'; payload: WindowOpenPayload; id: string }
  | { type: 'CLOSE_WINDOW'; windowId: string }
  | { type: 'FOCUS_WINDOW'; windowId: string }
  | { type: 'MOVE_WINDOW'; windowId: string; x: number; y: number }
  | { type: 'RESIZE_WINDOW'; windowId: string; width: number; height: number };

// ============================================================================
// Initial State
// ============================================================================

const initialState: WindowsState = {
  windows: [],
  activeWindowId: null,
  nextZIndex: WINDOW_CONSTANTS.BASE_Z_INDEX,
};

// ============================================================================
// Reducer
// ============================================================================

function windowsReducer(state: WindowsState, action: WindowsAction): WindowsState {
  switch (action.type) {
    case 'OPEN_WINDOW': {
      const { payload, id } = action;
      const width = payload.initialWidth ?? WINDOW_CONSTANTS.DEFAULT_WIDTH;
      const height = payload.initialHeight ?? WINDOW_CONSTANTS.DEFAULT_HEIGHT;

      // Center the window in the viewport
      // We'll use window dimensions; actual centering will be refined in container
      const viewportWidth = typeof window !== 'undefined' ? window.innerWidth : 800;
      const viewportHeight = typeof window !== 'undefined' ? window.innerHeight : 600;

      const x = Math.max(0, (viewportWidth - width) / 2);
      const y = Math.max(0, (viewportHeight - height) / 2);

      const newWindow: WindowInstance = {
        id,
        title: payload.title,
        component: payload.component,
        componentProps: payload.componentProps,
        x,
        y,
        width,
        height,
        zIndex: state.nextZIndex,
        createdAt: Date.now(),
      };

      return {
        ...state,
        windows: [...state.windows, newWindow],
        activeWindowId: id,
        nextZIndex: state.nextZIndex + 1,
      };
    }

    case 'CLOSE_WINDOW': {
      const { windowId } = action;
      const filteredWindows = state.windows.filter((w) => w.id !== windowId);

      // If we closed the active window, activate the top-most remaining window
      let newActiveId = state.activeWindowId;
      if (state.activeWindowId === windowId) {
        if (filteredWindows.length > 0) {
          // Find the window with highest z-index
          const topWindow = filteredWindows.reduce((prev, curr) =>
            curr.zIndex > prev.zIndex ? curr : prev
          );
          newActiveId = topWindow.id;
        } else {
          newActiveId = null;
        }
      }

      return {
        ...state,
        windows: filteredWindows,
        activeWindowId: newActiveId,
      };
    }

    case 'FOCUS_WINDOW': {
      const { windowId } = action;
      const windowExists = state.windows.some((w) => w.id === windowId);

      if (!windowExists) {
        return state;
      }

      // Bring the window to front by assigning the next z-index
      const updatedWindows = state.windows.map((w) =>
        w.id === windowId ? { ...w, zIndex: state.nextZIndex } : w
      );

      return {
        ...state,
        windows: updatedWindows,
        activeWindowId: windowId,
        nextZIndex: state.nextZIndex + 1,
      };
    }

    case 'MOVE_WINDOW': {
      const { windowId, x, y } = action;

      const updatedWindows = state.windows.map((w) => {
        if (w.id !== windowId) return w;

        // Apply position constraints
        const constrainedX = constrainPosition(x, w.width, 'x');
        const constrainedY = constrainPosition(y, w.height, 'y');

        return { ...w, x: constrainedX, y: constrainedY };
      });

      return {
        ...state,
        windows: updatedWindows,
      };
    }

    case 'RESIZE_WINDOW': {
      const { windowId, width, height } = action;

      const updatedWindows = state.windows.map((w) => {
        if (w.id !== windowId) return w;

        // Apply size constraints
        const constrainedWidth = Math.max(WINDOW_CONSTANTS.MIN_WIDTH, width);
        const constrainedHeight = Math.max(WINDOW_CONSTANTS.MIN_HEIGHT, height);

        return { ...w, width: constrainedWidth, height: constrainedHeight };
      });

      return {
        ...state,
        windows: updatedWindows,
      };
    }

    default:
      return state;
  }
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Constrain position to keep window partially visible.
 */
function constrainPosition(
  value: number,
  size: number,
  axis: 'x' | 'y'
): number {
  if (typeof window === 'undefined') return value;

  const viewportSize = axis === 'x' ? window.innerWidth : window.innerHeight;
  const minVisible = WINDOW_CONSTANTS.MIN_VISIBLE_EDGE;

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

/**
 * Generate a unique window ID.
 */
function generateWindowId(): string {
  return `window-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

// ============================================================================
// Context
// ============================================================================

const WindowsContext = createContext<WindowsContextValue | null>(null);

// ============================================================================
// Provider
// ============================================================================

interface WindowsProviderProps {
  children: ReactNode;
}

export function WindowsProvider({ children }: WindowsProviderProps) {
  const [state, dispatch] = useReducer(windowsReducer, initialState);

  const openWindow = useCallback((payload: WindowOpenPayload): string => {
    const id = generateWindowId();
    dispatch({ type: 'OPEN_WINDOW', payload, id });
    return id;
  }, []);

  const closeWindow = useCallback((windowId: string): void => {
    dispatch({ type: 'CLOSE_WINDOW', windowId });
  }, []);

  const focusWindow = useCallback((windowId: string): void => {
    dispatch({ type: 'FOCUS_WINDOW', windowId });
  }, []);

  const moveWindow = useCallback((windowId: string, x: number, y: number): void => {
    dispatch({ type: 'MOVE_WINDOW', windowId, x, y });
  }, []);

  const resizeWindow = useCallback(
    (windowId: string, width: number, height: number): void => {
      dispatch({ type: 'RESIZE_WINDOW', windowId, width, height });
    },
    []
  );

  const value: WindowsContextValue = {
    windows: state.windows,
    activeWindowId: state.activeWindowId,
    openWindow,
    closeWindow,
    focusWindow,
    moveWindow,
    resizeWindow,
  };

  return (
    <WindowsContext.Provider value={value}>{children}</WindowsContext.Provider>
  );
}

// ============================================================================
// Hook
// ============================================================================

/**
 * Hook to access the windows context.
 * @throws Error if used outside of WindowsProvider
 */
export function useWindows(): WindowsContextValue {
  const context = useContext(WindowsContext);

  if (!context) {
    throw new Error('useWindows must be used within a WindowsProvider');
  }

  return context;
}
