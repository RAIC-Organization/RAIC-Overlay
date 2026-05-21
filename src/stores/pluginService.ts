/**
 * Plugin service — frontend wrapper around the Rust backend's plugin commands.
 *
 * Matches the existing pattern in src/stores/persistenceService.ts: a plain
 * object whose methods invoke Tauri commands and surface typed results.
 *
 * @feature 060-plugin-system
 */

import { invoke } from '@tauri-apps/api/core';
import type { InstallPreview, RegisteredPlugin } from '@/types/plugins';

/** Raw backend error shape for installer commands. */
export interface InstallErrorPayload {
  kind: string;
  message: string;
  manifest_issues?: Array<{ path: string; message: string }>;
}

/**
 * Wraps a Tauri invoke that may reject with an InstallErrorPayload (object)
 * or with a plain string. Always resolves to a normalised payload.
 */
async function invokeInstaller<T>(
  command: string,
  args: Record<string, unknown>
): Promise<T> {
  try {
    return await invoke<T>(command, args);
  } catch (raw) {
    if (raw && typeof raw === 'object' && 'kind' in raw && 'message' in raw) {
      throw raw as InstallErrorPayload;
    }
    throw {
      kind: 'Unknown',
      message: typeof raw === 'string' ? raw : JSON.stringify(raw),
    } as InstallErrorPayload;
  }
}

export const pluginService = {
  /**
   * Step 1 of the install flow. Fetches the latest release, downloads + extracts
   * + validates, and returns the consent-screen payload. The temp install dir is
   * held by the backend until confirm or cancel.
   */
  async installPreview(url: string): Promise<InstallPreview> {
    const raw = await invokeInstaller<RawInstallPreview>('plugin_install_preview', {
      url,
    });
    return normalisePreview(raw);
  },

  /** Step 3 — atomically install. */
  async installConfirm(previewId: string): Promise<void> {
    await invokeInstaller<null>('plugin_install_confirm', {
      previewId,
    });
  },

  /** Step 4 — drop the held preview (TempDir auto-cleans). */
  async installCancel(previewId: string): Promise<void> {
    try {
      await invokeInstaller<null>('plugin_install_cancel', { previewId });
    } catch (_err) {
      // Cancel is best-effort; an UnknownPreview here just means it was
      // already consumed (e.g. the user clicked Confirm and Cancel quickly).
    }
  },

  /** List installed plugins from the in-memory registry. */
  async list(): Promise<RegisteredPlugin[]> {
    const rows = await invoke<RawRegisteredPlugin[]>('plugin_list');
    return rows.map(normaliseRegistered);
  },

  /** Open the plugin's primary window (creates the host-owned WebviewWindow). */
  async open(pluginId: string): Promise<string> {
    return await invoke<string>('plugin_open', { pluginId });
  },

  /** Re-read registry.json from disk (debug / recovery). */
  async reloadRegistry(): Promise<void> {
    await invoke<null>('plugin_reload_registry');
  },

  /** Toggle enabled state. Disabling tears down any running instance. */
  async setEnabled(pluginId: string, enabled: boolean): Promise<void> {
    await invoke<null>('plugin_set_enabled', { pluginId, enabled });
  },

  /** Remove a plugin entirely (files + state + registry entry). */
  async uninstall(pluginId: string): Promise<void> {
    await invoke<null>('plugin_uninstall', { pluginId });
  },

  /** Return on-disk size (bytes) of the plugin's state directory. */
  async getStorageBytes(pluginId: string): Promise<number> {
    return await invoke<number>('plugin_get_storage_bytes', { pluginId });
  },

  /** Force one poll cycle ("Check for updates" button). */
  async checkUpdates(): Promise<void> {
    await invoke<null>('plugin_check_updates');
  },
};

// ---------------------------------------------------------------------------
// Backend → frontend shape conversion (snake_case → camelCase)
// ---------------------------------------------------------------------------

interface RawInstallPreview {
  preview_id: string;
  plugin_id: string;
  name: string;
  version: string;
  author: string;
  description: string;
  source_repo_url: string;
  declared_permissions: string[];
  unknown_permissions: string[];
  sidecar_binaries: Array<{ platform: string; bin: string }>;
  is_update: boolean;
  previous_version: string | null;
}

interface RawRegisteredPlugin {
  id: string;
  name: string;
  installed_version: string;
  installed_at: string;
  updated_at: string;
  source_repo_url: string;
  enabled: boolean;
  granted_permissions: string[];
  storage_bytes?: number;
  available_update?: RawAvailableUpdate | null;
}

interface RawAvailableUpdate {
  version: string;
  release_url: string;
  release_notes: string;
  asset_size_bytes: number;
  detected_at: string;
}

function normalisePreview(raw: RawInstallPreview): InstallPreview {
  return {
    previewId: raw.preview_id,
    pluginId: raw.plugin_id,
    name: raw.name,
    version: raw.version,
    author: raw.author,
    description: raw.description,
    sourceRepoUrl: raw.source_repo_url,
    declaredPermissions: raw.declared_permissions,
    unknownPermissions: raw.unknown_permissions,
    sidecarBinaries: raw.sidecar_binaries.map((s) => ({
      platform: s.platform,
      bin: s.bin,
    })),
  };
}

function normaliseRegistered(raw: RawRegisteredPlugin): RegisteredPlugin {
  return {
    id: raw.id,
    name: raw.name,
    installedVersion: raw.installed_version,
    installedAt: raw.installed_at,
    updatedAt: raw.updated_at,
    sourceRepoUrl: raw.source_repo_url,
    enabled: raw.enabled,
    grantedPermissions: raw.granted_permissions,
    storageBytes: raw.storage_bytes ?? 0,
    availableUpdate: raw.available_update
      ? {
          version: raw.available_update.version,
          releaseUrl: raw.available_update.release_url,
          releaseNotes: raw.available_update.release_notes,
          assetSizeBytes: raw.available_update.asset_size_bytes,
          detectedAt: raw.available_update.detected_at,
        }
      : null,
  };
}
