# Feature Specification: Plugin System

**Feature Branch**: `060-plugin-system`
**Created**: 2026-05-21
**Status**: Draft
**Input**: User description: "Crea la especificación del nuevo sistema para plugin, define el schema del manifest más la lista de metodos json-rpc v1 y lo necesario según el contexto que ya tenemos"

## Summary

Enable third-party developers to extend RAIC Overlay with their own plugins — distributed as public GitHub repositories — without requiring the main application to be recompiled. The host application loads each plugin's web-based UI inside its native window system (preserving the SC HUD aesthetic) and exposes a documented, language-agnostic JSON-RPC v1 protocol so plugins can persist state, register hotkeys, log, and optionally run their own compiled sidecar binaries. The end user is solely responsible for vetting plugins before installation; the host shows the requested capabilities and the source repository URL, then installs at the user's explicit consent.

## Clarifications

### Session 2026-05-21

- Q: Transport mechanism for host ↔ sidecar JSON-RPC communication → A: JSON-RPC over stdio (newline-delimited JSON on the sidecar's stdin/stdout)
- Q: Per-plugin persistent storage quota → A: No hard quota; host tracks and exposes per-plugin storage usage but does not block writes (consistent with the "user is the trust authority" stance)
- Q: Sidecar per-call timeout → A: 30 seconds default per call, with optional `timeoutMs` override on `sidecar.call` capped at 300 000 ms (5 minutes) by the host
- Q: How are installed plugins exposed in the overlay menu? → A: A dedicated top-level "Plugins" button appears in the main overlay menu *only* when at least one plugin is installed and enabled; clicking it opens a dropdown listing every installed plugin. When zero plugins are installed, the button is hidden so the menu bar does not grow.
- Q: Plugin update policy → A: Periodic background check (at app launch + once per day) against each installed plugin's GitHub release; the host surfaces a notification/badge when a newer version is available; installation is always manual and goes through the same consent screen as first install (matches the host's own auto-update pattern in Features 049/051).

## User Scenarios & Testing *(mandatory)*

### User Story 1 - End User Installs a Community Plugin (Priority: P1)

An end user discovers a community-built plugin on GitHub (for example, a Twitch chat overlay or a build-order tracker), copies the repository URL, opens RAIC Overlay's Settings panel, pastes the URL into the "Install plugin" field, reviews the consent screen showing what the plugin can do and where it came from, confirms, and immediately sees the plugin available as a new entry in the overlay menu — wrapped in the same window chrome as the built-in components.

**Why this priority**: Without this flow there is no plugin system from the user's perspective. Everything else (the SDK, the protocol, sidecars) only matters once users can actually install something.

**Independent Test**: Manually publish a minimal "Hello World" plugin to a public GitHub repository (HTML + manifest only, no sidecar), then install it via Settings using only its URL. Plugin must appear in the menu, open in a host window with the standard chrome, and render its content.

**Acceptance Scenarios**:

1. **Given** the user has a valid plugin GitHub URL, **When** they paste it into the install field and click Install, **Then** the app shows a consent dialog listing the plugin's name, version, source URL, requested permissions, and any sidecar binaries it ships.
2. **Given** the consent dialog is shown, **When** the user confirms, **Then** the plugin is downloaded to the local plugins directory and becomes available in the overlay menu without restarting the app.
3. **Given** the consent dialog is shown, **When** the user cancels, **Then** nothing is installed and no files are written outside a temporary download area (which is cleaned up).
4. **Given** the GitHub URL points to a repository without a valid plugin release, **When** the user attempts to install, **Then** the app reports a clear error explaining what is missing (manifest, release assets, schema mismatch).
5. **Given** the user is operating the install flow with only a keyboard (no mouse), **When** they tab through the Settings → Plugins tab, paste a URL, focus the Install button, review the consent dialog, and confirm or cancel, **Then** every interactive element is reachable in a logical tab order, the consent dialog traps focus while open, the dialog's purpose and contents are announced by a screen reader, and color contrast on all text and controls meets WCAG 2.1 AA.

