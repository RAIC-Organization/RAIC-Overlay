// Newline-delimited JSON-RPC over stdio (FR-019 + Clarification Q1).
//
// Each sidecar spawns three long-lived tokio tasks:
//   1. stdin writer  - drains an mpsc::Receiver<Vec<u8>> into child.stdin
//   2. stdout reader - parses each line as a JSON-RPC message, routes
//                      responses to pending calls and notifications to
//                      event listeners
//   3. stderr reader - forwards each line to log::warn! tagged [plugin=<id>]
//
// Plus a supervisor task (in supervisor.rs) that watches child.wait() and
// signals pending callers on unexpected exit.

use std::collections::HashMap;
use std::sync::Arc;

use serde_json::Value;
use tokio::io::{AsyncBufReadExt, AsyncWriteExt, BufReader};
use tokio::process::{ChildStderr, ChildStdin, ChildStdout};
use tokio::sync::{mpsc, oneshot, Mutex};

use crate::plugins::types::{JsonRpcError, PluginId, RpcErrorCode};

/// Inflight `sidecar.call` requests keyed by JSON-RPC id.
pub type PendingCalls = Arc<Mutex<HashMap<String, oneshot::Sender<Result<Value, JsonRpcError>>>>>;

/// Subscribers to `sidecar.onEvent` keyed by tokio mpsc Sender (one per
/// subscription; supervisor drops on plugin teardown).
pub type EventSink = mpsc::UnboundedSender<Value>;

/// Spawn the stdin writer task. Owns the child's stdin handle for the
/// life of the sidecar process.
pub fn spawn_stdin_writer(
    plugin_id: PluginId,
    mut stdin: ChildStdin,
    mut rx: mpsc::Receiver<Vec<u8>>,
) {
    tokio::spawn(async move {
        while let Some(mut bytes) = rx.recv().await {
            if !bytes.ends_with(b"\n") {
                bytes.push(b'\n');
            }
            if let Err(e) = stdin.write_all(&bytes).await {
                log::warn!("[plugin={plugin_id}] sidecar stdin write failed: {e}");
                break;
            }
            if let Err(e) = stdin.flush().await {
                log::warn!("[plugin={plugin_id}] sidecar stdin flush failed: {e}");
                break;
            }
        }
        log::debug!("[plugin={plugin_id}] sidecar stdin writer task exited");
    });
}

/// Spawn the stdout reader task. Routes parsed messages to either:
///   - a pending request's oneshot (response messages)
///   - all registered event sinks (`raic.event` notifications)
pub fn spawn_stdout_reader(
    plugin_id: PluginId,
    stdout: ChildStdout,
    pending: PendingCalls,
    event_sinks: Arc<Mutex<Vec<EventSink>>>,
) {
    tokio::spawn(async move {
        let mut reader = BufReader::new(stdout);
        let mut line = String::new();
        loop {
            line.clear();
            let n = match reader.read_line(&mut line).await {
                Ok(0) => break, // EOF
                Ok(n) => n,
                Err(e) => {
                    log::warn!("[plugin={plugin_id}] sidecar stdout read error: {e}");
                    break;
                }
            };
            if n == 0 {
                break;
            }
            let trimmed = line.trim_end();
            if trimmed.is_empty() {
                continue;
            }
            let msg: Value = match serde_json::from_str(trimmed) {
                Ok(v) => v,
                Err(e) => {
                    log::warn!(
                        "[plugin={plugin_id}] sidecar wrote invalid JSON ({e}): {trimmed:.200}"
                    );
                    continue;
                }
            };

            // Dispatch.
            if let Some(id_val) = msg.get("id") {
                // Response (or error response) to a host-issued request.
                let id_key = json_id_key(id_val);
                let pending = pending.clone();
                let mut map = pending.lock().await;
                if let Some(tx) = map.remove(&id_key) {
                    if let Some(err) = msg.get("error") {
                        let parsed: JsonRpcError =
                            serde_json::from_value(err.clone()).unwrap_or_else(|_| {
                                JsonRpcError::new(
                                    RpcErrorCode::InternalError,
                                    "sidecar returned malformed error",
                                )
                            });
                        let _ = tx.send(Err(parsed));
                    } else {
                        let result = msg
                            .get("result")
                            .cloned()
                            .unwrap_or(Value::Null);
                        let _ = tx.send(Ok(result));
                    }
                } else {
                    log::warn!(
                        "[plugin={plugin_id}] sidecar response with unknown id {id_key}"
                    );
                }
            } else if msg.get("method").and_then(|v| v.as_str()) == Some("raic.event") {
                let payload = msg.get("params").cloned().unwrap_or(Value::Null);
                let sinks = event_sinks.lock().await;
                for s in sinks.iter() {
                    let _ = s.send(payload.clone());
                }
            } else if let Some(method) = msg.get("method").and_then(|v| v.as_str()) {
                log::debug!(
                    "[plugin={plugin_id}] sidecar sent notification {method:?} (ignored — host doesn't subscribe outside raic.event)"
                );
            }
        }
        log::debug!("[plugin={plugin_id}] sidecar stdout reader task exited");
    });
}

/// Spawn the stderr reader task. Every line becomes a warn log tagged
/// with the plugin id.
pub fn spawn_stderr_reader(plugin_id: PluginId, stderr: ChildStderr) {
    tokio::spawn(async move {
        let mut reader = BufReader::new(stderr);
        let mut line = String::new();
        loop {
            line.clear();
            match reader.read_line(&mut line).await {
                Ok(0) => break,
                Ok(_) => {
                    let trimmed = line.trim_end();
                    if !trimmed.is_empty() {
                        log::warn!("[plugin={plugin_id}] sidecar stderr: {trimmed}");
                    }
                }
                Err(e) => {
                    log::warn!("[plugin={plugin_id}] sidecar stderr read error: {e}");
                    break;
                }
            }
        }
    });
}

fn json_id_key(v: &Value) -> String {
    match v {
        Value::String(s) => s.clone(),
        Value::Number(n) => n.to_string(),
        _ => v.to_string(),
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn json_id_key_normalises_strings_and_numbers() {
        assert_eq!(json_id_key(&serde_json::json!("abc")), "abc");
        assert_eq!(json_id_key(&serde_json::json!(42)), "42");
        // Other shapes round-trip via to_string for stability.
        assert_eq!(json_id_key(&serde_json::json!(null)), "null");
    }
}
