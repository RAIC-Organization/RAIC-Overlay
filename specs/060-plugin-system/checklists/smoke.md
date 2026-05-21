# Plugin System — Manual Smoke Checklist (T106)

**Feature**: 060-plugin-system
**Run before**: tagging a release that includes the plugin system

Use this checklist when verifying the end-to-end plugin flow against a
real GitHub repository. The Rust + frontend unit/integration tests cover
the component-level behaviour; this checklist covers the AppHandle-tier
flow that's harder to fake in tests.

Set-up: publish `examples/hello-world-plugin/` to a public GitHub repo of
yours, create a release tagged `v0.1.0`, and attach the bundled folder
as `raic-plugin.zip`.

## US1 — Install (P1 MVP)

- [ ] Settings → Plugins shows "No plugins installed yet" message
- [ ] Pasting the GitHub URL + clicking Install opens the consent dialog
  within ~10 seconds (download + extract + validate)
- [ ] Consent dialog shows: name, version, author, description, clickable
  source URL, "Permissions requested: None" line
- [ ] Tab key cycles through the consent dialog's interactive elements in
  a logical order; Escape cancels
- [ ] Confirm installs; the dialog closes; the row appears in the list
- [ ] The "Plugins" entry appears in the overlay's main menu (it should
  have been absent before install)
- [ ] Clicking the plugin in the dropdown opens the host-chrome window;
  the plugin's HTML renders inside

## US2 — Developer DX (P1)

- [ ] Plugin's CSS using `var(--raic-bg)` etc resolves to SC HUD colors
  (visually consistent with built-in windows)
- [ ] Typing a name + Save persists; closing + re-opening the window
  shows "Hi, <name>!" again
- [ ] Plugin can call `window.setTitle({ title: 'X' })` and the host's
  chrome reflects it
- [ ] Devtools (debug build) shows `window.raic` defined before plugin
  scripts run

## US3 — Sidecar (P2)

(Skip unless you've published a plugin with a sidecar — see
`examples/sidecars/` for ready-made implementations.)

- [ ] Open the plugin window; `sidecar.status` returns `running: true`
  with a pid
- [ ] `sidecar.call('ping')` returns `{ reply: 'pong' }` within 30 s
- [ ] Closing the primary window terminates the sidecar process within
  5 seconds (verify with Task Manager)

## US4 — Management (P2)

- [ ] Disabling a plugin closes its primary window and removes it from
  the Plugins menu
- [ ] Re-enabling brings it back; clicking opens the window
- [ ] Uninstall confirm dialog appears; Remove deletes
  `%APPDATA%\com.raic.overlay\plugins\<id>\` entirely and registry.json
  no longer lists the id
- [ ] Bumping the plugin's GitHub release to `v0.2.0` and clicking the
  row's Refresh button shows the update consent dialog with the new
  version; confirming installs it
- [ ] Storage size displays for plugins that have persisted state

## US5 — Capabilities (P3)

- [ ] Plugin with `hotkeys` declared registers Ctrl+Shift+P; pressing
  the combo fires the plugin's `hotkey.onTrigger` listener
- [ ] Plugin without `hotkeys` calling `hotkey.register` gets
  `PermissionDenied`; log line shows `[plugin=<id>] permission denied:
  required=hotkeys`
- [ ] Plugin with `notifications` calling `notification.show` shows a
  toast in the top-right that auto-dismisses

## Accessibility (FR-029 / D1)

(Cross-referenced from `checklists/accessibility.md`.)

- [ ] Settings → Plugins tab is fully keyboard-operable (no mouse)
- [ ] Plugins menu dropdown opens with Enter/Space and Arrow keys
  navigate
- [ ] Screen-reader (NVDA / VoiceOver) announces consent dialog title,
  permission list, and notification toasts

## Error handling

- [ ] Invalid GitHub URL → clear error in the Settings install field
- [ ] Private/404 repository → clear error mentioning "repository not
  found or has no published releases"
- [ ] Release without `raic-plugin.zip` asset → clear error mentioning
  the missing asset
- [ ] Manifest with `protocol_version: 2` → install rejects with
  "protocol version not supported"
- [ ] Two plugins requesting the same hotkey → second registration
  rejects with `Conflict`

## Performance budgets

- [ ] Install end-to-end for a < 1 MB plugin under 60 seconds on
  broadband (SC-001)
- [ ] Plugin window cold-start under 500 ms p95 (subjective; load
  several plugins back-to-back)
- [ ] `state.get` / `window.setTitle` round-trip feels instantaneous
  (R-012: < 10 ms target)
