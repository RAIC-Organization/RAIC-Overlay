# Hello World — RAIC Overlay plugin reference

A minimal third-party plugin example for RAIC Overlay. It demonstrates:

- The required manifest (`raic-plugin.json`)
- An HTML/JS/CSS UI bundle that talks to the host through `window.raic`
- Persistent state via `state.get` / `state.set` (survives restarts)
- Visual integration with the SC HUD theme through CSS tokens
- WCAG 2.1 AA basics (labels, visible focus, keyboard-operable form)

See [`docs/plugins/quickstart.md`](../../docs/plugins/quickstart.md) for the full
plugin-author walkthrough. This directory is also used as an integration-test
fixture by `src-tauri/tests/plugin_install_test.rs`.

## Building the release zip

```bash
# From inside this directory (so the zip's top-level entries are the manifest
# and the ui/ folder — NOT a wrapping hello-world-plugin/ folder):
zip -r ../hello-world-plugin.zip raic-plugin.json ui/ README.md
```

Upload the resulting `hello-world-plugin.zip` as `raic-plugin.zip` to a GitHub
Release.
