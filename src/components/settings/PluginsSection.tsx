'use client';

/**
 * Settings → Plugins section.
 *
 * Mounted inline in SettingsPanel. Provides:
 *   1. "Install plugin from URL" input + button (FR-001, FR-004)
 *   2. The list of installed plugins via PluginRow
 *   3. The install consent dialog on top, accessible with focus management
 *      that satisfies FR-029 (WCAG 2.1 AA): return focus to the Install
 *      button on close, status announced via aria-live.
 *
 * @feature 060-plugin-system
 */

import { useRef, useState } from 'react';
import { Plus } from 'lucide-react';

import { pluginService, type InstallErrorPayload } from '@/stores/pluginService';
import { usePlugins } from '@/contexts/PluginsContext';
import type { InstallPreview } from '@/types/plugins';
import { PluginInstallDialog } from './PluginInstallDialog';
import { PluginRow } from './PluginRow';

export function PluginsSection() {
  const { plugins, loading, error, refresh } = usePlugins();
  const [url, setUrl] = useState('');
  const [previewing, setPreviewing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [preview, setPreview] = useState<InstallPreview | null>(null);
  const installBtnRef = useRef<HTMLButtonElement | null>(null);

  async function handleInstallClick() {
    if (!url.trim() || previewing) return;
    setPreviewing(true);
    setErrorMessage(null);
    try {
      const p = await pluginService.installPreview(url.trim());
      setPreview(p);
    } catch (raw) {
      const err = raw as InstallErrorPayload;
      setErrorMessage(err.message || 'Install preview failed');
    } finally {
      setPreviewing(false);
    }
  }

  function handleDialogClose(outcome: 'installed' | 'cancelled' | 'failed') {
    setPreview(null);
    if (outcome === 'installed') {
      setUrl('');
      void refresh();
    }
  }

  return (
    <section aria-labelledby="plugins-section-heading">
      <h2
        id="plugins-section-heading"
        className="font-display text-xs font-medium uppercase tracking-wide text-muted-foreground mb-3"
      >
        Plugins
      </h2>

      <div className="space-y-3">
        {/* Install URL row */}
        <div role="group" aria-label="Install plugin from URL">
          <label
            htmlFor="plugin-install-url"
            className="block text-xs text-muted-foreground mb-1"
          >
            Install from public GitHub URL
          </label>
          <div className="flex gap-2">
            <input
              id="plugin-install-url"
              type="url"
              inputMode="url"
              placeholder="https://github.com/owner/plugin-repo"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              disabled={previewing || !!preview}
              className="
                flex-1 px-2 py-1.5 rounded
                bg-muted/30 border border-border
                text-sm
                focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-1
                disabled:opacity-50
              "
              aria-describedby={errorMessage ? 'plugin-install-error' : undefined}
              aria-invalid={!!errorMessage || undefined}
            />
            <button
              ref={installBtnRef}
              type="button"
              onClick={handleInstallClick}
              disabled={!url.trim() || previewing || !!preview}
              className="
                px-3 py-1.5 rounded sc-glow-transition
                font-display text-xs uppercase tracking-wide
                bg-primary/20 border border-border
                hover:bg-primary/30 hover:shadow-glow-sm
                focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-1
                disabled:opacity-50 disabled:cursor-not-allowed
                inline-flex items-center gap-1.5
              "
            >
              <Plus className="h-3.5 w-3.5" aria-hidden />
              {previewing ? 'Fetching…' : 'Install'}
            </button>
          </div>
          {errorMessage && (
            <p
              id="plugin-install-error"
              role="alert"
              className="mt-1.5 text-xs text-amber-400"
            >
              {errorMessage}
            </p>
          )}
        </div>

        {/* Installed list */}
        <div aria-live="polite" aria-busy={loading}>
          {loading ? (
            <p className="text-xs text-muted-foreground italic">Loading…</p>
          ) : error ? (
            <p className="text-xs text-amber-400" role="alert">
              {error}
            </p>
          ) : plugins.length === 0 ? (
            <p className="text-xs text-muted-foreground italic">
              No plugins installed yet. Paste a GitHub URL above to add one.
            </p>
          ) : (
            <ul aria-label="Installed plugins">
              {plugins.map((p) => (
                <PluginRow key={p.id} plugin={p} />
              ))}
            </ul>
          )}
        </div>
      </div>

      {preview && (
        <PluginInstallDialog
          preview={preview}
          onClose={handleDialogClose}
          returnFocusTo={installBtnRef.current}
        />
      )}
    </section>
  );
}
