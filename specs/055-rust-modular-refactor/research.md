# Research: Rust Modular Architecture Patterns

**Feature**: 055-rust-modular-refactor
**Date**: 2026-01-03

## Research Questions

### 1. Rust 2021 Module File Organization

**Decision**: Use directory-based modules with `mod.rs` files

**Rationale**: Rust 2021 supports two styles for module organization:
- `module_name.rs` + `module_name/` subdirectory (newer style)
- `module_name/mod.rs` (traditional style)

For this project, the traditional `mod.rs` style is preferred because:
1. The existing `update/` module already uses this pattern
2. It groups all related files in one directory
3. IDE file explorers show the module as a collapsed folder
4. Consistency with existing codebase patterns

**Alternatives considered**:
- New `module_name.rs` style: Rejected because it would require a parallel file for each directory, mixing styles with existing `update/mod.rs`

### 2. Re-export Patterns for Public API

**Decision**: Use `pub use` re-exports in `mod.rs` for clean public APIs

**Rationale**: From Rust documentation:
```rust
// In mod.rs
pub use self::types::BrowserWebViewState;
pub use self::commands::{create_browser_webview, destroy_browser_webview};
```

This allows consumers to import from the module root:
```rust
use crate::browser::BrowserWebViewState;  // Clean path
// vs
use crate::browser::types::BrowserWebViewState;  // Verbose path
```

**Best practices applied**:
- Re-export only the public API, not internal implementation details
- Use `pub(crate)` for items shared between modules but not part of public API
- Keep `mod.rs` files lean - primarily declarations and re-exports

### 3. Platform-Specific Module Gating

**Decision**: Apply `#[cfg(windows)]` at the module declaration level in `lib.rs`

**Rationale**: This approach:
1. Keeps platform logic centralized in `lib.rs`
2. Allows the entire `platform/` module to be excluded on non-Windows builds
3. Matches existing patterns for `keyboard_hook`, `process_monitor`, etc.

```rust
// In lib.rs
#[cfg(windows)]
pub mod platform;
```

**Alternatives considered**:
- Per-function gating: More granular but scattered across files
- Build.rs conditional compilation: Overkill for this use case

### 4. Circular Dependency Prevention

**Decision**: Use a layered architecture with unidirectional dependencies

**Rationale**: Module dependency hierarchy:
```
core/           (no dependencies - types, state, utilities)
   ↑
logging/        (depends on core types only)
   ↑
persistence/    (depends on core, logging)
hotkey/         (depends on core)
platform/       (depends on core)
   ↑
browser/        (depends on core, platform)
settings/       (depends on core, persistence)
update/         (depends on core, logging)
   ↑
commands/       (depends on all feature modules)
   ↑
lib.rs          (orchestrates everything)
```

**Key principles**:
- Types and state in `core/` have no external dependencies
- Feature modules depend on `core/` but not on each other
- `commands/` module depends on feature modules for Tauri handlers
- `lib.rs` is the only file that imports all modules

### 5. Internal Module Structure Convention

**Decision**: Standardize on consistent file naming within modules

**Rationale**: Each feature module follows this pattern:
- `mod.rs` - Module root with `pub use` re-exports
- `types.rs` - All struct, enum, and type definitions
- `commands.rs` - Tauri command handlers (`#[tauri::command]`)
- `*.rs` - Feature-specific implementation files

This matches the existing `update/` module structure and provides clear guidance for new modules.

### 6. Visibility Levels

**Decision**: Use minimal visibility with explicit `pub`, `pub(crate)`, and private

**Rationale** (from Rust by Example):
- `pub` - Visible outside the crate
- `pub(crate)` - Visible within the crate only
- `pub(super)` - Visible to parent module
- Private (no modifier) - Visible only within current module

For this refactor:
- Tauri commands: `pub` (required by Tauri)
- Types used across modules: `pub` or `pub(crate)`
- Internal helpers: private or `pub(super)`

## Summary

All research questions resolved. No blockers for implementation.

| Topic | Decision | Confidence |
|-------|----------|------------|
| Module file organization | Directory + mod.rs | High |
| Re-export patterns | pub use in mod.rs | High |
| Platform gating | #[cfg(windows)] at module level | High |
| Circular dependency prevention | Layered architecture | High |
| Internal structure | types.rs, commands.rs convention | High |
| Visibility levels | Minimal visibility principle | High |
