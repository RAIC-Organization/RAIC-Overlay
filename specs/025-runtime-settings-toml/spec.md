# Feature Specification: Runtime Settings System

**Feature Branch**: `025-runtime-settings-toml`
**Created**: 2025-12-23
**Status**: Draft
**Input**: User description: "Add a new runtime settings system with a setting.toml file, this file need to be in the same directory of the exe file, this is for setting the variables TARGET_WINDOW_NAME, VITE_DEBUG_BORDER and RAIC_LOG_LEVEL, if the setting.toml don't exist or any of his setting properties don't exist in the file then the system take the default values for each of one, this default settings are loaded from the env file in build time, research about the best 2025 pattern about this type of runtime setting file with toml files"

## Clarifications

### Session 2025-12-23

- Q: Should an example configuration file be included with the distribution? → A: Include a `settings.example.toml` file with documented defaults alongside the executable.
- Q: Should the application log which settings came from settings.toml vs defaults? → A: Log each setting's source at startup (e.g., "target_window_name: 'Notepad' (from settings.toml)").

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Configure Target Window at Runtime (Priority: P1)

As a user, I want to change which window the overlay attaches to without rebuilding the application, so I can switch between different target applications (e.g., from "Star Citizen" to "Notepad" for testing) by simply editing a configuration file.

**Why this priority**: This is the primary use case - allowing runtime configuration of the most frequently changed setting without requiring a rebuild. The TARGET_WINDOW_NAME determines the core functionality of the overlay.

**Independent Test**: Can be fully tested by creating/modifying settings.toml with a different TARGET_WINDOW_NAME value, restarting the application, and verifying the overlay attaches to the new target window.

**Acceptance Scenarios**:

1. **Given** a settings.toml file exists with `target_window_name = "Notepad"`, **When** the application starts, **Then** the overlay attaches to windows containing "Notepad" in their title.
2. **Given** a settings.toml file exists with a different target_window_name than the build-time default, **When** the application starts, **Then** the runtime value takes precedence over the build-time default.

---

### User Story 2 - Graceful Fallback to Defaults (Priority: P1)

As a user, I want the application to work seamlessly even without a settings.toml file, so I don't need to create configuration files for basic usage and the application uses sensible defaults compiled at build time.

**Why this priority**: Essential for first-time users and ensures the application remains functional without manual configuration. Prevents application failures due to missing configuration.

**Independent Test**: Can be fully tested by removing/renaming any existing settings.toml file, starting the application, and verifying it uses the build-time default values from the .env file.

**Acceptance Scenarios**:

1. **Given** no settings.toml file exists in the executable directory, **When** the application starts, **Then** the application uses build-time default values for all settings.
2. **Given** a settings.toml file exists but is missing the `target_window_name` property, **When** the application starts, **Then** the application uses the build-time default for TARGET_WINDOW_NAME while respecting other configured values.
3. **Given** a settings.toml file exists but is missing the `debug_border` property, **When** the application starts, **Then** the application uses the build-time default for VITE_DEBUG_BORDER.
4. **Given** a settings.toml file exists but is missing the `log_level` property, **When** the application starts, **Then** the application uses the build-time default for RAIC_LOG_LEVEL.

---

### User Story 3 - Configure Debug Border at Runtime (Priority: P2)

As a developer/user, I want to enable or disable the debug border at runtime without rebuilding, so I can troubleshoot overlay positioning issues on any installation.

**Why this priority**: Debug functionality is important for troubleshooting but not required for normal operation. Secondary to core functionality.

**Independent Test**: Can be fully tested by setting `debug_border = true` in settings.toml, restarting the application, and verifying a debug border appears around the overlay.

**Acceptance Scenarios**:

1. **Given** a settings.toml file exists with `debug_border = true`, **When** the application starts, **Then** the overlay displays a visible debug border.
2. **Given** a settings.toml file exists with `debug_border = false`, **When** the application starts, **Then** no debug border is displayed.

---

### User Story 4 - Configure Log Level at Runtime (Priority: P2)

As a developer/user, I want to adjust the logging verbosity at runtime without rebuilding, so I can enable detailed logging for troubleshooting without modifying the application build.

**Why this priority**: Logging configuration is important for diagnostics but secondary to core functionality. Users may need to increase logging temporarily to diagnose issues.

**Independent Test**: Can be fully tested by setting `log_level = "DEBUG"` in settings.toml, restarting the application, and verifying detailed log entries appear in the log files.

**Acceptance Scenarios**:

