# Implementation Plan: Settings Panel Window

**Branch**: `038-settings-panel` | **Date**: 2025-12-29 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/038-settings-panel/spec.md`

## Summary

Create a standalone Settings panel as a separate Tauri window accessible from the system tray menu. The window will be movable, visible in the Windows taskbar, and styled to match the existing ErrorModal liquid glass theme. Users can configure custom hotkey bindings (default: F3 for toggle visibility, F5 for toggle mode) and enable/disable Windows startup auto-launch. Settings persist to `user-settings.json` in the app data directory.

**Technical Approach**:
- Use `WebviewWindowBuilder` for dynamic window creation on demand
- Implement custom titlebar with `data-tauri-drag-region` for dragging
- Use `tauri-plugin-autostart` for Windows Registry integration
- Modify `keyboard_hook.rs` to support configurable hotkey bindings
- Store user preferences in separate `user-settings.json` file

## Technical Context

**Language/Version**: TypeScript 5.7.2 (React 19.0.0 frontend), Rust 2021 Edition (Tauri backend)
**Primary Dependencies**: Tauri 2.x, React 19.0.0, Next.js 16.x, motion 12.x, shadcn/ui, Tailwind CSS 4.x, tauri-plugin-autostart 2.x, @tauri-apps/plugin-autostart
**Storage**: JSON files in Tauri app data directory (`user-settings.json`)
**Testing**: cargo test (Rust), manual integration testing
**Target Platform**: Windows 11 (64-bit)
**Project Type**: Tauri desktop application (Rust backend + React frontend)
**Performance Goals**: Settings panel opens in < 1 second, hotkey changes apply immediately
**Constraints**: Window must appear in taskbar, X button hides (not closes) window
**Scale/Scope**: Single-user desktop application

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Status | Notes |
|-----------|--------|-------|
| I. Code Quality | PASS | Following existing patterns (tray.rs, persistence.rs, ErrorModal.tsx) |
| II. Testing Standards | PASS | Manual integration testing per quickstart.md checklist; automated tests not explicitly requested |
| III. User Experience Consistency | PASS | Reusing liquid glass style from ErrorModal, consistent SC theme |
| IV. Performance Requirements | PASS | Window opens < 1s, hotkeys apply immediately |
| V. Research-First Development | PASS | Research completed in research.md with Context7 documentation |

**All gates passed - proceeding with implementation.**

## Project Structure

### Documentation (this feature)

```text
specs/038-settings-panel/
├── plan.md              # This file
├── research.md          # Phase 0 output - Tauri window/autostart research
├── data-model.md        # Phase 1 output - UserSettings, HotkeyBinding types
├── quickstart.md        # Phase 1 output - Implementation guide
├── contracts/           # Phase 1 output - Tauri command contracts
│   └── README.md
└── tasks.md             # Phase 2 output (created by /speckit.tasks)
```

### Source Code (repository root)

```text
src-tauri/
├── src/
│   ├── lib.rs                    # MODIFY: Register new commands, init autostart plugin
│   ├── tray.rs                   # MODIFY: Add "Settings" menu item
│   ├── keyboard_hook.rs          # MODIFY: Support configurable hotkeys
│   ├── user_settings.rs          # NEW: User settings persistence module
│   ├── user_settings_types.rs    # NEW: UserSettings, HotkeyBinding structs
│   └── settings_window.rs        # NEW: Settings window creation/management
├── Cargo.toml                    # MODIFY: Add tauri-plugin-autostart
└── capabilities/
    └── default.json              # MODIFY: Add autostart + window permissions

src/
├── components/
│   └── settings/
│       ├── SettingsPanel.tsx     # NEW: Main settings UI component
│       ├── HotkeyInput.tsx       # NEW: Hotkey capture input component
│       └── AutoStartToggle.tsx   # NEW: Auto-start toggle component
├── types/
│   └── user-settings.ts          # NEW: TypeScript interfaces
└── utils/
    ├── hotkey-validation.ts      # NEW: Hotkey validation utilities
    └── vk-codes.ts               # NEW: Virtual key code mapping

