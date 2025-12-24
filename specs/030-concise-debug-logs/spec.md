# Feature Specification: Concise Debug Logs

**Feature Branch**: `030-concise-debug-logs`
**Created**: 2025-12-24
**Status**: Draft
**Input**: User description: "Make the debug logs more concise, today the logfile is constantly write by a circular process of app detection, with this the log files is hard to read, so we need to refactor the debug log for be more concise, don't write in loop process only on events, for example, the startup, the start of the loop, the event of detection or error inside the loop, so the expected is have a log file more concise and easy to read for a developer"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Developer Reads Log File for Debugging (Priority: P1)

A developer opens the application log file to investigate an issue. Instead of scrolling through thousands of repetitive "checking window" entries generated every 100ms, they see a clean timeline of meaningful events: application startup, monitor initialization, process detection, focus changes, and errors.

**Why this priority**: This is the core value proposition - making logs readable and useful for debugging. Without this, the log files are practically unusable due to noise.

**Independent Test**: Can be fully tested by running the application for 5 minutes with the target process running, then examining the log file. The log should contain clearly separated events rather than continuous polling output.

**Acceptance Scenarios**:

1. **Given** the application is running with monitoring active, **When** no events occur (target process running, focused, stable), **Then** no new log entries are written during that stable period
2. **Given** the application is running and generating logs, **When** a developer opens the log file, **Then** they can identify distinct events (startup, detection, focus changes) without scrolling through repetitive entries
3. **Given** monitoring has been running for 30 minutes, **When** examining the log file, **Then** the log file size remains proportional to actual events, not elapsed time

---

### User Story 2 - Developer Troubleshoots Detection Failure (Priority: P2)

A developer needs to understand why the target window is not being detected. They enable trace-level logging to see detailed candidate evaluation, but this verbose output is opt-in rather than default.

**Why this priority**: Detailed debugging capability is important but secondary to having clean default logs. Developers need the ability to dive deep when required.

**Independent Test**: Can be tested by changing the log level to TRACE, running the application, and verifying that detailed candidate information appears only at TRACE level.

**Acceptance Scenarios**:

1. **Given** the log level is set to DEBUG (default), **When** window detection runs in a loop, **Then** individual candidate evaluations are NOT logged
2. **Given** the log level is set to TRACE, **When** window detection runs, **Then** detailed candidate information (process, class, title, match result) IS logged
3. **Given** a detection failure occurs, **When** the log level is DEBUG, **Then** a single summary line indicates the failure with search criteria

---

### User Story 3 - Developer Monitors Application Startup (Priority: P3)

A developer wants to verify the application initialized correctly by reviewing startup logs. They see clear initialization messages for each subsystem without being overwhelmed by subsequent polling activity.

**Why this priority**: Startup logging provides confidence that the application configured correctly, but is less frequently needed than ongoing event debugging.

**Independent Test**: Can be tested by starting the application and verifying that startup messages are clearly visible and not interleaved with polling output.

**Acceptance Scenarios**:

1. **Given** the application is starting, **When** initialization completes, **Then** each major subsystem logs exactly one "started" message with relevant configuration
2. **Given** the application has started, **When** monitoring loops begin, **Then** exactly one "monitoring loop started" message is logged per monitor (not per iteration)

---

### Edge Cases

- What happens when detection succeeds after many failures? Log only the success event, not each failed attempt.
- How does system handle rapid focus changes? Log each distinct focus transition, but deduplicate rapid oscillations within a 500ms window.
- What happens during application shutdown? Log graceful shutdown events even if they occur during a polling cycle.
- How are error conditions logged? Errors are always logged immediately, regardless of log level or rate limiting.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST log application startup with subsystem initialization status (one line per major component)
- **FR-002**: System MUST log monitoring loop start exactly once when polling begins, not on each iteration
- **FR-003**: System MUST log process detection events (detected/terminated) when target process state changes
- **FR-004**: System MUST log focus change events (gained/lost) when focus state actually transitions
- **FR-005**: System MUST NOT log routine polling checks when no state change occurs (at DEBUG level)
- **FR-006**: System MUST log all errors immediately regardless of any rate limiting or deduplication
- **FR-007**: System MUST provide TRACE level for detailed per-poll diagnostic information when needed
- **FR-008**: System MUST log window candidate details only at TRACE level, not DEBUG
- **FR-009**: System MUST log a summary when detection completes at DEBUG level (not per-candidate details)
- **FR-010**: System MUST deduplicate rapid focus oscillations by logging at most once per 500ms for the same state transition

### Key Entities

- **LogEvent**: A discrete, meaningful occurrence worth recording (startup, detection, focus change, error, shutdown)
- **PollingCycle**: A single iteration of a monitoring loop; NOT a log event unless it produces a state change
- **LogLevel**: Severity/verbosity classification (ERROR, WARN, INFO, DEBUG, TRACE) controlling what gets logged

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Log file size after 30 minutes of stable operation (no events) increases by less than 1KB
- **SC-002**: Developer can identify when target process was detected by scanning logs in under 10 seconds
- **SC-003**: Log entries per minute during stable operation (process running, focused) averages less than 1
- **SC-004**: All state transitions (startup, detection, focus change, shutdown) are logged with timestamps
- **SC-005**: 100% of errors are logged immediately with full context, regardless of deduplication settings
- **SC-006**: Switching to TRACE level provides detailed per-candidate window information for debugging

## Assumptions

- The existing log crate and tauri-plugin-log infrastructure will be used
- Log levels are configurable at runtime or startup via existing settings mechanisms
- The focus monitor polls every 100ms and process monitor polls at a configurable interval (default 1000ms)
- TRACE level logging may impact performance and is intended for short debugging sessions only
