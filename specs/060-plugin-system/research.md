# Phase 0 Research: Plugin System

**Feature**: 060-plugin-system
**Date**: 2026-05-21
**Constitution principle invoked**: V. Research-First Development

This document resolves every "NEEDS CLARIFICATION" / unknown surfaced while drafting the Technical Context, using Context7 for Tauri 2.x documentation and the GitHub REST API reference.

---

## R-001 — Sidecar transport: stdio framing & child process supervision

**Decision**: Spawn each plugin sidecar with Rust's `tokio::process::Command` directly (bypassing `tauri-plugin-shell`), pipe its `stdin`/`stdout`/`stderr`, and frame JSON-RPC messages as newline-delimited JSON (one JSON object per line, `\n`-terminated).

**Rationale**:
- Plugin sidecar binaries are discovered at install time and live under `%APPDATA%/RAICOverlay/plugins/<id>/<version>/bin/`. They cannot be declared at compile time in `tauri.conf.json`, which is what `tauri-plugin-shell` requires for its `sidecar()` API.
- `tauri-plugin-shell::command()` requires every allowed `cmd` to be listed by name in `capabilities/*.json` (per Context7 / `/websites/v2_tauri_app` → "Configure Shell permissions"). Plugin binaries have arbitrary names; we can't enumerate them.
- Going through `tokio::process::Command` keeps the validation in Rust (we verify the binary path is under the plugins directory before spawn), is async-native, and has zero extra plugin dependencies.
- Newline-delimited JSON is the same framing LSP uses for "Content-Type: text" (without the `Content-Length` header). It's trivial to implement in any language with `readline`/`println`, which matches the spec's language-agnostic goal (Q1 / Clarification on stdio transport).

**Alternatives considered**:
- `tauri-plugin-shell::sidecar()` — rejected: only works for sidecars declared at build time.
- `tauri-plugin-shell::command()` with permissive capability — rejected: the scope only narrows allowed binaries; it can't be "any binary under a directory", so we'd have to declare every plugin's binary in capabilities and reload them dynamically — not a documented pattern.
- Content-Length-framed JSON-RPC (LSP-style) — rejected: more parsing overhead in every sidecar implementation for negligible benefit at our message sizes.
- Named pipes / WebSocket — rejected at clarification time (see spec Clarifications session 2026-05-21, Q1).

**Implementation notes**:
- Use `tokio::io::BufReader::new(child.stdout.take().unwrap()).lines()` to read line-by-line.
- Capture `stderr` separately and pipe each line through `log::warn!` tagged with the plugin id, satisfying FR-019's "stderr is captured by the host into the unified log".
- On `child.wait()` returning Err or a non-zero exit, mark the sidecar as crashed and reject any in-flight RPC promises with `SidecarUnavailable`.
- Graceful termination: send a `shutdown` JSON-RPC notification, then `child.start_kill()` after a 5 s grace period.

---

## R-002 — Injecting `window.raic` and CSS tokens into the plugin webview

**Decision**: Use `WebviewWindowBuilder::initialization_script(script)` to inject a single bootstrap script *before* the plugin's HTML/JS executes. The script (a) registers `window.raic` with the JSON-RPC client, (b) injects a `<style>` tag exposing the SC HUD theme tokens as CSS custom properties on `:root`, and (c) wires the message transport (Tauri's `__TAURI_INTERNALS__.invoke` for host→plugin, `WebviewWindow.listen` for plugin→host events).

**Rationale**:
- `initialization_script` runs in the webview context before any page script — guaranteeing `window.raic` exists when the plugin's first inline script runs (satisfies FR-014).
- Plugin code is loaded from a `tauri://localhost/plugins/<id>/index.html` (custom protocol handler) URL so the host fully controls the resource origin and what scripts/styles get injected.
- For the JSON-RPC transport from the webview side, we use a single Tauri command `plugin_rpc(plugin_id, request)` invoked from the bootstrap script. The Rust side dispatches by method name to the right capability handler, applying permission checks.
- Events host→plugin (e.g., `hotkey.onTrigger`) are delivered via `app.emit_to(webview_label, "raic:event", payload)` and received by the bootstrap script with `WebviewWindow.listen`.