app/
└── settings/
    └── page.tsx                  # NEW: Settings page route

package.json                      # MODIFY: Add @tauri-apps/plugin-autostart
```

**Structure Decision**: Following existing Tauri + Next.js hybrid structure. New components follow established patterns (components/, contexts/, types/). Rust modules follow existing naming conventions.

## Complexity Tracking

> No constitution violations - standard feature implementation within existing architecture.

| Aspect | Complexity | Justification |
|--------|------------|---------------|
| New Tauri window | Low | Using documented WebviewWindowBuilder API |
| Hotkey configuration | Medium | Requires modifying keyboard_hook.rs |
| Auto-start integration | Low | Using official tauri-plugin-autostart |
| UI styling | Low | Reusing existing ErrorModal patterns |

## Implementation Phases

### Phase 1: Backend Foundation
1. Add dependencies (tauri-plugin-autostart, @tauri-apps/plugin-autostart)
2. Create user_settings_types.rs with data structures
3. Create user_settings.rs with load/save commands
4. Create settings_window.rs with window creation
5. Update lib.rs to register commands and init plugin
6. Add permissions to capabilities/default.json

### Phase 2: Tray Integration
1. Modify tray.rs to add "Settings" menu item
2. Handle menu event to open/focus settings window
3. Test tray menu integration

### Phase 3: Frontend UI
1. Create settings page route (app/settings/page.tsx)
2. Create SettingsPanel component with liquid glass styling
3. Create HotkeyInput component for key capture
4. Create AutoStartToggle component
5. Add validation utilities

### Phase 4: Hotkey Configuration
1. Modify keyboard_hook.rs to use configurable bindings
2. Add update_hotkeys command for runtime changes
3. Load user settings on app startup
4. Apply hotkey changes immediately

### Phase 5: Testing & Polish
1. Test all user stories from spec
2. Handle edge cases (corrupted file, invalid keys)
3. Add loading states and error handling
4. Verify taskbar presence and window behavior

## Key Design Decisions

1. **Separate user-settings.json file**: Keeps user preferences isolated from window state (state.json), allowing independent versioning and migration.

2. **Hide vs Close on X button**: Using `window.hide()` preserves window instance for quick reopening, matching user expectation that X doesn't close the app.

3. **WebviewWindowBuilder for dynamic creation**: Window created on-demand rather than pre-defined in tauri.conf.json, saving resources when settings isn't accessed.

4. **tauri-plugin-autostart over manual Registry**: Official plugin handles cross-platform concerns and Registry key management cleanly.

5. **Configurable keyboard hook**: Modifying existing hook rather than creating new one maintains single source of truth for hotkey handling.

## Dependencies

### New Rust Dependencies
- `tauri-plugin-autostart = "2"` (cfg(desktop))

### New JavaScript Dependencies
- `@tauri-apps/plugin-autostart`

### New Permissions
- `autostart:allow-enable`
- `autostart:allow-disable`
- `autostart:allow-is-enabled`
- `core:window:allow-hide`
- `core:window:allow-show`
- `core:window:allow-set-focus`
- `core:window:allow-start-dragging`

## Risk Mitigation

| Risk | Mitigation |
|------|------------|
| Keyboard hook restart delay | Keep restart atomic, validate under 100ms |
| Auto-start Registry write fails | Catch errors, show user-friendly message |
| Settings file corruption | Fall back to defaults, recreate file on save |
| Hotkey conflicts with system | Document known conflicts, reject reserved combinations |

## Generated Artifacts

- [research.md](./research.md) - Research findings for Tauri windows and autostart
- [data-model.md](./data-model.md) - UserSettings, HotkeyBinding type definitions
- [contracts/README.md](./contracts/README.md) - Tauri command API contracts
- [quickstart.md](./quickstart.md) - Step-by-step implementation guide

## Next Steps

Run `/speckit.tasks` to generate the task breakdown for implementation.
