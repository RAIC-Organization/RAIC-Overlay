# Data Model: Plugin System

**Feature**: 060-plugin-system
**Date**: 2026-05-21

Entities, fields, relationships, validation rules, and lifecycle/state transitions for the plugin system. All schemas are JSON-serialisable; the Rust types use `serde` and live in `src-tauri/src/plugins/types.rs` (see `plan.md` for the module layout).

---

## E-1. PluginRegistry

The single source of truth for which plugins are installed on the user's machine. Persisted as `%APPDATA%\com.raic.overlay\plugins\registry.json`.

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| `schema_version` | `u32` | yes | Currently `1`. Bumped on breaking changes to this file. |
| `plugins` | `Map<PluginId, RegisteredPlugin>` | yes | Keyed by plugin id (see E-2). |
| `last_update_check_at` | `RFC3339 timestamp` \| null | no | When the daily update poll last ran. |

**Invariants**:
- All keys in `plugins` MUST be unique (enforced by the `Map` type).
- `plugins[id].id` MUST equal the key.

---

## E-2. RegisteredPlugin

A single installed plugin's registry entry — what the host knows about it without loading the manifest from disk.

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| `id` | `PluginId` | yes | Stable identifier, see validation below. |
| `installed_version` | `semver::Version` | yes | The version currently considered "current". |
| `installed_at` | `RFC3339` | yes | First install timestamp. |
| `updated_at` | `RFC3339` | yes | Last successful update timestamp (== `installed_at` on first install). |
| `source_repo_url` | `Url` | yes | The GitHub repo URL the user originally pasted, normalised. |
| `enabled` | `bool` | yes | True by default; toggled by user via Settings. |
| `granted_permissions` | `Vec<Permission>` | yes | Snapshot of what the user consented to at install/update time. |
| `etag` | `String` \| null | no | Last seen ETag from GitHub for conditional polling. |
| `available_update` | `AvailableUpdate` \| null | no | Populated when polling finds a newer release. |
| `storage_bytes` | `u64` | yes | On-disk size of the plugin's `state/` directory; refreshed lazily. |

**State transitions** (`enabled` field):
```
[installed, enabled] --user disables--> [installed, disabled]
[installed, disabled] --user enables--> [installed, enabled]
[installed, *] --user uninstalls--> [removed]
```

**Validation**:
- `installed_version` MUST match the manifest's `version` in the on-disk install directory.
- `granted_permissions` MUST be a subset of the manifest's `permissions` (we never auto-grant more than was requested).

---

## E-3. PluginId

A globally unique stable identifier chosen by the plugin author.

**Format**: reverse-DNS-like string, validated against the regex:
```
^[a-z][a-z0-9-]*(\.[a-z][a-z0-9-]*){1,}$
```
e.g. `com.alice.build-order-tracker`, `dev.bob.twitch-chat`.

**Rationale**: prevents collisions across the open ecosystem (no central registry), discourages cute single-word ids that will conflict.

**Validation on install**: if the manifest's id is already in `PluginRegistry.plugins`, the install flow treats the operation as an update rather than a fresh install (and the source URL MUST match the registered one — see edge case in spec).

---

## E-4. Manifest

The declarative file shipped with every plugin release: `raic-plugin.json` at the root of `raic-plugin.zip`. Authoritative JSON Schema lives at `contracts/manifest.schema.json`. The shape:

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| `$schema` | `Url` | no | Optional; pointer to the published JSON Schema for editor autocomplete. |
| `manifest_version` | `1` | yes | Schema version of this manifest format. Host rejects unknown values (FR-010). |
| `id` | `PluginId` | yes | See E-3. |
| `name` | `string` (1..80 chars) | yes | Human-readable display name. |
| `version` | `semver` string | yes | Plugin's own version, e.g. `"1.4.2"`. Must equal the GitHub release `tag_name` (with or without leading `v`). |
| `author` | `string` (1..80 chars) | yes | Author name or handle. |
| `description` | `string` (1..280 chars) | yes | Short description shown in the consent screen and Settings list. |
| `source_repo_url` | `Url` (github.com only in v1) | yes | The repository URL. Validated against the URL the user pasted. |
| `min_host_version` | `semver` string | yes | The host version this plugin requires. Install fails if `host_version < min_host_version` (FR-011). |
| `protocol_version` | `1` | yes | The JSON-RPC protocol version this plugin targets. |
| `entry` | `EntryPoint` | yes | The primary UI entry point (see E-5). |
| `permissions` | `Vec<Permission>` | yes (may be empty) | Capability groups the plugin needs; subset of the known catalogue (see E-7). |
| `sidecar` | `Sidecar` \| null | no | Optional sidecar declaration (see E-6). |
| `icon` | `RelativePath` | no | Path within the bundle to a PNG/SVG used in the Plugins dropdown. Defaults to a generic placeholder. |
| `license` | `string` (SPDX id) | no | Informational. |
| `homepage` | `Url` | no | Informational; shown in Settings. |

