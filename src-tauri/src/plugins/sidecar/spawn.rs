// tokio::process::Command spawn for plugin sidecars.
//
// Validates the binary path is under the plugin's install dir (defence
// against a manifest pointing somewhere weird after install), sets the
// documented env vars (RAIC_PLUGIN_ID / VERSION / PROTOCOL_VERSION /
// STATE_DIR / LOG_PREFIX — see contracts/sidecar-protocol.md §Transport),
// pipes stdio, and performs the raic.init handshake within 5 seconds.

use std::path::PathBuf;
use std::process::Stdio;
use std::sync::atomic::AtomicU64;
use std::sync::Arc;
use std::time::{Duration, Instant};

use serde::{Deserialize, Serialize};
use serde_json::Value;
use tauri::AppHandle;
use tokio::process::Command;
use tokio::sync::{mpsc, oneshot, Mutex};
use tokio::time::timeout;

use crate::plugins::installer::manifest::Manifest;
use crate::plugins::registry::{plugin_install_dir, plugin_state_dir};
use crate::plugins::sidecar::transport::{
    spawn_stderr_reader, spawn_stdin_writer, spawn_stdout_reader, EventSink, PendingCalls,
};
use crate::plugins::types::PluginId;

const HANDSHAKE_TIMEOUT: Duration = Duration::from_secs(5);
const CURRENT_PLATFORM: &str = if cfg!(all(windows, target_pointer_width = "64")) {
    "windows-x86_64"
} else if cfg!(all(target_os = "linux", target_pointer_width = "64")) {
    "linux-x86_64"
} else if cfg!(all(target_os = "macos", target_arch = "aarch64")) {
    "macos-aarch64"
} else {
    "unknown"
};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct InitResult {
    pub name: String,
    pub version: String,
    #[serde(default)]
    pub methods: Vec<String>,
}

/// Returned to the caller (sidecar_handler / instance) after a successful
/// spawn + handshake. Owns the bookkeeping channels and the child handle.
pub struct SidecarProcess {
    pub plugin_id: PluginId,
    pub pid: u32,
    pub started_at: Instant,
    pub init: InitResult,
    pub stdin_tx: mpsc::Sender<Vec<u8>>,
    pub pending: PendingCalls,
    pub event_sinks: Arc<Mutex<Vec<EventSink>>>,
    pub next_id: AtomicU64,
    /// Drop signals the supervisor to terminate the process.
    pub shutdown_tx: Mutex<Option<oneshot::Sender<()>>>,
}

#[derive(Debug)]
pub enum SpawnError {
    NoPlatformBinary,
    InvalidBinPath(String),
    Io(std::io::Error),
    HandshakeTimeout,
    HandshakeFailed(String),
}

impl std::fmt::Display for SpawnError {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        match self {
            SpawnError::NoPlatformBinary => {
                write!(f, "sidecar has no binary for the current platform")
            }
            SpawnError::InvalidBinPath(s) => write!(f, "invalid bin path: {s}"),
            SpawnError::Io(e) => write!(f, "spawn IO: {e}"),
            SpawnError::HandshakeTimeout => {
                write!(f, "sidecar did not respond to raic.init within 5 seconds")
            }
            SpawnError::HandshakeFailed(s) => write!(f, "sidecar handshake failed: {s}"),
        }
    }
}

impl std::error::Error for SpawnError {}

