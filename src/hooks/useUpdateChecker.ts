"use client";

/**
 * useUpdateChecker Hook
 *
 * @deprecated T026 (051): This hook is deprecated in favor of the dedicated update window.
 * The update window is now opened directly by the backend (checker.rs) when an update
 * is found. This allows update notifications to appear regardless of overlay visibility.
 *
 * This hook is kept for backward compatibility and potential manual trigger use.
 * The `checkForUpdates` export can be used to manually trigger an update check.
 *
 * @see app/update/page.tsx - Dedicated update window route
 * @see src/components/update/UpdatePage.tsx - Update window component
 *
 * Original features (now handled by dedicated window):
 * - Checks for updates on app startup (after 3 second delay)
 * - Checks every 24 hours while app is running
 * - Manages download progress via Tauri Channel events
 * - Cleans up old installers on startup
 * - Persists dismissed version state
 *
 * @feature 049-auto-update
 * @feature 051-fix-update-popup
 */

import { useState, useEffect, useRef, useCallback } from "react";
import { invoke, Channel } from "@tauri-apps/api/core";
import { openUrl } from "@tauri-apps/plugin-opener";
import { exit } from "@tauri-apps/plugin-process";
import { debug, error as logError, info } from "@/lib/logger";
import type {
  UpdateInfo,
  UpdateCheckResult,
  DownloadEvent,
  UpdateUIState,
} from "@/types/update";

// ============================================================================
// Constants
// ============================================================================

/** Delay before first update check (ms) - gives app time to initialize */
const INITIAL_CHECK_DELAY_MS = 3000;

/** Interval between update checks (ms) - 24 hours */
const CHECK_INTERVAL_MS = 24 * 60 * 60 * 1000;

// ============================================================================
// Types
// ============================================================================

/**
 * Return type for the useUpdateChecker hook.
 */
export interface UpdateCheckerResult {
  /** Whether the notification popup should be visible */
  visible: boolean;
  /** Information about the available update (if any) */
  updateInfo: UpdateInfo | null;
  /** Current UI state */
  uiState: UpdateUIState;
  /** Download progress (if downloading) */
  downloadProgress: { bytesDownloaded: number; totalBytes: number } | null;
  /** Error message (if any) */
  error: string | null;
  /** Accept the update (start download) */
  onAccept: () => void;
  /** Postpone the update (ask again later) */
  onLater: () => void;
  /** Dismiss the notification */
  onDismiss: () => void;
  /** Retry failed download */
  onRetry: () => void;
  /** Open release page in browser */
  onOpenReleasePage: () => void;
  /** Manually trigger update check */
  checkForUpdates: () => void;
}

// ============================================================================
// Hook
// ============================================================================

/**
 * Hook that manages the entire update lifecycle.
 *
 * @returns Update checker state and actions
 *
 * @example
 * function App() {
 *   const update = useUpdateChecker();
 *   return (
 *     <>
 *       <UpdateNotification
 *         visible={update.visible}
 *         updateInfo={update.updateInfo}
 *         uiState={update.uiState}
 *         // ... other props
 *       />
 *       <YourAppContent />
 *     </>
 *   );
 * }
 */
