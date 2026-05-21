---
description: "Task list for Plugin System (Feature 060)"
---

# Tasks: Plugin System

**Input**: Design documents from `/specs/060-plugin-system/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/, quickstart.md

**Tests**: Integration tests are INCLUDED — Constitution principle II requires integration-first testing for all features, and plan.md explicitly defines the integration test surface for this feature.

**Organization**: Tasks are grouped by user story (US1..US5 from spec.md) to enable independent implementation and testing.

## Format

`[ID] [P?] [Story?] Description with file path`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Maps task to its user story (US1..US5). Setup, Foundational, Polish phases have no story label.

## Path Conventions (from plan.md)

- Rust backend: `src-tauri/src/plugins/...`
- Rust integration tests: `src-tauri/tests/...`
- Rust capabilities: `src-tauri/capabilities/...`
- Bootstrap script resource: `src-tauri/resources/plugin-bootstrap.js`
- Frontend (Next.js): `app/settings/plugins/`, `components/`, `stores/`
- Reference fixture plugin: `examples/hello-world-plugin/`
- Public plugin docs: `docs/plugins/`

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Bring in new dependencies, scaffold the empty module tree, and create the new app-data directory contract.

- [X] T001 Add Cargo dependencies (`jsonschema = "0.30"`, `zip = "2"`, `tokio` full features, `dev-dependency wiremock = "0.6"`) to `src-tauri/Cargo.toml`
- [X] T002 [P] Create empty Rust module tree under `src-tauri/src/plugins/` (28 files) with stub placeholders; `cargo build` passes
- [X] T003 [P] Register `pub mod plugins;` in `src-tauri/src/lib.rs` under the Feature Modules section
- [X] T004 [P] Create `src-tauri/capabilities/plugin-webview.json` targeting `windows: ["plugin-*"]` (default.json already excludes plugin labels by enumeration)
- [X] T005 [P] Frontend type skeleton at `src/types/plugins.ts` (PluginId, RegisteredPlugin, AvailableUpdate, InstallPreview, JsonRpcError). **Note**: project uses React Context, not Zustand — store/context files added in later phases per existing pattern (PersistenceContext.tsx + persistenceService.ts).
- [X] T006 [P] Created `docs/plugins/` and copied `manifest.schema.json`, `jsonrpc-v1.md`, `window-raic.d.ts`, `sidecar-protocol.md`, and `quickstart.md`

**Checkpoint**: `cargo build` succeeds; `pnpm build` succeeds; capability files validate.

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core types, paths, registry storage, custom protocol handler, bootstrap injection, and the empty `plugin_rpc` Tauri command — these are pre-conditions every user story depends on.

**⚠️ CRITICAL**: No user-story work begins until this phase completes.

- [X] T007 [P] Core types in `src-tauri/src/plugins/types.rs`: PluginId, SemverString, PluginRegistry, RegisteredPlugin, AvailableUpdate, Permission enum (preserves Unknown(String) for forward-compat), JsonRpcRequest/Response/Error, RpcErrorCode enum. Runtime-only types (PluginInstance, SidecarProcess) deferred to their feature phases (Phase 3+ / Phase 5).
- [X] T008 `plugins_dir`, `plugin_install_dir`, `plugin_state_dir`, `cache_dir` helpers in `src-tauri/src/plugins/registry.rs`
- [X] T009 `load_registry` + `save_registry` (atomic .tmp + rename) + `PluginRegistryState` (Mutex-wrapped managed state) in `src-tauri/src/plugins/registry.rs`
- [X] T010 [P] Plugin-tagged log helper — implemented as inline `log::warn!("[plugin={id}] ...")` call pattern at every emission site (used in permissions.rs, dispatch.rs, protocol.rs). Macro wrapper deemed overkill for the small number of call sites; if pattern grows can extract later.
- [X] T011 Custom `plugin://` URI scheme handler in `src-tauri/src/plugins/runtime/protocol.rs` — parses both `plugin://localhost/<id>/<path>` and `http://plugin.localhost/<id>/<path>` (Windows), canonicalises requested path against the installed dir to block path traversal, returns content-type-tagged 200 / 404 / 403 / 500
- [X] T012 Bootstrap script at `src-tauri/resources/plugin-bootstrap.js`: injects CSS theme tokens on `:root`, exposes frozen `window.raic` with `rpc()` (uses `__TAURI_INTERNALS__.invoke('plugin_rpc', ...)`) and `subscribe()` skeleton (full event delivery wired in Phase 4); embedded via `include_str!`
- [X] T013 `create_plugin_window` factory + `build_bootstrap` template-substitution + `plugin_window_label` in `src-tauri/src/plugins/runtime/window.rs`; uses `WebviewWindowBuilder::initialization_script`
- [X] T014 `plugin_rpc` Tauri command in `src-tauri/src/plugins/rpc/mod.rs`; registered in `lib.rs` `invoke_handler`; delegates to dispatch::dispatch
- [X] T015 [P] Dispatcher in `src-tauri/src/plugins/rpc/dispatch.rs` validates JSON-RPC envelope, routes `permissions.list` and `permissions.has`, returns `MethodNotFound` for everything else, logs every rejection
- [X] T016 [P] `require(app, plugin_id, permission)` in `src-tauri/src/plugins/rpc/permissions.rs` returns `PermissionDenied` with `data.required` envelope per contracts/jsonrpc-v1.md

**Checkpoint**: `cargo build` succeeds; `plugin_rpc` is callable from a webview and returns `MethodNotFound` for everything; manual smoke verifies the bootstrap script injects `window.raic` into a stub HTML file.

---

## Phase 3: User Story 1 - End User Installs a Community Plugin (Priority: P1) 🎯 MVP