**Validation rules**:
- All required fields MUST be present (`jsonschema` enforces this).
- `id` MUST match the regex in E-3.
- `version` MUST be valid semver (`semver::Version::parse`).
- `min_host_version` MUST be valid semver.
- `source_repo_url` MUST start with `https://github.com/` in v1.
- `permissions[*]` MUST each be in the known permission catalogue (E-7); unknown names are surfaced in the consent dialog as "unrecognized permission" but the install is allowed to proceed only if the user explicitly accepts.
- `entry.ui` MUST resolve to an existing path inside the unpacked archive.
- `sidecar.platforms[*].bin` MUST resolve to an existing file inside the unpacked archive (per platform).

---

## E-5. EntryPoint

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| `ui` | `RelativePath` | yes | Path to the HTML file that is the plugin's primary window root (e.g. `"ui/index.html"`). Loaded via the `tauri://` custom protocol. |
| `default_width` | `u32` (100..4000) | no | Preferred initial window width in CSS pixels. Defaults to 480. |
| `default_height` | `u32` (100..4000) | no | Preferred initial window height in CSS pixels. Defaults to 320. |

Per FR-027, exactly one `EntryPoint` per plugin. Secondary windows are opened at runtime via `window.openSecondary()` (FR-027a) and are NOT declared in the manifest.

---

## E-6. Sidecar

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| `platforms` | `Map<PlatformId, SidecarPlatformBinary>` | yes | Per-platform binary. v1 only ships Windows builds of the host, so the map is currently expected to contain `"windows-x86_64"`. Other keys are allowed but ignored. |

### SidecarPlatformBinary

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| `bin` | `RelativePath` | yes | Path within the bundle to the executable (e.g. `"bin/windows-x86_64/sidecar.exe"`). |
| `args` | `Vec<string>` | no | Extra command-line args passed to the sidecar after the host's own internal args. |

**Validation**:
- Edge case (spec): if the user's platform key is absent from `platforms`, install proceeds with the sidecar disabled and the user is warned in the consent screen ("This plugin's sidecar is not available for your platform; UI-only features will work").

---

## E-7. Permission

Enum of capability groups. v1 catalogue (extensible in future schema versions):

| Value | Gates RPC methods | Notes |
|-------|-------------------|-------|
| `notifications` | `notification.show` | Toast UX in the overlay. |
| `hotkeys` | `hotkey.register`, `hotkey.unregister`, `hotkey.onTrigger` | Global keyboard shortcuts. |
| `sidecar` | `sidecar.call`, `sidecar.onEvent`, `sidecar.status` | Required if `manifest.sidecar != null`. |

Methods NOT requiring a permission: `window.*`, `state.*`, `theme.*`, `log.*`, `permissions.*`. These are scoped to the plugin's own window/storage and have no abuse vector beyond the plugin's own surface.

**Forward compatibility**: declaring a permission name unknown to the host is non-fatal — see spec edge cases.

---

## E-8. PluginInstance (runtime, not persisted)

The live, in-memory presence of an enabled plugin. Created when the user clicks the plugin in the menu; destroyed when its primary window closes or the plugin is disabled.

| Field | Type | Notes |
|-------|------|-------|
| `id` | `PluginId` | |
| `version` | `semver::Version` | The installed version this instance is running. |
| `primary_window` | `WebviewLabel` | Tauri's stable handle to the primary window. |
| `secondary_windows` | `Vec<WebviewLabel>` | Opened via `window.openSecondary`. |
| `permission_grants` | `Vec<Permission>` | Copied from the registry on launch. |
| `sidecar` | `Option<SidecarProcess>` | Spawned at instance creation if the manifest declares one. |
| `hotkey_registrations` | `Vec<RegistrationId>` | Tracked for cleanup on instance teardown. |
| `event_subscriptions` | `Vec<SubscriptionId>` | Tracked for cleanup. |

