/**
 * Persistence Service for State Persistence System
 *
 * Provides a wrapper around Tauri invoke calls for persistence operations.
 * This is the frontend's interface to the Rust persistence backend.
 *
 * @feature 010-state-persistence-system
 */

import { invoke } from '@tauri-apps/api/core';
import type {
  LoadStateResult,
  SaveResult,
  DeleteResult,
  PersistedState,
  WindowContentFile,
} from '@/types/persistence-ipc';

/**
 * Persistence service for interacting with the Rust backend.
 * All methods handle errors internally and return result objects.
 */
export const persistenceService = {
  /**
   * Load all persisted state on startup.
   * Returns the main state file and all window content files.
   */
  async loadState(): Promise<LoadStateResult> {
    try {
      return await invoke<LoadStateResult>('load_state');
    } catch (error) {
      console.error('Failed to invoke load_state:', error);
      return {
        success: false,
        state: null,
        windowContents: [],
        error: String(error),
      };
    }
  },

  /**
   * Save main state file (global settings + window structure).
   * Does not save window content - use saveWindowContent for that.
   */
  async saveState(state: PersistedState): Promise<SaveResult> {
    try {
      return await invoke<SaveResult>('save_state', { state });
    } catch (error) {
      console.error('Failed to invoke save_state:', error);
      return {
        success: false,
        error: String(error),
      };
    }
  },

  /**
   * Save content for a specific window.
   * Called with debounce for high-frequency updates like typing.
   */
  async saveWindowContent(
    windowId: string,
    content: WindowContentFile
  ): Promise<SaveResult> {
    try {
      return await invoke<SaveResult>('save_window_content', {
        windowId,
        content,
      });
    } catch (error) {
      console.error('Failed to invoke save_window_content:', error);
      return {
        success: false,
        error: String(error),
      };
    }
  },

  /**
   * Delete content file for a closed window.
   * Called immediately when a window is closed.
   */
  async deleteWindowContent(windowId: string): Promise<DeleteResult> {
    try {
      return await invoke<DeleteResult>('delete_window_content', { windowId });
    } catch (error) {
      console.error('Failed to invoke delete_window_content:', error);
      return {
        success: false,
        existed: false,
        error: String(error),
      };
    }
  },
};
