"use client";

/**
 * T013-T019 (051): UpdatePage Component
 *
 * Page wrapper for the dedicated update notification window.
 * Fetches update info from backend state and renders the UpdateNotification component.
 *
 * Features:
 * - Loads update info via get_pending_update command on mount
 * - Listens for update-info-changed events to refresh displayed info
 * - Handles accept/later/dismiss actions via Tauri commands
 * - Manages download progress and error states
 *
 * @feature 051-fix-update-popup
 */

import { useEffect, useState, useCallback, useRef } from "react";
import { invoke, Channel } from "@tauri-apps/api/core";
import { listen } from "@tauri-apps/api/event";
import { openUrl } from "@tauri-apps/plugin-opener";
import { exit } from "@tauri-apps/plugin-process";
import { getCurrentWindow } from "@tauri-apps/api/window";
import { UpdateNotification } from "./UpdateNotification";
import { debug, error as logError, info as logInfo } from "@/lib/logger";
import type { UpdateInfo, DownloadEvent, UpdateUIState } from "@/types/update";

export function UpdatePage() {
  // State
  const [updateInfo, setUpdateInfo] = useState<UpdateInfo | null>(null);
  const [uiState, setUiState] = useState<UpdateUIState>("idle");
  const [downloadProgress, setDownloadProgress] = useState<{
    bytesDownloaded: number;
    totalBytes: number;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Ref for installer path
  const installerPathRef = useRef<string | null>(null);

  // T014: Load update info on mount
  useEffect(() => {
    const loadUpdateInfo = async () => {
      try {
        debug("UpdatePage: Fetching pending update info...");
        const info = await invoke<UpdateInfo | null>("get_pending_update");
        if (info) {
          setUpdateInfo(info);
          setUiState("available");
          logInfo(`UpdatePage: Loaded update info - v${info.currentVersion} -> v${info.version}`);
        } else {
          debug("UpdatePage: No pending update info available");
          // Close the window if no update info
          await invoke("close_update_window", { dismiss: false });
        }
      } catch (err) {
        logError(`UpdatePage: Failed to load update info: ${err}`);
        // Close the window on error
        await invoke("close_update_window", { dismiss: false });
      } finally {
        setIsLoading(false);
      }
    };

    loadUpdateInfo();
  }, []);

  // T014a: Listen for update-info-changed event to refresh displayed info
  useEffect(() => {
    const setupListener = async () => {
      const unlisten = await listen("update-info-changed", async () => {
        debug("UpdatePage: Received update-info-changed event, refreshing...");
        try {
          const info = await invoke<UpdateInfo | null>("get_pending_update");
          if (info) {
            setUpdateInfo(info);
            setUiState("available");
            setError(null);
          }
        } catch (err) {
          logError(`UpdatePage: Failed to refresh update info: ${err}`);
        }
      });

      return unlisten;
    };

    const unlistenPromise = setupListener();

    return () => {
      unlistenPromise.then((unlisten) => unlisten());
    };
  }, []);

  // T016: Handle accept (start download)
  const onAccept = useCallback(async () => {
    if (!updateInfo?.downloadUrl) return;

    setUiState("downloading");
    setDownloadProgress({
      bytesDownloaded: 0,
      totalBytes: updateInfo.downloadSize,
    });
    setError(null);

    logInfo(`UpdatePage: Starting download from ${updateInfo.downloadUrl}`);

    try {
      // Create channel for progress events
      const channel = new Channel<DownloadEvent>();

      channel.onmessage = (event: DownloadEvent) => {
        debug(`UpdatePage: Download event: ${event.event}`);

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
            logInfo(`UpdatePage: Download complete: ${event.data.installerPath}`);
            installerPathRef.current = event.data.installerPath;
            launchInstaller(event.data.installerPath);
            break;

          case "error":
            logError(`UpdatePage: Download failed: ${event.data.message}`);
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
      logError(`UpdatePage: Download invocation failed: ${err}`);
      setError(String(err));
      setUiState("error");
    }
  }, [updateInfo]);

  // Launch installer and exit
  const launchInstaller = async (installerPath: string) => {
    setUiState("installing");
    logInfo(`UpdatePage: Launching installer: ${installerPath}`);

    try {
      await invoke("launch_installer_and_exit", { installerPath });
      // App should exit, but just in case:
      await exit(0);
    } catch (err) {
      logError(`UpdatePage: Failed to launch installer: ${err}`);
      setError(`Failed to launch installer: ${err}`);
      setUiState("error");
    }
  };

  // T017: Handle "Ask Again Later"
  const onLater = useCallback(async () => {
    if (!updateInfo?.version) return;

    debug(`UpdatePage: User chose 'Ask Again Later' for version ${updateInfo.version}`);

    try {
      // Dismiss the update (persists to state)
      await invoke("dismiss_update", { version: updateInfo.version });
    } catch (err) {
      debug(`UpdatePage: Failed to save dismissed state: ${err}`);
    }

    // T019: Log window close event
    logInfo("UpdatePage: Window closed via 'Ask Again Later'");

    // Close the window
    await invoke("close_update_window", { dismiss: true });
  }, [updateInfo]);

  // T018: Handle dismiss (X button)
  const onDismiss = useCallback(async () => {
    if (uiState === "downloading" || uiState === "installing") {
      debug("UpdatePage: Cannot dismiss during download/install");
      return;
    }

    // Dismiss behaves like "Ask Again Later" per FR-008
    if (updateInfo?.version) {
      try {
        await invoke("dismiss_update", { version: updateInfo.version });
      } catch (err) {
        debug(`UpdatePage: Failed to save dismissed state: ${err}`);
      }
    }

    // T019: Log window close event
    logInfo("UpdatePage: Window dismissed via X button");

    // Close the window
    await invoke("close_update_window", { dismiss: true });
  }, [uiState, updateInfo]);

  // Handle retry
  const onRetry = useCallback(() => {
    onAccept();
  }, [onAccept]);

  // Handle open release page
  const onOpenReleasePage = useCallback(async () => {
    if (!updateInfo?.releaseUrl) return;

    try {
      await openUrl(updateInfo.releaseUrl);
    } catch (err) {
      debug(`UpdatePage: Failed to open release page: ${err}`);
    }
  }, [updateInfo]);

  // Handle window close button (native close)
  useEffect(() => {
    const setupCloseHandler = async () => {
      const window = getCurrentWindow();
      const unlisten = await window.onCloseRequested(async (event) => {
        // Prevent default close
        event.preventDefault();
        // Use our dismiss handler
        await onDismiss();
      });

      return unlisten;
    };

    const unlistenPromise = setupCloseHandler();

    return () => {
      unlistenPromise.then((unlisten) => unlisten());
    };
  }, [onDismiss]);

  // Show loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-background/90 backdrop-blur-xl">
        <div className="text-muted-foreground">Loading...</div>
      </div>
    );
  }

  // Show nothing if no update info (window will close)
  if (!updateInfo) {
    return null;
  }

  // Render the update notification as full window content
  // T027 (051): Use fullWindow mode to fill the dedicated window
  return (
    <div className="h-screen overflow-hidden bg-background/90 backdrop-blur-xl">
      <UpdateNotification
        visible={true}
        updateInfo={updateInfo}
        uiState={uiState}
        downloadProgress={downloadProgress}
        error={error}
        onAccept={onAccept}
        onLater={onLater}
        onDismiss={onDismiss}
        onRetry={onRetry}
        onOpenReleasePage={onOpenReleasePage}
        fullWindow={true}
      />
    </div>
  );
}
