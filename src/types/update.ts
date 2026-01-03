/**
 * T005 (049): Auto-update TypeScript types
 * @see specs/049-auto-update/data-model.md
 */

/**
 * Persisted update state for tracking check history
 */
export interface UpdateState {
  lastCheckTimestamp: string | null;
  lastNotifiedVersion: string | null;
  pendingInstallerPath: string | null;
}

/**
 * Information about an available update
 */
export interface UpdateInfo {
  version: string;
  currentVersion: string;
  downloadUrl: string;
  downloadSize: number;
  releaseUrl: string;
}

/**
 * Result of checking for updates
 */
export interface UpdateCheckResult {
  updateAvailable: boolean;
  updateInfo: UpdateInfo | null;
}

/**
 * Download progress events from the backend
 */
export type DownloadEvent =
  | { event: 'started'; data: { contentLength: number | null } }
  | { event: 'progress'; data: { bytesDownloaded: number; totalBytes: number } }
  | { event: 'finished'; data: { installerPath: string } }
  | { event: 'error'; data: { message: string } };

/**
 * UI state for the update notification
 */
export type UpdateUIState =
  | 'idle'
  | 'checking'
  | 'available'
  | 'downloading'
  | 'installing'
  | 'error';