---

### User Story 2 - Plugin Developer Builds a UI-Only Plugin (Priority: P1)

A developer reads the plugin documentation, creates a public GitHub repository containing a manifest file and an HTML/JS/CSS bundle, publishes a release, and shares the URL with users. Their plugin runs inside the host's window system, consumes the host's design tokens to match the SC HUD aesthetic, and talks to the host through documented JSON-RPC methods (set window title, persist state, log) — without writing a single line of platform-specific code or installing any package from RAIC Overlay.

**Why this priority**: The plugin developer experience is the supply side of the ecosystem. If building a plugin requires too much ceremony or a proprietary SDK, no one will build any.

**Independent Test**: A developer with no prior knowledge of RAIC Overlay reads the published plugin documentation, builds and publishes a working plugin in under two hours that successfully loads, persists state across restarts, and reacts to a registered hotkey.

**Acceptance Scenarios**:

1. **Given** a plugin's HTML page is loaded by the host, **When** the page's JavaScript executes, **Then** a `window.raic` global is already available with documented JSON-RPC methods — no script tag or package install required from the plugin author.
2. **Given** a plugin calls `window.raic.rpc('window.setTitle', { title: 'My Plugin' })`, **When** the call resolves, **Then** the host's window chrome shows the requested title in the header.
3. **Given** a plugin's CSS references design tokens such as `var(--raic-bg)` or `var(--raic-accent)`, **When** the plugin is rendered, **Then** the tokens resolve to the host's current SC HUD theme values and the plugin visually matches the rest of the app.
4. **Given** a plugin calls `window.raic.rpc('state.set', { key: 'foo', value: 'bar' })`, **When** the user closes and reopens the plugin window, **Then** the same key returns the same value from `state.get`.

---

### User Story 3 - Plugin Developer Ships a Native Sidecar (Priority: P2)

A developer needs functionality the webview cannot provide on its own — for example, native file watching, a long-running calculation in Rust, or talking to a hardware device. They declare a sidecar binary per platform in the manifest, compile and attach those binaries to their GitHub release, and the plugin's UI invokes the sidecar through the host using the same JSON-RPC channel. The host spawns the sidecar as a child process, supervises it, and routes messages between the UI and the sidecar.

**Why this priority**: Sidecars unlock genuinely powerful plugins, but UI-only plugins already cover a large share of useful cases — so this is P2, not P1.

**Independent Test**: Publish a plugin whose sidecar is a tiny program written in any language that responds to a JSON-RPC `ping` with `pong`. Install the plugin and verify the UI can call `sidecar.call('ping')` and receive `pong` end-to-end.

**Acceptance Scenarios**:

1. **Given** a plugin's manifest declares a sidecar for the user's platform, **When** the plugin window is opened, **Then** the host spawns the sidecar process and connects to it before the plugin UI is allowed to call sidecar methods.
2. **Given** the sidecar exits unexpectedly, **When** the plugin's UI next attempts a sidecar call, **Then** the call rejects with a documented error code and the host writes a log entry naming the plugin and exit reason.
3. **Given** the plugin's window is closed, **When** the close completes, **Then** the sidecar process is terminated within a documented grace period (5 seconds, after which the host force-kills the process) and no orphan processes remain.

---

### User Story 4 - End User Manages Installed Plugins (Priority: P2)

The user opens Settings, sees a list of installed plugins with name, version, source URL, last-updated date, and enabled/disabled toggle. They can disable a misbehaving plugin without uninstalling it, check for updates, install an update if one is available, or uninstall a plugin entirely (which removes its files and cleans up its persisted state).

**Why this priority**: Users need an escape hatch once they start installing third-party code. Without it, a single bad plugin makes the app unusable.

**Independent Test**: Install two plugins, disable one and confirm only the other appears in the menu; uninstall the disabled one and confirm its files and state are removed.

**Acceptance Scenarios**:

