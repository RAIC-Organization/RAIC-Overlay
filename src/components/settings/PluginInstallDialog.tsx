'use client';

/**
 * Plugin install consent dialog.
 *
 * Renders inside a native <dialog> element so the browser handles focus
 * trap, the inert ::backdrop, and Escape-to-cancel. Adds explicit ARIA
 * for screen-reader announcement of what the plugin is asking for, in
 * line with FR-029 (WCAG 2.1 AA).
 *
 * Triggered from PluginsSection. The previewing user has already pasted a
 * URL and the backend has fetched/extracted/validated the plugin; this
 * dialog shows the consent payload and offers Confirm / Cancel.
 *
 * @feature 060-plugin-system
 */

import { useEffect, useRef, useState } from 'react';
import { X, AlertTriangle, Package, ExternalLink } from 'lucide-react';
import { openUrl } from '@tauri-apps/plugin-opener';

import type { InstallPreview } from '@/types/plugins';
import { pluginService, type InstallErrorPayload } from '@/stores/pluginService';

interface PluginInstallDialogProps {
  preview: InstallPreview;
  /** Called after the install resolves (success or failure). */
  onClose: (outcome: 'installed' | 'cancelled' | 'failed') => void;
  /** Optional element to return focus to on close (FR-029 / WCAG 2.1 AA). */
  returnFocusTo?: HTMLElement | null;
}

const PERMISSION_DESCRIPTIONS: Record<string, string> = {
  notifications: 'Show notifications in the overlay',
  hotkeys: 'Register global keyboard shortcuts',
  sidecar: 'Run a native helper process that ships with this plugin',
};

