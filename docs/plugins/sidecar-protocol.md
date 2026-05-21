# Sidecar Protocol v1

**Feature**: 060-plugin-system
**Date**: 2026-05-21
**Protocol version**: `1`

This document is the contract a sidecar binary MUST implement to participate in the RAIC Overlay plugin system. A sidecar is any executable shipped inside a plugin's `raic-plugin.zip` and declared in the manifest's `sidecar.platforms[<platform>].bin` field.

Sidecar authors can implement this protocol in **any language** that can read its stdin and write to its stdout — Rust, Go, Python, Node.js, .NET, C++, etc. No RAIC Overlay library is required.

---

## Transport

- The host spawns the sidecar as a child process via Rust's `tokio::process::Command`.
- The host attaches **pipes** to the sidecar's `stdin`, `stdout`, and `stderr`.
- The host MAY pass extra command-line arguments declared in the manifest's `sidecar.platforms[<platform>].args` field.
- The host sets these environment variables before spawn:
  - `RAIC_PLUGIN_ID` — the plugin's id (matches `manifest.id`).
  - `RAIC_PLUGIN_VERSION` — the installed semver.
  - `RAIC_PROTOCOL_VERSION` — currently `1`.
  - `RAIC_PLUGIN_STATE_DIR` — absolute path to the plugin's persistent state directory (sidecars may read/write files here freely; it is the same directory the UI's `state.*` methods back into, but with no key/value abstraction).
  - `RAIC_PLUGIN_LOG_PREFIX` — a string the sidecar SHOULD prefix on log lines if it wants its own format, though the host already tags stderr captures with the plugin id.

## Framing

- Every message is **one line of UTF-8 JSON**, terminated by a single `\n` byte (LF, not CRLF).
- The message body MUST be a valid JSON-RPC 2.0 object (request, response, or notification).
- Lines longer than the host's max message size (default 1 MiB) are dropped with a `ParseError` written by the host into the unified log.
- **stdout** = sidecar → host. The sidecar writes its responses and notifications here.
- **stdin** = host → sidecar. The host writes its requests and notifications here.
- **stderr** = free-form. Every line is captured by the host and forwarded to the unified log as a `warn` entry tagged with the plugin id. Sidecars SHOULD use stderr for human-readable diagnostics and stdout exclusively for protocol traffic.

## Lifecycle

1. **Spawn**: host launches the sidecar. The sidecar SHOULD complete its initialisation within a few seconds and be ready to handle requests.
2. **Initialise handshake**: the host's first message is:
   ```json
   {"jsonrpc":"2.0","id":"init","method":"raic.init","params":{"protocol":1,"pluginId":"<id>","version":"<plugin-version>"}}
   ```
   The sidecar MUST respond within 5 seconds:
   ```json
   {"jsonrpc":"2.0","id":"init","result":{"name":"<sidecar-name>","version":"<sidecar-version>","methods":["<method1>","<method2>"]}}
   ```
   The `methods` array tells the host which sidecar-defined methods are callable via `sidecar.call`. If the sidecar fails to respond within 5 s, the host terminates it and marks the plugin instance as `failed`.
3. **Steady state**: the sidecar receives requests on stdin, processes them, writes responses on stdout. It MAY push notifications at any time using JSON-RPC 2.0 notification form (no `id`):
   ```json
   {"jsonrpc":"2.0","method":"raic.event","params":{"event":<any>}}
   ```
   These are forwarded verbatim to UI subscribers of `sidecar.onEvent`.
4. **Shutdown**: the host sends:
   ```json
   {"jsonrpc":"2.0","method":"raic.shutdown"}
   ```
   The sidecar SHOULD finish any in-flight responses and exit within 5 seconds. If it does not, the host kills the process.

## Request / response shapes

Identical to `jsonrpc-v1.md`'s JSON-RPC 2.0 envelopes. The methods called on the sidecar are **defined entirely by the sidecar author**; the only requirement is that the sidecar declare them in the `methods` array of its `raic.init` response.

Example: a sidecar that exposes a `ping` method.

Host → sidecar:
```json
{"jsonrpc":"2.0","id":"42","method":"ping","params":{}}
```
Sidecar → host:
```json
{"jsonrpc":"2.0","id":"42","result":{"reply":"pong"}}
```

## Error codes the sidecar may use

- Reuse the standard JSON-RPC codes for protocol-level errors (`-32700 ParseError`, `-32601 MethodNotFound`, `-32602 InvalidParams`, `-32603 InternalError`).
- For domain-specific errors, use codes in the range **`-32100..-32199`**. The host passes them straight through to the plugin's UI; the meaning is whatever the sidecar author documents.

## Timeouts

- The host enforces a per-call timeout of 30 000 ms by default, with the plugin UI free to override up to 300 000 ms via `sidecar.call({ ..., timeoutMs })`. If the sidecar hasn't responded within the effective deadline, the host rejects the UI's promise with `SidecarTimeout` and **forgets** about the request id; if the sidecar responds later, the host discards the response.
- Long-running work that exceeds 5 minutes MUST be modelled as: kick off via a short request, then push results via `raic.event` notifications.

## Crash handling

- If the sidecar exits unexpectedly (any exit code, including 0, while the plugin instance is supposed to be alive), the host:
  - Marks the `PluginInstance.sidecar` as `crashed`.
  - Rejects all in-flight `sidecar.call` requests with `SidecarUnavailable`.
  - Logs the exit code + last 32 stderr lines.
  - Does **not** auto-restart in v1. The user must close and reopen the plugin to retry.

## Sidecar author checklist

- [ ] Read stdin line by line; parse each as a JSON-RPC request or notification.
- [ ] Write responses to stdout, **flushing after every write** (unbuffered).
- [ ] Respond to `raic.init` within 5 seconds with your declared methods.
- [ ] Respond to `raic.shutdown` by exiting cleanly within 5 seconds.
- [ ] Never write non-JSON to stdout; use stderr for human-readable logs.
- [ ] Validate incoming params; on schema mismatch return `InvalidParams` (-32602).
- [ ] For long-running work, use notifications, not synchronous responses.
- [ ] Handle EOF on stdin (= host shutting down) by exiting cleanly.

## Minimal Python example

```python
import sys, json

def write(obj):
    sys.stdout.write(json.dumps(obj) + "\n")
    sys.stdout.flush()

for line in sys.stdin:
    msg = json.loads(line)
    if msg.get("method") == "raic.init":
        write({"jsonrpc": "2.0", "id": msg["id"],
               "result": {"name": "demo", "version": "0.1.0", "methods": ["ping"]}})
    elif msg.get("method") == "ping":
        write({"jsonrpc": "2.0", "id": msg["id"], "result": {"reply": "pong"}})
    elif msg.get("method") == "raic.shutdown":
        break
```
