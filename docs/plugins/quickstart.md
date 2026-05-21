# Plugin Quickstart

**Feature**: 060-plugin-system

This walkthrough takes a plugin author from "empty folder" to "user can install my plugin from GitHub" in under an hour. It also documents the install flow from the end user's perspective.

---

## Part 1 — For plugin authors

### 1. Project layout

Create a public GitHub repository with this layout:

```text
my-raic-plugin/
├── raic-plugin.json     # the manifest (required)
├── ui/
│   ├── index.html       # the primary window's HTML
│   ├── main.js          # your script (loaded by index.html)
│   └── style.css        # your styles
└── README.md            # for humans on the GitHub page
```

If you want a native sidecar, also add:

```text
└── bin/
    └── windows-x86_64/
        └── sidecar.exe   # your compiled binary (any language)
```

### 2. Write the manifest

`raic-plugin.json`:

```json
{
  "$schema": "https://raic-overlay.app/schemas/plugin-manifest/v1.json",
  "manifest_version": 1,
  "id": "com.alice.hello-overlay",
  "name": "Hello Overlay",
  "version": "0.1.0",
  "author": "Alice",
  "description": "A minimal example plugin that says hi.",
  "source_repo_url": "https://github.com/alice/hello-overlay",
  "min_host_version": "1.1.0",
  "protocol_version": 1,
  "entry": {
    "ui": "ui/index.html",
    "default_width": 320,
    "default_height": 200
  },
  "permissions": []
}
```

Field reference: see `contracts/manifest.schema.json` for the authoritative schema, including every constraint and every allowed `permissions` value.

### 3. Write the UI

`ui/index.html`:
```html
<!doctype html>
<html>
  <head><link rel="stylesheet" href="style.css" /></head>
  <body>
    <h1 id="greeting">Loading…</h1>
    <button id="save-btn">Save my name</button>
    <input id="name-input" placeholder="Your name" />
    <script src="main.js"></script>
  </body>
</html>
```

`ui/style.css` — use the injected SC HUD theme tokens to match the host look:
```css
body {
  background: var(--raic-bg-glass);
  color: var(--raic-fg);
  font-family: var(--raic-font-body);
  padding: calc(var(--raic-spacing-unit) * 4);
}
h1 { font-family: var(--raic-font-display); color: var(--raic-accent); }
button {
  background: var(--raic-accent);
  color: var(--raic-bg);
  border: 1px solid var(--raic-border);
  border-radius: var(--raic-radius);
  padding: var(--raic-spacing-unit) calc(var(--raic-spacing-unit) * 2);
}
```

`ui/main.js` — talk to the host via the auto-injected `window.raic`:
```js
async function init() {
  await window.raic.rpc("window.setTitle", { title: "Hello Overlay" });

  const stored = await window.raic.rpc("state.get", { key: "name" });
  const name = stored.value ?? "stranger";
  document.getElementById("greeting").textContent = `Hi, ${name}!`;

  document.getElementById("save-btn").addEventListener("click", async () => {
    const name = document.getElementById("name-input").value.trim();
    if (!name) return;
    await window.raic.rpc("state.set", { key: "name", value: name });
    document.getElementById("greeting").textContent = `Hi, ${name}!`;
  });
}

init().catch((err) => console.error(err));
```

That's it. No `npm install`, no bundler, no framework required. Use whatever JS framework you want if you prefer — the contract is `window.raic`, not a particular UI library.

### 4. Publish a release

1. Commit and push your repo to GitHub.
2. Create a folder structure on your machine that matches the layout above, then zip it. The zip's top-level entries MUST be the manifest, `ui/`, and (optionally) `bin/` — no extra wrapping directory.
   - Windows: select all files inside the folder → right-click → "Compress to ZIP file" → rename to `raic-plugin.zip`.
   - macOS/Linux: `zip -r raic-plugin.zip raic-plugin.json ui/ bin/`
3. Create a new GitHub release tagged with your version (e.g. `v0.1.0` — the leading `v` is fine, the host accepts both).
4. Attach `raic-plugin.zip` to the release.

Your plugin is now installable.

### 5. Share with users

Give your users the GitHub URL: `https://github.com/alice/hello-overlay`. That's all they need.

---

## Part 2 — Adding a sidecar (optional)

If you need to do something the webview can't — talk to a hardware device, run a long calculation, watch the filesystem — write a sidecar.

A sidecar is any executable that speaks JSON-RPC 2.0 on its stdin/stdout. See `contracts/sidecar-protocol.md` for the full protocol (it's short).

Minimum changes:

1. Add a sidecar declaration to the manifest:
   ```json
   "permissions": ["sidecar"],
   "sidecar": {
     "platforms": {
       "windows-x86_64": { "bin": "bin/windows-x86_64/sidecar.exe" }
     }
   }
   ```
2. Build your binary and put it at `bin/windows-x86_64/sidecar.exe` inside the zip.
3. Call it from your UI:
   ```js
   const { result } = await window.raic.rpc("sidecar.call", {
     method: "ping",
     params: {}
   });
   ```

A reference sidecar in Python (under 20 lines) lives in `contracts/sidecar-protocol.md`. Equivalent versions in Rust, Go, and Node.js are all just as short.

---

## Part 3 — For end users

To install a plugin:

1. Open RAIC Overlay.
2. Open the **Settings** panel and switch to the **Plugins** tab.
3. Paste the plugin's GitHub URL (e.g. `https://github.com/alice/hello-overlay`) into the "Install plugin from URL" field.
4. Click **Install**.
5. Review the consent screen carefully. It shows:
   - The plugin's name, version, author, and description.
   - The source GitHub URL (click to verify it's the repo you expected).
   - Every permission the plugin is requesting.
   - The list of native binaries (sidecars) it ships, if any.
6. Click **Install** to confirm, or **Cancel** to back out without writing anything to disk.
7. Once installed, a **Plugins** button appears in your overlay's main menu. Click it to see the dropdown of your installed plugins, then click a plugin to open it.

To uninstall, disable, or update a plugin, return to **Settings → Plugins**, find it in the list, and use the controls there. Updates appear with a badge when available; clicking it shows the new version's release notes and re-runs the consent flow.

---

## Part 4 — Trust model

**RAIC Overlay does not verify the safety of plugins.** The consent screen tells you exactly what a plugin can do; the GitHub URL lets you read the source. Treat installing a plugin like installing a desktop application from a stranger — trust comes from inspecting the source and the author's reputation, not from the host.

If you don't recognise the author or can't read the source, don't install it. There is no second line of defence.
