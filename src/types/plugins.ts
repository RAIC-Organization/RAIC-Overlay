/**
 * Plugin system frontend types (Feature 060)
 *
 * These mirror the Rust types in `src-tauri/src/plugins/types.rs`
 * (see specs/060-plugin-system/data-model.md for the authoritative shape).
 *
 * Phase 1: skeleton only. Fields will fill in as backend handlers land
 * across Phases 2-7.
 */

/**
 * Reverse-DNS-style globally-unique plugin id.
 * Example: "com.alice.build-order-tracker".
 */
export type PluginId = string;

/**
 * SemVer 2.0.0 string. Example: "1.4.2".
 */
export type SemverString = string;

/**
 * Permission category names known to the v1 catalogue. Unknown values
 * are still allowed at the protocol level (forward-compat) and surfaced
 * to the user as "unrecognized permission" in the consent dialog.
 */
export type KnownPermission = 'notifications' | 'hotkeys' | 'sidecar';

/**
 * One row in the Settings -> Plugins list. Mirrors
 * `plugins::types::RegisteredPlugin` in Rust.
 */
export interface RegisteredPlugin {
  id: PluginId;
  name: string;
  installedVersion: SemverString;
  installedAt: string; // RFC3339
  updatedAt: string; // RFC3339
  sourceRepoUrl: string;
  enabled: boolean;
  grantedPermissions: string[];
  storageBytes: number;
  availableUpdate: AvailableUpdate | null;
}

/**
 * Update detected by the daily poller (Phase 6).
 */
export interface AvailableUpdate {
  version: SemverString;
  releaseUrl: string;
  releaseNotes: string;
  assetSizeBytes: number;
  detectedAt: string; // RFC3339
}

/**
 * The payload returned by `plugin_install_preview` and consumed by
 * the consent dialog. Real shape lands with Phase 3 (T028, T030).
 */
export interface InstallPreview {
  previewId: string;
  pluginId: PluginId;
  name: string;
  version: SemverString;
  author: string;
  description: string;
  sourceRepoUrl: string;
  declaredPermissions: string[]; // includes unknown names
  unknownPermissions: string[]; // subset of declaredPermissions not in v1 catalogue
  sidecarBinaries: Array<{
    platform: string;
    bin: string;
  }>;
}

/**
 * JSON-RPC v1 error envelope as exposed back to the plugin's UI.
 * Mirrors `plugins::types::JsonRpcError` in Rust.
 */
export interface JsonRpcError {
  code: number;
  message: string;
  data?: unknown;
}
