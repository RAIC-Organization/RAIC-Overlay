// Plugin registry: file-system layout helpers + registry.json read/write.
//
// Layout (data-model.md §R-008 / data-model E-1):
//   <app_data>/plugins/
//   ├── registry.json
//   ├── <plugin-id>/<version>/  ...
//   ├── <plugin-id>/state/state.json
//   └── _cache/

use std::path::PathBuf;
use std::sync::Mutex;

use tauri::{AppHandle, Manager};

use super::types::{PluginId, PluginRegistry, RegisteredPlugin};

const REGISTRY_FILE: &str = "registry.json";

/// Returns `<app_data>/plugins/`, creating it (and parents) on first call.
pub fn plugins_dir(app: &AppHandle) -> Result<PathBuf, String> {
    let base = app
        .path()
        .app_data_dir()
        .map_err(|e| format!("failed to resolve app_data_dir: {e}"))?;
    let dir = base.join("plugins");
    if !dir.exists() {
        std::fs::create_dir_all(&dir)
            .map_err(|e| format!("failed to create plugins dir {dir:?}: {e}"))?;
    }
    Ok(dir)
}

/// `<app_data>/plugins/<id>/<version>/` — the versioned install directory.
pub fn plugin_install_dir(
    app: &AppHandle,
    id: &PluginId,
    version: &str,
) -> Result<PathBuf, String> {
    Ok(plugins_dir(app)?.join(id).join(version))
}

/// `<app_data>/plugins/<id>/state/` — the persistent state directory
/// (survives version upgrades).
pub fn plugin_state_dir(app: &AppHandle, id: &PluginId) -> Result<PathBuf, String> {
    let dir = plugins_dir(app)?.join(id).join("state");
    if !dir.exists() {
        std::fs::create_dir_all(&dir)
            .map_err(|e| format!("failed to create plugin state dir {dir:?}: {e}"))?;
    }
    Ok(dir)
}

/// `<app_data>/plugins/_cache/` — temp downloads / ETag cache.
pub fn cache_dir(app: &AppHandle) -> Result<PathBuf, String> {
    let dir = plugins_dir(app)?.join("_cache");
    if !dir.exists() {
        std::fs::create_dir_all(&dir)
            .map_err(|e| format!("failed to create plugin cache dir {dir:?}: {e}"))?;
    }
    Ok(dir)
}

fn registry_path(app: &AppHandle) -> Result<PathBuf, String> {
    Ok(plugins_dir(app)?.join(REGISTRY_FILE))
}

/// Load `registry.json`. Returns the default empty registry if the file does
/// not exist yet.
pub fn load_registry(app: &AppHandle) -> Result<PluginRegistry, String> {
    let path = registry_path(app)?;
    if !path.exists() {
        return Ok(PluginRegistry::default());
    }
    let bytes = std::fs::read(&path).map_err(|e| format!("read {path:?}: {e}"))?;
    serde_json::from_slice(&bytes).map_err(|e| format!("parse {path:?}: {e}"))
}

/// Write `registry.json` atomically (write `.tmp`, then rename).
pub fn save_registry(app: &AppHandle, reg: &PluginRegistry) -> Result<(), String> {
    let path = registry_path(app)?;
    let tmp = path.with_extension("json.tmp");
    let bytes = serde_json::to_vec_pretty(reg).map_err(|e| format!("serialise registry: {e}"))?;
    std::fs::write(&tmp, &bytes).map_err(|e| format!("write {tmp:?}: {e}"))?;
    std::fs::rename(&tmp, &path).map_err(|e| format!("rename {tmp:?} -> {path:?}: {e}"))?;
    Ok(())
}

// ============================================================================
// In-memory cache (managed Tauri state)
// ============================================================================

/// Thread-safe in-memory copy of the registry; the source of truth for the
/// running session. Mutations write through to disk via `save_registry`.
#[derive(Default)]
pub struct PluginRegistryState(Mutex<PluginRegistry>);

impl PluginRegistryState {
    pub fn new(reg: PluginRegistry) -> Self {
        Self(Mutex::new(reg))
    }

    pub fn snapshot(&self) -> PluginRegistry {
        self.0.lock().expect("plugin registry mutex poisoned").clone()
    }

    pub fn with<R>(&self, f: impl FnOnce(&PluginRegistry) -> R) -> R {
        f(&self.0.lock().expect("plugin registry mutex poisoned"))
    }

    pub fn mutate<R>(&self, f: impl FnOnce(&mut PluginRegistry) -> R) -> R {
        f(&mut self.0.lock().expect("plugin registry mutex poisoned"))
    }

    pub fn get(&self, id: &PluginId) -> Option<RegisteredPlugin> {
        self.with(|reg| reg.plugins.get(id).cloned())
    }
}
