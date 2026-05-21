// Plugin installation orchestrator + Tauri commands exposed to the
// Settings → Plugins UI.
//
// Flow (FR-001..004 + spec.md US1):
//   1. plugin_install_preview(url)
//        - parse owner/repo
//        - fetch latest GitHub release (+ ETag)
//        - download raic-plugin.zip to a temp dir
//        - extract zip into the temp dir (zip-slip guarded)
//        - load + validate manifest
//        - verify min_host_version <= running host
//        - construct InstallPreview, stash in InstallPreviewStore
//        - return the preview (id + everything the consent dialog needs)
//   2. user confirms or cancels in the consent dialog
//   3. plugin_install_confirm(preview_id)
//        - atomically move temp dir to <plugins>/<id>/<version>/
//        - update registry.json (granted_permissions = manifest.permissions)
//        - drop the preview from the store
//   4. plugin_install_cancel(preview_id)
//        - drop the preview from the store; temp dir TempDir handle cleans
//          up the filesystem when dropped

pub mod github;
pub mod archive;
pub mod manifest;

use std::collections::HashMap;
use std::sync::atomic::{AtomicU64, Ordering};
use std::sync::Mutex;

use semver::Version;
use serde::Serialize;
use tauri::{AppHandle, Emitter, Manager};

use crate::plugins::installer::manifest::{Manifest, ManifestIssue};
use crate::plugins::registry::{
    cache_dir, load_registry, plugin_install_dir, save_registry, PluginRegistryState,
};
use crate::plugins::types::{Permission, RegisteredPlugin};

const HOST_VERSION: &str = env!("CARGO_PKG_VERSION");

// ============================================================================
// Preview store (held between preview and confirm/cancel)
// ============================================================================

/// Opaque handle returned by `plugin_install_preview` and required by
/// `plugin_install_confirm` / `plugin_install_cancel`. Local-only; not
/// exposed externally.
pub type PreviewId = String;

/// What the frontend renders in the consent dialog. Mirrors
/// `src/types/plugins.ts::InstallPreview`.
#[derive(Debug, Clone, Serialize)]
pub struct InstallPreview {
    pub preview_id: PreviewId,
    pub plugin_id: String,
    pub name: String,
    pub version: String,
    pub author: String,
    pub description: String,
    pub source_repo_url: String,
    pub declared_permissions: Vec<String>,
    pub unknown_permissions: Vec<String>,
    pub sidecar_binaries: Vec<SidecarBinaryEntry>,
    pub is_update: bool,
    pub previous_version: Option<String>,
}

#[derive(Debug, Clone, Serialize)]
pub struct SidecarBinaryEntry {
    pub platform: String,
    pub bin: String,
}

struct HeldPreview {
    preview: InstallPreview,
    /// Temp directory holding the extracted plugin (auto-cleaned on drop).
    temp_dir: tempfile::TempDir,
    /// Pre-parsed manifest, ready for confirm.
    manifest: Manifest,
    /// ETag from the GitHub release, recorded into the registry on confirm.
    etag: Option<String>,
}

#[derive(Default)]
pub struct InstallPreviewStore {
    counter: AtomicU64,
    items: Mutex<HashMap<PreviewId, HeldPreview>>,
}

impl InstallPreviewStore {
    fn next_id(&self) -> PreviewId {
        let n = self.counter.fetch_add(1, Ordering::Relaxed);
        let ts = std::time::SystemTime::now()
            .duration_since(std::time::UNIX_EPOCH)
            .map(|d| d.as_nanos())
            .unwrap_or(0);
        format!("preview-{ts}-{n}")
    }
}

// ============================================================================
// Tauri commands
// ============================================================================

#[derive(Debug, Serialize)]
pub struct InstallError {
    pub kind: &'static str,
    pub message: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub manifest_issues: Option<Vec<ManifestIssue>>,
}

impl InstallError {
    fn simple(kind: &'static str, message: impl Into<String>) -> Self {
        Self {
            kind,
            message: message.into(),
            manifest_issues: None,
        }
    }
}

