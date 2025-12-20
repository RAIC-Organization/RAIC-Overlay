"use client";

/**
 * Windows Context
 *
 * Provides state management for the windowing system using React Context
 * and useReducer. This enables multiple windows to be opened, moved,
 * resized, focused, and closed.
 *
 * Extended for persistence support with initial state and content tracking.
 *
 * @feature 007-windows-system
 * @feature 010-state-persistence-system
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
  WindowInstance,
  WindowsState,
  WindowsContextValue,
  WindowOpenPayload,
  WindowContentType,
} from '@/types/windows';
import { WINDOW_CONSTANTS } from '@/types/windows';
import type { PersistedState, WindowContentFile } from '@/types/persistence';

// ============================================================================
// Extended State for Persistence
// ============================================================================

interface ExtendedWindowsState extends WindowsState {
  /** Map of window ID to content for persistence */
  windowContents: Map<string, WindowContentFile>;
}

// ============================================================================
// Extended Context Value for Persistence
// ============================================================================

export interface ExtendedWindowsContextValue extends WindowsContextValue {
  /** Get content for a specific window */
  getWindowContent: (windowId: string) => WindowContentFile | undefined;
  /** Set content for a specific window */
  setWindowContent: (windowId: string, content: WindowContentFile) => void;
  /** Get all window contents for persistence */
  getAllWindowContents: () => Map<string, WindowContentFile>;
  /** Get current state for persistence (excluding content) */
  getStateForPersistence: () => {
    windows: WindowInstance[];
    activeWindowId: string | null;
    nextZIndex: number;
  };
  /** Set opacity for a specific window */
  setWindowOpacity: (windowId: string, opacity: number) => void;
}

// ============================================================================
// Action Types
// ============================================================================

type WindowsAction =
  | { type: 'OPEN_WINDOW'; payload: WindowOpenPayload; id: string }
  | { type: 'CLOSE_WINDOW'; windowId: string }
  | { type: 'FOCUS_WINDOW'; windowId: string }
  | { type: 'MOVE_WINDOW'; windowId: string; x: number; y: number }
  | { type: 'RESIZE_WINDOW'; windowId: string; width: number; height: number }
  | { type: 'SET_WINDOW_CONTENT'; windowId: string; content: WindowContentFile }
  | { type: 'REMOVE_WINDOW_CONTENT'; windowId: string }
  | { type: 'SET_WINDOW_OPACITY'; windowId: string; opacity: number };

// ============================================================================
// Initial State
// ============================================================================

const initialState: ExtendedWindowsState = {
  windows: [],
  activeWindowId: null,
  nextZIndex: WINDOW_CONSTANTS.BASE_Z_INDEX,
  windowContents: new Map(),
};

// ============================================================================
// Reducer
// ============================================================================

