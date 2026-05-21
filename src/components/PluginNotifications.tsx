'use client';

/**
 * Plugin notification surface (Phase 7).
 *
 * Listens for `raic:plugin-notification` events emitted by
 * notification_handler::show. Renders a vertical stack of transient toasts
 * in the top-right of the overlay. Each toast auto-dismisses after its
 * durationMs.
 *
 * Accessibility (FR-029): each toast is `role="status"` with
 * `aria-live="polite"` so screen readers announce it without stealing
 * focus. The dismiss button has a descriptive `aria-label` including the
 * plugin id and title.
 *
 * @feature 060-plugin-system
 */

import { useEffect, useState } from 'react';
import { listen, type UnlistenFn } from '@tauri-apps/api/event';
import { X } from 'lucide-react';

interface PluginNotification {
  notificationId: string;
  pluginId: string;
  title: string;
  body: string;
  durationMs: number;
}

export function PluginNotifications() {
  const [items, setItems] = useState<PluginNotification[]>([]);

  useEffect(() => {
    let un: UnlistenFn | null = null;
    (async () => {
      un = await listen<PluginNotification>('raic:plugin-notification', (evt) => {
        const n = evt.payload;
        setItems((prev) => [...prev, n]);
        // auto-dismiss
        window.setTimeout(() => {
          setItems((prev) => prev.filter((x) => x.notificationId !== n.notificationId));
        }, n.durationMs);
      });
    })();
    return () => {
      if (un) un();
    };
  }, []);

  function dismiss(id: string) {
    setItems((prev) => prev.filter((x) => x.notificationId !== id));
  }

  if (items.length === 0) return null;

  return (
    <div
      aria-label="Plugin notifications"
      className="fixed top-3 right-3 z-50 flex flex-col gap-2 max-w-sm pointer-events-none"
    >
      {items.map((n) => (
        <div
          key={n.notificationId}
          role="status"
          aria-live="polite"
          className="
            pointer-events-auto
            rounded border border-border bg-background/95 backdrop-blur-xl shadow-glow-sm
            p-3 text-sm flex items-start gap-2
          "
        >
          <div className="min-w-0 flex-1">
            <div className="font-display text-xs uppercase tracking-wider text-primary">
              {n.title}
            </div>
            <div className="mt-0.5 break-words">{n.body}</div>
            <div className="mt-0.5 text-[10px] text-muted-foreground">{n.pluginId}</div>
          </div>
          <button
            type="button"
            onClick={() => dismiss(n.notificationId)}
            aria-label={`Dismiss notification from ${n.pluginId}: ${n.title}`}
            className="p-1 rounded hover:bg-muted/40 focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-1"
          >
            <X className="h-3.5 w-3.5" aria-hidden />
          </button>
        </div>
      ))}
    </div>
  );
}
