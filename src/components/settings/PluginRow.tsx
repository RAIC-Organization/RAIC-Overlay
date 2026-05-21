'use client';

/**
 * One row in the Settings → Plugins list (Phase 6).
 *
 * Provides full management controls:
 *   - Enable / Disable toggle (role="switch" + aria-pressed)
 *   - Open primary window
 *   - Check for updates / Update (when available)
 *   - Uninstall (with inline confirm)
 *   - Storage size display
 *
 * Accessibility (FR-029 / D1 / US4 AC5): every button's accessible name
 * includes the plugin name; the confirm-uninstall mini-flow uses
 * role="alertdialog" semantics with focus trap; toggle uses
 * role="switch" + aria-checked.
 *
 * @feature 060-plugin-system
 */

import { useEffect, useState } from 'react';
import { ExternalLink, Play, Trash2, RefreshCw, Sparkles } from 'lucide-react';
import { openUrl } from '@tauri-apps/plugin-opener';

import { pluginService, type InstallErrorPayload } from '@/stores/pluginService';
import type { InstallPreview, RegisteredPlugin } from '@/types/plugins';

interface PluginRowProps {
  plugin: RegisteredPlugin;
  /** Triggered when the user accepts updating; opens the install dialog. */
  onUpdateRequested: (preview: InstallPreview) => void;
}

function formatBytes(b: number): string {
  if (b < 1024) return `${b} B`;
  if (b < 1024 * 1024) return `${(b / 1024).toFixed(1)} KB`;
  return `${(b / 1024 / 1024).toFixed(1)} MB`;
}