**Lifecycle**:
```
[disabled] -> user clicks plugin in menu -> [starting]
[starting] -> sidecar spawned & ready (if any) -> [running]
[starting] -> sidecar fails to start -> [failed] -> instance destroyed
[running] -> primary window closed by user -> [stopping]
[stopping] -> all secondary windows closed -> sidecar terminated -> [destroyed]
[running] -> plugin disabled in Settings -> [stopping]
[running] -> plugin uninstalled -> [stopping] -> registry entry removed
```

**Cleanup on `[destroyed]`** (FR-006, FR-020):
- All `hotkey_registrations` are unregistered with the host's keyboard hook.
- All `event_subscriptions` are dropped.
- `SidecarProcess::shutdown()` is called (graceful 5 s, then SIGKILL).
- Secondary windows are closed.

---

## E-9. SidecarProcess (runtime)

| Field | Type | Notes |
|-------|------|-------|
| `pid` | `u32` | OS process id. |
| `child` | `tokio::process::Child` | The spawned process handle. |
| `stdin_writer` | `tokio::sync::mpsc::Sender<Vec<u8>>` | Bounded channel of outgoing JSON-RPC frames. |
| `pending_calls` | `Map<RequestId, oneshot::Sender<Result<Value, RpcError>>>` | Inflight RPC awaiters. |
| `event_listeners` | `Vec<UnboundedSender<SidecarEvent>>` | One per `sidecar.onEvent` subscription. |
| `started_at` | `Instant` | For `sidecar.status` uptime calculation. |

**Frame format on stdin/stdout**: one JSON-RPC 2.0 object per line, UTF-8, terminated by a single `\n`. The host writes requests/notifications to the sidecar's stdin; the sidecar writes responses/notifications to its stdout. stderr is captured line-by-line into the unified log tagged with the plugin id.

---

## E-10. AvailableUpdate

Populated by the daily update poller.

| Field | Type | Notes |
|-------|------|-------|
| `version` | `semver::Version` | The newer version detected. |
| `release_url` | `Url` | Direct link to the GitHub release page (shown in Settings). |
| `release_notes` | `string` | The release body, rendered as Markdown in the consent dialog. |
| `asset_size_bytes` | `u64` | Size of `raic-plugin.zip` asset; shown to the user before download. |
| `detected_at` | `RFC3339` | When the poller saw it. |

---

## E-11. PluginState (per-plugin persisted KV store)

Persisted as `%APPDATA%\com.raic.overlay\plugins\<id>\state\state.json`. Scoped per plugin id (FR-024) — strictly inaccessible to other plugins.

| Field | Type | Notes |
|-------|------|-------|
| `data` | `Map<string, JsonValue>` | The KV store backing `state.get` / `state.set`. |
| `updated_at` | `RFC3339` | Last write time. |

No quota (per Clarification Q2). The directory's on-disk size is exposed via `state.usage()` and surfaced in the Settings plugins list.

---

## E-12. JsonRpcRequest / JsonRpcResponse / JsonRpcError

Standard JSON-RPC 2.0 shapes; documented fully in `contracts/jsonrpc-v1.md`. Error codes (see also FR-017):

| Code | Constant | Meaning |
|------|----------|---------|
| -32700 | `ParseError` | Invalid JSON received. |
| -32600 | `InvalidRequest` | JSON-RPC structure invalid. |
| -32601 | `MethodNotFound` | Unknown method name. |
| -32602 | `InvalidParams` | Method parameters didn't validate. |
| -32603 | `InternalError` | Host-side bug; details in `data`. |
| -32000 | `PermissionDenied` | Manifest did not declare the required permission. |
| -32001 | `SidecarUnavailable` | Sidecar crashed / not running. |
| -32002 | `SidecarTimeout` | Sidecar call exceeded the (default or override) timeout. |
| -32003 | `Conflict` | E.g. hotkey already registered by another plugin or built-in. |

---

## Relationships diagram

```
PluginRegistry (1) ───── (N) RegisteredPlugin
                                  │
                                  │ describes
                                  ▼
                              Manifest (loaded from disk on instance start)
                                  │
                                  ├── EntryPoint (1)
                                  ├── Permission[] (0..N)
                                  └── Sidecar (0..1)
                                          │
                                          └── SidecarPlatformBinary (per platform)

RegisteredPlugin (1) ───── (0..1) PluginInstance (when running)
                                          │
                                          ├── primary_window: WebviewLabel
                                          ├── secondary_windows: WebviewLabel[]
                                          └── sidecar: SidecarProcess (0..1)

RegisteredPlugin (1) ───── (1) PluginState  (persisted, survives upgrades)
RegisteredPlugin (1) ───── (0..1) AvailableUpdate  (populated by poller)
```
