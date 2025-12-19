/**
 * Persistence Hook for State Persistence System
 *
 * Provides debounced persistence triggers for auto-saving state.
 * Wraps the persistence service with appropriate debouncing.
 *
 * @feature 010-state-persistence-system
 */

import { useRef, useCallback, useEffect } from 'react';
import { debounce } from '@/lib/debounce';
import { persistenceService } from '@/stores/persistenceService';
import {
  serializeState,
  serializeNotesContent,
  serializeDrawContent,
} from '@/lib/serialization';
import type { WindowInstance } from '@/types/windows';
import type { PersistedState, WindowContentFile } from '@/types/persistence';

const DEBOUNCE_DELAY_MS = 500;

export interface UsePersistenceOptions {
  /** Overlay mode for state serialization */
  overlayMode: 'windowed' | 'fullscreen';
  /** Overlay visibility for state serialization */
  overlayVisible: boolean;
}

export interface UsePersistenceReturn {
  /**
   * Save state immediately (for window create, close, mode changes).
   */
  saveStateImmediate: (windows: WindowInstance[]) => Promise<void>;

  /**
   * Save state with debounce (for position/size changes).
   */
  saveStateDebounced: (windows: WindowInstance[]) => void;

  /**
   * Save window content immediately (for window creation).
   */
  saveWindowContentImmediate: (content: WindowContentFile) => Promise<void>;

  /**
   * Save notes content with debounce (for typing).
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  saveNotesContentDebounced: (windowId: string, content: any) => void;

  /**
   * Save draw content with debounce (for drawing).
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  saveDrawContentDebounced: (windowId: string, elements: any[], appState?: any) => void;

  /**
   * Delete window content (for window close).
   */
  deleteWindowContent: (windowId: string) => Promise<void>;

  /**
   * Flush all pending debounced saves (for app close).
   */
  flushPendingSaves: () => void;

  /**
   * Cancel all pending debounced saves.
   */
  cancelPendingSaves: () => void;
}

/**
 * Hook for managing persistence triggers with appropriate debouncing.
 */
export function usePersistence(options: UsePersistenceOptions): UsePersistenceReturn {
  const { overlayMode, overlayVisible } = options;
  const optionsRef = useRef(options);
  optionsRef.current = options;

  // Create stable debounced functions
  const debouncedStateSaveRef = useRef(
    debounce(async (windows: WindowInstance[], mode: string, visible: boolean) => {
      const state = serializeState(windows, mode as 'windowed' | 'fullscreen', visible);
      const result = await persistenceService.saveState(state);
      if (!result.success) {
        console.error('Failed to save state:', result.error);
      }
    }, DEBOUNCE_DELAY_MS)
  );

  // Per-window content save debounce - one per window
  const windowContentDebounceMap = useRef(
    new Map<
      string,
      ReturnType<typeof debounce<(content: WindowContentFile) => void>>
    >()
  );

  // Get or create debounced save for a window
  const getWindowContentDebounce = useCallback((windowId: string) => {
    let debounceFn = windowContentDebounceMap.current.get(windowId);
    if (!debounceFn) {
      debounceFn = debounce(async (content: WindowContentFile) => {
        const result = await persistenceService.saveWindowContent(windowId, content);
        if (!result.success) {
          console.error(`Failed to save window content ${windowId}:`, result.error);
        }
      }, DEBOUNCE_DELAY_MS);
      windowContentDebounceMap.current.set(windowId, debounceFn);
    }
    return debounceFn;
  }, []);

  // Cleanup debounce on window close
  const cleanupWindowDebounce = useCallback((windowId: string) => {
    const debounceFn = windowContentDebounceMap.current.get(windowId);
    if (debounceFn) {
      debounceFn.cancel();
      windowContentDebounceMap.current.delete(windowId);
    }
  }, []);

  // Save state immediately
  const saveStateImmediate = useCallback(async (windows: WindowInstance[]) => {
    // Cancel any pending debounced save first
    debouncedStateSaveRef.current.cancel();

    const state = serializeState(
      windows,
      optionsRef.current.overlayMode,
      optionsRef.current.overlayVisible
    );
    const result = await persistenceService.saveState(state);
    if (!result.success) {
      console.error('Failed to save state (immediate):', result.error);
    }
  }, []);

  // Save state with debounce
  const saveStateDebounced = useCallback((windows: WindowInstance[]) => {
    debouncedStateSaveRef.current(
      windows,
      optionsRef.current.overlayMode,
      optionsRef.current.overlayVisible
    );
  }, []);

  // Save window content immediately
  const saveWindowContentImmediate = useCallback(async (content: WindowContentFile) => {
    // Cancel any pending debounced save for this window
    const debounceFn = windowContentDebounceMap.current.get(content.windowId);
    if (debounceFn) {
      debounceFn.cancel();
    }

    const result = await persistenceService.saveWindowContent(content.windowId, content);
    if (!result.success) {
      console.error('Failed to save window content (immediate):', result.error);
    }
  }, []);

  // Save notes content with debounce
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const saveNotesContentDebounced = useCallback((windowId: string, content: any) => {
    const debounceFn = getWindowContentDebounce(windowId);
    const contentFile = serializeNotesContent(windowId, content);
    debounceFn(contentFile);
  }, [getWindowContentDebounce]);

  // Save draw content with debounce
  const saveDrawContentDebounced = useCallback(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (windowId: string, elements: any[], appState?: any) => {
      const debounceFn = getWindowContentDebounce(windowId);
      const contentFile = serializeDrawContent(windowId, elements, appState);
      debounceFn(contentFile);
    },
    [getWindowContentDebounce]
  );

  // Delete window content
  const deleteWindowContent = useCallback(async (windowId: string) => {
    // Clean up debounce first
    cleanupWindowDebounce(windowId);

    const result = await persistenceService.deleteWindowContent(windowId);
    if (!result.success) {
      console.error('Failed to delete window content:', result.error);
    }
  }, [cleanupWindowDebounce]);

  // Flush all pending saves
  const flushPendingSaves = useCallback(() => {
    debouncedStateSaveRef.current.flush();
    for (const debounceFn of windowContentDebounceMap.current.values()) {
      debounceFn.flush();
    }
  }, []);

  // Cancel all pending saves
  const cancelPendingSaves = useCallback(() => {
    debouncedStateSaveRef.current.cancel();
    for (const debounceFn of windowContentDebounceMap.current.values()) {
      debounceFn.cancel();
    }
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      // Flush pending saves on unmount (app close)
      debouncedStateSaveRef.current.flush();
      for (const debounceFn of windowContentDebounceMap.current.values()) {
        debounceFn.flush();
      }
    };
  }, []);

  return {
    saveStateImmediate,
    saveStateDebounced,
    saveWindowContentImmediate,
    saveNotesContentDebounced,
    saveDrawContentDebounced,
    deleteWindowContent,
    flushPendingSaves,
    cancelPendingSaves,
  };
}
