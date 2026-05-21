'use client';

/**
 * One row in the Settings → Plugins list.
 *
 * Phase 3 ships the minimal version: name, version, source URL, "Open"
 * button. Enable/disable/uninstall/update controls are added in Phase 6
 * (US4). Accessibility (FR-029): each interactive control has an
 * accessible name that includes the plugin name for unambiguous screen
 * reader announcements.
 *
 * @feature 060-plugin-system
 */

import { ExternalLink, Play } from 'lucide-react';
import { openUrl } from '@tauri-apps/plugin-opener';

import { pluginService } from '@/stores/pluginService';
import type { RegisteredPlugin } from '@/types/plugins';

interface PluginRowProps {
  plugin: RegisteredPlugin;
}

export function PluginRow({ plugin }: PluginRowProps) {
  async function handleOpen() {
    try {
      await pluginService.open(plugin.id);
    } catch (e) {
      console.error(`Failed to open plugin ${plugin.id}:`, e);
    }
  }

  async function handleOpenSource() {
    try {
      await openUrl(plugin.sourceRepoUrl);
    } catch {
      /* ignore */
    }
  }

  return (
    <li className="flex items-start justify-between gap-3 py-2 border-b border-border last:border-b-0">
      <div className="min-w-0 flex-1">
        <div className="text-sm font-medium">
          {plugin.name}{' '}
          <span className="text-muted-foreground font-normal text-xs">
            v{plugin.installedVersion}
          </span>
        </div>
        <button
          type="button"
          onClick={handleOpenSource}
          className="
            mt-0.5 text-xs text-muted-foreground hover:text-primary
            underline decoration-dotted underline-offset-2
            inline-flex items-center gap-1 break-all text-left
          "
          aria-label={`Open ${plugin.name}'s source repository at ${plugin.sourceRepoUrl}`}
        >
          {plugin.sourceRepoUrl}
          <ExternalLink className="h-3 w-3 shrink-0" aria-hidden />
        </button>
      </div>
      <div className="flex items-center gap-1 shrink-0">
        <button
          type="button"
          onClick={handleOpen}
          aria-label={`Open ${plugin.name}`}
          className="
            p-1.5 rounded sc-glow-transition
            hover:bg-muted/50 hover:shadow-glow-sm
            focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-1
          "
        >
          <Play className="h-3.5 w-3.5" aria-hidden />
        </button>
      </div>
    </li>
  );
}
