# Reference sidecars

Three minimal sidecars implementing `docs/plugins/sidecar-protocol.md` in
three languages. They all expose the same surface (`raic.init`, `ping`,
`raic.shutdown`) so you can swap them in a plugin manifest 1-for-1.

| Directory | Build / run |
|-----------|-------------|
| `rust/`   | `cargo build --release` → `target/release/sidecar-rust.exe` |
| `python/` | Run directly: `python sidecar.py` (or pyinstaller for a single exe) |
| `node/`   | Run directly: `node sidecar.mjs` (or `bun build --compile`) |

Each one prints any received line back as part of an echo for debugging,
plus implements:

- `raic.init` — responds with `{ name, version, methods: ["ping", "echo"] }`
- `ping` — returns `{ reply: "pong", receivedAt: <RFC3339> }`
- `echo` — returns whatever was sent in `params`
- `raic.shutdown` — exits the process cleanly within 5 seconds

To wire one of these into a plugin, copy the built binary into
`bin/windows-x86_64/sidecar.exe` (or the equivalent platform dir) of your
plugin's release zip and declare it in `raic-plugin.json`:

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