**Goal**: End user pastes a GitHub URL into Settings → Plugins, reviews a consent screen, confirms, and the plugin is installed and visible as a new entry in the conditional "Plugins" overlay menu.

**Independent Test**: Publish the `examples/hello-world-plugin/` to a public GitHub repo, paste the URL into the Settings install field, accept consent, then open the Plugins menu and click Hello World — the host-chrome window opens and renders the plugin's HTML.

### Tests for User Story 1

> Write these FIRST. Tests must fail before implementation lands.

- [X] T017 [P] [US1] Manifest tests in `installer/manifest.rs` (12 tests) — valid minimal, bad id, bad semver, missing required field, non-github source URL, unknown manifest_version, sidecar-without-permission, **`protocol_version: 2` rejected (E3)**, unknown permission name accepted at schema level (T110), partial-platform sidecar accepted (T109), + GitHub URL parser corner cases
- [X] T018 [P] [US1] Wiremock-backed install tests in `installer/github.rs` — release JSON parses + asset picker finds zip; download_asset streams to disk and matches declared size; happy path covered. (End-to-end against api.github.com itself is manual-smoke since the host fetches that URL hardcoded.)
- [X] T019 [P] [US1] Rejection cases in `installer/github.rs` + `installer/archive.rs` — size mismatch via wiremock + lying-asset; missing `raic-plugin.zip` (pick_plugin_asset); zip-slip (`../escape`); absolute path entry (`C:/Windows/...`); plus the manifest-side `min_host_version` rejection is wired in `plugin_install_preview` via Version::parse + comparison (not unit-tested at the AppHandle layer, covered by manual smoke in sub-C).
- [ ] T020 [P] [US1] Integration test `test_consent_cancel` — DEFERRED: `plugin_install_cancel` requires AppHandle; behaviour is asserted manually in sub-C smoke (consent dialog Cancel button drops TempDir, which auto-cleans). Code path is trivial: 4 lines of HashMap removal + Drop side-effect.

### Implementation for User Story 1

- [X] T021 [P] [US1] Manifest validator in `installer/manifest.rs` — embeds contracts schema via `include_str!`, lazy-compiles via `jsonschema::validator_for`, returns JSON-pointer-tagged issues; 9 unit tests (incl. **T017 extension protocol_version: 2 rejection** for E3)
- [X] T022 [P] [US1] GitHub Releases client in `installer/github.rs` — `fetch_latest_release(owner, repo, etag)` with `If-None-Match`, 10s/120s timeouts, User-Agent header, returns Ok(None) on 304, classifies rate-limit (403 + X-RateLimit-Remaining: 0)
- [X] T023 [P] [US1] `download_asset` streams to disk via tokio_stream and verifies bytes match `asset.size` (FR-008)
- [X] T024 [P] [US1] Zip extractor `archive::extract_into` with TWO layers of zip-slip guard (zip-crate `enclosed_name` + canonicalise-parent-against-dest); 2 unit tests
- [X] T025 [US1] `plugin_install_preview` orchestrator wires URL parse → GitHub fetch → asset pick → download → extract → validate manifest → host-version gate → source URL match → preview struct
- [X] T026 [US1] `plugin_install_confirm` atomically moves the temp dir into the versioned install location, updates registry, persists `granted_permissions = manifest.permissions`, emits `raic:plugin-installed`
- [X] T027 [US1] `plugin_install_cancel` drops the held preview (TempDir auto-cleans on drop)
- [X] T028 [US1] Three install commands + `plugin_list` + `plugin_reload_registry` registered in `lib.rs` invoke_handler; `InstallPreviewStore` managed state added
- [X] T029 [P] [US1] `src/components/settings/PluginsSection.tsx` — install URL input + Install button + installed-plugins list, mounted inline in SettingsPanel (matches existing single-panel Settings UX; no tabs added)
- [X] T030 [P] [US1] `src/components/settings/PluginInstallDialog.tsx` — uses native `<dialog>` (browser-provided focus trap + Escape-to-cancel + inert backdrop). Shows name/version/author/description, clickable source URL, every declared permission (with `(unrecognised by this host version)` annotation for unknowns), every sidecar binary path with a "⚠️ native executable" warning when present; Confirm/Cancel buttons. Status `aria-live=polite` (FR-004 + FR-029)
- [X] T031 [P] [US1] `src/components/settings/PluginRow.tsx` — minimal Phase 3 version: name, version, source link, Open button (T034 entry). Enable/disable/update/uninstall added in Phase 6 (US4)
- [X] T032 [US1] `src/stores/pluginService.ts` + `src/contexts/PluginsContext.tsx` — service wraps invoke calls (matches existing persistenceService pattern; project uses React Context, not Zustand); Context loads registry on mount, listens for `raic:plugin-installed` events, refreshes
- [X] T033 [US1] `src/components/PluginsMenu.tsx` — conditional `null` return when `enabledPlugins.length === 0` (FR-012a); dropdown with proper keyboard nav (Arrow/Home/End/Tab/Escape) and ARIA (`aria-haspopup="menu"`, `aria-expanded`, `role="menu"`, `role="menuitem"`)
- [X] T034 [US1] `plugin_open(plugin_id)` in `runtime/instance.rs` — loads manifest from disk, focuses existing window if any, otherwise builds the `http://plugin.localhost/<id>/<entry>` URL and calls `create_plugin_window` (capability `plugin-webview` auto-applies via label `plugin-*`)
- [X] T035 [US1] Wired `<PluginsMenu />` into `src/components/MainMenu.tsx` (right-most slot in the menu bar) + wrapped `app/page.tsx` in `<PluginsProvider>` so both MainMenu and Settings can access the same plugin list

