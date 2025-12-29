"use client";

/**
 * AutoStartToggle Component
 *
 * Toggle switch for enabling/disabling Windows startup auto-launch.
 * Uses tauri-plugin-autostart for Registry integration.
 *
 * @feature 038-settings-panel
 */

import { useState, useEffect } from "react";
import { enable, disable, isEnabled } from "@tauri-apps/plugin-autostart";

interface AutoStartToggleProps {
  enabled: boolean;
  onChange: (enabled: boolean) => void;
}

export function AutoStartToggle({ enabled, onChange }: AutoStartToggleProps) {
  const [isChecking, setIsChecking] = useState(true);
  const [isToggling, setIsToggling] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [actualState, setActualState] = useState(enabled);

  // T035: Check actual autostart status on mount
  useEffect(() => {
    checkStatus();
  }, []);

  const checkStatus = async () => {
    try {
      const status = await isEnabled();
      setActualState(status);
      // Sync parent state if different
      if (status !== enabled) {
        onChange(status);
      }
    } catch (e) {
      console.error("Failed to check autostart status:", e);
      setError("Could not check auto-start status");
    } finally {
      setIsChecking(false);
    }
  };

  // T036: Handle toggle
  const handleToggle = async () => {
    if (isToggling) return;

    setIsToggling(true);
    setError(null);

    try {
      if (actualState) {
        await disable();
        setActualState(false);
        onChange(false);
      } else {
        await enable();
        setActualState(true);
        onChange(true);
      }
    } catch (e) {
      console.error("Failed to toggle autostart:", e);
      // T046: User-friendly error message for Registry write failures
      setError("Failed to update auto-start setting. Try running as administrator.");
    } finally {
      setIsToggling(false);
    }
  };

  if (isChecking) {
    return (
      <div className="flex items-center justify-between">
        <span className="font-display text-sm text-foreground">
          Start with Windows
        </span>
        <span className="font-display text-xs text-muted-foreground">
          Checking...
        </span>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center justify-between">
        <span className="font-display text-sm text-foreground">
          Start with Windows
        </span>
        <button
          onClick={handleToggle}
          disabled={isToggling}
          className={`
            relative w-11 h-6 rounded-full
            transition-colors duration-200
            focus:outline-none focus:ring-2 focus:ring-primary/50
            ${actualState ? "bg-primary/60" : "bg-muted/50"}
            ${isToggling ? "opacity-50 cursor-wait" : "cursor-pointer"}
          `}
          role="switch"
          aria-checked={actualState}
        >
          <span
            className={`
              absolute top-0.5 left-0.5
              w-5 h-5 rounded-full
              bg-foreground shadow
              transition-transform duration-200
              ${actualState ? "translate-x-5" : "translate-x-0"}
            `}
          />
        </button>
      </div>
      {error && <p className="text-xs text-red-400">{error}</p>}
    </div>
  );
}