1. **Given** the user opens the Settings plugins list, **When** the list renders, **Then** every installed plugin shows its name, current version, source URL, and an enabled/disabled control.
2. **Given** the user disables an installed plugin, **When** they reopen the overlay menu, **Then** the plugin no longer appears as a menu entry and its sidecar (if any) is not running.
3. **Given** the user clicks "Check for updates" on a plugin, **When** a newer release is available at the source URL, **Then** the app shows the new version and lets the user accept the update with the same consent flow used for first install.
4. **Given** the user uninstalls a plugin, **When** the uninstall completes, **Then** the plugin's files, persisted state, and any registered hotkeys are removed.
5. **Given** the user is managing plugins with only a keyboard (no mouse), **When** they navigate the Settings → Plugins list, toggle enable/disable, trigger "Check for updates", or trigger uninstall, **Then** every row's controls are reachable in a logical tab order, button purposes are announced by a screen reader (including the plugin name they apply to), and the conditional "Plugins" dropdown in the main overlay menu is openable and selectable via keyboard alone with visible focus indicators.

---

### User Story 5 - Plugin Reuses Host Capabilities (Priority: P3)

A plugin author wants their plugin to feel first-class: register a global hotkey, raise a notification, write structured log entries, and read the current theme tokens. All of these are exposed through the same JSON-RPC channel, gated by permissions declared in the manifest.

**Why this priority**: These are quality-of-life features that elevate plugins from "embedded webpages" to "real overlay components". They are not blocking for an MVP plugin ecosystem.

**Independent Test**: A plugin that requests the `hotkey` and `notification` permissions registers a global shortcut and, when pressed, fires a notification using only documented JSON-RPC calls.

**Acceptance Scenarios**:

1. **Given** a plugin's manifest declares the `hotkey` permission and the user accepted it, **When** the plugin calls `hotkey.register({ combo: 'Ctrl+Shift+P' })`, **Then** pressing that combination delivers a JSON-RPC event back to the plugin.
2. **Given** a plugin's manifest does *not* declare a permission, **When** the plugin calls an RPC method that requires it, **Then** the call rejects with a `PermissionDenied` error and the attempt is logged.

---

### Edge Cases

- The GitHub repository is private, deleted, renamed, or rate-limits the download — the install flow must fail with a clear message and not leave half-downloaded files behind.
- A plugin's release ships a sidecar only for some platforms — installing on an unsupported platform must either reject the install or install with the sidecar disabled (and clearly state which).
- A plugin requests an unknown permission name (typo or from a newer schema) — the host must show it explicitly in the consent screen as "unrecognized permission" rather than silently ignoring it.
- A plugin attempts to declare a manifest version newer than the host's supported version — the install must be rejected with a "host too old, please update RAIC Overlay" message that names the required version.
- Two installed plugins request the same global hotkey — the second registration must fail loudly so the user knows there is a conflict.
- A sidecar runs but never responds to JSON-RPC calls (hangs) — the host must time out individual calls and surface the failure to the plugin UI, without freezing the host.
- A plugin persists a very large amount of data — the host does not block the write, but the Settings plugins list MUST surface the plugin's storage size so the user can identify disk-hungry plugins and uninstall or disable them.
- The user uninstalls a plugin while its sidecar is mid-call — the host must terminate the sidecar and reject in-flight calls, never crash.

## Requirements *(mandatory)*

### Functional Requirements

#### Distribution & Installation