1. **Given** a settings.toml file exists with `log_level = "DEBUG"`, **When** the application starts, **Then** the application logs at DEBUG level.
2. **Given** a settings.toml file exists with `log_level = "WARN"`, **When** the application starts, **Then** only WARN and ERROR level logs are recorded.
3. **Given** a settings.toml file exists with an invalid log_level value, **When** the application starts, **Then** the application falls back to the build-time default log level and logs a warning about the invalid configuration.

---

### User Story 5 - Configuration File Location Discovery (Priority: P3)

As a user, I want the settings.toml file to be located next to the executable, so I can easily find and edit the configuration without searching through system directories.

**Why this priority**: File location is an implementation detail that supports usability. The user specified this location requirement explicitly.

**Independent Test**: Can be fully tested by placing settings.toml in the same directory as the executable and verifying the application reads the configuration from that location.

**Acceptance Scenarios**:

1. **Given** a settings.toml file exists in the same directory as the executable, **When** the application starts, **Then** the application reads and applies the configuration from that file.
2. **Given** the user wants to know where to place the configuration file, **When** they look in the executable directory, **Then** they find or can create the settings.toml file there.

---

### Edge Cases

- What happens when the settings.toml file contains malformed TOML syntax?
  - The application logs a warning about the parse error and falls back to build-time defaults for all settings.
- What happens when the settings.toml file has correct syntax but invalid values (e.g., log_level = "INVALID")?
  - The application uses the build-time default for that specific setting and logs a warning.
- What happens when the settings.toml file exists but is empty?
  - The application uses build-time defaults for all settings (treated as all properties missing).
- What happens when the application cannot read the settings.toml file due to permissions?
  - The application logs a warning and falls back to build-time defaults.
- What happens when settings are changed while the application is running?
  - Settings are read only at application startup; changes require application restart.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST read configuration from a settings.toml file located in the same directory as the executable at application startup.
- **FR-002**: System MUST support the following configurable settings:
  - `target_window_name` (string): The window title to attach the overlay to
  - `debug_border` (boolean): Whether to display a debug border around the overlay
  - `log_level` (string): The logging verbosity level (TRACE, DEBUG, INFO, WARN, ERROR)
- **FR-003**: System MUST fall back to build-time default values (from .env file) when the settings.toml file does not exist.
- **FR-004**: System MUST fall back to the build-time default for any individual setting that is missing from the settings.toml file.
- **FR-005**: System MUST log a warning when the settings.toml file contains malformed TOML syntax and fall back to all build-time defaults.
- **FR-006**: System MUST log a warning when an individual setting has an invalid value and fall back to the build-time default for that setting.
- **FR-007**: System MUST compile build-time default values from the .env file during the build process.
- **FR-008**: System MUST use a layered configuration approach where runtime values (from settings.toml) take precedence over build-time defaults (from .env).
- **FR-009**: System MUST handle file permission errors gracefully by logging a warning and using build-time defaults.
- **FR-010**: Distribution MUST include a `settings.example.toml` file alongside the executable, containing all available settings with their default values and documentation comments.
- **FR-011**: System MUST log each setting's effective value and source at startup (INFO level), indicating whether the value came from settings.toml or build-time defaults.

### Key Entities

- **RuntimeSettings**: Represents the merged configuration state containing all three settings with their effective values (either from settings.toml or build-time defaults).
- **SettingsFile**: Represents the optional settings.toml file that may or may not exist and may contain partial configuration.
- **BuildTimeDefaults**: Represents the compile-time embedded default values derived from the .env file.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Users can change the target window name by editing settings.toml and restarting the application, without requiring a rebuild.
- **SC-002**: Application starts successfully within its normal startup time whether or not a settings.toml file exists.
- **SC-003**: 100% of configuration errors (missing file, malformed TOML, invalid values) result in graceful fallback with appropriate warning logs.
- **SC-004**: Users can locate and edit the configuration file within 30 seconds by checking the executable directory.
- **SC-005**: All three configurable settings (target_window_name, debug_border, log_level) can be independently configured or omitted.

## Assumptions

- The TOML format is used as it is the standard configuration format in the Rust ecosystem and provides human-readable, easy-to-edit syntax.
- Settings are read once at application startup; live reloading is not required (changes require restart).
- The settings.toml file uses snake_case naming convention (e.g., `target_window_name`) to follow TOML best practices.
- The executable directory is determined at runtime using standard platform APIs.
- Build-time defaults are embedded in the binary during compilation from the .env file values.

## Dependencies

- Existing .env file containing TARGET_WINDOW_NAME, VITE_DEBUG_BORDER, and RAIC_LOG_LEVEL variables.
- Existing logging system (019-unified-logging-system) for warning messages about configuration issues.
