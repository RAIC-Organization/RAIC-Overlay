/**
 * Persistence Hook for State Persistence System
 *
 * Provides debounced persistence triggers for auto-saving state.
 * Wraps the persistence service with appropriate debouncing.
 *
 * @feature 010-state-persistence-system
 * @feature 015-browser-persistence
 * @feature 016-file-viewer-window
 */

import { useRef, useCallback, useEffect } from 'react';
import { debounce } from '@/lib/debounce';
import { persistenceService } from '@/stores/persistenceService';
import {
  serializeState,
  serializeNotesContent,
  serializeDrawContent,
  serializeBrowserContent,
  serializeFileViewerContent,
} from '@/lib/serialization';
import type { WindowInstance } from '@/types/windows';
import type { WindowContentFile, FileType } from '@/types/persistence';

const DEBOUNCE_DELAY_MS = 500;

// Performance metrics for T045/T045a
const persistenceMetrics = {
  rawStateChanges: 0,
  actualStateSaves: 0,
  rawContentChanges: 0,
  actualContentSaves: 0,

  recordStateChange() {
    this.rawStateChanges++;
  },

  recordStateSave() {
    this.actualStateSaves++;
  },

  recordContentChange() {
    this.rawContentChanges++;
  },

  recordContentSave() {
    this.actualContentSaves++;
  },

  getStats() {
    const stateReduction = this.rawStateChanges > 0
      ? ((1 - this.actualStateSaves / this.rawStateChanges) * 100).toFixed(1)
      : '0.0';
    const contentReduction = this.rawContentChanges > 0
      ? ((1 - this.actualContentSaves / this.rawContentChanges) * 100).toFixed(1)
      : '0.0';
    return {
      rawStateChanges: this.rawStateChanges,
      actualStateSaves: this.actualStateSaves,
      stateReductionPercent: stateReduction,
      rawContentChanges: this.rawContentChanges,
      actualContentSaves: this.actualContentSaves,
      contentReductionPercent: contentReduction,
    };
  },

  reset() {
    this.rawStateChanges = 0;
    this.actualStateSaves = 0;
    this.rawContentChanges = 0;
    this.actualContentSaves = 0;
  },
};

// Export for testing/debugging
if (typeof window !== 'undefined') {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (window as any).__persistenceMetrics = persistenceMetrics;
}

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
   * Save browser content with debounce (for URL/zoom changes).
   * @feature 015-browser-persistence
   */
  saveBrowserContentDebounced: (windowId: string, url: string, zoom: number) => void;

  /**
   * Save file viewer content with debounce (for file open/zoom changes).
   * @feature 016-file-viewer-window
   */
  saveFileViewerContentDebounced: (windowId: string, filePath: string, fileType: FileType, zoom: number) => void;

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
  const optionsRef = useRef(options);
  optionsRef.current = options;

  // Create stable debounced functions
  const debouncedStateSaveRef = useRef(
    debounce(async (windows: WindowInstance[], mode: string, visible: boolean) => {
      const startTime = performance.now();
      persistenceMetrics.recordStateSave();
      const state = serializeState(windows, mode as 'windowed' | 'fullscreen', visible);
      const result = await persistenceService.saveState(state);
      const elapsed = performance.now() - startTime;
      if (!result.success) {
        console.error('Failed to save state:', result.error);
      } else {
        console.log(`State saved in ${elapsed.toFixed(0)}ms (${windows.length} windows)`);
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
        const startTime = performance.now();
        persistenceMetrics.recordContentSave();
        const result = await persistenceService.saveWindowContent(windowId, content);
        const elapsed = performance.now() - startTime;
        if (!result.success) {
          console.error(`Failed to save window content ${windowId}:`, result.error);
        } else {
          console.log(`Window content ${windowId} saved in ${elapsed.toFixed(0)}ms`);
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
    persistenceMetrics.recordStateChange();
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
    persistenceMetrics.recordContentChange();
    const debounceFn = getWindowContentDebounce(windowId);
    const contentFile = serializeNotesContent(windowId, content);
    debounceFn(contentFile);
  }, [getWindowContentDebounce]);

  // Save draw content with debounce
  const saveDrawContentDebounced = useCallback(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (windowId: string, elements: any[], appState?: any) => {
      persistenceMetrics.recordContentChange();
      const debounceFn = getWindowContentDebounce(windowId);
      const contentFile = serializeDrawContent(windowId, elements, appState);
      debounceFn(contentFile);
    },
    [getWindowContentDebounce]
  );

  // Save browser content with debounce
  const saveBrowserContentDebounced = useCallback(
    (windowId: string, url: string, zoom: number) => {
      persistenceMetrics.recordContentChange();
      const debounceFn = getWindowContentDebounce(windowId);
      const contentFile = serializeBrowserContent(windowId, url, zoom);
      debounceFn(contentFile);
    },
    [getWindowContentDebounce]
  );

  // Save file viewer content with debounce
  const saveFileViewerContentDebounced = useCallback(
    (windowId: string, filePath: string, fileType: FileType, zoom: number) => {
      persistenceMetrics.recordContentChange();
      const debounceFn = getWindowContentDebounce(windowId);
      const contentFile = serializeFileViewerContent(windowId, filePath, fileType, zoom);
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
    const stats = persistenceMetrics.getStats();
    console.log(
      `Flushing persistence - Debounce efficiency: state ${stats.stateReductionPercent}% reduction (${stats.rawStateChanges} raw → ${stats.actualStateSaves} saves), ` +
      `content ${stats.contentReductionPercent}% reduction (${stats.rawContentChanges} raw → ${stats.actualContentSaves} saves)`
    );
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
    // Capture refs for cleanup
    const stateSaveDebounce = debouncedStateSaveRef.current;
    const contentDebounceMap = windowContentDebounceMap.current;

    return () => {
      // Log metrics and flush pending saves on unmount (app close)
      const stats = persistenceMetrics.getStats();
      console.log(
        `Persistence session stats - Debounce efficiency: state ${stats.stateReductionPercent}% reduction (${stats.rawStateChanges} raw → ${stats.actualStateSaves} saves), ` +
        `content ${stats.contentReductionPercent}% reduction (${stats.rawContentChanges} raw → ${stats.actualContentSaves} saves)`
      );
      stateSaveDebounce.flush();
      for (const debounceFn of contentDebounceMap.values()) {
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
    saveBrowserContentDebounced,
    saveFileViewerContentDebounced,
    deleteWindowContent,
    flushPendingSaves,
    cancelPendingSaves,
  };
}