**Alternatives considered**:
- `webview.eval()` from `on_webview_ready` — rejected: runs *after* the page loads, so there's a race where plugin scripts might run before `window.raic` is defined.
- `tauri-plugin-shell` IPC bridge — N/A, that's a different feature.
- Postmessage between an iframe and parent — rejected: adds an iframe wrapper layer with its own focus/scroll quirks. The webview *is* the plugin's window, simpler.

**Implementation notes**:
- The bootstrap script is a static `.js` file shipped in the host binary; it's read at startup and embedded into a `String` that's passed to `initialization_script(...)` for every plugin window.
- CSS tokens come from the host's current theme state. Token changes (theme switches) emit a `raic:theme-changed` event the bootstrap script listens to and updates the `:root` custom properties.

---

## R-003 — Plugin webview isolation from native Tauri commands

**Decision**: Plugin webviews are created with a different per-window IPC permission scope than the host's main window. The plugin webview is allowed to invoke exactly one Tauri command — `plugin_rpc(plugin_id, request)` — and nothing else. All host capabilities, including state, hotkeys, notifications, sidecar relay, are reached through that single dispatcher, which performs the permission check.

**Rationale**:
- Tauri 2's capability system is per-window: capabilities files (`capabilities/*.json`) target windows by `windows: ["main"]`. We define a `plugin-webview` capability that allows only `plugin_rpc` and applies it to plugin windows.
- One single entry point means the entire attack surface is one Rust function, easy to audit. All permission decisions live in one place.
- The plugin webview cannot reach `tauri-plugin-fs`, `tauri-plugin-shell`, the global event bus to other windows, etc., because those capabilities are not granted to its label.

**Alternatives considered**:
- Exposing every capability as its own Tauri command and gating each with permission checks — rejected: more surface, more places to forget the permission check.
- Isolation pattern (separate isolation webview) — overkill; isolation pattern is for protecting the main app from a third-party-served frontend, which is the opposite of our case.

---

## R-004 — Plugin manifest format

**Decision**: **JSON** with the filename `raic-plugin.json` at the root of the plugin release archive.

**Rationale**:
- JSON has zero learning curve for plugin authors (every editor, every language, every CI tool supports it).
- JSON Schema is the de facto standard for validating manifests — we can ship `contracts/manifest.schema.json` and authors can wire it into VS Code with `"$schema"` for autocompletion.
- The existing host already uses `serde_json` extensively (state persistence, RPC); no new parser dependency.
- TOML was considered (matches `Cargo.toml`/`tauri.conf.json`) but plugin authors are more likely to come from a web/JS background than a Rust one; JSON is friendlier.
- YAML rejected: whitespace-sensitive, harder to validate, no benefit here.

