"use client";

/**
 * T013-T019 (051): UpdatePage Component
 *
 * Dedicated update notification window with Settings-like layout.
 * Features draggable header and X close button (behaves like "Ask Again Later").
 *
 * @feature 051-fix-update-popup
 */

import { useEffect, useState, useCallback, useRef } from "react";
import { invoke, Channel } from "@tauri-apps/api/core";
import { listen } from "@tauri-apps/api/event";
import { openUrl } from "@tauri-apps/plugin-opener";
import { exit } from "@tauri-apps/plugin-process";
import { getCurrentWindow } from "@tauri-apps/api/window";
import { X, Download, Clock, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DownloadProgress } from "./DownloadProgress";
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
  // Ref to prevent re-entry in close handler
  const isClosingRef = useRef(false);

  // Format file size for display
  const formatSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

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

  // T017: Handle "Ask Again Later" - also used by X button
  const onLater = useCallback(async () => {
    // Prevent re-entry (fixes infinite loop when close triggers onCloseRequested)
    if (isClosingRef.current) {
      return;
    }

    if (uiState === "downloading" || uiState === "installing") {
      debug("UpdatePage: Cannot dismiss during download/install");
      return;
    }

    if (!updateInfo?.version) return;

    // Set flag to prevent re-entry
    isClosingRef.current = true;

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
  }, [updateInfo, uiState]);

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

  // Handle window close button (native close - e.g., Alt+F4)
  useEffect(() => {
    const setupCloseHandler = async () => {
      const window = getCurrentWindow();
      const unlisten = await window.onCloseRequested(async (event) => {
        // If we're already closing programmatically, let it happen
        if (isClosingRef.current) {
          return; // Don't prevent, let window close
        }

        // User initiated close (e.g., Alt+F4) - handle like "Ask Again Later"
        event.preventDefault();
        await onLater();
      });

      return unlisten;
    };

    const unlistenPromise = setupCloseHandler();

    return () => {
      unlistenPromise.then((unlisten) => unlisten());
    };
  }, [onLater]);

  // Show loading state
  if (isLoading) {
    return (
      <div className="h-screen bg-background/80 backdrop-blur-xl border border-border rounded-lg flex items-center justify-center">
        <p className="font-display text-sm text-muted-foreground">Loading...</p>
      </div>
    );
  }

  // Show nothing if no update info (window will close)
  if (!updateInfo) {
    return null;
  }

  // Render with Settings-like window layout
  return (
    <div className="h-screen bg-background/80 backdrop-blur-xl border border-border rounded-lg overflow-hidden sc-glow-transition sc-corner-accents shadow-glow-sm flex flex-col">
      {/* Draggable header with data-tauri-drag-region */}
      <div
        data-tauri-drag-region
        className="flex items-center justify-between px-3 py-2 border-b border-border bg-muted/50 shrink-0 cursor-move"
      >
        <h1 className="font-display text-sm font-medium uppercase tracking-wide">
          Update Available
        </h1>
        {/* X button - behaves like "Ask Again Later" */}
        <button
          onClick={onLater}
          disabled={uiState === "downloading" || uiState === "installing"}
          className={`p-1 rounded sc-glow-transition ${
            uiState === "downloading" || uiState === "installing"
              ? "opacity-50 cursor-not-allowed"
              : "hover:bg-muted/50 hover:shadow-glow-sm cursor-pointer"
          }`}
          aria-label="Close"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* Content area */}
      <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-4">
        {/* Version info */}
        <div className="flex flex-col gap-1">
          <p className="font-display text-sm text-foreground">
            A new version is available!
          </p>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <span className="font-mono">v{updateInfo.currentVersion}</span>
            <span className="text-primary">→</span>
            <span className="font-mono text-primary font-medium">
              v{updateInfo.version}
            </span>
          </div>
          <p className="text-xs text-muted-foreground">
            Size: {formatSize(updateInfo.downloadSize)}
          </p>
        </div>

        {/* Download progress (shown during download) */}
        {uiState === "downloading" && downloadProgress && (
          <DownloadProgress
            bytesDownloaded={downloadProgress.bytesDownloaded}
            totalBytes={downloadProgress.totalBytes}
          />
        )}

        {/* Installing state */}
        {uiState === "installing" && (
          <div className="flex items-center gap-2 text-sm text-primary">
            <div className="h-4 w-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            <span>Launching installer...</span>
          </div>
        )}

        {/* Error state */}
        {uiState === "error" && error && (
          <div className="p-2 rounded bg-destructive/10 border border-destructive/20">
            <p className="text-xs text-destructive">{error}</p>
          </div>
        )}

        {/* Action buttons */}
        <div className="flex flex-col gap-2">
          {/* Show Accept/Later for available state */}
          {uiState === "available" && (
            <>
              <Button
                onClick={onAccept}
                className="w-full gap-2"
                variant="default"
              >
                <Download className="h-4 w-4" />
                Update Now
              </Button>
              <Button
                onClick={onLater}
                variant="ghost"
                className="w-full gap-2"
              >
                <Clock className="h-4 w-4" />
                Ask Again Later
              </Button>
            </>
          )}

          {/* Show retry for error state */}
          {uiState === "error" && (
            <>
              <Button
                onClick={onRetry}
                className="w-full gap-2"
                variant="default"
              >
                <Download className="h-4 w-4" />
                Retry Download
              </Button>
              <Button
                onClick={onOpenReleasePage}
                variant="ghost"
                className="w-full gap-2"
              >
                <ExternalLink className="h-4 w-4" />
                Manual Download
              </Button>
            </>
          )}

          {/* Show cancel for downloading state */}
          {uiState === "downloading" && (
            <Button
              onClick={onLater}
              variant="ghost"
              className="w-full"
              disabled
            >
              Downloading...
            </Button>
          )}
        </div>

        {/* Release page link (available state only) */}
        {uiState === "available" && (
          <button
            onClick={onOpenReleasePage}
            className="flex items-center gap-1 text-xs text-muted-foreground hover:text-primary sc-glow-transition cursor-pointer"
          >
            <ExternalLink className="h-3 w-3" />
            View release notes
          </button>
        )}
      </div>
    </div>
  );
}