export function PluginInstallDialog({
  preview,
  onClose,
  returnFocusTo,
}: PluginInstallDialogProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState<string | null>(null);

  // Open the modal and move focus to the safer (Cancel) button — the
  // user must reach Confirm intentionally.
  useEffect(() => {
    const dlg = dialogRef.current;
    if (!dlg) return;
    if (!dlg.open) {
      dlg.showModal();
    }
    const cancelBtn = dlg.querySelector<HTMLButtonElement>(
      '[data-role="dialog-cancel"]'
    );
    cancelBtn?.focus();

    // Native <dialog> cancel event = Escape key. Map to our cancel flow.
    const onCancel = (e: Event) => {
      e.preventDefault();
      void handleCancel();
    };
    dlg.addEventListener('cancel', onCancel);
    return () => {
      dlg.removeEventListener('cancel', onCancel);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // FR-029 / WCAG: return focus to the originating control on close.
  useEffect(() => {
    return () => {
      if (returnFocusTo && typeof returnFocusTo.focus === 'function') {
        try {
          returnFocusTo.focus();
        } catch {
          /* ignore */
        }
      }
    };
  }, [returnFocusTo]);

  async function handleConfirm() {
    setBusy(true);
    setStatus('Installing…');
    try {
      await pluginService.installConfirm(preview.previewId);
      setStatus('Installed');
      dialogRef.current?.close();
      onClose('installed');
    } catch (raw) {
      const err = raw as InstallErrorPayload;
      setStatus(`Install failed: ${err.message}`);
      setBusy(false);
    }
  }

  async function handleCancel() {
    if (busy) return; // can't cancel mid-install
    try {
      await pluginService.installCancel(preview.previewId);
    } catch {
      /* best-effort */
    }
    dialogRef.current?.close();
    onClose('cancelled');
  }

  async function handleOpenSource() {
    try {
      await openUrl(preview.sourceRepoUrl);
    } catch {
      /* ignore — user can copy the URL from the text */
    }
  }

  return (
    <dialog
      ref={dialogRef}
      role="dialog"
      aria-modal="true"
      aria-labelledby="plugin-install-dialog-title"
      aria-describedby="plugin-install-dialog-desc"
      className="
        rounded-lg border border-border bg-background/95 backdrop-blur-xl
        max-w-lg w-[90vw] p-0 shadow-glow-sm sc-glow-transition
        text-foreground
      "
    >
      <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-muted/50">
        <h2
          id="plugin-install-dialog-title"
          className="font-display text-sm font-medium uppercase tracking-wide flex items-center gap-2"
        >
          <Package className="h-4 w-4" aria-hidden />
          {preview.previewId.startsWith('preview-') ? 'Install plugin' : 'Update plugin'}
        </h2>
        <button
          type="button"
          onClick={handleCancel}
          disabled={busy}
          aria-label="Cancel install"
          className="p-1 rounded sc-glow-transition hover:bg-muted/50 disabled:opacity-50"
        >
          <X className="h-4 w-4" aria-hidden />
        </button>
      </div>

      <div className="p-4 space-y-4">
        <div>
          <h3 className="font-display text-base font-semibold">
            {preview.name}{' '}
            <span className="text-muted-foreground font-normal text-sm">
              v{preview.version}
            </span>
          </h3>
          <p className="text-xs text-muted-foreground mt-0.5">by {preview.author}</p>
        </div>

        <p
          id="plugin-install-dialog-desc"
          className="text-sm"
        >
          {preview.description}
        </p>

        <div className="text-xs">
          <div className="font-display uppercase tracking-wide text-muted-foreground mb-1">
            Source
          </div>
          <button
            type="button"
            onClick={handleOpenSource}
            className="text-sm underline decoration-dotted underline-offset-2 hover:text-primary inline-flex items-center gap-1 break-all text-left"
          >
            {preview.sourceRepoUrl}
            <ExternalLink className="h-3 w-3 shrink-0" aria-hidden />
          </button>
        </div>

        <section aria-labelledby="plugin-install-perms-heading">
          <h4
            id="plugin-install-perms-heading"
            className="font-display text-xs uppercase tracking-wide text-muted-foreground mb-2"
          >
            Permissions requested
          </h4>
          {preview.declaredPermissions.length === 0 ? (
            <p className="text-sm text-muted-foreground italic">
              None — this plugin only accesses its own window and persistent state.
            </p>
          ) : (
            <ul className="space-y-1.5">
              {preview.declaredPermissions.map((perm) => {
                const isUnknown = preview.unknownPermissions.includes(perm);
                const description = PERMISSION_DESCRIPTIONS[perm];
                return (
                  <li
                    key={perm}
                    className="text-sm flex items-start gap-2"
                  >
                    {isUnknown ? (
                      <AlertTriangle
                        className="h-4 w-4 mt-0.5 text-amber-400 shrink-0"
                        aria-label="Unrecognised permission"
                      />
                    ) : (
                      <span
                        className="h-1.5 w-1.5 mt-2 rounded-full bg-primary shrink-0"
                        aria-hidden
                      />
                    )}
                    <span>
                      <code className="text-xs">{perm}</code>
                      {isUnknown ? (
                        <span className="text-amber-400 ml-2 text-xs">
                          (unrecognised by this host version)
                        </span>
                      ) : description ? (
                        <span className="text-muted-foreground ml-2">— {description}</span>
                      ) : null}
                    </span>
                  </li>
                );
              })}
            </ul>
          )}
        </section>

        {preview.sidecarBinaries.length > 0 && (
          <section aria-labelledby="plugin-install-sidecars-heading">
            <h4
              id="plugin-install-sidecars-heading"
              className="font-display text-xs uppercase tracking-wide text-muted-foreground mb-2"
            >
              Native binaries shipped
            </h4>
            <ul className="space-y-1">
              {preview.sidecarBinaries.map((s) => (
                <li
                  key={`${s.platform}-${s.bin}`}
                  className="text-sm flex items-start gap-2"
                >
                  <Package
                    className="h-3.5 w-3.5 mt-1 text-amber-400 shrink-0"
                    aria-hidden
                  />
                  <span>
                    <code className="text-xs">{s.bin}</code>
                    <span className="text-muted-foreground ml-2 text-xs">
                      ({s.platform})
                    </span>
                  </span>
                </li>
              ))}
            </ul>
            <p className="text-xs text-amber-400 mt-2">
              ⚠️ This plugin includes native executable(s) that will run on your
              machine. Only proceed if you trust the author and have reviewed
              the source on GitHub.
            </p>
          </section>
        )}
      </div>

      {/* aria-live status row */}
      <div
        role="status"
        aria-live="polite"
        aria-atomic="true"
        className="px-4 text-xs text-muted-foreground min-h-[1.25rem]"
      >
        {status}
      </div>

      <div className="flex items-center justify-end gap-2 px-4 py-3 border-t border-border bg-muted/30">
        <button
          type="button"
          data-role="dialog-cancel"
          onClick={handleCancel}
          disabled={busy}
          className="
            px-3 py-1.5 rounded sc-glow-transition
            font-display text-sm uppercase tracking-wide
            border border-border bg-transparent
            hover:bg-muted/50 disabled:opacity-50
          "
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={handleConfirm}
          disabled={busy}
          className="
            px-3 py-1.5 rounded sc-glow-transition
            font-display text-sm uppercase tracking-wide
            bg-primary/20 border border-border
            hover:bg-primary/30 hover:shadow-glow-sm disabled:opacity-50
          "
        >
          {busy ? 'Installing…' : 'Install'}
        </button>
      </div>
    </dialog>
  );
}
