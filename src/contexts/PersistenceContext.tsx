"use client";

/**
 * Persistence Context
 *
 * Provides persistence functionality to components throughout the app.
 * Wraps the usePersistence hook and makes it available via context.
 *
 * @feature 010-state-persistence-system
 * @feature 015-browser-persistence
 * @feature 016-file-viewer-window
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
import type { FileType } from '@/types/persistence';
import { serializeNotesContent, serializeDrawContent, serializeBrowserContent, serializeFileViewerContent } from '@/lib/serialization';

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
   * Trigger debounced save for browser content.
   * @feature 015-browser-persistence
   */
  onBrowserContentChange: (windowId: string, url: string, zoom: number) => void;

  /**
   * Trigger debounced save for file viewer content.
   * @feature 016-file-viewer-window
   */
  onFileViewerContentChange: (windowId: string, filePath: string, fileType: FileType, zoom: number) => void;

  /**
   * Handle window close - delete content and save state.
   */
  onWindowClosed: (windowId: string, contentType?: WindowContentType) => void;

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
    saveBrowserContentDebounced,
    saveFileViewerContentDebounced,
    deleteWindowContent,
    flushPendingSaves,
  } = usePersistence({
    overlayMode,
    overlayVisible,
  });

  // Track previous windows to detect added/removed windows
  const prevWindowsRef = useRef<WindowInstance[]>([]);

  // Save state when windows are added or removed
  useEffect(() => {
    const prevWindowIds = new Set(prevWindowsRef.current.map((w) => w.id));
    const currentWindowIds = new Set(windows.map((w) => w.id));

    // Find newly added windows
    const addedWindows = windows.filter((w) => !prevWindowIds.has(w.id));

    // Find removed windows
    const removedWindowIds = Array.from(prevWindowIds).filter(id => !currentWindowIds.has(id));

    // Handle added windows
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
        } else if (win.contentType === 'browser') {
          const content = serializeBrowserContent(win.id, 'https://example.com', 50);
          saveWindowContentImmediate(content);
        }
      }
    }

    // Handle removed windows - save state immediately
    if (removedWindowIds.length > 0) {
      saveStateImmediate(windows);
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

  // Debounced save for browser content
  const onBrowserContentChange = useCallback(
    (windowId: string, url: string, zoom: number) => {
      saveBrowserContentDebounced(windowId, url, zoom);
    },
    [saveBrowserContentDebounced]
  );

  // Debounced save for file viewer content
  const onFileViewerContentChange = useCallback(
    (windowId: string, filePath: string, fileType: FileType, zoom: number) => {
      saveFileViewerContentDebounced(windowId, filePath, fileType, zoom);
    },
    [saveFileViewerContentDebounced]
  );

  // Handle window close - delete content and save state
  const onWindowClosed = useCallback(
    async (windowId: string, contentType?: WindowContentType) => {
      // Only delete content for persistable windows
      if (contentType === 'notes' || contentType === 'draw' || contentType === 'browser' || contentType === 'fileviewer') {
        await deleteWindowContent(windowId);
      }

      // Get updated windows list (window was already removed from state)
      // Save the updated state immediately
      const currentState = getStateForPersistence();
      saveStateImmediate(currentState.windows);
    },
    [deleteWindowContent, saveStateImmediate, getStateForPersistence]
  );

  const value: PersistenceContextValue = {
    onWindowMoved,
    onNotesContentChange,
    onDrawContentChange,
    onBrowserContentChange,
    onFileViewerContentChange,
    onWindowClosed,
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