function windowsReducer(state: ExtendedWindowsState, action: WindowsAction): ExtendedWindowsState {
  switch (action.type) {
    case 'OPEN_WINDOW': {
      const { payload, id } = action;
      const width = payload.initialWidth ?? WINDOW_CONSTANTS.DEFAULT_WIDTH;
      const height = payload.initialHeight ?? WINDOW_CONSTANTS.DEFAULT_HEIGHT;

      // Use provided position or center the window in the viewport
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

      // Clamp initial opacity to valid range
      const opacity = Math.max(
        WINDOW_CONSTANTS.MIN_OPACITY,
        Math.min(
          WINDOW_CONSTANTS.MAX_OPACITY,
          payload.initialOpacity ?? WINDOW_CONSTANTS.DEFAULT_OPACITY
        )
      );

      const newWindow: WindowInstance = {
        id,
        title: payload.title,
        contentType: payload.contentType,
        component: payload.component,
        componentProps: payload.componentProps,
        x,
        y,
        width,
        height,
        zIndex: payload.initialZIndex ?? state.nextZIndex,
        createdAt: Date.now(),
        opacity,
      };

      return {
        ...state,
        windows: [...state.windows, newWindow],
        activeWindowId: id,
        nextZIndex: Math.max(state.nextZIndex + 1, (payload.initialZIndex ?? 0) + 1),
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

      // Remove content for this window
      const newContents = new Map(state.windowContents);
      newContents.delete(windowId);

      return {
        ...state,
        windows: filteredWindows,
        activeWindowId: newActiveId,
        windowContents: newContents,
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

    case 'SET_WINDOW_CONTENT': {
      const { windowId, content } = action;
      const newContents = new Map(state.windowContents);
      newContents.set(windowId, content);
      return {
        ...state,
        windowContents: newContents,
      };
    }

    case 'REMOVE_WINDOW_CONTENT': {
      const { windowId } = action;
      const newContents = new Map(state.windowContents);
      newContents.delete(windowId);
      return {
        ...state,
        windowContents: newContents,
      };
    }

    case 'SET_WINDOW_OPACITY': {
      const { windowId, opacity } = action;
      const clampedOpacity = Math.max(
        WINDOW_CONSTANTS.MIN_OPACITY,
        Math.min(WINDOW_CONSTANTS.MAX_OPACITY, opacity)
      );

      const updatedWindows = state.windows.map((w) =>
        w.id === windowId ? { ...w, opacity: clampedOpacity } : w
      );

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
 * Generate a unique window ID with win_ prefix for persistence compatibility.
 */
function generateWindowId(): string {
  return `win_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 9)}`;
}

// ============================================================================
// Context
// ============================================================================

const WindowsContext = createContext<ExtendedWindowsContextValue | null>(null);

// ============================================================================
// Provider
// ============================================================================

interface WindowsProviderProps {
  children: ReactNode;
  /** Initial state from hydration */
  initialPersistedState?: PersistedState;
  /** Initial window contents from hydration */
  initialWindowContents?: Map<string, WindowContentFile>;
  /** Callback when a window is closed (for persistence cleanup) */
  onWindowClose?: (windowId: string, contentType?: WindowContentType) => void;
}

export function WindowsProvider({
  children,
  initialPersistedState,
  initialWindowContents,
  onWindowClose,
}: WindowsProviderProps) {
  // Store onWindowClose in a ref to avoid dispatch dependency issues
  const onWindowCloseRef = useRef(onWindowClose);
  onWindowCloseRef.current = onWindowClose;

  // Build initial state from hydrated data
  const getInitialState = (): ExtendedWindowsState => {
    if (!initialPersistedState || initialPersistedState.windows.length === 0) {
      return {
        ...initialState,
        windowContents: initialWindowContents ?? new Map(),
      };
    }

    // We can't restore component references directly from persistence
    // The actual component restoration will happen in app/page.tsx
    // Here we just prepare the structure for the state
    let maxZIndex: number = WINDOW_CONSTANTS.BASE_Z_INDEX;
    for (const w of initialPersistedState.windows) {
      if (w.zIndex > maxZIndex) {
        maxZIndex = w.zIndex;
      }
    }

    return {
      windows: [], // Windows will be opened via openWindow calls
      activeWindowId: null,
      nextZIndex: maxZIndex + 1,
      windowContents: initialWindowContents ?? new Map(),
    };
  };

  const [state, dispatch] = useReducer(windowsReducer, undefined, getInitialState);

  const openWindow = useCallback((payload: WindowOpenPayload): string => {
    const id = payload.windowId ?? generateWindowId();
    dispatch({ type: 'OPEN_WINDOW', payload, id });
    return id;
  }, []);

  const closeWindow = useCallback((windowId: string): void => {
    // Get the window to find its content type before closing
    const window = state.windows.find(w => w.id === windowId);
    dispatch({ type: 'CLOSE_WINDOW', windowId });
    // Notify parent for persistence cleanup
    if (onWindowCloseRef.current && window) {
      onWindowCloseRef.current(windowId, window.contentType);
    }
  }, [state.windows]);

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

  const getWindowContent = useCallback((windowId: string): WindowContentFile | undefined => {
    return state.windowContents.get(windowId);
  }, [state.windowContents]);

  const setWindowContent = useCallback((windowId: string, content: WindowContentFile): void => {
    dispatch({ type: 'SET_WINDOW_CONTENT', windowId, content });
  }, []);

  const getAllWindowContents = useCallback((): Map<string, WindowContentFile> => {
    return state.windowContents;
  }, [state.windowContents]);

  const getStateForPersistence = useCallback(() => {
    return {
      windows: state.windows,
      activeWindowId: state.activeWindowId,
      nextZIndex: state.nextZIndex,
    };
  }, [state.windows, state.activeWindowId, state.nextZIndex]);

  const setWindowOpacity = useCallback((windowId: string, opacity: number): void => {
    dispatch({ type: 'SET_WINDOW_OPACITY', windowId, opacity });
  }, []);

  const value: ExtendedWindowsContextValue = {
    windows: state.windows,
    activeWindowId: state.activeWindowId,
    openWindow,
    closeWindow,
    focusWindow,
    moveWindow,
    resizeWindow,
    getWindowContent,
    setWindowContent,
    getAllWindowContents,
    getStateForPersistence,
    setWindowOpacity,
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
export function useWindows(): ExtendedWindowsContextValue {
  const context = useContext(WindowsContext);

  if (!context) {
    throw new Error('useWindows must be used within a WindowsProvider');
  }

  return context;
}
