/**
 * Serialization Utilities for State Persistence System
 *
 * Provides functions to convert between in-memory state and
 * persisted state formats.
 *
 * @feature 010-state-persistence-system
 */

import type { WindowInstance, WindowContentType } from '@/types/windows';
import { WINDOW_CONSTANTS } from '@/types/windows';
import type {
  PersistedState,
  WindowStructure,
  WindowType,
  WindowContentFile,
  NotesContent,
  DrawContent,
} from '@/types/persistence';
import { CURRENT_STATE_VERSION, DEFAULT_WINDOW_FLAGS } from '@/types/persistence';

// ============================================================================
// Migration Hooks (for future versions)
// ============================================================================

/**
 * Migration function type for upgrading state between versions.
 * Each migration upgrades state from version N to version N+1.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Migration = (state: any) => any;

/**
 * Map of migrations keyed by the version they upgrade FROM.
 * For example, migrations[1] upgrades from v1 to v2.
 *
 * Currently empty - will be populated when v2 is introduced.
 */
export const migrations: Record<number, Migration> = {
  // Example for future use:
  // 1: (state) => ({
  //   ...state,
  //   version: 2,
  //   newFieldAddedInV2: 'default value',
  // }),
};

/**
 * Apply migrations to upgrade state to the current version.
 * Currently unused - state is reset on version mismatch.
 *
 * @param state - The persisted state to migrate
 * @param fromVersion - The version of the persisted state
 * @returns Migrated state or null if migration failed
 */
export function migrateState(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  state: any,
  fromVersion: number
): PersistedState | null {
  let currentState = state;
  let version = fromVersion;

  while (version < CURRENT_STATE_VERSION) {
    const migration = migrations[version];
    if (!migration) {
      console.warn(`No migration found for version ${version}`);
      return null;
    }
    currentState = migration(currentState);
    version++;
  }

  return currentState as PersistedState;
}

// ============================================================================
// Window Serialization
// ============================================================================

/**
 * Convert window content type to persisted window type.
 */
function contentTypeToWindowType(contentType?: WindowContentType): WindowType | null {
  switch (contentType) {
    case 'notes':
      return 'notes';
    case 'draw':
      return 'draw';
    default:
      // 'test' and undefined are not persisted
      return null;
  }
}

/**
 * Serialize a WindowInstance to WindowStructure for persistence.
 * Returns null for non-persistable windows (test windows, etc).
 */
export function serializeWindow(win: WindowInstance): WindowStructure | null {
  const windowType = contentTypeToWindowType(win.contentType);

  // Skip windows that shouldn't be persisted
  if (!windowType) {
    return null;
  }

  return {
    id: win.id,
    type: windowType,
    position: {
      x: Math.round(win.x),
      y: Math.round(win.y),
    },
    size: {
      width: Math.round(win.width),
      height: Math.round(win.height),
    },
    zIndex: win.zIndex,
    flags: DEFAULT_WINDOW_FLAGS, // Currently not tracking minimized/maximized
    opacity: win.opacity ?? WINDOW_CONSTANTS.DEFAULT_OPACITY,
  };
}

/**
 * Clamp opacity value to valid range.
 */
function clampOpacity(opacity: number | undefined): number {
  if (opacity === undefined) return WINDOW_CONSTANTS.DEFAULT_OPACITY;
  return Math.max(
    WINDOW_CONSTANTS.MIN_OPACITY,
    Math.min(WINDOW_CONSTANTS.MAX_OPACITY, opacity)
  );
}

/**
 * Serialize current state to PersistedState format.
 */
export function serializeState(
  windows: WindowInstance[],
  overlayMode: 'windowed' | 'fullscreen',
  overlayVisible: boolean
): PersistedState {
  const persistableWindows = windows
    .map(serializeWindow)
    .filter((w): w is WindowStructure => w !== null);

  return {
    version: CURRENT_STATE_VERSION,
    lastModified: new Date().toISOString(),
    global: {
      overlayMode,
      overlayVisible,
    },
    windows: persistableWindows,
  };
}

// ============================================================================
// Content Serialization
// ============================================================================

/**
 * Create a WindowContentFile for notes content.
 */
export function serializeNotesContent(
  windowId: string,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  content: any
): WindowContentFile {
  return {
    windowId,
    type: 'notes',
    content: content as NotesContent,
    lastModified: new Date().toISOString(),
  };
}

/**
 * Create a WindowContentFile for draw content.
 */
export function serializeDrawContent(
  windowId: string,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  elements: any[],
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  appState?: any
): WindowContentFile {
  const content: DrawContent = {
    elements,
  };

  // Only include relevant app state properties
  if (appState?.viewBackgroundColor) {
    content.appState = {
      viewBackgroundColor: appState.viewBackgroundColor,
    };
  }

  return {
    windowId,
    type: 'draw',
    content,
    lastModified: new Date().toISOString(),
  };
}
