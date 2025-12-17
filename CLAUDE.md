# RAICOverlay Development Guidelines

Auto-generated from all feature plans. Last updated: 2025-12-12

## Active Technologies
- TypeScript 5.7 (React 19.2 frontend), Rust 1.92 (Tauri backend - unchanged) + shadcn/ui, Tailwind CSS 4.x, @tailwindcss/vite, clsx, tailwind-merge (002-shadcn-dark-theme)
- N/A (UI theming only) (002-shadcn-dark-theme)
- Rust 1.92 (Tauri backend), TypeScript 5.7 (React 19.2 frontend) + Tauri 2.x, React 19.2, tailwindcss 4.x, shadcn/ui (003-f3-fullscreen-overlay)
- N/A (in-memory state only) (003-f3-fullscreen-overlay)
- Rust 2021 Edition (backend), TypeScript 5.7.2 (frontend) + Tauri 2.x, React 19.0.0, tauri-plugin-global-shortcut 2.x, Windows API (windows-rs crate) (004-external-window-attach)

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
- 004-external-window-attach: Added Rust 2021 Edition (backend), TypeScript 5.7.2 (frontend) + Tauri 2.x, React 19.0.0, tauri-plugin-global-shortcut 2.x, Windows API (windows-rs crate)
- 003-f3-fullscreen-overlay: Added Rust 1.92 (Tauri backend), TypeScript 5.7 (React 19.2 frontend) + Tauri 2.x, React 19.2, tailwindcss 4.x, shadcn/ui
- 002-shadcn-dark-theme: Added TypeScript 5.7 (React 19.2 frontend), Rust 1.92 (Tauri backend - unchanged) + shadcn/ui, Tailwind CSS 4.x, @tailwindcss/vite, clsx, tailwind-merge


<!-- MANUAL ADDITIONS START -->
<!-- MANUAL ADDITIONS END -->
