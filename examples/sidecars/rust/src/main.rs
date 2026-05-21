// Minimal RAIC Overlay sidecar in Rust.
//
// Implements docs/plugins/sidecar-protocol.md:
//   raic.init       -> responds with { name, version, methods }
//   ping            -> responds with { reply: "pong", receivedAt }
//   echo            -> mirrors params back
//   raic.shutdown   -> exits cleanly within 5 seconds
//
// Build:    cargo build --release
// Output:   target/release/sidecar-rust.exe (Windows)
// Wire it into a plugin manifest at bin/windows-x86_64/sidecar.exe.

use std::io::{self, BufRead, Write};

use serde_json::{json, Value};

fn write_line(obj: &Value) {
    let line = serde_json::to_string(obj).expect("encode JSON");
    let stdout = io::stdout();
    let mut handle = stdout.lock();
    handle.write_all(line.as_bytes()).expect("write stdout");
    handle.write_all(b"\n").expect("write nl");
    handle.flush().expect("flush stdout");
}

fn log(msg: &str) {
    let stderr = io::stderr();
    let mut handle = stderr.lock();
    let _ = handle.write_all(msg.as_bytes());
    let _ = handle.write_all(b"\n");
}

fn now_rfc3339() -> String {
    chrono::Utc::now().to_rfc3339()
}

fn main() {
    let plugin_id = std::env::var("RAIC_PLUGIN_ID").unwrap_or_else(|_| "?".into());
    log(&format!("rust sidecar starting for plugin {plugin_id}"));

    let stdin = io::stdin();
    for line in stdin.lock().lines() {
        let line = match line {
            Ok(l) => l,
            Err(e) => {
                log(&format!("stdin read error: {e}"));
                break;
            }
        };
        if line.is_empty() {
            continue;
        }
        let msg: Value = match serde_json::from_str(&line) {
            Ok(v) => v,
            Err(e) => {
                log(&format!("invalid JSON: {e}"));
                continue;
            }
        };

        let id = msg.get("id").cloned().unwrap_or(Value::Null);
        let method = msg.get("method").and_then(|v| v.as_str()).unwrap_or("");

        match method {
            "raic.init" => write_line(&json!({
                "jsonrpc": "2.0",
                "id": id,
                "result": {
                    "name": "sidecar-rust",
                    "version": "0.1.0",
                    "methods": ["ping", "echo"],
                }
            })),
            "ping" => write_line(&json!({
                "jsonrpc": "2.0",
                "id": id,
                "result": { "reply": "pong", "receivedAt": now_rfc3339() }
            })),
            "echo" => write_line(&json!({
                "jsonrpc": "2.0",
                "id": id,
                "result": msg.get("params").cloned().unwrap_or(Value::Null)
            })),
            "raic.shutdown" => {
                log("shutdown received; exiting");
                std::process::exit(0);
            }
            other => write_line(&json!({
                "jsonrpc": "2.0",
                "id": id,
                "error": {
                    "code": -32601,
                    "message": format!("method {other:?} not found"),
                }
            })),
        }
    }
}