/// Step 1 of the install flow. See module-level docs.
#[tauri::command]
pub async fn plugin_install_preview(
    app: AppHandle,
    url: String,
) -> Result<InstallPreview, InstallError> {
    let (owner, repo) = manifest::parse_github_repo(&url).ok_or_else(|| {
        InstallError::simple(
            "InvalidUrl",
            format!("not a valid public GitHub repository URL: {url}"),
        )
    })?;

    // 1. Latest release
    let fetch = github::fetch_latest_release(&owner, &repo, None)
        .await
        .map_err(|e| InstallError::simple("GitHubFetch", e))?
        .ok_or_else(|| {
            InstallError::simple(
                "GitHubFetch",
                "GitHub returned 304 on first fetch (no ETag was sent)",
            )
        })?;

    // 2. Pick the asset and download it
    let asset =
        github::pick_plugin_asset(&fetch.release).map_err(|e| InstallError::simple("MissingAsset", e))?;

    let download_dir =
        cache_dir(&app).map_err(|e| InstallError::simple("AppData", e))?;
    let download_path = download_dir.join(format!("install-{}.zip", fetch.release.tag_name));
    github::download_asset(asset, &download_path)
        .await
        .map_err(|e| InstallError::simple("Download", e))?;

    // 3. Extract into a temp dir (auto-cleaned on TempDir drop)
    let temp_dir =
        tempfile::tempdir().map_err(|e| InstallError::simple("TempDir", e.to_string()))?;
    archive::extract_into(&download_path, temp_dir.path())
        .map_err(|e| InstallError::simple("Archive", e))?;
    let _ = std::fs::remove_file(&download_path);

    // 4. Load + validate the manifest
    let manifest_path = temp_dir.path().join("raic-plugin.json");
    if !manifest_path.exists() {
        return Err(InstallError::simple(
            "MissingManifest",
            "release archive does not contain raic-plugin.json at the root",
        ));
    }
    let manifest_bytes = std::fs::read(&manifest_path)
        .map_err(|e| InstallError::simple("ReadManifest", e.to_string()))?;

    let manifest = manifest::validate_and_parse(&manifest_bytes).map_err(|err| InstallError {
        kind: "InvalidManifest",
        message: err.message,
        manifest_issues: Some(err.issues),
    })?;

    // 5. host-version gate (FR-011)
    let min_host = Version::parse(&manifest.min_host_version).map_err(|e| {
        InstallError::simple(
            "InvalidManifest",
            format!("min_host_version is not valid semver: {e}"),
        )
    })?;
    let current_host = Version::parse(HOST_VERSION).map_err(|e| {
        InstallError::simple("InternalError", format!("host version unparseable: {e}"))
    })?;
    if current_host < min_host {
        return Err(InstallError::simple(
            "HostTooOld",
            format!(
                "plugin requires RAIC Overlay {min_host} or newer (you are running {current_host}); please update the host"
            ),
        ));
    }

    // 6. source URL sanity check — manifest declares the source repo, install
    // came from `url`. Allow them to differ only in trailing slash / .git.
    let url_norm = url.trim_end_matches('/').trim_end_matches(".git");
    let manifest_url_norm = manifest
        .source_repo_url
        .trim_end_matches('/')
        .trim_end_matches(".git");
    if !url_norm.eq_ignore_ascii_case(manifest_url_norm) {
        return Err(InstallError::simple(
            "SourceMismatch",
            format!(
                "URL you provided ({url}) does not match the source_repo_url in the manifest ({})",
                manifest.source_repo_url
            ),
        ));
    }

    // 7. is this an update for an already-installed plugin?
    let registry = app.state::<PluginRegistryState>();
    let previous = registry.get(&manifest.id);
    let is_update = previous.is_some();
    let previous_version = previous.as_ref().map(|p| p.installed_version.clone());

    // 8. Determine declared vs unknown permissions for the consent UI
    let declared_permissions: Vec<String> = manifest.permissions.clone();
    let unknown_permissions: Vec<String> = declared_permissions
        .iter()
        .filter(|name| !Permission::parse(name).is_known())
        .cloned()
        .collect();

    // 9. Sidecar binaries (per-platform). We surface ALL declared platforms
    // in the consent dialog so the user sees what's shipping; per-OS
    // selection happens at instance start (data-model.md §E-6 edge case).
    let sidecar_binaries: Vec<SidecarBinaryEntry> = manifest
        .sidecar
        .as_ref()
        .map(|s| {
            s.platforms
                .iter()
                .map(|(plat, bin)| SidecarBinaryEntry {
                    platform: plat.clone(),
                    bin: bin.bin.clone(),
                })
                .collect()
        })
        .unwrap_or_default();

    // 10. Build the preview, stash, return
    let store = app.state::<InstallPreviewStore>();
    let preview_id = store.next_id();
    let preview = InstallPreview {
        preview_id: preview_id.clone(),
        plugin_id: manifest.id.clone(),
        name: manifest.name.clone(),
        version: manifest.version.clone(),
        author: manifest.author.clone(),
        description: manifest.description.clone(),
        source_repo_url: manifest.source_repo_url.clone(),
        declared_permissions,
        unknown_permissions,
        sidecar_binaries,
        is_update,
        previous_version,
    };
    let held = HeldPreview {
        preview: preview.clone(),
        temp_dir,
        manifest,
        etag: fetch.etag,
    };
    store
        .items
        .lock()
        .expect("install preview store mutex poisoned")
        .insert(preview_id, held);

    Ok(preview)
}

