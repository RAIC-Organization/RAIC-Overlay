# RAICOverlay Development Guidelines

Auto-generated from all feature plans. Last updated: 2025-12-22

## Active Technologies
- TypeScript 5.7 (React 19.2 frontend), Rust 1.92 (Tauri backend - unchanged) + shadcn/ui, Tailwind CSS 4.x, @tailwindcss/vite, clsx, tailwind-merge (002-shadcn-dark-theme)
- N/A (UI theming only) (002-shadcn-dark-theme)
- Rust 1.92 (Tauri backend), TypeScript 5.7 (React 19.2 frontend) + Tauri 2.x, React 19.2, tailwindcss 4.x, shadcn/ui (003-f3-fullscreen-overlay)
- N/A (in-memory state only) (003-f3-fullscreen-overlay)
- Rust 2021 Edition (backend), TypeScript 5.7.2 (frontend) + Tauri 2.x, React 19.0.0, tauri-plugin-global-shortcut 2.x, Windows API (windows-rs crate) (004-external-window-attach)
- TypeScript 5.7.2, Rust 2021 Edition (backend unchanged) + Next.js 15.x (static export), React 19.x, motion (motion.dev), shadcn/ui, Tailwind CSS 4.x, Tauri 2.x (005-nextjs-motion-refactor)
- TypeScript 5.7.2, React 19.0.0 + Next.js 16.x, motion (12.x), shadcn/ui, Tailwind CSS 4.x, Tauri 2.x (006-main-menu-component)
- N/A (UI component only, uses existing overlay state) (006-main-menu-component)
- TypeScript 5.7.2 (React 19.0.0 frontend), Rust 1.92 (Tauri backend - unchanged) + React 19.0.0, Next.js 16.x, motion (12.x), shadcn/ui, Tailwind CSS 4.x, Tauri 2.x (007-windows-system)
- N/A (in-memory state only for Phase 1) (007-windows-system)
- TypeScript 5.7.2, React 19.0.0, Next.js 16.x + @tiptap/react, @tiptap/pm, @tiptap/starter-kit, @tiptap/extension-text-align (new); motion 12.x, shadcn/ui, Tailwind CSS 4.x (existing) (008-tiptap-notes-component)
- N/A (ephemeral in-memory state only, no persistence) (008-tiptap-notes-component)
- TypeScript 5.7.2, React 19.0.0, Next.js 16.x + @excalidraw/excalidraw 0.18.0 (new); motion 12.x, shadcn/ui, Tailwind CSS 4.x (existing) (009-excalidraw-draw-component)
- N/A (ephemeral in-memory state only, no persistence) (009-excalidraw-draw-component)
- TypeScript 5.7.2 (React 19.0.0 frontend), Rust 2021 Edition (Tauri backend) + React 19.0.0, Next.js 16.x, Tauri 2.x, @tauri-apps/api 2.0.0, serde/serde_json (Rust), TipTap 3.13.0, Excalidraw 0.18.0 (010-state-persistence-system)
- JSON files in Tauri app data directory (`state.json` + `window-{id}.json`) (010-state-persistence-system)
- TypeScript 5.7.2 (React 19.0.0 frontend), Rust 2021 Edition (Tauri backend - unchanged) + React 19.0.0, Next.js 16.x, motion 12.x, Tailwind CSS 4.x, shadcn/ui (011-app-icon-branding)
- N/A (static asset only) (011-app-icon-branding)
- TypeScript 5.7.2 (frontend), Rust 2021 Edition (Tauri backend) + Tauri CLI 2.x (`@tauri-apps/cli`), Next.js 16.x, React 19.0.0 (012-tauri-app-icon)
- N/A (static asset generation only) (012-tauri-app-icon)
- TypeScript 5.7.2 (frontend), Rust 2021 Edition (Tauri backend) + React 19.0.0, Next.js 16.x, motion 12.x, shadcn/ui, Tailwind CSS 4.x, Tauri 2.x (013-window-opacity-control)
- JSON files in Tauri app data directory (extends state.json for window structure) (013-window-opacity-control)
- TypeScript 5.7.2 (frontend), Rust 2021 Edition (Tauri backend - unchanged) + React 19.0.0, Next.js 16.x, motion 12.x, shadcn/ui, Tailwind CSS 4.x, Tauri 2.x, lucide-react (icons) (014-browser-component)
- JSON files in Tauri app data directory (extends existing `state.json` + `window-{id}.json` pattern) (015-browser-persistence)
- TypeScript 5.7.2 (frontend), Rust 2021 Edition (Tauri backend - unchanged) + React 19.0.0, Next.js 16.x, pdfjs-dist (PDF.js), react-markdown, motion 12.x, shadcn/ui, Tailwind CSS 4.x, Tauri 2.x, lucide-react (016-file-viewer-window)
- TypeScript 5.7.2, React 19.0.0 + react-zoom-pan-pinch (new), @tauri-apps/plugin-fs (existing), lucide-react (existing) (017-image-viewer-zoom)
- JSON files in Tauri app data directory (existing persistence system) (017-image-viewer-zoom)
- Rust 2021 Edition (backend), TypeScript 5.7.2 (frontend) + Tauri 2.x, React 19.0.0, Next.js 16.x, serde/serde_json (Rust), @tauri-apps/api 2.0.0 (019-unified-logging-system)
- JSON log files in Tauri app data directory (`logs/` subdirectory) (019-unified-logging-system)
- TypeScript 5.7.2 (frontend), Rust 2021 Edition (backend - unchanged) + React 19.0.0, Next.js 16.x, Tauri 2.x, @tauri-apps/api 2.0.0 (020-background-transparency-persistence)
- JSON files in Tauri app data directory (state.json) (020-background-transparency-persistence)
- TypeScript 5.7.2 (React 19.0.0 frontend), Rust 2021 Edition (Tauri backend - unchanged) + Next.js 16.x, React 19.0.0, Tailwind CSS 4.x, next/font/google (built-in) (021-orbitron-font)
- N/A (font files are self-hosted at build time) (021-orbitron-font)
- Rust 2021 Edition (backend), TypeScript 5.7.2 (frontend - unchanged) + Tauri 2.x with `tray-icon` feature, existing tauri dependencies (022-tray-icon-menu)
- N/A (uses existing state persistence system for exit cleanup) (022-tray-icon-menu)
- TypeScript 5.7.2 (React 19.0.0 frontend), Rust 2021 Edition (Tauri backend - unchanged) + React 19.0.0, Next.js 16.x, Tailwind CSS 4.x, motion 12.x, shadcn/ui, Tauri 2.x (023-system-clock-window)
- Rust 2021 Edition (Tauri backend) + tauri-plugin-log 2.x, tauri 2.x (024-fix-duplicate-log)
- JSON log files in Tauri app log directory (024-fix-duplicate-log)
- Rust 2021 Edition (Tauri backend), TypeScript 5.7.2 (React 19.0.0 frontend) + `toml` crate (serde-compatible TOML parser), `serde` (existing), Tauri 2.x (existing) (025-runtime-settings-toml)
- TOML file (`settings.toml`) in executable directory (025-runtime-settings-toml)
- TypeScript 5.7.2 (frontend), Rust 2021 Edition (backend - unchanged) + React 19.0.0, Next.js 16.x, Tailwind CSS 4.x, shadcn/ui, motion 12.x, class-variance-authority, lucide-react (026-sc-hud-theme)
- N/A (CSS-only changes, settings stored via existing persistence system) (026-sc-hud-theme)
- TypeScript 5.7.2 (React 19.0.0 frontend), Rust 2021 Edition (Tauri backend) + React 19.0.0, Next.js 16.x, motion 12.x (for animations), shadcn/ui, Tailwind CSS 4.x, Tauri 2.x (027-widget-container)
- JSON files in Tauri app data directory (extends existing state.json + widget-{id}.json pattern) (027-widget-container)
- Rust 2021 Edition (Tauri backend), TypeScript 5.7.2 (React 19.0.0 frontend) + Tauri 2.x, windows-rs 0.62 (Win32 API), tauri-plugin-log, tauri-plugin-global-shortcut (028-sc-window-detection)
- JSON files in Tauri app data directory (settings.toml for configuration) (028-sc-window-detection)
- Rust 2021 Edition (Tauri backend), TypeScript 5.7.2 (React 19.0.0 frontend - unchanged) + `windows-rs` 0.62 (already in use), `tauri` 2.x, `lazy_static` 1.4 (029-low-level-keyboard-hook)
- Rust 2021 Edition (Tauri backend) + `log` 0.4, `tauri-plugin-log` 2.x (existing infrastructure) (030-concise-debug-logs)
- N/A (log files managed by tauri-plugin-log with rotation) (030-concise-debug-logs)
- TypeScript 5.7.2 (React 19.0.0 frontend), Rust 2021 Edition (Tauri backend - unchanged) + React 19.0.0, Next.js 16.x, @tauri-apps/api 2.0.0, Tauri 2.x (031-webview-hotkey-capture)
- N/A (stateless key event handling) (031-webview-hotkey-capture)
- TypeScript 5.7.2 (React 19.0.0 frontend) + TipTap 3.13.0 (@tiptap/react, @tiptap/starter-kit), Tailwind CSS 4.x, Next.js 16.x (032-fix-tiptap-toolbar)
- N/A (uses existing persistence system) (032-fix-tiptap-toolbar)
- TypeScript 5.7.2, React 19.0.0 + @excalidraw/excalidraw 0.18.0, Next.js 16.x, Tailwind CSS 4.x (033-excalidraw-view-polish)
- TypeScript 5.7.2 (React 19.0.0 frontend), Rust 2021 Edition (Tauri backend - unchanged) + React 19.0.0, Next.js 16.x, Tauri 2.x, @tauri-apps/api 2.0.0 (034-fix-browser-persist)
- JSON files in Tauri app data directory (state.json + window-{id}.json) (034-fix-browser-persist)
- TypeScript 5.7.2, React 19.0.0 + Next.js 16.x, Tailwind CSS 4.x, pdfjs-dist 5.4, react-markdown 10.1, react-zoom-pan-pinch 3.7 (035-fix-file-viewer-transparency)
- N/A (uses existing persistence system - no changes required) (035-fix-file-viewer-transparency)
- TypeScript 5.7.2, React 19.0.0 + Next.js 16.x, Tailwind CSS 4.x, motion 12.x (existing) (036-liquid-glass-clock)
- N/A (UI styling only - no persistence changes) (036-liquid-glass-clock)
- TypeScript 5.7.2 (React 19.0.0 frontend), Rust 2021 Edition (Tauri backend - unchanged) + React 19.0.0, Next.js 16.x, motion 12.x (motion/react), shadcn/ui, Tailwind CSS 4.x, lucide-react (X icon) (037-process-popup-glass)
- N/A (uses existing state persistence system - no changes required) (037-process-popup-glass)
- TypeScript 5.7.2 (React 19.0.0 frontend), Rust 2021 Edition (Tauri backend) + Tauri 2.x, React 19.0.0, Next.js 16.x, motion 12.x, shadcn/ui, Tailwind CSS 4.x, tauri-plugin-autostart 2.x, @tauri-apps/plugin-autostart (038-settings-panel)
- JSON files in Tauri app data directory (`user-settings.json`) (038-settings-panel)
- Rust 2021 Edition (backend), TypeScript 5.7.2 (frontend - unchanged) + Tauri 2.x, tauri-plugin-prevent-default 4.0.3 (new) (039-prevent-default-plugin)
- N/A (plugin configuration is compile-time only) (039-prevent-default-plugin)
- Rust 2021 Edition (Tauri backend), TypeScript 5.7.2 (React 19.0.0 frontend) + Tauri 2.x (WebviewWindow API, window management), React 19.0.0, Next.js 16.x, @tauri-apps/api 2.0.0, motion 12.x, shadcn/ui (040-webview-browser)
- JSON files in Tauri app data directory (existing persistence system - state.json + window-{id}.json) (040-webview-browser)
- TypeScript 5.7.2 (React 19.0.0 frontend) + React 19.0.0, Next.js 16.x, motion 12.x, shadcn/ui (ButtonGroup, Button) (041-header-button-groups)
- N/A (no persistence changes) (041-header-button-groups)
- TypeScript 5.7.2 (frontend), Rust 2021 Edition (backend - unchanged) + React 19.0.0, Next.js 16.0.10, @tauri-apps/api 2.0.0, motion 12.x (042-sync-webview-hotkeys)
- JSON files in Tauri app data directory (user-settings.json via existing persistence) (042-sync-webview-hotkeys)
- Rust 2021 Edition (Tauri backend) + Tauri 2.x, existing `build.rs` and `settings.rs` modules (043-build-env-defaults)
- N/A (build-time configuration only) (043-build-env-defaults)
- TypeScript 5.7.2 (React 19.0.0 frontend), Rust 2021 Edition (Tauri backend - unchanged) + React 19.0.0, Next.js 16.x, motion 12.x, @tauri-apps/api 2.0.0 (event listening), existing widget system components (044-session-timer-widget)
- JSON files in Tauri app data directory (existing persistence system - state.json) (044-session-timer-widget)
- TypeScript 5.7.2 (frontend), Rust 2021 Edition (backend) + React 19.0.0, Next.js 16.x, Tauri 2.x, motion 12.x, shadcn/ui (045-chronometer-widget)
- JSON files in Tauri app data directory (state.json + widget-{id}.json pattern) (045-chronometer-widget)
- WiX XML 3.x (installer definition), JSON (Tauri config) + Tauri 2.x bundler, WiX Toolset v3 (bundled with Tauri CLI) (046-msi-installer-shortcuts)
- N/A (installer artifacts only) (046-msi-installer-shortcuts)
- TypeScript 5.7.2 (React 19.0.0 frontend), Rust 2021 Edition (Tauri backend - unchanged) + React 19.0.0, Next.js 16.x, @tauri-apps/api 2.0.0, Tailwind CSS 4.x (047-settings-version-display)
- N/A (version is read from build configuration at runtime) (047-settings-version-display)
- YAML (GitHub Actions), PowerShell/Bash (scripts) + GitHub Actions (actions/checkout, actions/setup-node, dtolnay/rust-action, softprops/action-gh-release), Tauri CLI 2.x (048-github-release-workflow)
- N/A (workflow artifacts only) (048-github-release-workflow)
- Rust 2021 Edition (Tauri backend), TypeScript 5.7.2 (React 19.0.0 frontend) + Tauri 2.x, React 19.0.0, Next.js 16.x, @tauri-apps/api 2.0.0, reqwest (Rust HTTP client), semver (version comparison) (049-auto-update)
- JSON file in Tauri app data directory (`update-state.json`) (049-auto-update)
- WiX XML 3.x (Windows Installer XML) + Tauri 2.x bundler, WiX Toolset (bundled with Tauri CLI) (050-desktop-shortcut)
- N/A (installer configuration only) (050-desktop-shortcut)
- Rust 2021 Edition (Tauri backend), TypeScript 5.7.2 (React 19.0.0 frontend) + Tauri 2.x, React 19.0.0, Next.js 16.x, @tauri-apps/api 2.0.0, motion 12.x, shadcn/ui (051-fix-update-popup)
- JSON files in Tauri app data directory (existing update-state.json) (051-fix-update-popup)
- TypeScript 5.7.2 (React 19.0.0 frontend), Rust 2021 Edition (Tauri backend - unchanged) + React 19.0.0, Next.js 16.x, Tauri 2.x, @tauri-apps/api 2.0.0, motion 12.x, shadcn/ui, Tailwind CSS 4.x, lucide-react (052-settings-update-button)
- N/A (reuses existing update state persistence) (052-settings-update-button)
- TypeScript 5.7.2 (React 19.0.0 frontend), Rust 2021 Edition (Tauri backend - unchanged) + React 19.0.0, Next.js 16.x, @tauri-apps/plugin-opener (already installed), Tailwind CSS 4.x, lucide-react (for icons) (053-buymeacoffee-button)
- N/A (no persistence required - static URL) (053-buymeacoffee-button)

