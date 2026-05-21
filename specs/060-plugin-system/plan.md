# Implementation Plan: Plugin System

**Branch**: `060-plugin-system` | **Date**: 2026-05-21 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/060-plugin-system/spec.md`

## Summary

A protocol-first, language-agnostic plugin system that lets third-party developers extend RAIC Overlay by publishing public GitHub repositories. Users install by pasting a GitHub URL; the host downloads the release, displays a consent screen, and (on confirm) unpacks the plugin into an isolated per-user directory. Plugin UIs are HTML/JS/CSS bundles loaded through a custom `tauri://` protocol handler into host-owned webviews that inherit the SC HUD chrome and theme tokens. A single `window.raic` JSON-RPC client is injected before plugin scripts run. Optional native sidecars (any language, ship as platform binaries inside the release) are spawned as child processes with newline-delimited JSON-RPC over stdio. Updates poll the GitHub Releases API once at startup and daily, badge the plugins menu, and require manual confirm. The user is the sole trust authority: the host validates structure and shows permissions, but does not sign or attest.

## Technical Context

**Language/Version**: Rust 2021 Edition (backend, requires 1.92+, matches the existing host), TypeScript 5.7.2 (React 19.0.0 frontend, Next.js 16.x).

**Primary Dependencies (additions on top of existing host)**:
- Backend (Cargo): `jsonschema = "0.x"` (manifest validation), `zip = "2"` (release archive extraction), `wiremock = "0.6"` (test-only — mocks the GitHub API in integration tests). Reuses existing: `tauri 2.x`, `serde`, `serde_json`, `tokio`, `reqwest`, `semver`, `tauri-plugin-log`, `tauri-plugin-fs`, `tauri-plugin-opener`.
- Frontend: no new packages. Reuses existing React 19.0.0, Next.js 16.x, Tailwind CSS 4.x, motion, shadcn/ui, `@tauri-apps/api 2.0.0`.