export function useUpdateChecker(): UpdateCheckerResult {
  // State
  const [visible, setVisible] = useState(false);
  const [updateInfo, setUpdateInfo] = useState<UpdateInfo | null>(null);
  const [uiState, setUiState] = useState<UpdateUIState>("idle");
  const [downloadProgress, setDownloadProgress] = useState<{
    bytesDownloaded: number;
    totalBytes: number;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Refs for cleanup and state tracking
  const checkIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const installerPathRef = useRef<string | null>(null);
  // Ref to track blocked state without causing re-renders
  const isCheckBlockedRef = useRef(false);

  // Keep the ref in sync with uiState
  useEffect(() => {
    isCheckBlockedRef.current = uiState === "downloading" || uiState === "installing";
  }, [uiState]);

  // Cleanup old installers on mount
  useEffect(() => {
    const cleanup = async () => {
      try {
        await invoke("cleanup_old_installers");
        debug("Update: Cleaned up old installers");
      } catch (err) {
        debug(`Update: Failed to cleanup old installers: ${err}`);
      }
    };
    cleanup();
  }, []);

  // Check for updates function - uses ref to avoid dependency on uiState
  const checkForUpdates = useCallback(async () => {
    if (isCheckBlockedRef.current) {
      debug("Update: Skipping check - download/install in progress");
      return;
    }

    setUiState("checking");
    debug("Update: Checking for updates...");

    try {
      const result = await invoke<UpdateCheckResult>("check_for_updates");

      if (result.updateAvailable && result.updateInfo) {
        info(
          `Update: New version available: ${result.updateInfo.version}`
        );
        setUpdateInfo(result.updateInfo);
        setUiState("available");
        setVisible(true);
        setError(null);
      } else {
        debug("Update: No updates available");
        setUiState("idle");
      }
    } catch (err) {
      logError(`Update: Check failed: ${err}`);
      setUiState("idle");
    }
  }, []); // No dependencies - uses ref for state check

  // Setup initial check and interval - runs only once on mount
  useEffect(() => {
    // Initial delayed check
    const initialTimeout = setTimeout(() => {
      checkForUpdates();
    }, INITIAL_CHECK_DELAY_MS);

    // Periodic checks every 24 hours
    checkIntervalRef.current = setInterval(() => {
      checkForUpdates();
    }, CHECK_INTERVAL_MS);

    return () => {
      clearTimeout(initialTimeout);
      if (checkIntervalRef.current) {
        clearInterval(checkIntervalRef.current);
      }
    };
  }, [checkForUpdates]); // checkForUpdates is now stable (empty deps)

  // Accept update - start download
  const onAccept = useCallback(async () => {
    if (!updateInfo?.downloadUrl) return;

    setUiState("downloading");
    setDownloadProgress({ bytesDownloaded: 0, totalBytes: updateInfo.downloadSize });
    setError(null);

    info(`Update: Starting download from ${updateInfo.downloadUrl}`);

    try {
      // Create channel for progress events
      const channel = new Channel<DownloadEvent>();

      channel.onmessage = (event: DownloadEvent) => {
        debug(`Update: Download event: ${event.event}`);

        switch (event.event) {
          case "started":
            if (event.data.contentLength) {
              setDownloadProgress((prev) => ({
                bytesDownloaded: prev?.bytesDownloaded ?? 0,
                totalBytes: event.data.contentLength!,
              }));
            }
            break;

          case "progress":
            setDownloadProgress({
              bytesDownloaded: event.data.bytesDownloaded,
              totalBytes: event.data.totalBytes,
            });
            break;

          case "finished":
            info(`Update: Download complete: ${event.data.installerPath}`);
            installerPathRef.current = event.data.installerPath;
            launchInstaller(event.data.installerPath);
            break;

          case "error":
            logError(`Update: Download failed: ${event.data.message}`);
            setError(event.data.message);
            setUiState("error");
            break;
        }
      };

      // Start download
      await invoke("download_update", {
        url: updateInfo.downloadUrl,
        onEvent: channel,
      });
    } catch (err) {
      logError(`Update: Download invocation failed: ${err}`);
      setError(String(err));
      setUiState("error");
    }
  }, [updateInfo]);

  // Launch installer and exit
  const launchInstaller = async (installerPath: string) => {
    setUiState("installing");
    info(`Update: Launching installer: ${installerPath}`);

    try {
      await invoke("launch_installer_and_exit", { installerPath });
      // App should exit, but just in case:
      await exit(0);
    } catch (err) {
      logError(`Update: Failed to launch installer: ${err}`);
      setError(`Failed to launch installer: ${err}`);
      setUiState("error");
    }
  };

  // Postpone update
  const onLater = useCallback(async () => {
    if (!updateInfo?.version) return;

    debug(`Update: Postponing update for version ${updateInfo.version}`);

    try {
      await invoke("dismiss_update", { version: updateInfo.version });
    } catch (err) {
      debug(`Update: Failed to save dismissed state: ${err}`);
    }

    setVisible(false);
    setUiState("idle");
  }, [updateInfo]);

  // Dismiss notification (T033: behaves like "Ask Again Later")
  const onDismiss = useCallback(async () => {
    if (uiState === "downloading" || uiState === "installing") {
      debug("Update: Cannot dismiss during download/install");
      return;
    }

    // T033: X button/click outside behaves like "Ask Again Later"
    if (updateInfo?.version) {
      try {
        await invoke("dismiss_update", { version: updateInfo.version });
      } catch (err) {
        debug(`Update: Failed to save dismissed state: ${err}`);
      }
    }

    setVisible(false);
    setUiState("idle");
  }, [uiState, updateInfo]);

  // Retry download
  const onRetry = useCallback(() => {
    onAccept();
  }, [onAccept]);

  // Open release page
  const onOpenReleasePage = useCallback(async () => {
    if (!updateInfo?.releaseUrl) return;

    try {
      await openUrl(updateInfo.releaseUrl);
    } catch (err) {
      debug(`Update: Failed to open release page: ${err}`);
    }
  }, [updateInfo]);

  return {
    visible,
    updateInfo,
    uiState,
    downloadProgress,
    error,
    onAccept,
    onLater,
    onDismiss,
    onRetry,
    onOpenReleasePage,
    checkForUpdates,
  };
}
