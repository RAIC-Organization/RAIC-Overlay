# Accessibility Audit Checklist (T119)

**Feature**: 060-plugin-system
**Standard**: WCAG 2.1 AA (Constitution principle III + spec FR-029)

Use this checklist when running the cross-cutting WCAG audit before
declaring v1 ready. Apply both an automated tool (axe DevTools or
equivalent in browser devtools) and a manual keyboard + screen-reader
pass (NVDA on Windows recommended for the primary platform).

## Surfaces covered

This feature adds 4 new host-built UI surfaces. Plugin-authored UI
inside plugin windows is the plugin author's responsibility (per FR-029
carve-out).

1. **Settings → Plugins section** (`src/components/settings/PluginsSection.tsx`)
2. **Plugin install/update consent dialog** (`PluginInstallDialog.tsx`)
3. **Plugin row in Settings list** (`PluginRow.tsx`)
4. **Conditional "Plugins" entry + dropdown** in main overlay menu (`PluginsMenu.tsx`)
5. **Plugin notification toast surface** (`PluginNotifications.tsx`)

## Keyboard operation

- [ ] **Settings tab**: Tab reaches the install URL input, Install
  button, every plugin row's controls (enable toggle, Open, Refresh,
  Uninstall), and exits the section cleanly
- [ ] **Install dialog**: Opens with focus on the safer (Cancel) button
  per WCAG 2.4.3 focus order best practice; Tab cycles within the
  dialog and does not escape; Escape closes (= Cancel)
- [ ] **Uninstall confirm mini-dialog**: Has `role="alertdialog"`; focus
  doesn't escape to the rest of Settings while open; Cancel/Remove are
  both keyboard-operable
- [ ] **Plugins menu dropdown trigger**: Enter/Space + ArrowDown open
  the menu and focus the first item
- [ ] **Plugins menu items**: Arrow Up/Down move focus and wrap;
  Home/End jump to first/last; Tab closes the menu and moves focus on;
  Escape closes and returns focus to the trigger
- [ ] **Notification toasts**: Dismiss button is reachable via Tab;
  Escape on a focused toast doesn't dismiss other toasts

## Focus management

- [ ] **Install dialog** returns focus to the originating Install button
  on close (we pass `returnFocusTo` in `PluginsSection`)
- [ ] **Visible focus indicator** on every interactive element under the
  SC HUD theme (we use `focus-visible:ring-2 focus-visible:ring-primary
  focus-visible:ring-offset-1` consistently)
- [ ] No element has `outline: 0` without an explicit replacement
  indicator

## ARIA / semantics

- [ ] **PluginsSection** wraps with `<section aria-labelledby>`; the
  input has `aria-describedby` for errors + `aria-invalid` when present
- [ ] **PluginInstallDialog** uses native `<dialog>` element with
  `role="dialog"`, `aria-modal="true"`, `aria-labelledby`,
  `aria-describedby`; status row is `role="status"` `aria-live="polite"`
- [ ] **PluginRow** enable toggle uses `role="switch"` + `aria-checked`;
  every button's `aria-label` includes the plugin name for unambiguous
  screen-reader announcement
- [ ] **PluginsMenu** trigger uses `aria-haspopup="menu"`,
  `aria-expanded`, `aria-controls`; the dropdown is `role="menu"` with
  `role="menuitem"` items; `aria-label` on the trigger conveys the
  available-updates count for non-visual users
- [ ] **PluginNotifications** toasts are `role="status"`
  `aria-live="polite"`; the wrapper has `aria-label="Plugin notifications"`

## Color contrast

- [ ] All visible text in the new surfaces meets 4.5:1 against its
  background under the SC HUD theme (use axe contrast checker)
- [ ] The "update available" amber badge meets 3:1 (large-text /
  UI-component threshold)
- [ ] The "Off" disabled state on a toggled-off plugin row is still
  legible (not pure muted-on-muted)

## Announcement / live regions

- [ ] Install progress + errors in the dialog are announced via
  `aria-live="polite"` (do NOT use `assertive` — these are not
  emergencies)
- [ ] Plugin notifications fire `aria-live="polite"` on appearance; the
  user is not interrupted mid-task
- [ ] Permission-denied errors from the backend are surfaced to the user
  in some accessible way (currently via log line — adequate for v1; if
  we surface to UI in future, must announce)

## Pass criteria

This checklist passes when:

- Every item above is checked (automated + manual)
- axe DevTools reports zero "Critical" or "Serious" violations on the
  new surfaces in both light and SC HUD theme modes
- A keyboard-only walkthrough of every smoke-checklist scenario in
  `smoke.md` succeeds without resorting to the mouse
- An NVDA pass through the same scenarios surfaces the right
  announcements at the right times (consent permission list audible;
  hotkey/notification confirmations audible)

Any failures here must be resolved before tagging the v1 release.