**Alternatives considered**:
- `plugin.toml` — rejected for the audience reason above.
- `package.json` (reuse npm's manifest) — rejected: would conflict with `package.json`'s own semantics if the plugin author happens to use npm to build their UI.

---

## R-005 — Manifest validation library (Rust)

**Decision**: Use the `jsonschema` crate (latest stable, 0.x at the time of writing) for compile-time-loaded schema validation.

**Rationale**:
- `jsonschema` is the most-maintained pure-Rust JSON Schema validator, supports draft 2020-12.
- We embed `contracts/manifest.schema.json` into the binary via `include_str!` and compile it once at startup.
- Validation errors come back as a list of `ValidationError` with JSON pointers, perfect for the consent screen / install error UI.

**Alternatives considered**:
- Hand-rolled validation in `serde` derives — rejected: schema is also the contract published to plugin authors; having one source of truth (JSON Schema file) prevents drift between the host's parser and the published spec.
- `valico` — older, less actively maintained.

---

## R-006 — GitHub Releases API: latest release, asset download, rate limiting

**Decision**:
- **Latest release lookup**: `GET https://api.github.com/repos/{owner}/{repo}/releases/latest` (unauthenticated). Parse `tag_name` (semver), `assets[]` (each with `name`, `browser_download_url`, `size`, `content_type`).
- **Plugin archive convention**: the plugin author MUST attach an asset named `raic-plugin.zip` (case-insensitive) to the release. The host downloads that one asset, *not* the auto-generated source tarball.
- **Conditional requests**: cache the previous release's `ETag` per plugin in `plugin-registry.json`; send `If-None-Match` on the daily check to get 304 responses that don't count against rate limit.
- **Rate limit**: 60 requests/hour unauthenticated, per IP. With ≤20 plugins checked once at startup + once per 24 h, we use 21-40 requests/day. Well under the limit.

**Rationale**:
- Forcing a named asset (`raic-plugin.zip`) means the author controls exactly what gets shipped (pre-built UI bundle, pre-compiled sidecars per platform), which is necessary for sidecar plugins. Source tarballs would include build files and not the compiled sidecars.
- ETags are a standard hardening for daily polling and they're free.

**Alternatives considered**:
- GitHub source tarball — rejected: doesn't include compiled sidecars; requires plugin authors to publish source-only plugins.
- Authenticated requests (5 000 req/hr) — rejected: would require the user to provide a GitHub token, unacceptable friction for v1.
- Polling without ETag — works but wastes rate budget.

**Implementation notes**:
- Use `reqwest::Client` (already a dep, see `Cargo.toml`).
- User-Agent header REQUIRED by GitHub API: `User-Agent: RAICOverlay/<version>`.
- On HTTP 403 with `X-RateLimit-Remaining: 0`, surface to the user: "GitHub rate limit reached, retry after <reset time>".

---

## R-007 — Archive extraction (zip on Windows)

**Decision**: Use the `zip` crate (`zip = "2"`) to extract `raic-plugin.zip` into the plugin's install directory. Validate archive entries against path traversal before extraction (no `..`, no absolute paths).

**Rationale**:
- `zip` is the standard Rust crate for zip files; supports streaming extraction.
- Path traversal is the classic zip-slip vulnerability; explicit canonicalisation before each `extract` call prevents it.
- Windows-only target means we don't need to worry about Unix permissions / executable bits.

**Alternatives considered**:
- `tar` (require `.tar.gz`) — rejected: zip is more familiar on Windows; less tooling friction for authors.
- Shell out to PowerShell `Expand-Archive` — rejected: extra subprocess, harder to error-handle.

---

## R-008 — Plugin storage layout on disk

**Decision**:

```text
%APPDATA%\com.raic.overlay\plugins\
├── registry.json                       # PluginRegistry (installed plugins index)
├── <plugin-id>\
│   ├── <version>\                       # versioned install dir (e.g., 1.4.2)
│   │   ├── raic-plugin.json             # manifest
│   │   ├── ui\index.html                # UI bundle root (whatever the manifest's ui.entry points at)
│   │   ├── bin\<platform>\sidecar.exe   # optional sidecar binary
│   │   └── README.md / LICENSE / etc.   # author-included files
│   └── state\                           # persistent state (survives version upgrades)
│       └── state.json                   # plugin's state.get/set storage
└── _cache\                              # temp downloads / ETag cache
    └── <plugin-id>.etag
```

**Rationale**:
- Versioned install dirs allow side-by-side installs during update (download new version, verify, then atomically flip the "current" pointer in `registry.json`).
- Plugin state lives **outside** the versioned dir so it persists across upgrades (a 1.4.2 → 1.5.0 update doesn't lose user settings).
- One file per plugin's state (`state.json`) is fine for v1 — we have no quota, and read/write is in-memory anyway.

**Alternatives considered**:
- Flat `plugins/<id>/` without version subdirs — rejected: no atomic upgrade path.
- SQLite for state — rejected: way overkill for kv access patterns, adds a dep.

---

## R-009 — JSON-RPC dispatcher architecture (Rust side)

**Decision**: A single `plugin_rpc` Tauri command receives `(plugin_id: String, request: JsonRpcRequest)`. It looks up the plugin's runtime state (active `PluginInstance`), applies the permission check based on the requested method's category, and routes to one of: state store, hotkey registry, notification dispatcher, sidecar relay, etc. Each handler returns `Result<Value, RpcError>` which is serialised into the JSON-RPC response.

**Rationale**:
- One entry point = one place to enforce isolation, log denials, and time out hung calls.
- Method routing by name (e.g., `"state.set"` → `state_handler::set`) is simple `match` on a string; no macro magic needed.
- Async-by-default with `tokio` so a slow sidecar call doesn't block other plugins.

**Alternatives considered**:
- A separate Tauri command per capability group — rejected: scatters permission logic, requires per-window capability config for each.

---

## R-010 — Auto-update polling pattern

**Decision**: At host startup, spawn a `tokio` task that:
1. Immediately checks each installed plugin's latest release.
2. Sleeps for 24 h.
3. Re-checks.
4. Repeats while the host is running.

Results are stored in `registry.json`'s per-plugin `available_update` field. A frontend listener on `raic:plugin-update-available` events shows the badge.

**Rationale**:
- Mirrors the existing host auto-update pattern (Feature 049/051) the user explicitly called out in Q5.
- No background scheduling library needed; `tokio::time::sleep_until(Instant::now() + Duration::from_secs(86_400))` is enough.

**Implementation notes**:
- Cancel the loop cleanly on host shutdown via a `CancellationToken`.
- Initial check is delayed by 10 s after startup to avoid competing with the host's own update check.

---

## R-011 — Testing strategy

**Decision**:
- **Rust integration tests** (`src-tauri/tests/`) covering:
  - Manifest validation (positive + negative cases for every required field).
  - Plugin install flow with a fake `reqwest` `MockServer` (e.g., `wiremock` crate) serving a synthetic GitHub release.
  - JSON-RPC dispatcher: each method's success path + each permission denial path.
  - Sidecar lifecycle: spawn, ping/pong, timeout, crash, shutdown grace period.
  - State store: scoping (plugin A cannot read plugin B), persistence across restart.
- **Frontend smoke tests** (manual + Playwright for the install consent dialog & Plugins menu visibility toggle): existing project pattern doesn't have automated E2E yet, so this matches the team's testing diamond.
- **Reference Hello World plugin** in `examples/hello-world-plugin/` used both for the quickstart doc and as a fixture for integration tests.

**Rationale**: Matches Constitution principle II (integration-first; reserve unit tests for complex algorithms — manifest validation logic itself is a good unit-test target since it's algorithmic).

---

## R-012 — Performance budgets

**Decision**:
| Path | Target | Source |
|------|--------|--------|
| `plugin_rpc` round trip (host-only methods like `state.set`) | < 10 ms p95 | Derived from spec's UX consistency goal |
| Plugin webview cold start (window open → plugin's `DOMContentLoaded`) | < 500 ms p95 for plugins ≤ 1 MB | Derived from SC-001 |
| Install end-to-end (GitHub URL → plugin in menu) | < 60 s for ≤ 1 MB on typical broadband | SC-001 |
| Sidecar spawn → first JSON-RPC response available | < 1 s p95 (excluding sidecar's own init time) | Derived from "before allowing UI to make sidecar calls" (FR-019) |
| Auto-update check (per plugin) | < 2 s p95 with ETag-304 | Constitution baseline for background operations |

All measured in CI on a reference machine matching the constitution's "Performance Requirements" principle.

---

## Resolved unknowns summary

| # | Topic | Status |
|---|-------|--------|
| R-001 | Sidecar transport & framing | Resolved |
| R-002 | Bootstrap script injection | Resolved |
| R-003 | Webview isolation from Tauri commands | Resolved |
| R-004 | Manifest format | Resolved |
| R-005 | Manifest validator | Resolved |
| R-006 | GitHub Releases API usage | Resolved |
| R-007 | Archive extraction | Resolved |
| R-008 | On-disk storage layout | Resolved |
| R-009 | RPC dispatcher architecture | Resolved |
| R-010 | Auto-update polling | Resolved |
| R-011 | Testing strategy | Resolved |
| R-012 | Performance budgets | Resolved |

No NEEDS CLARIFICATION remaining.