**Storage**: JSON files in the Tauri app data directory:
- `%APPDATA%\com.raic.overlay\plugins\registry.json` (installed plugins index).
- `%APPDATA%\com.raic.overlay\plugins\<plugin-id>\<version>\` (versioned plugin install dirs).
- `%APPDATA%\com.raic.overlay\plugins\<plugin-id>\state\state.json` (per-plugin persistent KV store, survives version upgrades).
- `%APPDATA%\com.raic.overlay\plugins\_cache\<plugin-id>.etag` (ETag cache for conditional GitHub polling).

**Testing**:
- Rust integration tests in `src-tauri/tests/plugin_*.rs` using `wiremock` for the GitHub API, real `tokio::process::Command` for sidecar tests with a fixture sidecar binary built in CI.
- Reference `examples/hello-world-plugin/` exercises the full happy path (UI-only, no sidecar) and is used as a test fixture.
- Manual smoke verification for the install consent dialog and Plugins-menu visibility toggle, following the existing project pattern (`run` / `verify` skill).

**Target Platform**: Windows 11 (64-bit). Same target as the host today.

**Project Type**: Single project (Tauri-bundled Next.js frontend + Rust backend). Matches the existing structure under Feature 055's modular Rust layout.

**Performance Goals** (per `research.md` R-012):
- `plugin_rpc` round-trip for host-only methods (`state.set`, `window.setTitle`, etc.): < 10 ms p95.
- Plugin webview cold start (window open → `DOMContentLoaded`): < 500 ms p95 for plugins ≤ 1 MB.
- End-to-end install from "URL pasted" to "plugin in menu" (SC-001): < 60 s for ≤ 1 MB plugins on typical broadband.
- Sidecar spawn → first JSON-RPC reply available: < 1 s p95 (excluding sidecar's own init compute).
- Auto-update check per plugin (with ETag 304): < 2 s p95.

**Constraints**:
- Sidecar transport is strictly newline-delimited JSON over stdio (FR-019, Clarification Q1).
- Sidecar per-call timeout: 30 s default, 300 s max (FR-022, Clarification Q3).
- No storage quota; track and surface size only (FR-025, Clarification Q2).
- "Plugins" menu entry hidden when zero plugins installed (FR-012a, Clarification Q4).
- Update install always requires explicit user confirmation; no silent path (FR-005b, Clarification Q5).
- GitHub API unauthenticated only (60 req/hour shared limit) — never prompt for tokens in v1.

**Scale/Scope**:
- Expected ≤ 20 concurrently installed plugins per user.
- Each plugin: 1 primary window + N secondary windows (no hard cap, but secondary windows are user-initiated through plugin code).
- One optional sidecar process per plugin.

## Constitution Check

*GATE: passes before Phase 0 research; re-checked post-Phase 1 design (see end of section).*

### I. Code Quality
- ✅ All new modules will follow the project's existing modular Rust layout (Feature 055) — one feature directory per responsibility (`plugins/registry`, `plugins/installer`, `plugins/runtime`, `plugins/rpc`, `plugins/sidecar`).
- ✅ Type-checked across both languages (Rust compiler + TypeScript). No unsafe Rust required.
- ✅ Single dispatcher entry point (`plugin_rpc`) — no scattered permission logic.

### II. Testing Standards
- ✅ Integration-first: every install flow path, manifest validation case, RPC method, and sidecar lifecycle state has an integration test (see Testing notes above).
- ✅ Reference fixture plugin doubles as a smoke test and as the canonical example in `quickstart.md`.
- ✅ Unit tests reserved for the algorithmic core: manifest validator, semver checks, ETag-aware update detection.

### III. User Experience Consistency
- ✅ Plugin UIs inherit the SC HUD window chrome unchanged (FR-012); CSS tokens provide consistent typography/colors (FR-013).
- ✅ Install consent dialog reuses the existing Settings panel dialog patterns (Feature 038).
- ✅ "Plugins" menu entry follows the same dropdown pattern as the existing menu (Feature 041 header button groups), only conditionally rendered.
- ✅ Error messages from the install flow follow the same "actionable error → suggested next step" style the host uses elsewhere.
- ✅ **Accessibility (WCAG 2.1 AA)** is required by spec FR-029 for every new host-built surface (Settings → Plugins tab, install/update consent dialog, conditional Plugins menu). US1 and US4 each include a dedicated accessibility acceptance scenario (keyboard-only flow, focus management, screen-reader announcements, contrast). Implementation is covered by tasks T116 (install dialog + Settings tab a11y), T117 (Plugins menu dropdown a11y), T118 (plugin row controls a11y), and T119 (cross-cutting WCAG audit in Polish).

### IV. Performance Requirements
- ✅ Targets are quantified in `research.md` R-012 (above).
- ✅ All external dependencies have timeouts: GitHub API requests (10 s connect, 30 s read), sidecar calls (30 s default, 300 s max), webview cold start measured per-plugin and surfaced in logs if exceeded.
- ✅ Update polling cadence (startup + 24 h) chosen to fit within GitHub's 60 req/hour unauthenticated limit with margin.

### V. Research-First Development
- ✅ Phase 0 ran Context7 against `/websites/v2_tauri_app` for Tauri 2.x WebviewWindow, sidecar / shell-plugin patterns, and capability scoping. Findings recorded in `research.md`.
- ✅ Decisions tied back to concrete Tauri 2.x APIs (`initialization_script`, custom protocol, capability-per-window scope) — no cached or speculative knowledge.
- ✅ External Rust crates (`jsonschema`, `zip`, `wiremock`) chosen against current maintenance status.

**Result**: All five principles pass; **no entries needed in Complexity Tracking**.

## Project Structure

### Documentation (this feature)

```text
specs/060-plugin-system/
├── plan.md                  # This file
├── spec.md                  # Feature spec (with Clarifications session)
├── research.md              # Phase 0 — resolved unknowns
├── data-model.md            # Phase 1 — entities, fields, lifecycles
├── quickstart.md            # Phase 1 — plugin author + end user walkthrough
├── contracts/
│   ├── manifest.schema.json    # JSON Schema for raic-plugin.json
│   ├── jsonrpc-v1.md           # Full method/error catalog
│   ├── window-raic.d.ts        # TypeScript types for the injected global
│   └── sidecar-protocol.md     # Stdio framing + sidecar author contract
├── checklists/
│   └── requirements.md      # Spec quality checklist (all items pass)
└── tasks.md                 # Created later by /speckit.tasks
```

### Source Code (repository root)

```text
src-tauri/
├── src/
│   ├── lib.rs                       # MODIFIED — register the plugins module
│   ├── plugins/                     # NEW — feature module (follows the layered layout from Feature 055)
│   │   ├── mod.rs                   # Re-exports
│   │   ├── types.rs                 # Plugin, Manifest, Sidecar, Permission, PluginInstance, etc. (data-model.md)
│   │   ├── registry.rs              # registry.json read/write + ETag cache
│   │   ├── installer/
│   │   │   ├── mod.rs
│   │   │   ├── github.rs            # GitHub Releases API client (reqwest)
│   │   │   ├── archive.rs           # Zip extraction with path-traversal guard
│   │   │   └── manifest.rs          # JSON Schema validation via jsonschema crate
│   │   ├── runtime/
│   │   │   ├── mod.rs
│   │   │   ├── instance.rs          # PluginInstance lifecycle (start/stop, secondaries)
│   │   │   ├── window.rs            # WebviewWindow creation + initialization_script injection
│   │   │   ├── protocol.rs          # tauri://plugin/<id> custom protocol handler
│   │   │   └── theme.rs             # Theme token → CSS injection helper
│   │   ├── rpc/
│   │   │   ├── mod.rs               # plugin_rpc Tauri command (single entry point)
│   │   │   ├── dispatch.rs          # method-name → handler routing
│   │   │   ├── permissions.rs       # Permission check
│   │   │   ├── window_handler.rs    # window.* methods
│   │   │   ├── state_handler.rs     # state.* methods (per-plugin scope)
│   │   │   ├── theme_handler.rs     # theme.* methods
│   │   │   ├── log_handler.rs       # log.* methods (delegates to tauri-plugin-log)
│   │   │   ├── notification_handler.rs
│   │   │   ├── hotkey_handler.rs    # hooks into existing hotkey module
│   │   │   └── sidecar_handler.rs
│   │   ├── sidecar/
│   │   │   ├── mod.rs
│   │   │   ├── spawn.rs             # tokio::process::Command spawn + handshake
│   │   │   ├── supervisor.rs        # process supervision, crash detection
│   │   │   └── transport.rs         # newline-delimited JSON stdio reader/writer
│   │   └── update/
│   │       ├── mod.rs
│   │       └── poller.rs            # 24 h polling loop (mirrors Feature 049's pattern)
│   └── ... (existing modules unchanged)
├── capabilities/
│   ├── default.json                 # MODIFIED — restrict capabilities to existing windows only
│   └── plugin-webview.json          # NEW — capability granting ONLY plugin_rpc to plugin windows
└── tests/
    ├── plugin_install_test.rs       # NEW — wiremock-backed install flow tests
    ├── plugin_rpc_test.rs           # NEW — dispatcher + per-method tests
    ├── plugin_sidecar_test.rs       # NEW — fixture sidecar binary, lifecycle tests
    └── plugin_manifest_test.rs      # NEW — JSON Schema validation tests

