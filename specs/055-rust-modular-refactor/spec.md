# Feature Specification: Rust Modular Architecture Refactor

**Feature Branch**: `055-rust-modular-refactor`
**Created**: 2026-01-03
**Status**: Draft
**Input**: User description: "The current src-tauri/src folder have actually a no good organization, I want to refactor the architecture organization for the best modularize 2025 patter for organizate rust application"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Developer Finds Related Code Quickly (Priority: P1)

A developer working on the RAIC Overlay needs to modify browser-related functionality. They can immediately navigate to a dedicated `browser/` module directory and find all browser-related code (types, commands, state, WebView management) in one logical location, rather than searching through 28 flat files.

**Why this priority**: This directly addresses the core problem - poor organization makes code discovery and maintenance difficult. Grouping related code improves productivity and reduces onboarding time for new contributors.

**Independent Test**: Can be fully tested by asking a developer unfamiliar with the codebase to find "all code related to browser WebViews" and measuring time to locate all relevant files. Success = files are co-located in one directory.

**Acceptance Scenarios**:

1. **Given** a developer needs to modify browser functionality, **When** they open the `src-tauri/src/` directory, **Then** they see a `browser/` module directory containing all browser-related files
2. **Given** a developer searches for "WebView" types, **When** they look in the module structure, **Then** types, commands, and state are all within the same parent module
3. **Given** the module structure is in place, **When** the application is compiled, **Then** all existing functionality works identically to before

---

### User Story 2 - Developer Adds New Feature with Clear Patterns (Priority: P2)

A developer needs to add a new feature (e.g., a "timer" module). They can reference existing module structures (e.g., `update/`, `browser/`) to understand the expected organization pattern: `mod.rs` for public API, `types.rs` for data structures, `commands.rs` for Tauri commands, and feature-specific implementation files.

**Why this priority**: Consistent patterns enable faster feature development and reduce code review friction. This is critical for long-term maintainability but depends on P1 being complete first.

**Independent Test**: Can be fully tested by providing the refactored codebase to a developer and asking them to scaffold a new "timer" module following the existing patterns. Success = they can do so without asking questions about structure.

**Acceptance Scenarios**:

1. **Given** a developer wants to add a new feature module, **When** they examine existing modules like `update/` or `browser/`, **Then** they see a consistent internal structure pattern they can replicate
2. **Given** the module has types, commands, and business logic, **When** following the pattern, **Then** types go in `types.rs`, commands in `commands.rs`, and `mod.rs` re-exports the public API

---

### User Story 3 - Developer Understands Module Dependencies at a Glance (Priority: P3)

A developer needs to understand which modules depend on which. The `lib.rs` file provides a clear, organized view of all modules grouped by functionality (core, features, platform-specific), with comments explaining each group purpose.

**Why this priority**: Clear dependency visualization helps prevent circular dependencies and architectural drift. This is a quality-of-life improvement that builds on the structural improvements.

**Independent Test**: Can be fully tested by reading `lib.rs` and drawing a module dependency diagram. Success = dependencies are clear and logically grouped.

**Acceptance Scenarios**:

1. **Given** a developer opens `lib.rs`, **When** they read the module declarations, **Then** modules are grouped with comments (e.g., "// Core infrastructure", "// Feature modules", "// Platform-specific")
2. **Given** platform-specific code exists, **When** examining module declarations, **Then** `#[cfg(windows)]` attributes are clearly visible next to relevant modules

---

### Edge Cases

