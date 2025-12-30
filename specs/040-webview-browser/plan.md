# Implementation Plan: WebView Browser Architecture

**Branch**: `040-webview-browser` | **Date**: 2025-12-30 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/040-webview-browser/spec.md`

## Summary

Replace the iframe-based browser content rendering with native Tauri WebView windows to bypass X-Frame-Options restrictions. Implement a synchronized dual-window architecture where React components manage the browser UI (toolbar, URL bar, navigation controls) while separate native WebView windows render actual website content. The WebView windows are positioned, sized, and synchronized with their parent browser window components to create a seamless single-window illusion.

## Technical Context

**Language/Version**: Rust 2021 Edition (Tauri backend), TypeScript 5.7.2 (React 19.0.0 frontend)
**Primary Dependencies**: Tauri 2.x (WebviewWindow API, window management), React 19.0.0, Next.js 16.x, @tauri-apps/api 2.0.0, motion 12.x, shadcn/ui
**Storage**: JSON files in Tauri app data directory (existing persistence system - state.json + window-{id}.json)
**Testing**: vitest (frontend), cargo test (backend)
**Target Platform**: Windows 11 (64-bit)
**Project Type**: Desktop application (Tauri + React)
**Performance Goals**: Position sync <100ms, URL sync <500ms, 2-pixel alignment tolerance
**Constraints**: Overlay hotkeys take priority over WebView input; all popups blocked silently
**Scale/Scope**: Multiple concurrent browser windows supported, each with independent WebView

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Status | Notes |
|-----------|--------|-------|
| I. Code Quality | PASS | Feature extends existing patterns; static analysis enforced |
| II. Testing Standards | PASS | Integration tests for WebView commands; component tests for React |
| III. User Experience Consistency | PASS | Maintains existing browser toolbar UX; adds error indicator in URL bar |
| IV. Performance Requirements | PASS | Explicit targets: <100ms position sync, <500ms URL sync, 2px tolerance |
| V. Research-First Development | PASS | Phase 0 research covers Tauri WebView API, window synchronization |

**Simplicity Standard Check:**
- Uses existing Tauri WebviewWindow API (no new dependencies for core feature)
- Extends existing window management patterns in `window.rs`
- Builds on existing persistence system (no new storage mechanism)
- Single responsibility: WebView controller manages lifecycle; React manages UI

## Project Structure

### Documentation (this feature)

```text
specs/040-webview-browser/
├── spec.md              # Feature specification
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
├── contracts/           # Phase 1 output (Tauri commands)
└── tasks.md             # Phase 2 output (/speckit.tasks command)
```

### Source Code (repository root)

```text
src-tauri/
├── src/
│   ├── lib.rs                    # Existing - add new commands
│   ├── browser_webview.rs        # NEW: WebView lifecycle management
│   ├── browser_webview_types.rs  # NEW: WebView state types
│   └── window.rs                 # Existing - extend with WebView positioning

src/
├── components/
│   └── windows/
│       ├── BrowserContent.tsx    # MODIFY: Remove iframe, add WebView bridge
│       └── BrowserToolbar.tsx    # MODIFY: Add error indicator
├── hooks/
│   └── useBrowserWebView.ts      # NEW: WebView control hook
└── types/
    └── browserWebView.ts         # NEW: WebView TypeScript types

tests/
├── react/
│   ├── BrowserContent.test.tsx   # MODIFY: Update for WebView architecture
│   └── useBrowserWebView.test.ts # NEW: WebView hook tests
└── rust/
    └── browser_webview.rs        # NEW: Rust WebView command tests
```

**Structure Decision**: Extends existing Tauri + React architecture. New Rust module `browser_webview.rs` manages WebView lifecycle; new React hook `useBrowserWebView` bridges frontend controls to backend WebView. No new directories needed beyond existing patterns.

## Complexity Tracking

> No violations requiring justification. Implementation uses existing patterns and dependencies.

| Aspect | Assessment |
|--------|------------|
| New Dependencies | None for core feature; Tauri WebviewWindow API is built-in |
| New Modules | 2 Rust files, 2 TypeScript files - minimal addition |
| Abstraction Level | Single controller pattern for WebView lifecycle |
| Integration Points | React ↔ Tauri commands (existing pattern) |