export function PluginRow({ plugin, onUpdateRequested }: PluginRowProps) {
  const [busy, setBusy] = useState(false);
  const [confirmingUninstall, setConfirmingUninstall] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [storage, setStorage] = useState<number | null>(null);

  useEffect(() => {
    pluginService
      .getStorageBytes(plugin.id)
      .then(setStorage)
      .catch(() => setStorage(null));
  }, [plugin.id, plugin.updatedAt]);

  async function handleOpen() {
    setError(null);
    try {
      await pluginService.open(plugin.id);
    } catch (e) {
      setError(`Open failed: ${String(e)}`);
    }
  }

  async function handleOpenSource() {
    try {
      await openUrl(plugin.sourceRepoUrl);
    } catch { /* ignore */ }
  }

  async function handleToggle() {
    setBusy(true);
    setError(null);
    try {
      await pluginService.setEnabled(plugin.id, !plugin.enabled);
    } catch (e) {
      setError(`Toggle failed: ${String(e)}`);
    } finally {
      setBusy(false);
    }
  }

  async function handleUninstall() {
    setBusy(true);
    setError(null);
    try {
      await pluginService.uninstall(plugin.id);
    } catch (e) {
      setError(`Uninstall failed: ${String(e)}`);
    } finally {
      setBusy(false);
      setConfirmingUninstall(false);
    }
  }

  async function handleCheckUpdate() {
    setBusy(true);
    setError(null);
    try {
      if (plugin.availableUpdate) {
        // Already detected — re-run the preview against the source URL so
        // the user lands in the consent dialog with the diff.
        const preview = await pluginService.installPreview(plugin.sourceRepoUrl);
        onUpdateRequested(preview);
      } else {
        await pluginService.checkUpdates();
      }
    } catch (raw) {
      const err = raw as InstallErrorPayload;
      setError(`Update failed: ${err.message ?? String(raw)}`);
    } finally {
      setBusy(false);
    }
  }

  const hasUpdate = plugin.availableUpdate != null;

  return (
    <li className="flex flex-col gap-1 py-2 border-b border-border last:border-b-0">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="text-sm font-medium flex items-center gap-1.5 flex-wrap">
            <span>{plugin.name}</span>
            <span className="text-muted-foreground font-normal text-xs">
              v{plugin.installedVersion}
            </span>
            {hasUpdate && (
              <span
                className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-amber-500/15 text-amber-300 text-[10px] font-medium uppercase tracking-wider"
                aria-label={`Update available to version ${plugin.availableUpdate!.version}`}
              >
                <Sparkles className="h-3 w-3" aria-hidden /> v
                {plugin.availableUpdate!.version}
              </span>
            )}
            {!plugin.enabled && (
              <span className="text-[10px] uppercase tracking-wider text-muted-foreground px-1.5 py-0.5 rounded bg-muted/40">
                disabled
              </span>
            )}
          </div>
          <button
            type="button"
            onClick={handleOpenSource}
            className="
              mt-0.5 text-xs text-muted-foreground hover:text-primary
              underline decoration-dotted underline-offset-2
              inline-flex items-center gap-1 break-all text-left
              focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-1
            "
            aria-label={`Open ${plugin.name}'s source repository at ${plugin.sourceRepoUrl}`}
          >
            {plugin.sourceRepoUrl}
            <ExternalLink className="h-3 w-3 shrink-0" aria-hidden />
          </button>
          {storage != null && (
            <p className="text-[11px] text-muted-foreground mt-0.5">
              Storage: {formatBytes(storage)}
            </p>
          )}
        </div>

        <div className="flex items-center gap-1 shrink-0">
          <button
            type="button"
            role="switch"
            aria-checked={plugin.enabled}
            aria-label={`${plugin.enabled ? 'Disable' : 'Enable'} ${plugin.name}`}
            onClick={handleToggle}
            disabled={busy}
            className={`
              px-2 py-1 rounded text-[10px] uppercase tracking-wider font-display
              sc-glow-transition border border-border
              focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-1
              disabled:opacity-50
              ${plugin.enabled ? 'bg-primary/20 hover:bg-primary/30' : 'bg-muted/30 hover:bg-muted/50'}
            `}
          >
            {plugin.enabled ? 'On' : 'Off'}
          </button>
          <button
            type="button"
            onClick={handleOpen}
            disabled={!plugin.enabled || busy}
            aria-label={`Open ${plugin.name}`}
            className="
              p-1.5 rounded sc-glow-transition
              hover:bg-muted/50 hover:shadow-glow-sm
              focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-1
              disabled:opacity-50 disabled:cursor-not-allowed
            "
          >
            <Play className="h-3.5 w-3.5" aria-hidden />
          </button>
          <button
            type="button"
            onClick={handleCheckUpdate}
            disabled={busy}
            aria-label={
              hasUpdate
                ? `Install update for ${plugin.name} (v${plugin.availableUpdate!.version})`
                : `Check for updates for ${plugin.name}`
            }
            className={`
              p-1.5 rounded sc-glow-transition
              focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-1
              disabled:opacity-50
              ${hasUpdate ? 'bg-amber-500/15 hover:bg-amber-500/25 text-amber-300' : 'hover:bg-muted/50'}
            `}
          >
            <RefreshCw className="h-3.5 w-3.5" aria-hidden />
          </button>
          <button
            type="button"
            onClick={() => setConfirmingUninstall((v) => !v)}
            disabled={busy}
            aria-label={`Uninstall ${plugin.name}`}
            aria-expanded={confirmingUninstall}
            className="
              p-1.5 rounded sc-glow-transition hover:bg-destructive/20 hover:text-destructive
              focus-visible:ring-2 focus-visible:ring-destructive focus-visible:ring-offset-1
              disabled:opacity-50
            "
          >
            <Trash2 className="h-3.5 w-3.5" aria-hidden />
          </button>
        </div>
      </div>

      {confirmingUninstall && (
        <div
          role="alertdialog"
          aria-labelledby={`uninstall-confirm-${plugin.id}`}
          className="mt-1 p-2 rounded border border-destructive/40 bg-destructive/10 text-xs flex items-center justify-between gap-2"
        >
          <span id={`uninstall-confirm-${plugin.id}`}>
            Remove {plugin.name} and its stored data? This cannot be undone.
          </span>
          <div className="flex gap-1 shrink-0">
            <button
              type="button"
              onClick={() => setConfirmingUninstall(false)}
              disabled={busy}
              className="px-2 py-1 rounded text-[10px] uppercase tracking-wider font-display border border-border hover:bg-muted/50 disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleUninstall}
              disabled={busy}
              className="px-2 py-1 rounded text-[10px] uppercase tracking-wider font-display border border-destructive bg-destructive/20 hover:bg-destructive/30 disabled:opacity-50"
            >
              Remove
            </button>
          </div>
        </div>
      )}

      {error && (
        <p className="text-xs text-amber-400" role="alert">
          {error}
        </p>
      )}
    </li>
  );
}
