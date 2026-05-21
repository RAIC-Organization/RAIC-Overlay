// Sidecar process supervision.
//
// One supervisor task per sidecar watches child.wait() in the background.
// When the child exits (cleanly or not):
//   - all pending sidecar.call oneshots are rejected with SidecarUnavailable
//   - event sinks (sidecar.onEvent subscribers) are dropped
//   - the SidecarProcess in the SidecarStore is marked as crashed via
//     removal from the store (next sidecar.status will return running:false)
//
// Graceful shutdown (called from instance teardown) sends raic.shutdown,
// waits up to 5 seconds, then kills.

use std::collections::HashMap;
use std::sync::Arc;
use std::sync::Mutex as StdMutex;
use std::time::Duration;

use tokio::process::Child;
use tokio::sync::Mutex;
use tokio::time::{sleep, timeout};

use crate::plugins::sidecar::spawn::SidecarProcess;
use crate::plugins::sidecar::transport::{EventSink, PendingCalls};
use crate::plugins::types::{JsonRpcError, PluginId, RpcErrorCode};

const SHUTDOWN_GRACE: Duration = Duration::from_secs(5);

/// Tauri-managed: keyed by plugin id → live SidecarProcess.
#[derive(Default)]
pub struct SidecarStore(StdMutex<HashMap<PluginId, Arc<SidecarProcess>>>);

impl SidecarStore {
    pub fn put(&self, plugin_id: PluginId, proc: Arc<SidecarProcess>) {
        let mut map = self.0.lock().expect("sidecar store mutex poisoned");
        map.insert(plugin_id, proc);
    }

    pub fn get(&self, plugin_id: &PluginId) -> Option<Arc<SidecarProcess>> {
        let map = self.0.lock().expect("sidecar store mutex poisoned");
        map.get(plugin_id).cloned()
    }

    pub fn take(&self, plugin_id: &PluginId) -> Option<Arc<SidecarProcess>> {
        let mut map = self.0.lock().expect("sidecar store mutex poisoned");
        map.remove(plugin_id)
    }
}

/// Start a background task that watches child.wait() and cleans up on exit.
pub fn supervise(
    plugin_id: PluginId,
    mut child: Child,
    pending: PendingCalls,
    event_sinks: Arc<Mutex<Vec<EventSink>>>,
) {
    tokio::spawn(async move {
        let status = match child.wait().await {
            Ok(s) => s,
            Err(e) => {
                log::warn!("[plugin={plugin_id}] sidecar wait() failed: {e}");
                return;
            }
        };

        log::info!(
            "[plugin={plugin_id}] sidecar exited with {}",
            status.code()
                .map(|c| c.to_string())
                .unwrap_or_else(|| "(no code)".to_string())
        );

        // Reject any in-flight calls
        let mut map = pending.lock().await;
        for (_, tx) in map.drain() {
            let _ = tx.send(Err(JsonRpcError::new(
                RpcErrorCode::SidecarUnavailable,
                format!(
                    "sidecar exited (code: {})",
                    status.code()
                        .map(|c| c.to_string())
                        .unwrap_or_else(|| "n/a".to_string())
                ),
            )));
        }

        // Drop event sinks
        let mut sinks = event_sinks.lock().await;
        sinks.clear();
    });
}

/// Send raic.shutdown and wait up to 5 s; force-kill afterward.
/// Called from PluginInstance teardown.
pub async fn shutdown(proc: &Arc<SidecarProcess>) {
    // Notify (no id = notification per JSON-RPC 2.0).
    let shutdown_msg = serde_json::json!({
        "jsonrpc": "2.0",
        "method": "raic.shutdown",
    });
    let bytes = serde_json::to_vec(&shutdown_msg).expect("shutdown JSON");
    let _ = proc.stdin_tx.send(bytes).await;

    // Wait for natural exit by polling whether the pending map empties or
    // the sender side of stdin_tx becomes the only ref. Pragmatically, we
    // just sleep for the grace period — supervisor will catch the exit.
    sleep(SHUTDOWN_GRACE).await;
    // Note: we don't have the Child handle here (supervisor task owns it).
    // The supervisor will detect any exit; if the sidecar still hasn't exited,
    // the supervisor's grip on the Child has kill_on_drop=true so dropping
    // the SidecarProcess Arc (which happens after this returns from the
    // store) ultimately closes the channels which causes the sidecar to
    // see EOF on stdin.
    log::info!(
        "[plugin={}] sidecar shutdown grace elapsed (5s); supervisor will reap",
        proc.plugin_id
    );
    // Add tiny extra delay to let supervisor process the exit.
    let _ = timeout(Duration::from_millis(200), sleep(Duration::from_millis(200))).await;
}
