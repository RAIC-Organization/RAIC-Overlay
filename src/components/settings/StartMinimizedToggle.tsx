"use client";

/**
 * StartMinimizedToggle Component
 *
 * Toggle switch for enabling/disabling "Start Minimized" behavior.
 * When disabled (default), Settings panel opens on app startup.
 * When enabled, app starts silently to system tray.
 *
 * @feature 054-settings-panel-startup
 */

interface StartMinimizedToggleProps {
  enabled: boolean;
  onChange: (enabled: boolean) => void;
}

export function StartMinimizedToggle({
  enabled,
  onChange,
}: StartMinimizedToggleProps) {
  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center justify-between">
        <div className="flex flex-col">
          <span className="font-display text-sm text-foreground">
            Start Minimized
          </span>
          <span className="font-display text-xs text-muted-foreground">
            Launch to system tray without showing settings
          </span>
        </div>
        <button
          onClick={() => onChange(!enabled)}
          className={`
            relative w-11 h-6 rounded-full
            transition-colors duration-200
            focus:outline-none focus:ring-2 focus:ring-primary/50
            ${enabled ? "bg-primary/60" : "bg-muted/50"}
            cursor-pointer
          `}
          role="switch"
          aria-checked={enabled}
          aria-label="Start Minimized"
        >
          <span
            className={`
              absolute top-0.5 left-0.5
              w-5 h-5 rounded-full
              bg-foreground shadow
              transition-transform duration-200
              ${enabled ? "translate-x-5" : "translate-x-0"}
            `}
          />
        </button>
      </div>
    </div>
  );
}
