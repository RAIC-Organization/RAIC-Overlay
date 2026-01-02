"use client";

/**
 * SettingsPanel Component
 *
 * Main settings UI with liquid glass styling matching ErrorModal.
 * Contains hotkeys configuration and auto-start toggle.
 * Features draggable header and X close button.
 *
 * @feature 038-settings-panel
 */

import { useState, useEffect, useCallback } from "react";
import { invoke } from "@tauri-apps/api/core";
import { getCurrentWindow } from "@tauri-apps/api/window";
import { getVersion } from "@tauri-apps/api/app";
import { X } from "lucide-react";
import { HotkeyInput } from "./HotkeyInput";
import { AutoStartToggle } from "./AutoStartToggle";
import type {
  UserSettings,
  LoadUserSettingsResult,
  HotkeySettings,
} from "@/types/user-settings";
import { DEFAULT_USER_SETTINGS } from "@/types/user-settings";

export function SettingsPanel() {
  const [settings, setSettings] = useState<UserSettings>(DEFAULT_USER_SETTINGS);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [appVersion, setAppVersion] = useState<string | null>(null);
  const [errors, setErrors] = useState<{
    toggleVisibility?: string;
    toggleMode?: string;
  }>({});

  // T021: Load settings on mount
  useEffect(() => {
    loadSettings();
  }, []);

  // T005: Fetch app version on mount
  useEffect(() => {
    getVersion()
      .then(setAppVersion)
      .catch(() => setAppVersion(null));
  }, []);

  const loadSettings = async () => {
    try {
      const result = await invoke<LoadUserSettingsResult>("load_user_settings");
      if (result.success && result.settings) {
        setSettings(result.settings);
      }
    } catch (e) {
      console.error("Failed to load settings:", e);
    } finally {
      setIsLoading(false);
    }
  };

  // T042: Handle X button click - hide window
  const handleClose = async () => {
    try {
      const window = getCurrentWindow();
      await window.hide();
    } catch (e) {
      console.error("Failed to close settings window:", e);
    }
  };

  // T021: Save handler
  const handleSave = async () => {
    // Check for validation errors
    if (errors.toggleVisibility || errors.toggleMode) {
      return;
    }

    setIsSaving(true);
    try {
      const updatedSettings: UserSettings = {
        ...settings,
        lastModified: new Date().toISOString(),
      };

      await invoke("save_user_settings", { settings: updatedSettings });

      // Update hotkeys in the running keyboard hook
      await invoke("update_hotkeys", { hotkeys: settings.hotkeys });

      setSettings(updatedSettings);
    } catch (e) {
      console.error("Failed to save settings:", e);
    } finally {
      setIsSaving(false);
    }
  };

  const updateHotkey = useCallback(
    (field: keyof HotkeySettings) =>
      (binding: typeof settings.hotkeys.toggleVisibility) => {
        setSettings((prev) => ({
          ...prev,
          hotkeys: {
            ...prev.hotkeys,
            [field]: binding,
          },
        }));
      },
    []
  );

  const setHotkeyError = useCallback(
    (field: keyof HotkeySettings) => (error: string | null) => {
      setErrors((prev) => ({
        ...prev,
        [field]: error || undefined,
      }));
    },
    []
  );

  if (isLoading) {
    return (
      <div className="h-screen bg-background/80 backdrop-blur-xl border border-border rounded-lg flex items-center justify-center">
        <p className="font-display text-sm text-muted-foreground">Loading...</p>
      </div>
    );
  }

  return (
    <div className="h-screen bg-background/80 backdrop-blur-xl border border-border rounded-lg overflow-hidden sc-glow-transition sc-corner-accents shadow-glow-sm flex flex-col">
      {/* T030: Draggable header with data-tauri-drag-region */}
      <div
        data-tauri-drag-region
        className="flex items-center justify-between px-3 py-2 border-b border-border bg-muted/50 shrink-0 cursor-move"
      >
        <h1 className="font-display text-sm font-medium uppercase tracking-wide">
          Settings
        </h1>
        {/* T042, T043: X button with SC theme styling */}
        <button
          onClick={handleClose}
          className="p-1 rounded sc-glow-transition hover:bg-muted/50 hover:shadow-glow-sm cursor-pointer"
          aria-label="Close"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* Content area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        {/* Hotkeys Section */}
        <section>
          <h2 className="font-display text-xs font-medium uppercase tracking-wide text-muted-foreground mb-3">
            Hotkeys
          </h2>
          <div className="space-y-3">
            <HotkeyInput
              label="Toggle Visibility"
              binding={settings.hotkeys.toggleVisibility}
              otherBinding={settings.hotkeys.toggleMode}
              error={errors.toggleVisibility}
              onChange={updateHotkey("toggleVisibility")}
              onValidationError={setHotkeyError("toggleVisibility")}
            />
            <HotkeyInput
              label="Toggle Mode"
              binding={settings.hotkeys.toggleMode}
              otherBinding={settings.hotkeys.toggleVisibility}
              error={errors.toggleMode}
              onChange={updateHotkey("toggleMode")}
              onValidationError={setHotkeyError("toggleMode")}
            />
          </div>
        </section>

        {/* Startup Section - T040 */}
        <section>
          <h2 className="font-display text-xs font-medium uppercase tracking-wide text-muted-foreground mb-3">
            Startup
          </h2>
          <AutoStartToggle
            enabled={settings.autoStart}
            onChange={(enabled) =>
              setSettings((prev) => ({ ...prev, autoStart: enabled }))
            }
          />
        </section>
      </div>

      {/* Footer with Save button and version display */}
      <div className="shrink-0 p-4 border-t border-border bg-muted/30">
        <button
          onClick={handleSave}
          disabled={
            isSaving || !!errors.toggleVisibility || !!errors.toggleMode
          }
          className={`
            w-full py-2 px-4 rounded
            font-display text-sm uppercase tracking-wide
            sc-glow-transition
            ${
              isSaving || errors.toggleVisibility || errors.toggleMode
                ? "bg-muted/30 text-muted-foreground cursor-not-allowed"
                : "bg-primary/20 hover:bg-primary/30 border border-border hover:shadow-glow-sm cursor-pointer"
            }
          `}
        >
          {isSaving ? "Saving..." : "Save Settings"}
        </button>

        {/* T006, T007: Version display */}
        <div className="mt-3 text-center">
          <span className="text-xs text-muted-foreground font-display">
            {appVersion ? `v${appVersion}` : "Version unavailable"}
          </span>
        </div>
      </div>
    </div>
  );
}