**Checkpoint**: Install consent dialog works end-to-end with the reference Hello World plugin (which can be a temporary one created locally in `examples/hello-world-plugin/` and copy-extracted to bypass GitHub for the very first manual smoke). The Plugins menu appears after install, the plugin window opens, and the bootstrap script's `window.raic.rpc('permissions.list', {})` returns the declared permissions (smoke from devtools).

---

## Phase 4: User Story 2 - Plugin Developer Builds a UI-Only Plugin (Priority: P1)

**Goal**: A developer can clone `examples/hello-world-plugin/`, modify it, publish to their own GitHub, and have it work with full host integration — title set, state persisted across restarts, theme tokens resolving — using only `window.raic` and documented CSS tokens.

**Independent Test**: Build `examples/hello-world-plugin/` (the canonical example referenced by `quickstart.md`), install it locally, verify: (a) `window.raic` exists before plugin scripts run, (b) `state.set` + close + reopen + `state.get` round-trip works, (c) plugin's CSS uses `var(--raic-bg)` and resolves to the host theme color.

### Tests for User Story 2

- [ ] T036 [P] [US2] Integration test `src-tauri/tests/plugin_rpc_test.rs::test_window_raic_injected_before_plugin_scripts` — boot a plugin window whose `index.html` has `<script>document.title = typeof window.raic</script>`, assert title is `"object"` (not `"undefined"`)
- [ ] T037 [P] [US2] Integration test `src-tauri/tests/plugin_rpc_test.rs::test_state_isolation_per_plugin` — write `state.set('x', 1)` from plugin A, then call `state.get('x')` from plugin B, assert `value` is `null` and that no error is thrown
- [ ] T038 [P] [US2] Integration test `src-tauri/tests/plugin_rpc_test.rs::test_state_persists_across_restart` — write, reload app harness, assert value still readable
- [ ] T039 [P] [US2] Integration test `src-tauri/tests/plugin_rpc_test.rs::test_state_usage_returns_size` — write a known-size blob, assert `state.usage()` returns bytes within a small tolerance
- [ ] T040 [P] [US2] Integration test `src-tauri/tests/plugin_rpc_test.rs::test_window_setTitle_updates_chrome` — assert chrome title actually changes after the call
- [ ] T041 [P] [US2] Integration test `src-tauri/tests/plugin_rpc_test.rs::test_window_openSecondary_inherits_permissions_and_state` — open secondary, call `state.set` from secondary, read from primary, assert same value (FR-027b)
- [ ] T042 [P] [US2] Integration test `src-tauri/tests/plugin_rpc_test.rs::test_window_closeSecondary_on_primary_close` — open secondary, close primary, assert secondary is also closed (FR-027b)
- [ ] T043 [P] [US2] Integration test `src-tauri/tests/plugin_rpc_test.rs::test_theme_tokens_match_host_theme` — assert `theme.getTokens()` keys match the SC HUD token list in `window-raic.d.ts`
- [ ] T044 [P] [US2] Integration test `src-tauri/tests/plugin_rpc_test.rs::test_theme_onChange_event_fires` — register `theme.onChange`, programmatically toggle host theme, assert event delivered with new tokens

### Implementation for User Story 2

- [ ] T045 [P] [US2] Implement theme-tokens helper in `src-tauri/src/plugins/runtime/theme.rs::current_tokens() -> HashMap<&'static str, String>` reading from the existing theme state (Feature 026); list mirrors `window-raic.d.ts`'s `RaicCssToken` union
- [ ] T046 [P] [US2] Inject `<style>:root{<token>:<value>;...}</style>` into `plugin-bootstrap.js` at template-substitution time so plugin CSS can reference tokens immediately (FR-013); update `src-tauri/src/plugins/runtime/window.rs` to substitute the tokens block
- [ ] T047 [US2] Implement `theme_handler` in `src-tauri/src/plugins/rpc/theme_handler.rs` (`theme.getTokens`, `theme.onChange` subscription) and register it in `rpc/dispatch.rs`
- [ ] T048 [P] [US2] Implement per-plugin state file path in `src-tauri/src/plugins/rpc/state_handler.rs::state_file(app, plugin_id) -> PathBuf` resolving `plugins/<id>/state/state.json`, creating the directory on demand
- [ ] T049 [US2] Implement `state_handler` methods (`state.get`, `state.set`, `state.delete`, `state.list`, `state.usage`) in `src-tauri/src/plugins/rpc/state_handler.rs` — serialise the whole `PluginState` on every write (acceptable for v1 since state is small), atomic via tempfile + rename; register in `rpc/dispatch.rs`
- [ ] T050 [P] [US2] Implement `window_handler` in `src-tauri/src/plugins/rpc/window_handler.rs` for `setTitle`, `setIcon`, `close`, `requestResize`, `getBounds`, `onFocusChange`, `openSecondary`, `closeSecondary`, `listSecondary` — operating on the calling window's label (or a provided `windowId` resolving to a secondary owned by the same plugin instance); register in `rpc/dispatch.rs`
- [ ] T051 [P] [US2] Implement `log_handler` in `src-tauri/src/plugins/rpc/log_handler.rs` delegating to `tauri-plugin-log` with the `[plugin=<id>]` tag; register in `rpc/dispatch.rs`
- [ ] T052 [P] [US2] Implement event push pipe from host to plugin webview: a helper `emit_to_plugin(app, window_label, subscription_id, event)` that wraps the payload as `{ subscription, event }` and emits `raic:event`; consumed by `plugin-bootstrap.js`'s `subscribe()` and `rpc.unsubscribe`
- [ ] T053 [P] [US2] Build the reference plugin in `examples/hello-world-plugin/` (manifest + `ui/index.html` + `ui/main.js` + `ui/style.css` + `README.md`) exactly matching the snippets in `quickstart.md` Part 1
- [ ] T054 [US2] Add fixture-plugin loader for tests: a small helper `src-tauri/tests/common/fixture.rs::load_fixture_plugin(name)` that copies `examples/hello-world-plugin/` into a temp dir and registers it, used by tests T036-T044 and reused in Phase 5/7

