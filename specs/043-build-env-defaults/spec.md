# Feature Specification: Build-Time Environment Variable Defaults

**Feature Branch**: `043-build-env-defaults`
**Created**: 2025-12-31
**Status**: Draft
**Input**: User description: "Convert DEFAULT_PROCESS_NAME and DEFAULT_WINDOW_CLASS to build-time environment variables with hardcoded fallbacks, and make TARGET_WINDOW_NAME optional with fallback to Star Citizen"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Build Without Environment Variables (Priority: P1)

A developer clones the repository and runs the build without setting any environment variables. The build succeeds using sensible Star Citizen defaults for all three window detection settings.

**Why this priority**: This is the primary use case - enabling zero-configuration builds for the default Star Citizen overlay use case. Currently, builds fail without `TARGET_WINDOW_NAME`, creating friction for new contributors.

**Independent Test**: Can be fully tested by removing all `TARGET_WINDOW_NAME`, `TARGET_PROCESS_NAME`, and `TARGET_WINDOW_CLASS` environment variables, running `cargo build`, and verifying the application starts and attempts to detect "Star Citizen" windows with process "StarCitizen.exe" and class "CryENGINE".

**Acceptance Scenarios**:

1. **Given** no environment variables are set, **When** `cargo tauri build` is executed, **Then** the build completes successfully without errors.
2. **Given** no environment variables are set, **When** the built application starts, **Then** it uses "Star Citizen" as the target window name, "StarCitizen.exe" as the target process name, and "CryENGINE" as the target window class.

---

### User Story 2 - Custom Target Window Name via Environment Variable (Priority: P2)

A developer wants to test the overlay with a different application (e.g., Notepad) by setting the `TARGET_WINDOW_NAME` environment variable before building.

**Why this priority**: This enables developers to create custom builds for different target applications while maintaining the simple default behavior for Star Citizen users.

**Independent Test**: Can be fully tested by setting `TARGET_WINDOW_NAME=Notepad`, running `cargo tauri build`, and verifying the built application attempts to attach to Notepad windows instead of Star Citizen.

**Acceptance Scenarios**:

1. **Given** `TARGET_WINDOW_NAME=Notepad` is set, **When** `cargo tauri build` is executed, **Then** the build completes successfully.
2. **Given** `TARGET_WINDOW_NAME=Notepad` is set, **When** the built application starts, **Then** it uses "Notepad" as the target window name instead of the default.

---

### User Story 3 - Custom Process Name and Window Class via Environment Variables (Priority: P3)

A developer wants to customize all three detection parameters for a completely different target application by setting `TARGET_PROCESS_NAME` and `TARGET_WINDOW_CLASS` environment variables.

**Why this priority**: This provides full customization capability for advanced users who need precise control over window detection for non-Star Citizen applications.

**Independent Test**: Can be fully tested by setting `TARGET_PROCESS_NAME=notepad.exe` and `TARGET_WINDOW_CLASS=Notepad`, running `cargo tauri build`, and verifying the built application uses these custom values for detection.

**Acceptance Scenarios**:

1. **Given** `TARGET_PROCESS_NAME=notepad.exe` and `TARGET_WINDOW_CLASS=Notepad` are set, **When** `cargo tauri build` is executed, **Then** the build completes successfully.
2. **Given** only `TARGET_PROCESS_NAME=notepad.exe` is set (without `TARGET_WINDOW_CLASS`), **When** the built application starts, **Then** it uses "notepad.exe" as the process name and the default "CryENGINE" as the window class.
3. **Given** only `TARGET_WINDOW_CLASS=CustomClass` is set (without `TARGET_PROCESS_NAME`), **When** the built application starts, **Then** it uses "StarCitizen.exe" as the process name and "CustomClass" as the window class.

---

### Edge Cases

- What happens when an environment variable is set to an empty string? → Treated as unset, fallback to default value.
- What happens when `TARGET_WINDOW_NAME` is set but `TARGET_PROCESS_NAME` and `TARGET_WINDOW_CLASS` are not? → Mixed configuration is valid; each setting falls back independently.
- How does the system handle whitespace-only environment variable values? → Treated as unset, fallback to default value.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST compile successfully when no `TARGET_WINDOW_NAME` environment variable is set, using "Star Citizen" as the default value.
- **FR-002**: System MUST compile successfully when no `TARGET_PROCESS_NAME` environment variable is set, using "StarCitizen.exe" as the default value.
- **FR-003**: System MUST compile successfully when no `TARGET_WINDOW_CLASS` environment variable is set, using "CryENGINE" as the default value.
- **FR-004**: System MUST use the environment variable value when `TARGET_WINDOW_NAME` is set to a non-empty string at build time.
- **FR-005**: System MUST use the environment variable value when `TARGET_PROCESS_NAME` is set to a non-empty string at build time.
- **FR-006**: System MUST use the environment variable value when `TARGET_WINDOW_CLASS` is set to a non-empty string at build time.
- **FR-007**: System MUST treat empty string environment variable values as unset and use the default fallback.
- **FR-008**: System MUST maintain backward compatibility with existing `settings.toml` runtime overrides (runtime settings take precedence over build-time defaults).
- **FR-009**: Build script MUST log which values are being used (environment variable or default) during compilation for debugging purposes.

### Key Entities

- **Build-Time Configuration**: The three environment variables (`TARGET_WINDOW_NAME`, `TARGET_PROCESS_NAME`, `TARGET_WINDOW_CLASS`) that can optionally customize the compiled defaults.
- **Hardcoded Defaults**: The fallback values ("Star Citizen", "StarCitizen.exe", "CryENGINE") used when environment variables are not set.
- **Runtime Configuration**: The existing `settings.toml` file that can override build-time defaults at application startup.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Developers can successfully build the application without setting any environment variables.
- **SC-002**: Build process completes in the same time as before (no performance regression).
- **SC-003**: All three window detection parameters can be independently customized via environment variables at build time.
- **SC-004**: Existing `settings.toml` runtime configuration continues to work and takes precedence over build-time values.
- **SC-005**: Build output clearly indicates which configuration values are being used (env var vs default).

## Assumptions

- The existing priority chain (settings.toml > build-time env > hardcoded default) remains unchanged for `TARGET_WINDOW_NAME`.
- The new `TARGET_PROCESS_NAME` and `TARGET_WINDOW_CLASS` environment variables follow the same priority chain pattern.
- The `.env.example` file will be updated to document all three optional environment variables.
- Empty strings and whitespace-only values in environment variables are treated as "not set".

## Out of Scope

- Changing the runtime configuration system (`settings.toml`).
- Adding new runtime environment variable support (only build-time changes).
- Changing the window detection algorithm or behavior.
- Adding validation for environment variable values beyond empty string checking.