/// Spawn the plugin's sidecar (if declared for the current platform) and
/// perform the raic.init handshake. Returns Ok(Some(_)) on success,
/// Ok(None) if the manifest declares NO platforms key for our OS (edge
/// case from spec — install proceeds with sidecar disabled).
pub async fn spawn_sidecar(
    app: &AppHandle,
    plugin_id: &PluginId,
    version: &str,
    manifest: &Manifest,
) -> Result<Option<SidecarProcess>, SpawnError> {
    let Some(sidecar) = manifest.sidecar.as_ref() else {
        return Ok(None);
    };
    let Some(bin) = sidecar.platforms.get(CURRENT_PLATFORM) else {
        log::warn!(
            "[plugin={plugin_id}] sidecar declared but no binary for current platform ({CURRENT_PLATFORM})"
        );
        return Ok(None);
    };

    let install_dir = plugin_install_dir(app, plugin_id, version)
        .map_err(|e| SpawnError::InvalidBinPath(format!("resolve install dir: {e}")))?;
    let bin_path: PathBuf = install_dir.join(&bin.bin);
    let bin_canon = bin_path
        .canonicalize()
        .map_err(|e| SpawnError::InvalidBinPath(format!("canonicalize bin: {e}")))?;
    let install_canon = install_dir
        .canonicalize()
        .map_err(|e| SpawnError::InvalidBinPath(format!("canonicalize install: {e}")))?;
    if !bin_canon.starts_with(&install_canon) {
        return Err(SpawnError::InvalidBinPath(format!(
            "{} escapes install dir",
            bin.bin
        )));
    }

    let state_dir = plugin_state_dir(app, plugin_id)
        .map_err(|e| SpawnError::InvalidBinPath(format!("resolve state dir: {e}")))?;

    let mut cmd = Command::new(&bin_canon);
    cmd.args(&bin.args)
        .env("RAIC_PLUGIN_ID", plugin_id)
        .env("RAIC_PLUGIN_VERSION", version)
        .env("RAIC_PROTOCOL_VERSION", "1")
        .env("RAIC_PLUGIN_STATE_DIR", &state_dir)
        .env("RAIC_PLUGIN_LOG_PREFIX", format!("[plugin={plugin_id}] "))
        .stdin(Stdio::piped())
        .stdout(Stdio::piped())
        .stderr(Stdio::piped())
        // Tokio kills the child when the handle drops — but we explicitly
        // kill on shutdown anyway.
        .kill_on_drop(true);

    log::info!(
        "[plugin={plugin_id}] spawning sidecar {}",
        bin_canon.display()
    );

    let mut child = cmd.spawn().map_err(SpawnError::Io)?;
    let pid = child.id().unwrap_or(0);
    let stdin = child.stdin.take().expect("piped");
    let stdout = child.stdout.take().expect("piped");
    let stderr = child.stderr.take().expect("piped");

    let pending: PendingCalls = Arc::new(Mutex::new(Default::default()));
    let event_sinks: Arc<Mutex<Vec<EventSink>>> = Arc::new(Mutex::new(Vec::new()));
    let (stdin_tx, stdin_rx) = mpsc::channel::<Vec<u8>>(64);

    spawn_stdin_writer(plugin_id.clone(), stdin, stdin_rx);
    spawn_stdout_reader(plugin_id.clone(), stdout, pending.clone(), event_sinks.clone());
    spawn_stderr_reader(plugin_id.clone(), stderr);

    // Set up the supervisor's shutdown signal channel; the supervisor task
    // is started by the caller (sidecar/supervisor.rs::supervise).
    let (shutdown_tx, _shutdown_rx) = oneshot::channel::<()>();

    // Handshake: send raic.init, wait up to 5s for the response.
    let init_id = "init".to_string();
    let (init_tx, init_rx) = oneshot::channel::<Result<Value, crate::plugins::types::JsonRpcError>>();
    pending.lock().await.insert(init_id.clone(), init_tx);

    let init_request = serde_json::json!({
        "jsonrpc": "2.0",
        "id": init_id,
        "method": "raic.init",
        "params": {
            "protocol": 1,
            "pluginId": plugin_id,
            "version": version,
        }
    });
    let init_bytes = serde_json::to_vec(&init_request).expect("init JSON");
    stdin_tx
        .send(init_bytes)
        .await
        .map_err(|e| SpawnError::HandshakeFailed(format!("send init: {e}")))?;

    let init_result = match timeout(HANDSHAKE_TIMEOUT, init_rx).await {
        Ok(Ok(Ok(v))) => v,
        Ok(Ok(Err(rpc_err))) => {
            let _ = child.kill().await;
            return Err(SpawnError::HandshakeFailed(format!(
                "raic.init returned error {}: {}",
                rpc_err.code, rpc_err.message
            )));
        }
        Ok(Err(_)) => {
            let _ = child.kill().await;
            return Err(SpawnError::HandshakeFailed(
                "init oneshot dropped".to_string(),
            ));
        }
        Err(_) => {
            let _ = child.kill().await;
            return Err(SpawnError::HandshakeTimeout);
        }
    };

    let init: InitResult = serde_json::from_value(init_result).map_err(|e| {
        SpawnError::HandshakeFailed(format!("decode init result: {e}"))
    })?;

    log::info!(
        "[plugin={plugin_id}] sidecar handshake OK — name={} version={} methods={:?}",
        init.name,
        init.version,
        init.methods
    );

    // Start supervisor task watching child.wait() so we can detect crashes
    // and fail in-flight calls.
    crate::plugins::sidecar::supervisor::supervise(
        plugin_id.clone(),
        child,
        pending.clone(),
        event_sinks.clone(),
    );

    Ok(Some(SidecarProcess {
        plugin_id: plugin_id.clone(),
        pid,
        started_at: Instant::now(),
        init,
        stdin_tx,
        pending,
        event_sinks,
        next_id: AtomicU64::new(1),
        shutdown_tx: Mutex::new(Some(shutdown_tx)),
    }))
}
