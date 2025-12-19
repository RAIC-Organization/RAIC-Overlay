/**
 * Persistence IPC Types for State Persistence System
 *
 * Defines the TypeScript types for IPC communication between the
 * frontend and Rust backend for persistence operations.
 *
 * @feature 010-state-persistence-system
 */

import type { PersistedState, WindowContentFile } from './persistence';

// ============================================================================
// IPC Result Types
// ============================================================================

/**
 * Result of loading persisted state from disk.
 */
export interface LoadStateResult {
  success: boolean;
  state: PersistedState | null;
  windowContents: WindowContentFile[];
  error?: string;
}

/**
 * Result of saving state or window content to disk.
 */
export interface SaveResult {
  success: boolean;
  error?: string;
}

/**
 * Result of deleting window content from disk.
 */
export interface DeleteResult {
  success: boolean;
  existed: boolean;
  error?: string;
}

// ============================================================================
// Re-exports for convenience
// ============================================================================

export type { PersistedState, WindowContentFile } from './persistence';
