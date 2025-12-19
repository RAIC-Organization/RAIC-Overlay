/**
 * Hydration Hook for State Persistence System
 *
 * Loads persisted state on application startup and provides
 * hydration status for blocking UI render until complete.
 *
 * @feature 010-state-persistence-system
 */

import { useState, useEffect } from 'react';
import { persistenceService } from '@/stores/persistenceService';
import type { PersistedState, WindowContentFile } from '@/types/persistence';
import {
  CURRENT_STATE_VERSION,
  DEFAULT_PERSISTED_STATE,
} from '@/types/persistence';

export interface HydrationResult {
  /** Whether hydration is complete */
  isHydrated: boolean;
  /** The hydrated state (or defaults if none/error) */
  state: PersistedState;
  /** Map of window ID to content */
  windowContents: Map<string, WindowContentFile>;
  /** Error message if hydration failed */
  error: string | null;
  /** Whether state was reset due to version mismatch */
  wasReset: boolean;
}

/**
 * Hook to load persisted state on application startup.
 *
 * Blocks until hydration is complete, then provides the hydrated state.
 * Falls back to defaults on error or version mismatch.
 */
export function useHydration(): HydrationResult {
  const [result, setResult] = useState<HydrationResult>({
    isHydrated: false,
    state: DEFAULT_PERSISTED_STATE,
    windowContents: new Map(),
    error: null,
    wasReset: false,
  });

  useEffect(() => {
    async function hydrate() {
      const startTime = performance.now();

      try {
        const loadResult = await persistenceService.loadState();

        // Handle load failure
        if (!loadResult.success) {
          console.error('Failed to load state:', loadResult.error);
          setResult({
            isHydrated: true,
            state: DEFAULT_PERSISTED_STATE,
            windowContents: new Map(),
            error: loadResult.error || 'Unknown error',
            wasReset: false,
          });
          return;
        }

        // No persisted state - use defaults
        if (!loadResult.state) {
          const elapsed = performance.now() - startTime;
          console.log(`Hydration complete (no saved state) in ${elapsed.toFixed(0)}ms`);
          setResult({
            isHydrated: true,
            state: DEFAULT_PERSISTED_STATE,
            windowContents: new Map(),
            error: null,
            wasReset: false,
          });
          return;
        }

        // Version check - reset to defaults on mismatch
        if (loadResult.state.version !== CURRENT_STATE_VERSION) {
          console.warn(
            `State version mismatch: saved version ${loadResult.state.version} vs current ${CURRENT_STATE_VERSION}. Resetting to defaults.`
          );
          setResult({
            isHydrated: true,
            state: DEFAULT_PERSISTED_STATE,
            windowContents: new Map(),
            error: null,
            wasReset: true,
          });
          return;
        }

        // Build window contents map
        const contentMap = new Map<string, WindowContentFile>();
        for (const content of loadResult.windowContents) {
          contentMap.set(content.windowId, content);
        }

        const elapsed = performance.now() - startTime;
        console.log(
          `Hydration complete in ${elapsed.toFixed(0)}ms: ${loadResult.state.windows.length} windows, ${contentMap.size} content files`
        );

        setResult({
          isHydrated: true,
          state: loadResult.state,
          windowContents: contentMap,
          error: null,
          wasReset: false,
        });
      } catch (err) {
        console.error('Hydration error:', err);
        setResult({
          isHydrated: true,
          state: DEFAULT_PERSISTED_STATE,
          windowContents: new Map(),
          error: String(err),
          wasReset: false,
        });
      }
    }

    hydrate();
  }, []);

  return result;
}
