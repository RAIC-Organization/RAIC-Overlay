"use client";

/**
 * Persistence Context
 *
 * Provides persistence functionality to components throughout the app.
 * Wraps the usePersistence hook and makes it available via context.
 *
 * @feature 010-state-persistence-system
 */

import {
  createContext,
  useContext,
  useCallback,
  useEffect,
  useRef,
  type ReactNode,
} from 'react';
import { usePersistence } from '@/hooks/usePersistence';
import { useWindows } from '@/contexts/WindowsContext';
import type { WindowInstance, WindowContentType } from '@/types/windows';
import type { WindowContentFile } from '@/types/persistence';
import { serializeNotesContent, serializeDrawContent } from '@/lib/serialization';

// ============================================================================
// Context Value Interface
// ============================================================================

export interface PersistenceContextValue {
  /**
   * Trigger debounced save after window position/size change.
   */
  onWindowMoved: () => void;

  /**
   * Trigger debounced save for notes content.
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  onNotesContentChange: (windowId: string, content: any) => void;

  /**
   * Trigger debounced save for draw content.
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  onDrawContentChange: (windowId: string, elements: any[], appState?: any) => void;

  /**
   * Flush all pending saves (call before app close).
   */
  flushPendingSaves: () => void;
}

// ============================================================================
// Context
// ============================================================================

const PersistenceContext = createContext<PersistenceContextValue | null>(null);

// ============================================================================
// Provider
// ============================================================================

interface PersistenceProviderProps {
  children: ReactNode;
  /** Current overlay mode */
  overlayMode: 'windowed' | 'fullscreen';
  /** Current overlay visibility */
  overlayVisible: boolean;
  /** Callback when a window is closed (for cleanup) */
  onWindowDelete?: (windowId: string) => void;
}

export function PersistenceProvider({
  children,
  overlayMode,
  overlayVisible,
  onWindowDelete,
}: PersistenceProviderProps) {
  const { windows, getStateForPersistence } = useWindows();
  const onWindowDeleteRef = useRef(onWindowDelete);
  onWindowDeleteRef.current = onWindowDelete;

  const {
    saveStateImmediate,
    saveStateDebounced,
    saveWindowContentImmediate,
    saveNotesContentDebounced,
    saveDrawContentDebounced,
    deleteWindowContent,
    flushPendingSaves,
  } = usePersistence({
    overlayMode,
    overlayVisible,
  });

  // Track previous windows to detect new windows
  const prevWindowsRef = useRef<WindowInstance[]>([]);

  // Save state immediately when windows are added
  useEffect(() => {
    const prevWindowIds = new Set(prevWindowsRef.current.map((w) => w.id));
    const currentWindowIds = new Set(windows.map((w) => w.id));

    // Find newly added windows
    const addedWindows = windows.filter((w) => !prevWindowIds.has(w.id));

    if (addedWindows.length > 0) {
      // Save state immediately for new windows
      saveStateImmediate(windows);

      // Save initial empty content for new windows
      for (const win of addedWindows) {
        if (win.contentType === 'notes') {
          const content = serializeNotesContent(win.id, { type: 'doc', content: [] });
          saveWindowContentImmediate(content);
        } else if (win.contentType === 'draw') {
          const content = serializeDrawContent(win.id, []);
          saveWindowContentImmediate(content);
        }
      }
    }

    prevWindowsRef.current = windows;
  }, [windows, saveStateImmediate, saveWindowContentImmediate]);

  // Save state immediately when overlay mode changes
  const prevModeRef = useRef(overlayMode);
  useEffect(() => {
    if (prevModeRef.current !== overlayMode) {
      prevModeRef.current = overlayMode;
      saveStateImmediate(windows);
    }
  }, [overlayMode, windows, saveStateImmediate]);

  // Debounced save for position/size changes
  const onWindowMoved = useCallback(() => {
    saveStateDebounced(windows);
  }, [windows, saveStateDebounced]);

  // Debounced save for notes content
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const onNotesContentChange = useCallback((windowId: string, content: any) => {
    saveNotesContentDebounced(windowId, content);
  }, [saveNotesContentDebounced]);

  // Debounced save for draw content
  const onDrawContentChange = useCallback(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (windowId: string, elements: any[], appState?: any) => {
      saveDrawContentDebounced(windowId, elements, appState);
    },
    [saveDrawContentDebounced]
  );

  const value: PersistenceContextValue = {
    onWindowMoved,
    onNotesContentChange,
    onDrawContentChange,
    flushPendingSaves,
  };

  return (
    <PersistenceContext.Provider value={value}>
      {children}
    </PersistenceContext.Provider>
  );
}

// ============================================================================
// Hook
// ============================================================================

/**
 * Hook to access persistence context.
 * Returns null if used outside PersistenceProvider (for optional usage).
 */
export function usePersistenceContext(): PersistenceContextValue | null {
  return useContext(PersistenceContext);
}

/**
 * Hook to access persistence context.
 * Throws if used outside PersistenceProvider.
 */
export function usePersistenceRequired(): PersistenceContextValue {
  const context = useContext(PersistenceContext);
  if (!context) {
    throw new Error('usePersistenceRequired must be used within a PersistenceProvider');
  }
  return context;
}
