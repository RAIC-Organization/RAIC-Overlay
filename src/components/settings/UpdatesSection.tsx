"use client";

/**
 * UpdatesSection Component
 *
 * Displays app version and provides a "Check for Updates" button.
 * Shows inline status messages for update check results.
 *
 * @feature 052-settings-update-button
 */

import { useState, useEffect } from "react";
import { invoke } from "@tauri-apps/api/core";
import { getVersion } from "@tauri-apps/api/app";
import { RefreshCw, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import type { UpdateCheckResult } from "@/types/update";

type StatusType = "idle" | "success" | "error";

interface Status {
  type: StatusType;
  message: string;
}

export function UpdatesSection() {
  const [appVersion, setAppVersion] = useState<string | null>(null);
  const [isChecking, setIsChecking] = useState(false);
  const [status, setStatus] = useState<Status>({ type: "idle", message: "" });

  // Load app version on mount
  useEffect(() => {
    getVersion()
      .then(setAppVersion)
      .catch(() => setAppVersion(null));
  }, []);

  const handleCheckForUpdates = async () => {
    // Clear previous status and set loading state
    setStatus({ type: "idle", message: "" });
    setIsChecking(true);

    try {
      const result = await invoke<UpdateCheckResult>("check_for_updates");

      if (!result.updateAvailable) {
        // No update available - show success message
        setStatus({
          type: "success",
          message: `You're running the latest version${appVersion ? ` (v${appVersion})` : ""}.`,
        });
      }
      // If update is available, the backend automatically opens the update window
    } catch {
      // Network or other error
      setStatus({
        type: "error",
        message: "Unable to check for updates. Please try again later.",
      });
    } finally {
      setIsChecking(false);
    }
  };

  return (
    <section>
      <h2 className="font-display text-xs font-medium uppercase tracking-wide text-muted-foreground mb-3">
        Updates
      </h2>
      <div className="space-y-3">
        {/* Version display */}
        <div className="text-sm text-muted-foreground">
          Current version:{" "}
          <span className="text-foreground">
            {appVersion ? `v${appVersion}` : "Unknown"}
          </span>
        </div>

        {/* Check for Updates button */}
        <button
          onClick={handleCheckForUpdates}
          disabled={isChecking}
          className={cn(
            "flex items-center gap-2 px-3 py-2 rounded",
            "font-display text-sm",
            "sc-glow-transition",
            isChecking
              ? "bg-muted/30 text-muted-foreground cursor-not-allowed"
              : "bg-primary/20 hover:bg-primary/30 border border-border hover:shadow-glow-sm cursor-pointer"
          )}
        >
          {isChecking ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Checking...
            </>
          ) : (
            <>
              <RefreshCw className="w-4 h-4" />
              Check for Updates
            </>
          )}
        </button>

        {/* Inline status message */}
        {status.message && (
          <p
            className={cn(
              "text-xs",
              status.type === "success" && "text-green-400",
              status.type === "error" && "text-red-400"
            )}
          >
            {status.message}
          </p>
        )}
      </div>
    </section>
  );
}