- Rust 1.92 (backend/native), TypeScript 5.x (React UI) + Tauri 2.x (Rust-React bridge, native window management), React 19.2 (UI layer) (001-rust-overlay-init)

## Target Platform

- Windows 11 (64-bit)

## Project Structure

```text
src/
tests/
```

## Commands

cargo test; cargo clippy

## Code Style

Rust 1.92: Follow standard conventions
TypeScript/React 19.2: Follow standard conventions

## Recent Changes
- 053-buymeacoffee-button: Added TypeScript 5.7.2 (React 19.0.0 frontend), Rust 2021 Edition (Tauri backend - unchanged) + React 19.0.0, Next.js 16.x, @tauri-apps/plugin-opener (already installed), Tailwind CSS 4.x, lucide-react (for icons)
- 052-settings-update-button: Added TypeScript 5.7.2 (React 19.0.0 frontend), Rust 2021 Edition (Tauri backend - unchanged) + React 19.0.0, Next.js 16.x, Tauri 2.x, @tauri-apps/api 2.0.0, motion 12.x, shadcn/ui, Tailwind CSS 4.x, lucide-react
- 051-fix-update-popup: Added Rust 2021 Edition (Tauri backend), TypeScript 5.7.2 (React 19.0.0 frontend) + Tauri 2.x, React 19.0.0, Next.js 16.x, @tauri-apps/api 2.0.0, motion 12.x, shadcn/ui


<!-- MANUAL ADDITIONS START -->
<!-- MANUAL ADDITIONS END -->