/// Step 3 of the install flow. See module-level docs.
#[tauri::command]
pub async fn plugin_install_confirm(
    app: AppHandle,
    preview_id: PreviewId,
) -> Result<(), InstallError> {
    let held = {
        let store = app.state::<InstallPreviewStore>();
        let mut items = store
            .items
            .lock()
            .expect("install preview store mutex poisoned");
        items.remove(&preview_id).ok_or_else(|| {
            InstallError::simple(
                "UnknownPreview",
                format!("install preview {preview_id} not found or already consumed"),
            )
        })?
    };

    let HeldPreview {
        preview,
        temp_dir,
        manifest,
        etag,
    } = held;

    // Move temp_dir into the versioned install location. TempDir is moved
    // out so its Drop doesn't delete what we just installed.
    let install_dir = plugin_install_dir(&app, &manifest.id, &manifest.version)
        .map_err(|e| InstallError::simple("AppData", e))?;

    // If the target already exists (re-install), wipe it first.
    if install_dir.exists() {
        std::fs::remove_dir_all(&install_dir)
            .map_err(|e| InstallError::simple("Install", format!("remove old install: {e}")))?;
    }
    if let Some(parent) = install_dir.parent() {
        std::fs::create_dir_all(parent)
            .map_err(|e| InstallError::simple("Install", format!("create parent: {e}")))?;
    }
    let temp_path = temp_dir.keep();
    std::fs::rename(&temp_path, &install_dir).map_err(|e| {
        InstallError::simple(
            "Install",
            format!("move {} -> {}: {e}", temp_path.display(), install_dir.display()),
        )
    })?;

    // Update registry
    let registry_state = app.state::<PluginRegistryState>();
    let now = chrono::Utc::now().to_rfc3339();
    registry_state.mutate(|reg| {
        let previous_installed_at = reg
            .plugins
            .get(&manifest.id)
            .map(|p| p.installed_at.clone());
        let entry = RegisteredPlugin {
            id: manifest.id.clone(),
            name: manifest.name.clone(),
            installed_version: manifest.version.clone(),
            installed_at: previous_installed_at.unwrap_or_else(|| now.clone()),
            updated_at: now.clone(),
            source_repo_url: manifest.source_repo_url.clone(),
            enabled: true,
            granted_permissions: manifest
                .permissions
                .iter()
                .map(|s| Permission::parse(s))
                .collect(),
            etag,
            available_update: None,
            storage_bytes: 0,
        };
        reg.plugins.insert(manifest.id.clone(), entry);
    });
    if let Err(e) = save_registry(&app, &registry_state.snapshot()) {
        log::warn!("[plugins] save_registry failed after install: {e}");
        // Still return Ok — the install is live in memory; reload will re-sync.
    }

    let _ = app.emit("raic:plugin-installed", &preview.plugin_id);
    log::info!(
        "[plugins] installed {} v{} from {}",
        preview.plugin_id,
        preview.version,
        preview.source_repo_url
    );
    Ok(())
}

/// Step 4 of the install flow. See module-level docs.
#[tauri::command]
pub async fn plugin_install_cancel(
    app: AppHandle,
    preview_id: PreviewId,
) -> Result<(), InstallError> {
    let store = app.state::<InstallPreviewStore>();
    let mut items = store
        .items
        .lock()
        .expect("install preview store mutex poisoned");
    // Just drop the held entry; TempDir's Drop cleans the filesystem.
    items.remove(&preview_id).ok_or_else(|| {
        InstallError::simple(
            "UnknownPreview",
            format!("install preview {preview_id} not found"),
        )
    })?;
    Ok(())
}

/// List currently-installed plugins (for the Settings list).
#[tauri::command]
pub fn plugin_list(app: AppHandle) -> Vec<RegisteredPlugin> {
    let registry = app.state::<PluginRegistryState>();
    let snapshot = registry.snapshot();
    snapshot.plugins.into_values().collect()
}

/// Refresh the registry from disk (debug / recovery).
#[tauri::command]
pub fn plugin_reload_registry(app: AppHandle) -> Result<(), String> {
    let reg = load_registry(&app)?;
    let state = app.state::<PluginRegistryState>();
    state.mutate(|r| *r = reg);
    Ok(())
}

