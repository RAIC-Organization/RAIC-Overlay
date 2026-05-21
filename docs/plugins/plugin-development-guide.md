# Plugin Development Guide

A complete, opinionated guide to building, packaging, publishing, and
integrating plugins for RAIC Overlay.

Prerequisites: you already know HTML, CSS, and basic JavaScript. No prior
experience with RAIC Overlay or Tauri is required. If you want to add a
native sidecar you'll also need familiarity with whatever language you
want to write it in (any language that can read stdin and write to stdout
works — see §13).

> If you just want the absolute minimum, read **[`quickstart.md`](quickstart.md)** first
> — it's a 3-minute Hello World walkthrough. This guide is the deeper
> reference for everything beyond Hello World.

---

## Table of contents

1. [Overview](#1-overview)
2. [How plugins work](#2-how-plugins-work)
3. [Project layout](#3-project-layout)
4. [The manifest (`raic-plugin.json`)](#4-the-manifest)
5. [The UI bundle](#5-the-ui-bundle)
6. [Styling with theme tokens](#6-styling-with-theme-tokens)
7. [Persisting state](#7-persisting-state)
8. [Window control & secondary windows](#8-window-control--secondary-windows)
9. [Permissions](#9-permissions)
10. [Hotkeys](#10-hotkeys)
11. [Notifications](#11-notifications)
12. [Logging](#12-logging)
13. [Native sidecars](#13-native-sidecars)
14. [Building the release ZIP](#14-building-the-release-zip)
15. [Publishing on GitHub](#15-publishing-on-github)
16. [Installing your plugin locally](#16-installing-your-plugin-locally)
17. [Updating your plugin](#17-updating-your-plugin)
18. [Debugging](#18-debugging)
19. [Best practices](#19-best-practices)
20. [Security model](#20-security-model)
21. [Versioning & forward compatibility](#21-versioning--forward-compatibility)
22. [Reference index](#22-reference-index)

---

## 1. Overview

A RAIC Overlay plugin is a **web app** (HTML + JS + CSS) that runs inside
a host-owned window in the overlay. It optionally ships a **native
sidecar binary** for work the webview can't do on its own.

You distribute your plugin by publishing it as a release on a **public
GitHub repository**. Users install it by pasting the repo URL into
RAIC Overlay's Settings → Plugins panel. The host downloads the release,
shows the user a consent dialog with the source URL + every requested
permission + every shipped native binary, and installs only after the
user explicitly confirms.

There is **no central registry, no review process, and no marketplace**.
The user is the trust authority — your responsibility as an author is to
keep your source open and honest about what your plugin does.

---

## 2. How plugins work

When a user opens your plugin from the overlay menu, the host:

1. Creates a new WebviewWindow with the standard SC HUD chrome
   (titlebar, drag, opacity, close button)
2. Injects a bootstrap script **before** any of your scripts run. The
   bootstrap:
   - Defines `window.raic` — a frozen JSON-RPC client connected to the
     host
   - Adds a `<style>` block on `:root` with the SC HUD CSS custom
     properties (background, foreground, accent, fonts, etc.)
3. Loads your `entry.ui` HTML over a custom protocol
   (`http://plugin.localhost/<your-id>/<entry>`)
4. If your manifest declares a sidecar for the user's platform, the host
   spawns it as a child process and waits for the `raic.init` handshake
   before unblocking your UI's `sidecar.call`

When the user closes the primary window (or disables / uninstalls the
plugin), the host:

- Closes any secondary windows your plugin opened
- Drops every subscription you registered
- Sends `raic.shutdown` to your sidecar (5 second grace, then kill)
- Releases every hotkey you registered

**You don't manage any of that cleanup yourself.** The host owns the
lifecycle. Your job is to build the UI and use the documented
`window.raic` methods.

---

## 3. Project layout

```text
my-cool-plugin/
├── raic-plugin.json     # The manifest (required, at the root)
├── ui/
│   ├── index.html       # Entry point (or wherever entry.ui points)
│   ├── main.js
│   └── style.css
├── bin/                 # OPTIONAL — sidecar binaries
│   └── windows-x86_64/
│       └── sidecar.exe
├── icon.png             # OPTIONAL — referenced by manifest.icon
├── README.md            # OPTIONAL but recommended (humans read this on GitHub)
└── LICENSE              # OPTIONAL but recommended
```

Use any folder names you want under `ui/` and `bin/` as long as your
manifest references them by relative path.

---

## 4. The manifest

The authoritative shape is [`manifest.schema.json`](manifest.schema.json).
Wire it into your editor with `$schema` for autocomplete:

```json
{
  "$schema": "https://raic-overlay.app/schemas/plugin-manifest/v1.json",
  "manifest_version": 1,
  "id": "com.alice.build-order-tracker",
  "name": "Build Order Tracker",
  "version": "1.4.2",
  "author": "Alice",
  "description": "Tracks your build orders during gameplay.",
  "source_repo_url": "https://github.com/alice/build-order-tracker",
  "min_host_version": "1.0.0",
  "protocol_version": 1,
  "entry": {
    "ui": "ui/index.html",
    "default_width": 480,
    "default_height": 320
  },
  "permissions": ["notifications", "hotkeys"],
  "icon": "ui/icon.svg",
  "license": "MIT",
  "homepage": "https://example.com/build-order-tracker"
}
```

### Field reference

| Field | Required | Notes |
|-------|----------|-------|
| `$schema` | no | Editor autocomplete only, ignored at runtime |
| `manifest_version` | yes | Always `1` in v1 |
| `id` | yes | Reverse-DNS-style. `^[a-z][a-z0-9-]*(\.[a-z][a-z0-9-]*){1,}$` |
| `name` | yes | 1..80 chars, shown in menu + Settings |
| `version` | yes | SemVer 2.0.0 (`1.4.2`, `2.0.0-beta.1`, etc) |
| `author` | yes | 1..80 chars |
| `description` | yes | 1..280 chars, shown in consent dialog |
| `source_repo_url` | yes | Must start with `https://github.com/`; v1 GitHub-only |
| `min_host_version` | yes | Install fails if host version is older |
| `protocol_version` | yes | Always `1` in v1 |
| `entry.ui` | yes | Relative path to your HTML entry. No `\` or leading `/` |
| `entry.default_width` | no | Pixels, 100..4000, default 480 |
| `entry.default_height` | no | Pixels, 100..4000, default 320 |
| `permissions` | yes | Array; may be empty. See [§9](#9-permissions) |
| `sidecar` | no | See [§13](#13-native-sidecars) |
| `icon` | no | Relative path to a PNG or SVG shown in the menu |
| `license` | no | SPDX id, informational (`MIT`, `Apache-2.0`, etc) |
| `homepage` | no | URL, shown in Settings |

### ID conventions

- Use reverse-DNS keyed on a domain or namespace **you control**.
- Never use a generic id like `tracker` or `chat` — collisions are
  rejected at install time and you'll lose users.
- Examples: `com.alice.demo`, `dev.bob.twitch-chat`,
  `studio.raic.official-tools.macros`.

### Version discipline

- The host installs from the latest GitHub release **tagged** with
  semver. `v1.4.2`, `1.4.2`, and `1.4.2+meta` are all accepted (leading
  `v` optional; build metadata stripped for comparison).
- `manifest.version` MUST equal the tag (minus the leading `v`).
- Bump the major when you break compatibility with your stored state
  shape; consider migration in `main.js`.

---

## 5. The UI bundle

Your plugin's UI is a regular web page. Open it however you like —
plain HTML, a React/Vue/Svelte SPA, anything that builds to static
files.

### The `window.raic` global

The host injects this before your scripts run. From any script in your
plugin:

```js
// All methods return Promises.
await window.raic.rpc('window.setTitle', { title: 'Hello' });

const { value } = await window.raic.rpc('state.get', { key: 'username' });

// Subscriptions
const sub = await window.raic.subscribe('theme.onChange', {}, (event) => {
  console.log('theme changed:', event.tokens);
});
// Later:
await sub.unsubscribe();
```

If you write TypeScript, drop [`window-raic.d.ts`](window-raic.d.ts) into
your project and add the triple-slash reference:

```ts
/// <reference path="./window-raic.d.ts" />

const { value } = await window.raic.rpc<{ value: string | null }>('state.get', {
  key: 'username',
});
```

### Available methods

The full catalog with parameter and return shapes lives in
[`jsonrpc-v1.md`](jsonrpc-v1.md). Quick index:

- **`window.*`**: `setTitle`, `setIcon`, `close`, `requestResize`,
  `getBounds`, `onFocusChange`, `openSecondary`, `closeSecondary`,
  `listSecondary`
- **`state.*`**: `get`, `set`, `delete`, `list`, `usage`
- **`theme.*`**: `getTokens`, `onChange`
- **`log.*`**: `info`, `warn`, `error`
- **`permissions.*`**: `list`, `has`
- **`notification.*`**: `show` *(requires `notifications`)*
- **`hotkey.*`**: `register`, `unregister`, `onTrigger` *(requires `hotkeys`)*
- **`sidecar.*`**: `call`, `onEvent`, `status` *(requires `sidecar`)*
- **`raic.unsubscribe`**: protocol-level, drops a subscription id

### No npm package, no bundler required

There is intentionally no `@raicoverlay/plugin-sdk` package. The
contract is `window.raic` itself, defined globally before your scripts
run. You can:

- Write plain HTML + JS with no toolchain at all
- Use a bundler if you prefer (Vite, esbuild, parcel)
- Use a framework (React, Vue, Svelte) — bundle to a single
  `ui/index.html` + assets

If you bundle, make sure relative paths in `index.html` resolve under
your plugin's directory — the host serves them from
`http://plugin.localhost/<id>/<path>`.

### Errors

Every `rpc()` call's promise rejects with a `RaicRpcError`-like object
on failure:

```js
try {
  await window.raic.rpc('hotkey.register', { combo: 'Ctrl+Shift+P', id: 'open' });
} catch (err) {
  console.log(err.code);     // e.g. -32000 for PermissionDenied
  console.log(err.message);  // human-readable
  console.log(err.data);     // optional structured data, e.g. { required: 'hotkeys' }
}
```

Error codes are documented in [`jsonrpc-v1.md`](jsonrpc-v1.md) §Error
model.

---

## 6. Styling with theme tokens

The host injects CSS custom properties on `:root` that mirror the SC HUD
theme. Reference them in your CSS to automatically match the rest of
the app:

```css
body {
  background: var(--raic-bg-glass);
  color: var(--raic-fg);
  font-family: var(--raic-font-body);
}
h1 {
  font-family: var(--raic-font-display); /* Orbitron */
  color: var(--raic-accent);
}
button {
  background: var(--raic-bg-elevated);
  color: var(--raic-fg);
  border: 1px solid var(--raic-border);
  border-radius: var(--raic-radius);
  padding: calc(var(--raic-spacing-unit) * 2);
}
button:focus-visible {
  outline: 2px solid var(--raic-accent);
  outline-offset: 2px;
}
```

### Available tokens

The complete current list (also documented as the `RaicCssToken` union
in [`window-raic.d.ts`](window-raic.d.ts)):

| Token | Purpose |
|-------|---------|
| `--raic-bg` | Primary background |
| `--raic-bg-deep` | Deeper background (page-level) |
| `--raic-bg-elevated` | Elevated surfaces (cards, popups) |
| `--raic-bg-muted` | Muted/disabled background |
| `--raic-bg-glass` | Glassmorphism backdrop |
| `--raic-fg` | Primary foreground / text |
| `--raic-fg-muted` | Secondary text |
| `--raic-accent` | Primary accent (SC cyan) |
| `--raic-accent-strong` | Accent emphasis (hover, focus) |
| `--raic-border` | Standard border color |
| `--raic-border-glass` | Border on glass surfaces |
| `--raic-shadow` | Standard drop shadow |
| `--raic-radius` | Standard border radius (0.5rem) |
| `--raic-radius-sm` | Small radius |
| `--raic-radius-lg` | Large radius |
| `--raic-font-display` | Orbitron + fallbacks |
| `--raic-font-body` | System body font stack |
| `--raic-spacing-unit` | Base spacing unit (4px) |

### Reading tokens at runtime

```js
const { tokens } = await window.raic.rpc('theme.getTokens');
// tokens['--raic-accent'] === 'hsl(190 100% 50%)' etc

// React to runtime theme changes (if the host ever switches themes):
const sub = await window.raic.subscribe('theme.onChange', {}, ({ tokens }) => {
  console.log('new theme tokens:', tokens);
});
```

### Working without tokens (fallbacks)

Always provide CSS fallbacks so your plugin doesn't break if a future
host removes a token:

```css
color: var(--raic-fg, #f0f6ff);
```

---

## 7. Persisting state

Each plugin gets its own isolated KV store. No other plugin can read or
write your keys.

```js
// Write
await window.raic.rpc('state.set', { key: 'username', value: 'Alice' });
await window.raic.rpc('state.set', { key: 'prefs', value: { theme: 'dark', count: 42 } });

// Read
const { value } = await window.raic.rpc('state.get', { key: 'username' });
// value === 'Alice' or null if not set

// Delete + list
await window.raic.rpc('state.delete', { key: 'username' });
const { keys } = await window.raic.rpc('state.list');

// Find out how much disk you're using
const { bytes } = await window.raic.rpc('state.usage');
```

State persists across host restarts AND across plugin version upgrades
(stored under `state/` outside the versioned install dir).

### What you can store

Any JSON-serialisable value: strings, numbers, booleans, arrays, plain
objects. No DOM nodes, no functions, no `undefined` values inside
arrays/objects (they get dropped during JSON serialisation).

### Best practices

- **Debounce writes**. Every `state.set` triggers a disk write
  (atomic .tmp + rename). For high-frequency saves (every keystroke,
  every scroll position), debounce by ~250–500ms.
- **Batch related data**. Prefer one `state.set('prefs', {...})` over
  five `state.set('pref1', ...)`, `state.set('pref2', ...)` calls.
- **Be a good citizen with disk**. There is no hard quota in v1, but
  the user can see your storage size in Settings and uninstall you if
  you're a pig. Keep it under a few MB unless you have a great reason.
- **Don't store secrets** as plaintext. The store is unencrypted JSON
  in the user's `%APPDATA%` folder.

---

## 8. Window control & secondary windows

### Primary window

Your plugin always has one primary window. Control it from any script:

```js
await window.raic.rpc('window.setTitle', { title: 'Build Order — Game 1' });
await window.raic.rpc('window.requestResize', { width: 600, height: 400 });
const { x, y, width, height } = await window.raic.rpc('window.getBounds');
await window.raic.rpc('window.close');
```

### Focus events

```js
const sub = await window.raic.subscribe('window.onFocusChange', {}, ({ focused, windowId }) => {
  console.log(focused ? 'gained focus' : 'lost focus');
});
```

### Secondary windows

Open additional windows belonging to the same plugin instance. Useful
for popups, detail views, separate panels.

```js
const { windowId } = await window.raic.rpc('window.openSecondary', {
  id: 'details',           // unique within this plugin instance
  title: 'Match Details',
  width: 320,
  height: 240,
  ui: 'ui/details.html',   // relative path inside your bundle
});

// Later
await window.raic.rpc('window.closeSecondary', { windowId });

// List currently open
const { windows } = await window.raic.rpc('window.listSecondary');
```

Secondary windows:

- Get the same host chrome and CSS tokens as the primary
- Share the same persisted state (everything's keyed on plugin id)
- Share the same sidecar process (if any)
- Are **automatically closed** when the primary closes (don't manage
  cleanup yourself)
- Are **not visible** as separate entries in the overlay menu (the
  primary is the only menu entry, per FR-027)

---

## 9. Permissions

Methods that touch anything beyond your own window and storage are
gated by named permissions. Declare them in `manifest.permissions`;
the host shows them to the user in the consent dialog at install time.
Calls to gated methods without the matching permission reject with
`PermissionDenied`.

### v1 catalog

| Permission | Gates |
|------------|-------|
| `notifications` | `notification.show` |
| `hotkeys` | `hotkey.register`, `hotkey.unregister`, `hotkey.onTrigger` |
| `sidecar` | `sidecar.call`, `sidecar.onEvent`, `sidecar.status` (required if `manifest.sidecar` is set) |

### Methods that DON'T require a permission

- `window.*` (scoped to your own windows)
- `state.*` (scoped to your own storage)
- `theme.*` (read-only host metadata)
- `log.*` (write-only, host-tagged)
- `permissions.*` (introspection)

### Unknown permissions

You can declare a permission name that this host version doesn't
recognise (forward compat). The consent dialog will surface it as
"(unrecognised by this host version)" and a warning icon, but the user
can still accept; it just won't unlock any methods on a host that
doesn't know about it.

### Checking permissions at runtime

```js
const { granted } = await window.raic.rpc('permissions.has', { name: 'hotkeys' });
if (!granted) {
  // Fall back gracefully or tell the user
}
```

---

## 10. Hotkeys

```js
// Register
const { registrationId } = await window.raic.rpc('hotkey.register', {
  combo: 'Ctrl+Shift+P',
  id: 'open-palette',   // your-side id, included on every trigger event
});

// Subscribe to trigger events
await window.raic.subscribe('hotkey.onTrigger', {}, ({ id, combo, at }) => {
  if (id === 'open-palette') openPalette();
});

// Unregister
await window.raic.rpc('hotkey.unregister', { registrationId });
```

### Combo grammar

Modifier names: `Ctrl`, `Shift`, `Alt`, `Super`/`Cmd` (mac), separated
by `+`. The key can be a letter, digit, `F1`..`F24`, or one of:
`Space`, `Tab`, `Enter`, `Escape`, `Up`, `Down`, `Left`, `Right`,
`Home`, `End`, `PageUp`, `PageDown`, `Insert`, `Delete`.

Examples: `Ctrl+Shift+P`, `Alt+F4`, `F8`, `Ctrl+Alt+Up`.

### Conflicts

If the combo is already registered by another plugin or by the host
(F3, F5, etc), `hotkey.register` rejects with `Conflict`. Catch and
fall back:

```js
try {
  await window.raic.rpc('hotkey.register', { combo: 'Ctrl+Shift+P', id: 'palette' });
} catch (err) {
  if (err.code === -32003) {
    // Conflict — offer the user a different combo, or skip
  } else {
    throw err;
  }
}
```

### Cleanup

You **don't** have to unregister hotkeys before your window closes.
The host releases everything you registered on plugin teardown
automatically.

### Best practices

- Don't grab combos the OS or other apps own (`Ctrl+C`, `Win+L`,
  `Alt+F4` on Windows).
- Prefer modifier-laden combos over single keys (single-key combos
  fire during typing in text fields).
- Make your hotkeys user-configurable if you can — store the combo in
  `state` and re-register on startup.

---

## 11. Notifications

Show a transient toast in the overlay (auto-dismisses):

```js
await window.raic.rpc('notification.show', {
  title: 'Build saved',
  body: 'Your build order was saved.',
  durationMs: 3000,   // optional, 500..30000, default 4000
});
```

Notifications appear stacked in the top-right of the overlay. The user
can dismiss them early via the X button.

### Limits

- `title` and `body` are required strings
- `durationMs` clamped to [500, 30000]
- Don't spam — the host doesn't rate-limit you in v1 but burying the
  user under toasts is a fast way to get uninstalled

---

## 12. Logging

```js
await window.raic.rpc('log.info', { message: 'plugin started' });
await window.raic.rpc('log.warn', { message: 'config missing field', data: { field: 'x' } });
await window.raic.rpc('log.error', { message: 'sync failed', data: { err: 'timeout' } });
```

Entries land in the host's unified log, tagged with your plugin id:
`[plugin=com.alice.demo] config missing field | {"field":"x"}`.

These survive page reloads and persist across sessions — useful for
troubleshooting issues users report.

Don't use `log.*` for high-frequency output (per-frame, per-keystroke).
For that, use the browser's `console.*` and read it from the plugin
window's devtools.

---

## 13. Native sidecars

Use a sidecar when your plugin needs to do something the webview can't
on its own:

- Talk to a hardware device (serial port, USB)
- Run a long CPU-bound calculation
- Watch the filesystem
- Talk to a local service the user already has running
- Use a library that doesn't exist in JavaScript

The host spawns your sidecar as a child process, attaches pipes to its
stdin/stdout/stderr, and relays JSON-RPC messages between your
plugin's UI and the sidecar.

### Quick conceptual model

```text
        plugin UI (window.raic.rpc 'sidecar.call' ...)
                            │
                            ▼
                       host (Rust)
                            │
              ┌─────────────┴─────────────┐
              ▼                           ▼
    your sidecar (stdin)         your sidecar (stdout)
       JSON-RPC requests           JSON-RPC responses
                                       + events
```

### Step 1 — Declare in the manifest

```json
{
  "permissions": ["sidecar"],
  "sidecar": {
    "platforms": {
      "windows-x86_64": { "bin": "bin/windows-x86_64/sidecar.exe" }
    }
  }
}
```

Platform keys currently used:

- `windows-x86_64` (target the production host runs on)
- `linux-x86_64`, `macos-aarch64` — accepted in the manifest schema
  but the host doesn't run on these platforms yet; they're forward
  compat

If you declare a sidecar but no binary for the user's current platform,
the install proceeds with the sidecar disabled and the consent dialog
shows a warning.

### Step 2 — Write the sidecar

The full contract is in [`sidecar-protocol.md`](sidecar-protocol.md).
Read it once; it's short. Highlights:

- Communication: newline-delimited JSON over stdin/stdout (`\n`, not
  CRLF)
- Each message is a JSON-RPC 2.0 request, response, or notification
- The host sets these environment variables before spawn:
  - `RAIC_PLUGIN_ID`
  - `RAIC_PLUGIN_VERSION`
  - `RAIC_PROTOCOL_VERSION` (always `1` in v1)
  - `RAIC_PLUGIN_STATE_DIR` (absolute path to your state dir)
  - `RAIC_PLUGIN_LOG_PREFIX`
- First message from host: `raic.init` — you MUST respond within 5s
  with `{ name, version, methods }` listing your callable methods
- Last message from host: `raic.shutdown` — exit within 5s or you'll
  be killed
- Per-call timeout: 30s default, plugin UI can override up to 300s
- Anything you write to stderr is captured by the host into its
  unified log

### Step 3 — Build per platform

You compile separately for each platform you want to support. RAIC
Overlay v1 ships for Windows so target `windows-x86_64` (i.e. produce
an `.exe`).

**Pre-built reference sidecars** (copy + modify):

- **Python**: [`examples/sidecars/python/sidecar.py`](../../examples/sidecars/python/sidecar.py)
  — Wrap with PyInstaller (`pyinstaller --onefile sidecar.py`) to
  produce a single `.exe`.
- **Node.js**: [`examples/sidecars/node/sidecar.mjs`](../../examples/sidecars/node/sidecar.mjs)
  — Use `bun build --compile`, `pkg`, or Node's experimental SEA to
  produce a standalone exe.
- **Rust**: [`examples/sidecars/rust/`](../../examples/sidecars/rust/)
  — `cargo build --release` produces `target/release/sidecar-rust.exe`.

Place the resulting binary at `bin/windows-x86_64/sidecar.exe` inside
your plugin folder, matching whatever path you declared in the
manifest.

### Step 4 — Call from your UI

```js
const { result } = await window.raic.rpc('sidecar.call', {
  method: 'ping',
  params: {},
  // timeoutMs: 60000,  // optional, default 30000, host-capped at 300000
});
console.log(result); // whatever your sidecar returned

// Subscribe to events the sidecar pushes
const sub = await window.raic.subscribe('sidecar.onEvent', {}, (event) => {
  console.log('sidecar event:', event);
});

// Check if it's alive
const { running, pid, uptimeMs } = await window.raic.rpc('sidecar.status');
```

### Sidecar lifecycle

- **Spawned**: when the user opens your plugin's primary window
- **Killed**: when the user closes the primary window, disables the
  plugin, or uninstalls it (graceful 5s, then force-kill)
- **Crash detection**: if your sidecar exits unexpectedly, all
  in-flight `sidecar.call` promises reject with `SidecarUnavailable`;
  the host does NOT auto-restart in v1 (the user must close and
  reopen)

### Sidecar best practices

- Respond to `raic.init` within a few hundred ms — slow init blocks
  the plugin UI from being usable
- Always flush stdout after writing a response (Python: `sys.stdout.flush()`)
- Use stderr for human-readable diagnostics; reserve stdout for
  protocol traffic
- Define error codes in the `-32100..-32199` range for your own
  domain errors
- For long-running work, return a quick acknowledgement and push
  progress via `raic.event` notifications instead of blocking the
  response

### Sidecar security implications

The user will see your sidecar listed by file path in the consent
dialog with a "⚠️ native executable" warning. Be transparent in your
README about what the sidecar does — users who care will read the
source before installing.

---

## 14. Building the release ZIP

Your release asset MUST be named **`raic-plugin.zip`** (case-insensitive)
and its top-level entries MUST be your manifest + folders directly — NO
wrapping `my-plugin-name/` folder.

### From inside your plugin's directory

**Windows (PowerShell)**:

```powershell
Compress-Archive -Path raic-plugin.json,ui,bin,README.md,LICENSE -DestinationPath ../raic-plugin.zip
```

**macOS / Linux**:

```sh
zip -r ../raic-plugin.zip raic-plugin.json ui/ bin/ README.md LICENSE
```

The resulting `raic-plugin.zip`, when extracted, should look like:

```text
raic-plugin.json   ← AT THE ROOT, not inside any folder
ui/
bin/
README.md
LICENSE
```

If you accidentally zip the wrapping folder (`my-plugin/`), the install
fails with "release archive does not contain raic-plugin.json at the
root". Common mistake.

---

## 15. Publishing on GitHub

1. Commit your plugin to a **public** GitHub repository
   (`https://github.com/<you>/<repo>`). Private repos won't work in
   v1 — the host fetches via GitHub's unauthenticated API.
2. Create a new release (`Releases → Draft a new release`).
3. Tag the release with your semver: `v1.4.2` (or `1.4.2` — either
   works). The tag MUST match `manifest.version`.
4. Write release notes — they're shown to users in the update consent
   dialog.
5. Attach your `raic-plugin.zip` as a release asset.
6. Publish the release.

That's the entire publish workflow. Share the repo URL with users; the
host handles everything from "URL pasted" to "plugin in menu".

### Rate limits

GitHub allows 60 unauthenticated requests per hour per IP. Each install
uses ~2 requests (release lookup + asset download). The host caches
ETags for the daily update poll, so an idle user's host uses about
1 request per plugin per day. You don't need to worry about this
unless you're testing many installs in rapid succession.

---

## 16. Installing your plugin locally

While developing:

1. Push your plugin to a personal public GitHub repo (you can keep
   commits sparse — only the release matters).
2. Make a release with your `raic-plugin.zip`.
3. In RAIC Overlay, open Settings → Plugins, paste your repo URL,
   accept consent.

### Iterating

Every change requires a new release tag. The Settings UI's Refresh
button on your row checks for upstream updates and lets you re-install.
For faster local iteration, run the host in debug mode and use F12
inside your plugin's window to live-edit DOM/CSS via devtools.

### Devtools

Debug builds of RAIC Overlay allow F12 to open the WebView2 devtools
inside any plugin window. You get:

- Console (your `console.log` lands here; the host also forwards it
  to its unified log in some configurations)
- Network tab (see the `plugin_rpc` invokes as IPC calls)
- DOM inspector
- React/Vue/etc devtools extensions (if you install them in your
  WebView2 user data dir)

Release builds disable devtools.

---

## 17. Updating your plugin

The host polls each installed plugin's GitHub release once at app
startup (+10s delay) and once every 24 hours. When a newer version is
found:

- The plugin's row in Settings shows an amber "v1.5.0" badge
- The "Plugins" menu trigger in the overlay shows a count badge
- The user clicks Refresh on the row → consent dialog → confirm

**State survives the upgrade.** Your state directory lives outside the
versioned install dir; v1.5.0 installs alongside v1.4.2 in a new
versioned folder, the registry's `installed_version` flips, and the
state file is unchanged.

### Breaking changes

If you change your state shape in a breaking way:

- Bump your major version (`1.x.x` → `2.0.0`)
- In your `main.js`, detect the old shape on `state.get` and migrate
  it before saving the new shape
- Document the migration in your release notes so users know what to
  expect

---

## 18. Debugging

### "My plugin window opens but `window.raic` is undefined"

Three common causes:

1. You're running your plugin outside of RAIC Overlay (e.g. opening
   `index.html` directly in a browser). `window.raic` only exists
   inside a host-spawned plugin window. Add a guard:

   ```js
   if (!window.raic) {
     console.warn('Running outside RAIC Overlay — using mock');
     // mock implementation for browser dev
   }
   ```

2. You're loading scripts from a CDN with `defer`/`async` and the host
   bootstrap hasn't run by the time your script executes. The host's
   bootstrap is injected via `initialization_script` which is
   guaranteed to run before ANY `<script>` in your HTML, so this
   shouldn't happen — but if you have weird module loading, double-
   check.

3. You renamed `window.raic` to something else in your code. Don't.

### "PermissionDenied"

- Check that `manifest.permissions` includes the required permission
  name (`hotkeys`, `notifications`, `sidecar`)
- Make sure you didn't typo the permission name
- Re-install after editing the manifest (permission grants are taken
  at install time)

### "Sidecar didn't start" / "SidecarUnavailable"

- Check that `bin/<platform>/<binary>` actually exists in your release
  zip
- Verify the binary runs standalone (try executing it directly — it
  should wait for stdin)
- Check the host's log for `[plugin=<id>] sidecar stderr:` lines —
  your sidecar likely panicked during init
- Make sure your sidecar responds to `raic.init` within 5s; longer
  init kills the spawn

### "Conflict" registering a hotkey

- Someone else already owns it. Choose a different combo or make it
  user-configurable.

### "release archive does not contain raic-plugin.json at the root"

- You zipped a wrapping folder. Re-zip with the manifest at the
  archive root (see [§14](#14-building-the-release-zip)).

### Where to find logs

- **Host log**: `%APPDATA%\com.raic.overlay\logs\` (recent files
  rotate)
- **Plugin's own state dir**: `%APPDATA%\com.raic.overlay\plugins\<your-id>\state\`
- **Plugin's install dir**: `%APPDATA%\com.raic.overlay\plugins\<your-id>\<version>\`

---

## 19. Best practices

### Accessibility (FR-029 carve-out)

The host enforces WCAG 2.1 AA on its OWN UI surfaces (consent dialog,
Plugins menu, etc). Inside YOUR plugin window, the host doesn't
enforce anything — accessibility is your responsibility. At minimum:

- Provide accessible names on every interactive element (`<label>`,
  `aria-label`)
- Make everything operable with the keyboard
- Don't trap focus
- Use `:focus-visible` styles
- Hit 4.5:1 contrast for text against background

The Hello World example
([`examples/hello-world-plugin/`](../../examples/hello-world-plugin/))
follows these basics — copy its CSS as a starting point.

### Performance

- Debounce expensive operations (state writes, resize requests)
- Don't run animations or polling loops when your window doesn't have
  focus (use `window.onFocusChange`)
- Don't ship megabytes of CSS / JS — overlays are loaded on top of
  games and every MB matters

### Error handling

Every RPC promise can reject. Wrap calls in try/catch or `.catch()`,
especially:

- `hotkey.register` (may reject with `Conflict`)
- `sidecar.call` (may reject with `SidecarTimeout` or
  `SidecarUnavailable`)
- Permission-gated methods (may reject with `PermissionDenied` if you
  forgot the permission)
- `window.openSecondary` (may reject with `Conflict` for duplicate ids)

### Versioning

- Treat your release tags as the source of truth (you can NOT
  re-publish a release with a changed asset)
- Use pre-release tags (`1.5.0-beta.1`) for testing — they're valid
  semver and the host treats them as ordered correctly

### Don't over-request permissions

The consent dialog shows everything. Users get suspicious of plugins
that ask for more than they obviously need. If you don't use
`hotkeys`, don't declare it.

---

## 20. Security model

### What the host protects against

- **Path traversal** in your zip (`../escape.txt` entries are rejected
  at install time)
- **Tauri capability escalation** — plugin webviews can only invoke
  `plugin_rpc`, no direct filesystem / shell / network access through
  the host
- **Permission escalation** — methods that need a permission strictly
  enforce it server-side
- **Subscription leaks** — every subscription you create is dropped
  when your window closes
- **Process leaks** — your sidecar is killed when your window closes
- **State leaks** — your state file lives in its own directory; no
  other plugin can read it

### What the host does NOT protect against

- **Your code itself.** If your plugin's JS or sidecar does something
  malicious, the host can't stop it. The user accepted the risk when
  they installed your plugin.
- **Network access from your sidecar.** Your sidecar is a full child
  process; it can open sockets, read environment variables, etc. Be
  transparent in your README.
- **Network access from your UI.** Your plugin's webview can `fetch()`
  arbitrary URLs the user might not expect. CORS applies per the
  custom protocol's `Access-Control-Allow-Origin: *` (set by the host
  for asset loading) but no other firewalling happens.
- **Signature verification.** The host downloads the zip you tagged
  and trusts the GitHub release URL. There's no signature check, no
  attestation, no reproducible-build verification. Your reputation is
  your signature.

### Your responsibilities as a plugin author

- Keep your source public on GitHub
- Be specific in your README about what your plugin does and what data
  it touches
- Don't ship secrets (API keys, tokens) in your zip — they're publicly
  readable
- If your sidecar makes network calls or modifies files outside the
  plugin's state dir, document it prominently
- If you're sensitive to integrity (e.g. for paid or business-critical
  plugins): set up a reproducible CI build via GitHub Actions, use
  artifact attestations, and tell your users to verify

---

## 21. Versioning & forward compatibility

### Protocol version (`protocol_version`)

Currently always `1`. The host treats v1 method names, parameter
shapes, return shapes, and error codes as a **stable public contract**.
Breaking changes require a new `protocol_version` value and the host
will run multiple protocol versions side-by-side during a deprecation
window.

Additive changes (new methods, new optional parameters, new optional
fields in event payloads) may land in v1 minor releases — write your
plugin defensively (don't assume the absence of a field is meaningful).

### Manifest version (`manifest_version`)

Currently always `1`. Bumped on breaking changes to the manifest
shape itself. Older hosts reject newer `manifest_version` values; this
is intentional (the user must update the host first).

### Unknown permissions

If you declare a permission this host doesn't know about, install
proceeds with the unknown permission preserved in the registry but no
methods unlocked. Future hosts that do know about it will honor the
grant without requiring re-install.

---

## 22. Reference index

- **Contracts (authoritative)**:
  - [`manifest.schema.json`](manifest.schema.json) — manifest shape
  - [`jsonrpc-v1.md`](jsonrpc-v1.md) — every method, every error code
  - [`window-raic.d.ts`](window-raic.d.ts) — TypeScript ambient types
  - [`sidecar-protocol.md`](sidecar-protocol.md) — stdio framing + handshake
- **Walkthroughs**:
  - [`quickstart.md`](quickstart.md) — 3-minute Hello World
  - This file — full developer guide
- **Examples**:
  - [`examples/hello-world-plugin/`](../../examples/hello-world-plugin/) — reference plugin
  - [`examples/sidecars/{rust,python,node}/`](../../examples/sidecars/) — minimal sidecars in 3 languages
- **Host source** (if you want to understand how it works):
  - `src-tauri/src/plugins/` — Rust backend
  - `src/components/PluginsMenu.tsx`, `src/components/settings/PluginsSection.tsx` — frontend

### Common error codes (from `jsonrpc-v1.md`)

| Code | Constant | Cause |
|------|----------|-------|
| -32601 | `MethodNotFound` | Method name not in v1 catalog |
| -32602 | `InvalidParams` | Params failed schema validation |
| -32000 | `PermissionDenied` | Manifest did not declare the required permission |
| -32001 | `SidecarUnavailable` | Sidecar crashed or not running |
| -32002 | `SidecarTimeout` | Sidecar call exceeded its timeout |
| -32003 | `Conflict` | Hotkey collision, duplicate window id, etc |
| -32603 | `InternalError` | Host bug — please file an issue |

---

Found a gap, an error, or something unclear in this guide? Open an issue
or PR against
[RAIC-Overlay](https://github.com/RAIC-Organization/RAIC-Overlay).
