"use client";

/**
 * UpdateNotification Component
 *
 * Displays a notification popup when a new version is available.
 * Users can accept (download and install) or postpone (ask later).
 * Styled with SC HUD theme to match the overlay.
 *
 * T027 (051): Updated to support both overlay popup and dedicated window layouts.
 * When used in the dedicated update window (UpdatePage), the component fills
 * the entire window. When used as an overlay popup (original behavior),
 * it positions fixed in top-right corner.
 *
 * @feature 049-auto-update
 * @feature 051-fix-update-popup
 */

import { motion, AnimatePresence, useReducedMotion } from "motion/react";
import { X, Download, Clock, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { UpdateInfo, DownloadEvent, UpdateUIState } from "@/types/update";
import { DownloadProgress } from "./DownloadProgress";

interface UpdateNotificationProps {
  visible: boolean;
  updateInfo: UpdateInfo | null;
  uiState: UpdateUIState;
  downloadProgress: { bytesDownloaded: number; totalBytes: number } | null;
  error: string | null;
  onAccept: () => void;
  onLater: () => void;
  onDismiss: () => void;
  onRetry: () => void;
  onOpenReleasePage: () => void;
  /** T027 (051): If true, fills container; if false, positions fixed top-right */
  fullWindow?: boolean;
}

export function UpdateNotification({
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
  fullWindow = false,
}: UpdateNotificationProps) {
  const prefersReducedMotion = useReducedMotion();
  const duration = prefersReducedMotion ? 0 : 0.2;

  // T027 (051): Different layout classes for full window vs overlay popup
  const containerClasses = fullWindow
    ? "h-full w-full flex items-center justify-center select-none"
    : "fixed top-4 right-4 z-50 select-none";

  // Format file size for display
  const formatSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <AnimatePresence>
      {visible && updateInfo && (
        <motion.div
          key="update-notification"
          initial={{ opacity: 0, y: -20, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -20, scale: 0.95 }}
          transition={{ duration, ease: "easeOut" }}
          className={containerClasses}
          role="alertdialog"
          aria-modal="true"
          aria-labelledby="update-notification-title"
          aria-describedby="update-notification-description"
        >
          {/* SC-themed container with liquid glass effect */}
          <div className="relative w-80 border border-border rounded-lg overflow-hidden sc-glow-transition sc-corner-accents shadow-glow-sm bg-background/90 backdrop-blur-xl">
            {/* Window header */}
            <div className="flex items-center justify-between px-3 py-2 border-b border-border bg-muted/50">
              <h2
                id="update-notification-title"
                className="font-display text-sm font-medium uppercase tracking-wide"
              >
                Update Available
              </h2>
              <button
                onClick={onDismiss}
                className="p-1 rounded sc-glow-transition hover:bg-muted/50 hover:shadow-glow-sm cursor-pointer"
                aria-label="Close"
                disabled={uiState === "downloading" || uiState === "installing"}
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Content area */}
            <div className="p-4 flex flex-col gap-4">
              {/* Version info */}
              <div className="flex flex-col gap-1">
                <p
                  id="update-notification-description"
                  className="font-display text-sm text-foreground"
                >
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
                    onClick={onDismiss}
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
        </motion.div>
      )}
    </AnimatePresence>
  );
}
