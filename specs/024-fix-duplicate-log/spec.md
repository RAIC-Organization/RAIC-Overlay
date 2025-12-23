# Feature Specification: Fix Duplicate Log File

**Feature Branch**: `024-fix-duplicate-log`
**Created**: 2025-12-23
**Status**: Draft
**Input**: User description: "Fix the duplicate log file removing the .target and using the default RAIC Overlay.log file"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Single Log File Output (Priority: P1)

As a developer or user reviewing application logs, I want only one log file to exist so that I can find all log entries in a single, predictable location without confusion about which file contains the relevant information.

**Why this priority**: This is the core problem being solved - eliminating the confusion and disk space waste caused by duplicate log files. Without this, users must check two separate files to get complete logging information.

**Independent Test**: Can be fully tested by launching the application, performing actions that generate logs, then verifying only one log file exists in the logs directory with all expected entries.

**Acceptance Scenarios**:

1. **Given** the application is freshly installed, **When** the user launches the application, **Then** only the "RAIC Overlay.log" file is created in the logs directory
2. **Given** the application is running, **When** log events occur, **Then** all log entries appear in "RAIC Overlay.log" and no "app.log" file exists
3. **Given** a user previously had both log files from an older version, **When** they upgrade and run the new version, **Then** new log entries only go to "RAIC Overlay.log" (existing app.log remains but receives no new entries)

---

### User Story 2 - Consistent Log File Naming (Priority: P2)

As a user searching for log files, I want the log file to be named after the application ("RAIC Overlay.log") so that I can easily identify which application generated the logs.

**Why this priority**: Secondary to the main fix, but important for user experience when troubleshooting or sharing logs for support.

**Independent Test**: Can be verified by checking the logs directory and confirming the log file name matches the application's product name.

**Acceptance Scenarios**:

1. **Given** the application is installed, **When** the user navigates to the logs directory, **Then** they find a log file named "RAIC Overlay.log" that clearly identifies the source application

---

### Edge Cases

- What happens when the logs directory does not exist? (System should create it automatically - existing behavior)
- How does the system handle log rotation? (Existing rotation behavior with "RAIC Overlay.log.1", ".2", etc. should continue to work)
- What happens to existing "app.log" files from previous versions? (They remain untouched; cleanup is handled by existing 7-day retention policy)

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST write all log entries to a single file named "RAIC Overlay.log" in the application's log directory
- **FR-002**: System MUST NOT create an additional "app.log" file
- **FR-003**: System MUST maintain all existing logging functionality including:
  - JSON-formatted structured logs
  - Log level filtering based on RAIC_LOG_LEVEL environment variable
  - 10MB maximum file size before rotation
  - KeepAll rotation strategy
  - Console output when log level is DEBUG or INFO
- **FR-004**: System MUST continue to support the existing log cleanup mechanism (7-day retention)
- **FR-005**: The get_log_file_path command MUST return the path to "RAIC Overlay.log" instead of "app.log"

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: After application launch, exactly one log file exists in the logs directory (excluding rotated files like .log.1, .log.2)
- **SC-002**: All log entries from a test session are found in "RAIC Overlay.log" with zero entries in any "app.log" file
- **SC-003**: Log file size is reduced by approximately 50% compared to the previous dual-file approach (since data is no longer duplicated)
- **SC-004**: The `get_log_file_path` command returns a path ending in "RAIC Overlay.log"

## Assumptions

- The default log file name used by the logging plugin matches the application's `productName` from tauri.conf.json ("RAIC Overlay")
- The existing log cleanup mechanism will eventually remove orphaned "app.log" files from users who upgrade (within 7 days)
- No external tools or scripts depend on the "app.log" filename specifically
