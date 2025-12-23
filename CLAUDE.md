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
- 028-sc-window-detection: Added Rust 2021 Edition (Tauri backend), TypeScript 5.7.2 (React 19.0.0 frontend) + Tauri 2.x, windows-rs 0.62 (Win32 API), tauri-plugin-log, tauri-plugin-global-shortcut
- 027-widget-container: Added TypeScript 5.7.2 (React 19.0.0 frontend), Rust 2021 Edition (Tauri backend) + React 19.0.0, Next.js 16.x, motion 12.x (for animations), shadcn/ui, Tailwind CSS 4.x, Tauri 2.x
- 026-sc-hud-theme: Added TypeScript 5.7.2 (frontend), Rust 2021 Edition (backend - unchanged) + React 19.0.0, Next.js 16.x, Tailwind CSS 4.x, shadcn/ui, motion 12.x, class-variance-authority, lucide-react


<!-- MANUAL ADDITIONS START -->
<!-- MANUAL ADDITIONS END -->