app/                                 # Frontend (Next.js app router)
├── settings/
│   ├── plugins/                     # NEW — Settings → Plugins tab
│   │   ├── page.tsx                 # List installed plugins + install field
│   │   ├── install-dialog.tsx       # The consent screen
│   │   └── plugin-row.tsx           # Per-plugin enable/disable/uninstall/update
│   └── ... (existing settings unchanged)
└── ... (existing routes unchanged)

components/
├── plugins-menu.tsx                 # NEW — conditional "Plugins" dropdown in main menu (FR-012a)
└── ... (existing components unchanged)

stores/
├── plugins-store.ts                 # NEW — Zustand store: installed plugins, available updates, active instances
└── ... (existing stores unchanged)

src-tauri/resources/
└── plugin-bootstrap.js              # NEW — the script injected via initialization_script (defines window.raic)

examples/
└── hello-world-plugin/              # NEW — reference plugin used by tests and quickstart.md
    ├── raic-plugin.json
    ├── ui/
    │   ├── index.html
    │   ├── main.js
    │   └── style.css
    └── README.md
```

**Structure Decision**: Single project, modular Rust per Feature 055. The new `plugins/` module mirrors the existing `browser/`, `update/`, `settings/` module style. Frontend additions live entirely under the existing `app/settings/` (admin surface) and a single new `components/plugins-menu.tsx` (overlay surface). No new top-level directories.

## Implementation Phases (Overview)

> Detailed task breakdown lives in `tasks.md` (generated by `/speckit.tasks`). The phases below are the milestones the tasks will roll up to.

**Phase A — Foundation (User Story 1 / P1: end-user install)**
- Manifest schema + validator (`installer/manifest.rs`, `contracts/manifest.schema.json`).
- Registry storage (`registry.rs`) + data types (`types.rs`).
- GitHub Releases client (`installer/github.rs`) + zip extraction (`installer/archive.rs`).
- Settings panel "Plugins" tab + install consent dialog (`app/settings/plugins/`).
- Custom `tauri://plugin/<id>` protocol handler (`runtime/protocol.rs`).
- Bootstrap script (`resources/plugin-bootstrap.js`) + `initialization_script` wiring.
- Capability file (`plugin-webview.json`) restricting plugin windows to one command.