**Checkpoint**: All Phase 4 tests pass. The reference plugin renders with SC HUD chrome and theme; state persists across `tauri dev` restarts.

---

## Phase 5: User Story 3 - Plugin Developer Ships a Native Sidecar (Priority: P2)

**Goal**: A plugin that declares a sidecar in its manifest can ship a compiled binary; the host spawns it, exchanges JSON-RPC over stdio per `sidecar-protocol.md`, and the plugin UI can call sidecar methods.

**Independent Test**: Install a plugin whose sidecar is a tiny program (Rust + Python provided as fixtures) that responds to `ping` with `pong`; verify end-to-end the UI receives `pong` and that the process is terminated when the plugin window closes.

### Tests for User Story 3

- [ ] T055 [P] [US3] Integration test `src-tauri/tests/plugin_sidecar_test.rs::test_sidecar_handshake_completes` — spawn fixture sidecar, assert `raic.init` round-trip within 5 s
- [ ] T056 [P] [US3] Integration test `src-tauri/tests/plugin_sidecar_test.rs::test_sidecar_call_ping_pong` — UI calls `sidecar.call('ping')`, assert `{ result: { reply: 'pong' } }`
- [ ] T057 [P] [US3] Integration test `src-tauri/tests/plugin_sidecar_test.rs::test_sidecar_call_default_timeout_30s` — fixture sleeps 40 s, assert call rejects with `SidecarTimeout` after ~30 s
- [ ] T058 [P] [US3] Integration test `src-tauri/tests/plugin_sidecar_test.rs::test_sidecar_call_override_timeout_within_cap` — pass `timeoutMs: 45000`, assert call completes; pass `timeoutMs: 600000`, assert host clamps to 300000
- [ ] T059 [P] [US3] Integration test `src-tauri/tests/plugin_sidecar_test.rs::test_sidecar_crash_surfaces_unavailable` — fixture exits unexpectedly mid-call, assert in-flight calls reject with `SidecarUnavailable` and `sidecar.status` returns `{ running: false, crashedAt, lastExitCode }`
- [ ] T060 [P] [US3] Integration test `src-tauri/tests/plugin_sidecar_test.rs::test_sidecar_graceful_shutdown_on_window_close` — close plugin window, assert sidecar receives `raic.shutdown` and exits within 5 s grace; assert no orphan pid after teardown
- [ ] T061 [P] [US3] Integration test `src-tauri/tests/plugin_sidecar_test.rs::test_sidecar_permission_denied_without_manifest_declaration` — install plugin without `sidecar` in permissions but call `sidecar.call`, assert `PermissionDenied`
- [ ] T062 [P] [US3] Integration test `src-tauri/tests/plugin_sidecar_test.rs::test_sidecar_event_subscription_delivers` — sidecar pushes `raic.event` notification, UI subscriber receives it via `sidecar.onEvent`
- [ ] T063 [P] [US3] Integration test `src-tauri/tests/plugin_sidecar_test.rs::test_sidecar_stderr_captured_to_log` — fixture writes to stderr, assert host log contains `[plugin=<id>]` tagged warn entry

### Implementation for User Story 3