- **FR-001**: The system MUST allow end users to install a plugin by providing only the URL of a public GitHub repository — no local file paths, no package registries, no authentication.
- **FR-002**: The system MUST install plugins from the latest *tagged release* of the source repository (not from arbitrary branch HEAD), so plugin authors can publish stable versions with semantic version tags.
- **FR-003**: The system MUST store each installed plugin under a per-user application data directory, isolated in its own subdirectory keyed by plugin id and version.
- **FR-004**: Before installing or updating a plugin, the system MUST display a consent screen showing at minimum: plugin name, version, source repository URL, every permission the manifest requests, and a list of every sidecar binary the manifest declares. Installation MUST NOT proceed without explicit user confirmation.
- **FR-005**: The system MUST allow the user to update an installed plugin to a newer published release through the same consent flow used for first install.
- **FR-005a**: The system MUST periodically check each installed and enabled plugin's source GitHub repository for newer tagged releases. The check MUST run at host startup and at least once per 24 hours while the host is running.
- **FR-005b**: When a newer release is detected for an installed plugin, the system MUST surface a visible indicator (a badge on the "Plugins" menu entry and on the affected plugin's row in the Settings plugins list) and MUST NOT install the update without explicit user confirmation through the standard consent screen. There MUST NOT be a silent auto-install path in v1.
- **FR-006**: The system MUST allow the user to uninstall a plugin, removing its files, its persisted per-plugin state, and any host registrations (hotkeys, etc.) the plugin held.
- **FR-007**: The system MUST allow the user to disable an installed plugin without uninstalling it; a disabled plugin MUST NOT appear in the overlay menu and its sidecar (if any) MUST NOT run.
- **FR-008**: The system MUST NOT perform any cryptographic or build-provenance verification of downloaded plugin artifacts beyond ensuring the download completed and matches the size advertised by the release. The user is the sole authority on whether a plugin is trustworthy; the host's role is to make the source transparent (URL shown), not to guarantee safety.

#### Plugin Manifest

- **FR-009**: Every plugin MUST include a manifest file at the root of its release that declares: a unique plugin id, a human-readable name, a semantic version, an author identifier, the source repository URL, the minimum host application version it requires, the manifest schema version, an entry point for its UI bundle, the list of permissions it requires, and optionally a list of sidecar binaries per platform.
- **FR-010**: The system MUST reject installation of any plugin whose manifest is missing required fields, fails schema validation, or declares a manifest schema version newer than what the host supports.
- **FR-011**: The system MUST reject installation of any plugin whose declared minimum host application version is greater than the running host version, with a message instructing the user to update the host.

#### UI Hosting & Aesthetic

- **FR-012**: The system MUST render every plugin's UI inside its own host-owned window using the same window chrome (title bar, drag handles, opacity control, close button, focus behavior) as built-in components, so plugins inherit the SC HUD aesthetic without effort from the plugin author.
- **FR-012a**: The system MUST surface installed plugins through a dedicated top-level "Plugins" entry in the overlay menu that opens a dropdown listing every installed and enabled plugin. The "Plugins" entry MUST be hidden from the menu when zero plugins are installed (or all installed plugins are disabled), so the main menu bar does not grow when the user has no plugins. The user opens a plugin by selecting its name from the dropdown.
- **FR-013**: The system MUST inject into each plugin's web environment a base stylesheet exposing the current theme tokens as CSS custom properties (background, foreground, accent, border, glass, font family, etc.) so a plugin's own CSS can match the host theme by referencing these tokens.
- **FR-014**: The system MUST automatically inject into each plugin's web environment a global object — referred to in this spec as `window.raic` — that exposes the JSON-RPC v1 client already connected to the host. Plugin authors MUST NOT need to install, import, or bundle any package from RAIC Overlay to use this object.
- **FR-015**: A plugin's UI MUST NOT have direct access to native host APIs (filesystem, network proxying through the host, native window manipulation outside its own window, etc.). All host capabilities MUST go through the JSON-RPC channel, gated by the permission system.

#### JSON-RPC v1 Protocol — Method Catalog

- **FR-016**: The system MUST expose JSON-RPC v1 methods covering at least the following capability groups. Methods marked *(permission)* require the named permission to be granted in the manifest.

  **Window control** (no permission required — scoped to the plugin's own window):
  - `window.setTitle({ title })` — set the title shown in the host window chrome
  - `window.setIcon({ icon })` — set an icon shown next to the title and in the menu entry, given as a data URL or path within the plugin bundle
  - `window.close()` — request that the host close the plugin's window
  - `window.requestResize({ width, height })` — request a new window size (host may clamp or refuse)
  - `window.getBounds() → { x, y, width, height }` — read the current window position and size
  - `window.onFocusChange(listener) → subscriptionId` — receive an event when the plugin's window gains or loses focus
  - `window.openSecondary({ id, title, width, height, ui }) → { windowId }` — open a secondary window that belongs to this plugin instance (popup, detail view, etc.); the host wraps it with standard chrome and the new window inherits the plugin's permission grants, state scope, and sidecar
  - `window.closeSecondary({ windowId })` — close a previously opened secondary window
  - `window.listSecondary() → { windows }` — list the plugin's currently open secondary windows

  **Persistent state** (no permission required — scoped to the plugin's own storage):
  - `state.get({ key }) → { value }` — read a value previously stored by this plugin
  - `state.set({ key, value })` — write a value into the plugin's isolated state store
  - `state.delete({ key })` — remove a stored key
  - `state.list() → { keys }` — list keys currently stored by this plugin
  - `state.usage() → { bytes }` — return the current on-disk size of this plugin's persisted state so the plugin can self-regulate

  **Theme** (no permission required):
  - `theme.getTokens() → { tokens }` — read the current theme token values as a flat map
  - `theme.onChange(listener) → subscriptionId` — receive an event when the host theme changes

  **Logging** (no permission required):
  - `log.info({ message, data })`, `log.warn({ message, data })`, `log.error({ message, data })` — write structured entries into the host's unified log, tagged with the plugin id

  **Notifications** *(permission: `notifications`)*:
  - `notification.show({ title, body, durationMs })` — raise a transient notification in the overlay

  **Hotkeys** *(permission: `hotkeys`)*:
  - `hotkey.register({ combo, id }) → { registrationId }` — register a global hotkey; conflicts with existing registrations MUST reject
  - `hotkey.unregister({ registrationId })` — release a previously registered hotkey
  - `hotkey.onTrigger(listener) → subscriptionId` — receive an event when one of the plugin's registered hotkeys fires

  **Sidecar** *(permission: `sidecar`, only if the manifest declares a sidecar)*:
  - `sidecar.call({ method, params, timeoutMs? }) → { result }` — invoke a method on the plugin's own sidecar process via the host's relay; `timeoutMs` is optional (default 30 000, capped by the host at 300 000)
  - `sidecar.onEvent(listener) → subscriptionId` — receive asynchronous events pushed from the sidecar
  - `sidecar.status() → { running, pid, uptimeMs }` — query the sidecar process status

  **Permissions** (no permission required):
  - `permissions.list() → { granted, declared }` — return the plugin's declared and currently granted permissions
  - `permissions.has({ name }) → { granted }` — boolean check for a single permission

- **FR-017**: The system MUST define a stable error model for JSON-RPC v1 with at least the following error codes: `PermissionDenied`, `InvalidParams`, `MethodNotFound`, `SidecarUnavailable`, `SidecarTimeout`, `Conflict` (e.g., for hotkey collisions), and `InternalError`. Each error MUST carry a human-readable `message` and an optional structured `data` field.
- **FR-018**: The system MUST treat the JSON-RPC method names, parameter shapes, and error codes defined in v1 as a stable contract. Breaking changes MUST be introduced under a new protocol version (`v2`), and the manifest's declared protocol version determines which version the host exposes to that plugin.

#### Sidecar Lifecycle & Communication

- **FR-019**: When a plugin with a sidecar is loaded, the system MUST spawn the sidecar binary as a child process and establish a JSON-RPC channel with it over **stdio** (the sidecar reads JSON-RPC requests as newline-delimited JSON on its `stdin` and writes responses/events as newline-delimited JSON on its `stdout`; `stderr` is captured by the host into the unified log) before allowing the plugin UI to make sidecar calls. The sidecar MUST NOT be expected to open any network port or named pipe of its own.
- **FR-020**: The system MUST supervise sidecar processes: detect crashes, surface them to the plugin UI through the documented error model, and terminate sidecars when their plugin's window is closed or the plugin is disabled/uninstalled.
- **FR-021**: All UI-to-sidecar traffic MUST be relayed by the host. Plugins MUST NOT be able to open arbitrary network ports or talk to their sidecar by any other route arranged by themselves. This keeps the host in control of permissions, logging, and process lifetime.
- **FR-022**: Sidecar calls MUST enforce a per-call timeout. The default timeout MUST be 30 seconds. A plugin MAY pass an explicit `timeoutMs` on `sidecar.call` to override the default, but the host MUST cap the effective timeout at 300 000 ms (5 minutes). Calls exceeding the effective timeout MUST reject with `SidecarTimeout` and MUST NOT block the host or other plugins. Long-running work that exceeds 5 minutes MUST use the asynchronous event pattern (`sidecar.onEvent`) rather than a long-lived synchronous call.

#### Permissions & Isolation

- **FR-023**: The system MUST honor a permission model where each capability group that touches anything beyond the plugin's own window or storage is gated by a named permission, declared in the manifest and granted by the user at install time.
- **FR-024**: The system MUST scope plugin persisted state to the plugin's own id; one plugin MUST NOT be able to read or write another plugin's state through any documented method.
- **FR-025**: The system MUST NOT enforce a hard storage quota on a plugin's persisted state. Instead, the system MUST track the on-disk size of each plugin's storage and expose it through the Settings plugins list (so the user can see which plugin is consuming disk space) and through the `state.usage()` RPC method so plugins can self-regulate.
- **FR-026**: The system MUST log, with the offending plugin's id, every rejected RPC call (permission denials, conflict errors, timeouts, invalid params) so the user and the plugin author can diagnose problems.

#### Plugin Composition

- **FR-027**: A plugin's manifest MUST declare exactly one *primary* entry point that becomes its single visible entry in the overlay menu. This keeps the menu predictable and prevents a single install from sprawling across the menu surface.
- **FR-027a**: A plugin MAY, at runtime, request the host to open additional *secondary* windows (popups, sub-panels, detail views) that belong to the same plugin instance. Secondary windows MUST NOT appear as independent entries in the overlay menu; they are owned by and contextually attached to the primary plugin instance.
- **FR-027b**: Secondary windows MUST share the same permission grants, persisted state scope, and (if present) sidecar process as the primary window. Closing the primary plugin window or disabling the plugin MUST close all of its secondary windows and terminate any associated sidecar process.

#### Documentation

- **FR-028**: The system MUST ship public documentation (in the repository) covering: the manifest schema (every field, every permission, every sidecar field), the full JSON-RPC v1 method catalog with parameters and return shapes, the available theme CSS tokens, the error model, the transport used for sidecar communication, and a minimal end-to-end example plugin.

#### UI Accessibility

- **FR-029**: Every new host-built UI surface introduced by this feature — the Settings → Plugins tab and its rows, the install/update consent dialog, and the conditional "Plugins" entry and dropdown in the main overlay menu — MUST follow WCAG 2.1 AA. Concretely: (a) all interactive elements are reachable and operable with the keyboard alone in a logical tab order; (b) the consent dialog traps focus while open and returns focus to the originating control on close; (c) every button, toggle, badge, and list row has an accessible name announced by a screen reader (including the plugin name the control applies to); (d) state changes (install progress, update-available badge, enable/disable toggle, plugin opened in menu) are announced via ARIA live regions or equivalent; (e) text and meaningful non-text elements meet a contrast ratio of at least 4.5:1 (or 3:1 for large text and UI components) against their background under the SC HUD theme. Plugin-authored content rendered inside a plugin window is the plugin author's responsibility, not the host's.

### Key Entities

- **Plugin**: A third-party extension distributed as a public GitHub repository and installed locally by the user. Identified by a globally unique id, has a semantic version, a source URL, an installed-on date, a current enabled/disabled state, and a permission grant record.
- **Manifest**: The declarative file shipped with every plugin release that tells the host what the plugin is called, what protocol/host versions it targets, where its UI bundle lives, what permissions it requests, and which sidecar binaries it ships per platform.
- **Sidecar**: An optional native executable, compiled by the plugin author for one or more platforms, that the host runs as a child process and communicates with via JSON-RPC. Each plugin has at most one sidecar.
- **Permission**: A named capability (for example `hotkeys`, `notifications`, `sidecar`) that a plugin must declare in its manifest and the user must grant before the host honors related JSON-RPC calls.
- **Plugin Instance**: A live runtime presence of a plugin — one primary host-owned window, zero or more secondary host-owned windows opened by the plugin at runtime, an injected JSON-RPC client per window, optionally a single shared sidecar process, and a connection to the plugin's isolated state store.
- **JSON-RPC v1 Catalog**: The documented set of method names, parameter shapes, return shapes, error codes, and subscription patterns that the host exposes to plugin UIs and sidecars. Treated as a stable public contract.

## Assumptions

- The end user is responsible for vetting plugins. The host does not validate code, signatures, build provenance, or release authenticity beyond confirming the download completed. The consent screen exists to make the source visible, not to certify safety.
- Plugins are installed per-user (under the user's application data directory), not machine-wide. This matches how the host itself is installed and avoids needing elevated permissions for plugin operations.
- Plugins are fetched from the latest GitHub *release* (semver-tagged), not from arbitrary commits or branches. This forces a release discipline on plugin authors and aligns with the existing host auto-update mechanism.
- The host exposes one JSON-RPC channel per plugin instance for the UI and one per running sidecar. All channels for a given plugin share the same permission grants.
- The injected `window.raic` global is the only required entry point for plugin UIs. Plugin authors may write their UI in any web framework or none at all; the contract is the JSON-RPC method names and shapes, not any specific JavaScript API.
- The host does not provide any plugin-to-plugin communication channel in v1. Plugins are isolated from each other.
- Sidecars do not need to be written in any particular language. Any executable that can speak the documented JSON-RPC transport over the documented channel is a valid sidecar.

## Out of Scope

- A central plugin marketplace, search, ratings, or curated index. Distribution is GitHub URLs only in v1.
- Automatic verification of plugin authenticity (signatures, reproducible builds, GitHub artifact attestations). Trust is the user's responsibility.
- A localized or graphical plugin developer SDK (npm package, framework, scaffolding tool). The protocol and manifest documentation is the SDK in v1.
- Plugin-to-plugin communication channels.
- A separate language-specific helper library for sidecar authors. They implement the documented JSON-RPC transport directly.
- Paid plugins or any kind of payments/licensing flow.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: An end user can go from "I have a GitHub URL" to "the plugin is running in my overlay" in under 60 seconds for a small (under 1 MB) plugin on a typical broadband connection.
- **SC-002**: A developer who has never seen RAIC Overlay before can publish a working "Hello World" plugin (UI-only, no sidecar) using only the public plugin documentation in under 2 hours.
- **SC-003**: Sidecar plugins can be authored in at least 3 different programming languages without any language-specific helper from the host project, validated by reference implementations in those languages.
- **SC-004**: When a user opens the install consent screen, 100% of the capabilities the plugin will be able to exercise are visible on that screen (no hidden permissions, no implicit capabilities).
- **SC-005**: A plugin's UI rendered through the host is visually consistent with built-in windows: same chrome, same fonts, same opacity behavior, and — when the plugin's CSS references the documented theme tokens — same colors, with no extra work from the plugin author.
- **SC-006**: A misbehaving plugin (crashing sidecar, hanging RPC call, disk-hungry storage) can be identified by the user from the Settings plugins list (which shows per-plugin storage usage) and disabled or uninstalled without restarting the host or affecting other plugins.
- **SC-007**: The JSON-RPC v1 method catalog, manifest schema, error codes, and CSS theme tokens are all documented in the public repository before v1 ships, with at least one end-to-end example plugin a developer can clone and modify.