**Phase B — UI integration (User Story 2 / P1: developer DX)**
- Theme-token injection (`runtime/theme.rs`).
- `plugin_rpc` dispatcher (`rpc/dispatch.rs`) + permission check (`rpc/permissions.rs`).
- `window.*`, `state.*`, `theme.*`, `log.*`, `permissions.*` handlers.
- Conditional "Plugins" menu (`components/plugins-menu.tsx`) wired to the plugins store.
- Reference `examples/hello-world-plugin/` published and consumed as test fixture.
- Integration tests for the no-permission RPC methods.

**Phase C — Sidecar support (User Story 3 / P2)**
- Sidecar spawn (`sidecar/spawn.rs`) + transport (`sidecar/transport.rs`) + supervision (`sidecar/supervisor.rs`).
- `sidecar.*` RPC handlers.
- `raic.init` / `raic.shutdown` handshake.
- Per-call timeout with override + cap.
- Fixture Rust sidecar binary in `examples/hello-world-plugin/bin/windows-x86_64/` for integration tests.

**Phase D — Management (User Story 4 / P2)**
- Enable/disable in Settings.
- Uninstall with full cleanup (files, state, hotkey unregistration).
- Storage size tracking + display.

**Phase E — Updates (Clarification Q5 / supports User Story 4)**
- Daily poller (`update/poller.rs`) following Feature 049's pattern.
- Update badge in plugins menu and Settings.
- Update consent flow (reuses install dialog).

**Phase F — Capabilities (User Story 5 / P3)**
- `hotkey.*` and `notification.*` handlers (gated by permissions).
- Permission denial logging surface.
- End-to-end integration test for the P3 story.

## Constitution re-check (post-Phase 1 design)

After completing `data-model.md` and `contracts/`:

- **I. Code Quality**: Module boundaries match data boundaries; one entry point per responsibility. ✅
- **II. Testing Standards**: Every contract document (manifest schema, RPC catalog, sidecar protocol) has a corresponding test file slot in `src-tauri/tests/`. ✅
- **III. UX Consistency**: All user-facing surfaces (Settings, Plugins menu, consent dialog) reuse existing patterns; CSS tokens enforce visual consistency without effort from authors. ✅
- **IV. Performance**: Quantified targets in R-012 are mapped to specific code paths in the structure above (`rpc/dispatch.rs` for the < 10 ms target; `update/poller.rs` for the < 2 s ETag-304 target; etc.). ✅
- **V. Research-First**: Phase 0 used Context7 for the load-bearing decisions (initialization_script, shell capability scope, sidecar spawning). Decisions encoded in research.md cite the source. ✅

**Result**: gates still pass. Complexity Tracking remains empty.

## Complexity Tracking

*No violations to justify.*

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|--------------------------------------|
| _(none)_  | _(n/a)_    | _(n/a)_                              |
