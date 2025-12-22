# Feature Specification: Unified Logging System

**Feature Branch**: `019-unified-logging-system`
**Created**: 2025-12-22
**Status**: Draft
**Input**: User description: "Create a new log system for log events and error from the tauri app and nextjs app, this system need to register the log in a logfile in the app directory and manage diferent levet of log (INFO, WARN, ERRO, DEBUG, etc), and this levels can active by and env variable for dev and debug purpose, the default value if the min for a production env"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Developer Debugging Issues (Priority: P1)

As a developer, I want to enable detailed logging during development so that I can trace application behavior and diagnose issues quickly.

**Why this priority**: Debugging is the primary use case for logging. Without visible logs at various detail levels, developers cannot effectively troubleshoot issues during development.

**Independent Test**: Can be fully tested by setting the environment variable to DEBUG level, performing various application actions, and verifying that detailed logs appear in both console output and log files.

**Acceptance Scenarios**:

1. **Given** the log level environment variable is set to DEBUG, **When** the application starts, **Then** all log messages (DEBUG, INFO, WARN, ERROR) are written to the log file and console
2. **Given** the log level environment variable is set to INFO, **When** a DEBUG-level event occurs, **Then** the DEBUG message is not written to logs
3. **Given** the developer changes the log level environment variable, **When** the application is restarted, **Then** the new log level takes effect immediately

---

### User Story 2 - Production Error Tracking (Priority: P1)

As an operations engineer, I want production errors and warnings to be logged to a file so that I can investigate issues that occur in deployed applications.

**Why this priority**: Production logging is equally critical as it enables post-incident analysis and ensures important events are captured without verbose debug noise.

**Independent Test**: Can be fully tested by running the application without setting any log level variable (using defaults), triggering error conditions, and verifying only WARN and ERROR messages are persisted.

**Acceptance Scenarios**:

1. **Given** no log level environment variable is set, **When** an error occurs in the application, **Then** the error is logged to the log file with timestamp and context
2. **Given** the application is running with default settings, **When** a warning condition occurs, **Then** the warning is logged to the file
3. **Given** the application is running with default (production) settings, **When** an INFO-level event occurs, **Then** the INFO message is not written to the log file

---

### User Story 3 - Log File Management (Priority: P2)

As a system administrator, I want log files to be stored in a predictable location and managed for size so that disk space is not exhausted over time.

**Why this priority**: Log file management prevents disk exhaustion and ensures logs are discoverable, but the core logging functionality must work first.

**Independent Test**: Can be fully tested by running the application over time, generating logs, and verifying files are created in the expected location with appropriate rotation behavior.

**Acceptance Scenarios**:

1. **Given** the application starts, **When** a log event occurs, **Then** the log is written to a file in the application's data directory
2. **Given** a log file reaches the maximum size threshold, **When** a new log event occurs, **Then** the current log file is rotated and a new file is created
3. **Given** the application has been running for multiple days, **When** checking the log directory, **Then** old log files beyond the retention period have been automatically cleaned up

---

### User Story 4 - Unified Frontend and Backend Logging (Priority: P2)

As a developer, I want both the Tauri backend (Rust) and Next.js frontend (TypeScript) to use the same logging format and configuration so that I can correlate events across the full stack.

**Why this priority**: Unified logging improves debugging efficiency but requires the base logging infrastructure to exist first.

**Independent Test**: Can be fully tested by triggering events in both frontend and backend, examining the log file, and verifying consistent format and timestamps allow correlation.

**Acceptance Scenarios**:

1. **Given** an event occurs in the Rust backend, **When** checking the log file, **Then** the entry includes source identifier (backend), timestamp, level, and message
2. **Given** an event occurs in the TypeScript frontend, **When** checking the log file, **Then** the entry includes source identifier (frontend), timestamp, level, and message
3. **Given** events occur in both frontend and backend, **When** reviewing the log file, **Then** all entries use the same timestamp format and can be sorted chronologically

---

### Edge Cases

- What happens when the log directory does not exist or is not writable? (System creates directory or logs error to console as fallback)
- How does the system handle extremely rapid log events? (Buffer writes to prevent I/O bottleneck)
- What happens when disk space is critically low? (Log rotation triggers or oldest logs are pruned)
- How are log entries handled if they contain very long messages or special characters? (Truncation at reasonable limit, proper escaping)
- What happens when the application crashes? (Buffered logs are flushed on graceful shutdown; some loss acceptable on hard crash)

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST support log levels: DEBUG, INFO, WARN, ERROR (in order of verbosity)
- **FR-002**: System MUST read the minimum log level from an environment variable at application startup
- **FR-003**: System MUST default to WARN level when no environment variable is set (production-safe default)
- **FR-004**: System MUST write log entries to a file in the application's data directory
- **FR-005**: System MUST include timestamp, log level, source (frontend/backend), and message in each log entry
- **FR-006**: System MUST provide logging functions for both Rust (Tauri backend) and TypeScript (Next.js frontend)
- **FR-012**: Frontend logs MUST be transported to the backend via Tauri IPC commands for unified file writing
- **FR-013**: Log entries MUST be serialized as structured JSON (one JSON object per line) for machine parseability
- **FR-007**: System MUST output logs to console in development mode (when DEBUG or INFO level is set)
- **FR-008**: System MUST rotate log files when they exceed a configured size threshold
- **FR-009**: System MUST retain log files for a configurable retention period before cleanup
- **FR-010**: System MUST handle concurrent log writes from frontend and backend without data corruption
- **FR-011**: System MUST gracefully handle file system errors (directory not found, permission denied) with fallback to console logging

### Key Entities

- **Log Entry**: A single JSON object per line containing timestamp (ISO 8601), level (DEBUG/INFO/WARN/ERROR), source (frontend/backend), message text, and optional context data
- **Log File**: A persistent file storing log entries, identified by date and sequence number for rotation
- **Log Configuration**: Runtime settings including minimum level, file path, rotation threshold, and retention period

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Developers can enable DEBUG logging by setting a single environment variable and see all log levels in output
- **SC-002**: Production deployments capture all WARN and ERROR events without manual configuration
- **SC-003**: Log files are automatically rotated before reaching 10MB to prevent excessive disk usage
- **SC-004**: Log entries from frontend and backend can be correlated within 1 second accuracy using timestamps
- **SC-005**: System continues operating (with console fallback) if log file cannot be written
- **SC-006**: Old log files are automatically cleaned up after 7 days to manage disk space

## Clarifications

### Session 2025-12-22

- Q: How should frontend logs reach the log file (frontend cannot write directly to filesystem)? → A: Frontend sends logs to backend via Tauri IPC; backend writes to file
- Q: What serialization format should log entries use in the log file? → A: Structured JSON (one JSON object per line)

## Assumptions

- The environment variable name will follow platform conventions (e.g., `RAIC_LOG_LEVEL` or similar)
- Log rotation threshold defaults to 10MB per file (configurable)
- Log retention period defaults to 7 days (configurable)
- ISO 8601 timestamp format will be used for consistency and sortability
- Console output in production mode (WARN/ERROR only) is acceptable for container/service environments
- The application data directory location follows Tauri conventions (platform-specific app data path)