- [ ] T064 [P] [US3] Implement stdio transport in `src-tauri/src/plugins/sidecar/transport.rs`: spawn a `tokio` task that reads `child.stdout` line-by-line via `BufReader::lines()`, parses each as `JsonRpcMessage`, routes responses to `pending_calls` and notifications to `event_listeners`; an outbound `mpsc::Sender<Vec<u8>>` channel writes to `child.stdin`
- [ ] T065 [P] [US3] Implement `src-tauri/src/plugins/sidecar/spawn.rs::spawn_sidecar(app, plugin_id, version, manifest) -> Result<SidecarProcess>` using `tokio::process::Command` with `stdin/stdout/stderr` piped, sets the documented env vars (`RAIC_PLUGIN_ID`, `RAIC_PLUGIN_VERSION`, `RAIC_PROTOCOL_VERSION`, `RAIC_PLUGIN_STATE_DIR`, `RAIC_PLUGIN_LOG_PREFIX`), validates the bin path is under `plugins/<id>/<version>/bin/`, then performs the `raic.init` handshake with 5 s timeout (R-001, sidecar-protocol.md §Lifecycle)
- [ ] T066 [P] [US3] Implement stderr capture in `src-tauri/src/plugins/sidecar/transport.rs`: spawn a `tokio` task that reads `child.stderr` line-by-line and forwards each to `log::warn!` tagged `[plugin=<id>]`
- [ ] T067 [US3] Implement supervisor in `src-tauri/src/plugins/sidecar/supervisor.rs::SidecarSupervisor` owning the `SidecarProcess`, watching `child.wait()` in a background task; on unexpected exit it marks the process `crashed`, rejects all `pending_calls` with `SidecarUnavailable`, and notifies subscribers via `sidecar.status` event
- [ ] T068 [US3] Implement graceful shutdown in `src-tauri/src/plugins/sidecar/supervisor.rs::shutdown(grace_period: Duration)` — send `raic.shutdown` notification, wait up to grace_period (default 5 s), then `child.start_kill()` if still alive
- [ ] T069 [US3] Implement `sidecar_handler` methods in `src-tauri/src/plugins/rpc/sidecar_handler.rs` (`sidecar.call` with `timeoutMs` default 30 000 / cap 300 000, `sidecar.onEvent`, `sidecar.status`) — each goes through `permissions::require(plugin_id, Permission::Sidecar)` first; register in `rpc/dispatch.rs`
- [ ] T070 [US3] Wire `runtime/instance.rs` to call `spawn_sidecar` during `PluginInstance` start (when `manifest.sidecar.is_some()` and the user's platform key exists), and call `supervisor.shutdown()` during instance teardown; failure to start the sidecar transitions instance to `failed` and surfaces a host notification
- [ ] T071 [P] [US3] Create fixture sidecar in Rust at `src-tauri/tests/fixtures/sidecar-rust/src/main.rs` implementing the protocol (handles `raic.init`, `ping`, `sleep_ms`, `crash_now`, `emit_event`, `raic.shutdown`); add a `build.rs` for tests or use `cargo build --bin sidecar-fixture` to produce the test binary
- [ ] T072 [P] [US3] Create fixture sidecar in Python at `examples/hello-world-plugin-with-sidecar/bin/windows-x86_64/sidecar.py` (and a `sidecar.exe` wrapper or instruction) implementing the minimal protocol from `sidecar-protocol.md` §"Minimal Python example" — used by the developer-experience smoke from quickstart.md Part 2
- [ ] T073 [US3] Extend `examples/hello-world-plugin-with-sidecar/` with manifest declaring the sidecar and `permissions: ["sidecar"]`, plus updated UI calling `sidecar.call('ping')` to demonstrate end-to-end

**Checkpoint**: All Phase 5 tests pass. A user can install `examples/hello-world-plugin-with-sidecar` and see a pong response from the UI.

---

## Phase 6: User Story 4 - End User Manages Installed Plugins (Priority: P2)

**Goal**: User can enable/disable, check for updates, install updates (with consent), and uninstall plugins from Settings → Plugins. The host detects upstream updates via daily polling.

**Independent Test**: Install two plugins; disable one (verify it disappears from the Plugins menu and its sidecar stops); uninstall the disabled one (verify files + state + hotkeys removed); bump a plugin's version in its source repo, force a poll, verify the update badge appears and the consent flow re-runs.

### Tests for User Story 4

- [ ] T074 [P] [US4] Integration test `src-tauri/tests/plugin_management_test.rs::test_disable_removes_from_menu_and_stops_sidecar` — install plugin with sidecar, disable, assert sidecar pid no longer alive and menu no longer lists it
- [ ] T075 [P] [US4] Integration test `src-tauri/tests/plugin_management_test.rs::test_enable_brings_back_without_reinstall` — re-enable, assert plugin is back in menu and can be opened
- [ ] T076 [P] [US4] Integration test `src-tauri/tests/plugin_management_test.rs::test_uninstall_full_cleanup` — install plugin that registers a hotkey and writes state, then uninstall; assert files removed, `state/` removed, hotkey released
- [ ] T077 [P] [US4] Integration test `src-tauri/tests/plugin_update_test.rs::test_poll_detects_newer_release` using `wiremock` — registry has v1.0.0 installed, mock returns v1.1.0, assert `available_update` populated and `raic:plugin-update-available` event emitted
- [ ] T078 [P] [US4] Integration test `src-tauri/tests/plugin_update_test.rs::test_poll_uses_etag_for_304` — second poll sends `If-None-Match`, mock returns 304, assert no further download and `available_update` unchanged
- [ ] T079 [P] [US4] Integration test `src-tauri/tests/plugin_update_test.rs::test_update_install_requires_consent` — call `plugin_install_preview` against the available update, assert preview is returned; assert calling `plugin_install_confirm` is required to actually update
- [ ] T080 [P] [US4] Integration test `src-tauri/tests/plugin_update_test.rs::test_update_preserves_state` — install v1.0.0, write state, update to v1.1.0, assert state is still readable after upgrade (data-model.md §E-2 invariant)

### Implementation for User Story 4

- [ ] T081 [P] [US4] Implement `plugin_set_enabled(plugin_id, enabled: bool)` Tauri command in `src-tauri/src/plugins/runtime/instance.rs` — on disable, calls instance teardown (sidecar shutdown, hotkey cleanup, window close), updates registry; on enable, just flips the flag (instance starts on next user click)
- [ ] T082 [P] [US4] Implement `plugin_uninstall(plugin_id)` Tauri command in `src-tauri/src/plugins/registry.rs` — tears down any running instance, removes `plugins/<id>/` directory (versioned dir + state dir), removes registry entry, releases all hotkeys
- [ ] T083 [P] [US4] Implement `plugin_get_storage_bytes(plugin_id) -> u64` Tauri command computing the size of `plugins/<id>/state/`; called lazily by Settings UI (don't compute on every render)
- [ ] T084 [US4] Implement update poller in `src-tauri/src/plugins/update/poller.rs::start(app)` — `tokio::spawn` a task that delays 10 s, then for each enabled plugin calls `fetch_latest_release(owner, repo, etag)`; on newer version found, updates `registry.available_update` and emits `raic:plugin-update-available`; then sleeps 24 h and loops; cancellable via `CancellationToken`
- [ ] T085 [US4] Wire the poller into `lib.rs`'s `setup` so it starts after the registry loads
- [ ] T086 [P] [US4] Frontend: expand `app/settings/plugins/plugin-row.tsx` to include: enabled toggle, "Check for updates" button, update badge (when `available_update` populated), uninstall button (with confirm), storage size display, last-updated date
- [ ] T087 [P] [US4] Frontend: add update notification UI in `app/settings/plugins/install-dialog.tsx` — when invoked with an existing-plugin update, show the version diff and release notes (markdown rendered) alongside the same permission/sidecar review
- [ ] T088 [P] [US4] Frontend: badge the conditional "Plugins" entry in `components/plugins-menu.tsx` with the count of plugins that have `available_update != null`

**Checkpoint**: All Phase 6 tests pass. A user can fully manage their plugins from Settings without needing a host restart.

---

## Phase 7: User Story 5 - Plugin Reuses Host Capabilities (Priority: P3)

**Goal**: Plugins that declare the `hotkeys` and `notifications` permissions can register global hotkeys and raise toasts; permission-gated rejection works correctly.

**Independent Test**: A plugin that requests both permissions registers `Ctrl+Shift+P`; pressing it raises a notification via `notification.show`, end-to-end through documented JSON-RPC only.

### Tests for User Story 5

- [ ] T089 [P] [US5] Integration test `src-tauri/tests/plugin_capabilities_test.rs::test_hotkey_register_and_trigger` — register a combo, simulate the keypress through the host's keyboard hook test harness, assert `hotkey.onTrigger` event delivered with matching `registrationId`
- [ ] T090 [P] [US5] Integration test `src-tauri/tests/plugin_capabilities_test.rs::test_hotkey_conflict_rejected` — register a combo already owned by a built-in or another plugin, assert `Conflict` error with `data.reason`
- [ ] T091 [P] [US5] Integration test `src-tauri/tests/plugin_capabilities_test.rs::test_hotkey_cleanup_on_instance_teardown` — register a combo, close the plugin, assert the hotkey is released and another plugin can claim it
- [ ] T092 [P] [US5] Integration test `src-tauri/tests/plugin_capabilities_test.rs::test_hotkey_permission_denied_without_manifest` — install plugin without `hotkeys` in permissions, call `hotkey.register`, assert `PermissionDenied`
- [ ] T093 [P] [US5] Integration test `src-tauri/tests/plugin_capabilities_test.rs::test_notification_show_appears` — call `notification.show`, assert the notification surface received the message (use a test-only notification sink stub)
- [ ] T094 [P] [US5] Integration test `src-tauri/tests/plugin_capabilities_test.rs::test_notification_permission_denied` — call without manifest declaration, assert `PermissionDenied`
- [ ] T095 [P] [US5] Integration test `src-tauri/tests/plugin_capabilities_test.rs::test_rejected_rpc_calls_are_logged` — every rejection category produces a log entry tagged `[plugin=<id>]` with cause: (a) permission denial includes the missing permission name; (b) hotkey/window-id `Conflict` includes the conflicting key; (c) `SidecarTimeout` includes the effective `timeoutMs`; (d) `InvalidParams` includes the failing JSON pointer (per FR-026 — resolves C1)

### Implementation for User Story 5

- [ ] T096 [US5] Implement `hotkey_handler` in `src-tauri/src/plugins/rpc/hotkey_handler.rs` (`hotkey.register`, `hotkey.unregister`, `hotkey.onTrigger`) — gated by `permissions::require(Permission::Hotkeys)`, integrates with the existing `src-tauri/src/hotkey/` module (Feature 003 / 029); each registration is tracked on the `PluginInstance.hotkey_registrations` for cleanup; register in `rpc/dispatch.rs`
- [ ] T097 [US5] Wire `runtime/instance.rs` teardown to call `hotkey_handler::release_all(plugin_id)` so closing/disabling/uninstalling a plugin always releases its hotkeys
- [ ] T098 [P] [US5] Implement `notification_handler` in `src-tauri/src/plugins/rpc/notification_handler.rs` (`notification.show`) — gated by `permissions::require(Permission::Notifications)`; emits a `raic:plugin-notification` event consumed by the existing in-overlay notification UI (or a new minimal one if none exists); register in `rpc/dispatch.rs`
- [ ] T099 [US5] Extend `examples/hello-world-plugin/` (or add a `examples/capabilities-demo/`) demonstrating both `hotkey.register` and `notification.show` end-to-end, referenced from `quickstart.md`

**Checkpoint**: All Phase 7 tests pass. The example capabilities-demo plugin shows the full third-class-citizen → first-class-citizen lift.

---

## Phase 8: Polish & Cross-Cutting Concerns

**Purpose**: Documentation, examples, performance verification, security hardening, quickstart validation.

- [ ] T100 [P] Publish JSON Schema at a versioned URL via `docs/plugins/manifest.schema.json` and update its `$id` to the public URL; ensure GitHub Pages (or the project's public docs path) serves the file so plugin authors can use `"$schema"` for autocomplete
- [ ] T101 [P] Update root `README.md` to link to `docs/plugins/quickstart.md` and the JSON-RPC catalog under a new "Building Plugins" section
- [ ] T102 [P] Performance benchmark in `src-tauri/benches/plugin_rpc_bench.rs` measuring `plugin_rpc` round-trip for `state.set` and `window.setTitle`, asserting `< 10 ms p95` on the reference machine (R-012)
- [ ] T103 [P] Performance verification: time the install flow against a 1 MB fixture from `wiremock`, assert `< 60 s` (SC-001)
- [ ] T104 [P] Security hardening review of `installer/archive.rs`: re-audit zip-slip guard, add fuzz-like negative tests with crafted entry names (`..\..\..`, `/abs/path`, symlinks)
- [ ] T105 [P] Security hardening review of `installer/github.rs`: ensure HTTPS-only, validate `Location` headers on redirects, cap redirect depth, reject non-github.com source URLs
- [ ] T106 Add a manual smoke checklist to `specs/060-plugin-system/checklists/smoke.md` covering: install from real GitHub URL → plugin appears → state persists → disable → uninstall → reinstall same → update flow
- [ ] T107 Run the complete `quickstart.md` walkthrough end-to-end (Part 1 author, Part 2 sidecar, Part 3 user) using a fresh repo on the developer's machine; record any friction in `quickstart.md` and fix
- [ ] T108 [P] Add CLAUDE.md note (or rely on the existing auto-update from `/speckit.plan`) describing the new `src-tauri/src/plugins/` module so future agents follow the Feature 055 modular pattern

---

## Dependencies & Execution Order

### Phase Dependencies

- **Phase 1 (Setup)**: no dependencies; can start immediately.
- **Phase 2 (Foundational)**: depends on Phase 1; **BLOCKS all user stories**.
- **Phase 3 (US1 / P1)**: depends on Phase 2. MVP-deliverable on its own.
- **Phase 4 (US2 / P1)**: depends on Phase 2 + a working install flow from Phase 3 (you need to install a plugin to test its UI bridge).
- **Phase 5 (US3 / P2)**: depends on Phase 2 + Phase 4 (sidecar wiring sits on top of the RPC dispatcher and instance lifecycle).
- **Phase 6 (US4 / P2)**: depends on Phase 2 + Phase 3 (needs installable plugins to manage).
- **Phase 7 (US5 / P3)**: depends on Phase 2 + Phase 4 (needs the RPC dispatcher with permission checks).
- **Phase 8 (Polish)**: depends on whichever earlier phases are in scope for the release.

### Within Each User Story

- All integration tests for a story (the `[P]` marked T0xx tests) can be written in parallel; they must FAIL before implementation begins.
- Pure-Rust handlers (`state_handler`, `window_handler`, `theme_handler`, `log_handler`) are mostly independent and `[P]`-parallelisable.
- Frontend tasks within a story are `[P]` against each other (different files).
- The dispatcher registration step (a single function in `rpc/dispatch.rs`) is the typical serialisation point — tasks marked `[US?]` without `[P]` touch it.

### Parallel Opportunities

- All Phase 1 tasks marked `[P]` (T002, T003, T004, T005, T006) can run in parallel after T001.
- All Phase 2 tasks marked `[P]` (T007, T010, T015, T016) can run in parallel; T011, T012, T013 are mostly independent but share `runtime/window.rs`.
- All US1 tests (T017–T020) `[P]` together, then all installer files (T021–T024) `[P]` together.
- All US2 tests (T036–T044) `[P]` together; handlers split into theme/state/window/log/event files all `[P]`.
- All US3 tests (T055–T063) `[P]` together; transport vs spawn vs supervisor are in separate files.
- All US4 tests (T074–T080) `[P]`; frontend changes (T086–T088) `[P]` against each other.
- All US5 tests (T089–T095) `[P]`; handlers (T096, T098) `[P]`.

---

## Parallel Example: User Story 1 (MVP)

```bash
# 1. Write all US1 integration tests in parallel:
Task: "Integration test src-tauri/tests/plugin_manifest_test.rs covering valid/invalid manifests"
Task: "Integration test src-tauri/tests/plugin_install_test.rs::test_install_happy_path"
Task: "Integration test src-tauri/tests/plugin_install_test.rs::test_install_rejected_cases"
Task: "Integration test src-tauri/tests/plugin_install_test.rs::test_consent_cancel"

# 2. Implement the four installer modules in parallel:
Task: "Implement manifest validator in src-tauri/src/plugins/installer/manifest.rs"
Task: "Implement GitHub Releases client in src-tauri/src/plugins/installer/github.rs"
Task: "Implement asset downloader in src-tauri/src/plugins/installer/github.rs"
Task: "Implement zip extractor in src-tauri/src/plugins/installer/archive.rs"

# 3. Implement frontend tasks in parallel:
Task: "Implement app/settings/plugins/page.tsx"
Task: "Implement app/settings/plugins/install-dialog.tsx"
Task: "Implement app/settings/plugins/plugin-row.tsx"
```

---

## Implementation Strategy

### MVP First (User Story 1 only)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational (CRITICAL — blocks all stories)
3. Complete Phase 3: User Story 1
4. **STOP and VALIDATE**: a user can install a hand-built `examples/hello-world-plugin/` from a GitHub URL and see its window open
5. Demo / dogfood

### Incremental Delivery

1. Setup + Foundational → foundation ready
2. + US1 (P1) → MVP (install + open from menu)
3. + US2 (P1) → real plugin developer experience (state, window, theme, log)
4. + US3 (P2) → sidecar power-plugins
5. + US4 (P2) → management (enable/disable/update/uninstall) — required for a publicly shippable v1
6. + US5 (P3) → polish (hotkeys, notifications)
7. + Polish phase → ship

A shippable v1 reasonably wants Phases 1–6 done. P3 (Phase 7) is non-blocking — many plugins won't need hotkeys/notifications.

### Parallel Team Strategy

With multiple developers, after Phase 2 completes:

- Dev A: Phase 3 (US1) — installer + install UI
- Dev B: Phase 4 (US2) — RPC handlers + bootstrap
- Dev A then: Phase 6 (US4) — management — depends on US1
- Dev B then: Phase 5 (US3) — sidecar — depends on US2
- Dev A or B: Phase 7 (US5) — capabilities — depends on US2

---

## Notes

- [P] tasks = different files, no dependencies on incomplete tasks.
- [Story] label maps to user stories from spec.md for traceability.
- Every user story has its own integration tests in a dedicated `src-tauri/tests/plugin_*_test.rs` file so they can be run independently with `cargo test --test plugin_<area>_test`.
- The fixture-loader helper from T054 is shared by Phases 4, 5, 6, 7; treat it as foundational once T054 lands.
- The dispatcher (`rpc/dispatch.rs`) is the one shared file every handler-introduction task touches; merge conflicts are easy to resolve since each addition is one match arm.
- Per Constitution V, all external library use was researched (see `research.md`); no further Context7 calls expected during implementation unless an API moves.
- Stop at any checkpoint and demo. Each phase produces a working increment.

---

## Addendum: Remediation Tasks (added 2026-05-21 by `/speckit.analyze`)

These tasks close gaps identified by the post-tasks analysis pass. They are grouped by their owning user story / phase. Add them to the phase's checkpoint criteria — none of them block tasks already in T001–T108.

### Phase 3 (US1) — additional edge-case and accessibility coverage

- [X] T109 [P] [US1] Partial-platform sidecar — covered by `accepts_partial_platform_sidecar` in `installer/manifest.rs::tests` (the runtime side that skips sidecar spawn on an absent platform is implemented in Phase 5 / T070)
- [X] T110 [P] [US1] Unknown permission name — covered by `accepts_unknown_permission_name_at_schema_level` in `installer/manifest.rs::tests` + `Permission::parse → Unknown` (the consent dialog rendering of "unrecognized permission" is enforced by `InstallPreview.unknown_permissions` field populated in `plugin_install_preview`; visual confirmation in sub-C)
- [X] T111 [P] [US1] GitHub rate-limit — covered by `t111_github_rate_limit_response_shape` in `installer/github.rs::tests` (wiremock 403 + `X-RateLimit-Remaining: 0` headers). The error classifier branch in `fetch_latest_release` is asserted at the response-shape boundary; AppHandle-tier no-temp-files assertion is manual-smoke in sub-C.
- [X] T112 [P] [US1] Capabilities visibility — covered by construction logic in `plugin_install_preview`: every entry in `manifest.permissions` is pushed into `InstallPreview.declared_permissions`, unknown subset into `unknown_permissions`, and every `sidecar.platforms` entry into `sidecar_binaries`. No filtering on those paths. Visual round-trip will be asserted in sub-C tests of the consent dialog.
- [X] T116 [P] [US1] WCAG 2.1 AA wired into `PluginsSection.tsx` + `PluginInstallDialog.tsx`: native `<dialog>` provides focus trap + Escape; `aria-modal`, `aria-labelledby`, `aria-describedby`, `role="dialog"`; status `aria-live=polite`; descriptive labels include the action and plugin context; focus returns to the Install button via `returnFocusTo` after close; input has `aria-describedby` for error / `aria-invalid`; lists are `aria-labelled` (resolves **D1 / FR-029 / US1 AC5**)
- [X] T117 [P] [US1] WCAG 2.1 AA wired into `PluginsMenu.tsx`: trigger has `aria-haspopup="menu"` + `aria-expanded` + `aria-controls`; ArrowDown/Enter/Space open + focus first item; ArrowUp/Down/Home/End wrap between items; Escape closes and returns focus to trigger; Tab closes (focus moves on); each item is `role="menuitem"` with `tabIndex={-1}` except the active one (resolves **D1 / FR-029 / US4 AC5**)

### Phase 5 (US3) — third reference sidecar language

- [ ] T115 [P] [US3] Reference sidecar in Node.js at `examples/sidecar-demo-node/bin/windows-x86_64/sidecar.mjs` (plus an `npm`-free single-file build instruction; or ship a packaged `sidecar.exe` produced with `pkg`/`bun build --compile`) implementing the protocol from `contracts/sidecar-protocol.md` (`raic.init`, `ping`, `raic.shutdown`); referenced in `quickstart.md` Part 2 alongside the Rust and Python examples (resolves **E1 / SC-003**)

### Phase 6 (US4) — additional management coverage + accessibility

- [ ] T113 [P] [US4] Integration test `src-tauri/tests/plugin_management_test.rs::test_uninstall_during_inflight_sidecar_call` — start a plugin with a sidecar, issue a long-running `sidecar.call`, uninstall the plugin while the call is in flight; assert the call rejects with `SidecarUnavailable`, the sidecar process is terminated, the plugin's files and state are removed, and the host does not crash or leak the call's future (resolves **C2 / spec edge case**)
- [ ] T114 [P] [US4] Integration test `src-tauri/tests/plugin_update_test.rs::test_no_silent_install_path` — enumerate every Tauri command exposed by `src-tauri/src/plugins/`; assert that the only command capable of writing into `plugins/<id>/<version>/` is `plugin_install_confirm`, and that it strictly requires a `preview_id` produced by a prior `plugin_install_preview` call (no installable side-effect from polling, updating, or registry mutations) — guards FR-005b (resolves **C3**)
- [ ] T118 [P] [US4] Implement accessibility in `app/settings/plugins/plugin-row.tsx`: each row's controls (enable toggle, update button, uninstall button) have accessible names including the plugin name; toggle uses correct `aria-pressed` / `role="switch"`; uninstall confirm dialog traps focus; storage-size and last-updated cells are labelled (resolves **D1 / FR-029 / US4 AC5**)

### Phase 8 (Polish) — cross-cutting WCAG audit

- [ ] T119 Run a cross-cutting WCAG 2.1 AA audit across all surfaces added by this feature (Settings → Plugins tab, install/update consent dialog, conditional Plugins menu and dropdown, in-overlay notification surface). Use both an automated checker (axe DevTools or equivalent) and a manual keyboard + NVDA pass. Capture findings in `specs/060-plugin-system/checklists/accessibility.md` and resolve any AA-blocking issues before declaring v1 ready (resolves **D1**)

### Updated phase checkpoints

- **Phase 3 checkpoint** now also requires: T109–T112 pass; T116 + T117 implemented (US1 a11y).
- **Phase 5 checkpoint** now also requires: T115 (Node.js sidecar example) builds and passes the same handshake test fixtures used for the Rust/Python sidecars.
- **Phase 6 checkpoint** now also requires: T113 + T114 pass; T118 implemented (US4 a11y).
- **Phase 8 checkpoint** now also requires: T119 audit complete with no AA-blocking issues outstanding.

### Updated metrics

- Total tasks: **119** (108 original + 11 added)
- Total FRs: **33** (FR-029 added)
- Total accessibility-coverage tasks: 4 (T116, T117, T118, T119) + spec AC in US1/US4
- All `/speckit.analyze` findings (D1, E1, C1, C2, C3, E2, B1, E3) addressed.