- What happens when circular dependencies exist between modules? The refactoring must break any cycles by extracting shared types to a common module.
- How does the system handle platform-specific modules during compilation on non-Windows platforms? All Windows-specific modules must be properly gated with `#[cfg(windows)]` attributes.
- What happens if a file is accidentally duplicated during refactoring? The build system will fail with "duplicate definition" errors - tests must verify clean compilation.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST organize related functionality into dedicated subdirectories (modules) under `src-tauri/src/`
- **FR-002**: System MUST use Rust 2021 Edition module patterns (`mod.rs` as module root, or named `module_name.rs` with `module_name/` subdirectory)
- **FR-003**: Each feature module MUST have a clear public API exported through its `mod.rs` (or equivalent root file)
- **FR-004**: System MUST separate types from implementation (types in dedicated `types.rs` files within each module)
- **FR-005**: System MUST separate Tauri command handlers from business logic within each module
- **FR-006**: System MUST maintain all existing functionality without regression (all Tauri commands work identically)
- **FR-007**: System MUST preserve all `#[cfg(windows)]` platform-specific gating during refactoring
- **FR-008**: System MUST reduce `lib.rs` to module declarations and application setup only (no inline command handlers exceeding 50 lines)
- **FR-009**: System MUST group modules in `lib.rs` with comments indicating their purpose (core, features, platform)
- **FR-010**: System MUST ensure zero circular dependencies between modules

### Proposed Module Structure

```text
src-tauri/src/
+-- main.rs                 # Entry point (unchanged)
+-- lib.rs                  # Module declarations + run() setup
|
+-- core/                   # Core infrastructure
|   +-- mod.rs
|   +-- state.rs           # OverlayState
|   +-- types.rs           # Core types (Position, OverlayMode, etc.)
|   +-- window.rs          # Window positioning utilities
|
+-- browser/               # Browser WebView feature
|   +-- mod.rs
|   +-- types.rs           # BrowserWebViewState, related types
|   +-- commands.rs        # Tauri commands
|   +-- webview.rs         # WebView lifecycle management
|
+-- persistence/           # State persistence feature
|   +-- mod.rs
|   +-- types.rs
|   +-- commands.rs
|
+-- settings/              # Settings management
|   +-- mod.rs
|   +-- types.rs           # User settings types
|   +-- runtime.rs         # Runtime settings (TOML)
|   +-- user.rs            # User settings commands
|   +-- window.rs          # Settings window
|
+-- update/                # Auto-update feature (already organized)
|   +-- mod.rs
|   +-- types.rs
|   +-- checker.rs
|   +-- downloader.rs
|   +-- installer.rs
|   +-- state.rs
|   +-- window.rs
|
+-- hotkey/                # Hotkey handling
|   +-- mod.rs
|   +-- shortcuts.rs
|
+-- logging/               # Logging infrastructure
|   +-- mod.rs
|   +-- types.rs
|
+-- platform/              # Platform-specific code (Windows)
|   +-- mod.rs
|   +-- keyboard_hook.rs
|   +-- target_window.rs
|   +-- process_monitor.rs
|   +-- focus_monitor.rs
|   +-- tray.rs
|
+-- commands/              # Top-level Tauri commands
    +-- mod.rs
    +-- overlay.rs         # toggle_visibility, toggle_mode, etc.
```

### Key Entities

- **Module**: A logical grouping of related Rust code in a directory with a `mod.rs` entry point
- **Public API**: The subset of types, functions, and commands exported via `pub use` statements
- **Feature Module**: A self-contained module implementing a specific feature (browser, update, persistence)
- **Platform Module**: Code gated with `#[cfg()]` attributes for OS-specific functionality

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: All 28 current `.rs` files are reorganized into no more than 10 top-level directories/modules
- **SC-002**: `lib.rs` file is reduced to under 200 lines (currently ~700 lines)
- **SC-003**: New developer can locate all browser-related code within 30 seconds (single directory lookup)
- **SC-004**: All existing unit tests continue to pass without modification to test logic
- **SC-005**: Application compiles successfully on target platform (Windows 11)
- **SC-006**: All 50+ Tauri commands work identically to pre-refactor state
- **SC-007**: Zero circular dependency warnings during compilation
- **SC-008**: Each feature module has clear internal organization visible in file listing (types.rs, commands.rs pattern)

## Assumptions

- The `update/` module already follows good modular patterns and serves as a reference implementation
- All existing functionality is covered by manual testing or the development workflow
- The refactoring is purely organizational - no behavioral changes to any functions
- Rust 2021 Edition module resolution is used (path-style modules, not legacy)
- The target platform remains Windows 11 with Tauri 2.x
