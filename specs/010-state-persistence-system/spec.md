# Feature Specification: State Persistence System

**Feature Branch**: `010-state-persistence-system`
**Created**: 2025-12-19
**Status**: Draft
**Input**: User description: "Create a persistence system where the frontend (Next.js/React) keeps the entire overlay state in memory as the single source of truth, including the global overlay state (mode, visibility), the structural state of windows (ID, type, position, size, order, flags), and the internal state of each embedded application. This state must be managed through a centralized store or context and expose clear serialization and hydration capabilities. The frontend is responsible for defining the events that trigger persistence, such as window creation and removal, overlay mode changes, and the end of user interactions like drag and resize, avoiding continuous saves during active interactions by applying debounce to consolidate high-frequency changes and persist only when the state becomes stable. When a user closes or deletes a window, the frontend must immediately remove that window and its internal data from the in-memory state, and this removal must be persisted so the window cannot be restored in future sessions. The Tauri backend (Rust) must act exclusively as a durable storage layer, exposing commands to save, load, and delete persisted state without embedding business logic. The serialized state should be stored as versioned JSON files inside the application's data directory, ensuring a persistent, OS-specific location. When a window is permanently closed, the backend must also delete any JSON files associated with that window's persisted state, ensuring no orphaned or recoverable data remains on disk. On application startup, the frontend must request the last saved global state from the backend and, if present, hydrate the store before or during the initial render to reconstruct the overlay, windows, and embedded applications exactly as they were in the previous session, falling back to a default state if no persisted data exists."

## Clarifications

### Session 2025-12-19

- Q: Should "close" and "delete" be distinct operations (close = hide/recoverable, delete = permanent), or are all closures permanent? → A: All window closures are permanent deletions with no recovery option.
- Q: Should persisted state files be encrypted to protect user content? → A: No encryption needed; OS file permissions in the app data directory are sufficient.
- Q: Should the system implement full state migrations or reset to defaults on version mismatch? → A: Reset to defaults for now, but structure code with migration hooks for future versions.
- Q: What should users see while state is being restored on startup? → A: Block render until hydrated, showing a splash/loading screen to prevent visual pop-in.
- Q: What happens if the user launches the app while it's already running? → A: Enforce single instance; focus the existing window instead of launching a new one.
- Q: What file structure should be used for persistence? → A: Hybrid approach with `state.json` (global settings + window structure/metadata) and separate `window-{id}.json` files for each window's content.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Session Restoration on Application Launch (Priority: P1)

A user opens the RAICOverlay application after having previously used it with multiple windows arranged in a specific layout. Upon launch, the application automatically reconstructs the exact state from their last session - all windows appear in their previous positions, sizes, and z-order, with each embedded application (notes, drawings, etc.) containing the same content they had when the user last closed the application.

**Why this priority**: This is the core value proposition of the persistence system. Without session restoration, users would lose all their work and window arrangements every time they close the application, making it frustrating to use for any serious workflow.

**Independent Test**: Can be fully tested by arranging windows with content, closing the application, reopening it, and verifying the complete state is restored. Delivers immediate value by preserving user work.

**Acceptance Scenarios**:

1. **Given** a user has previously used the application with 3 windows positioned across the screen, **When** the user launches the application, **Then** all 3 windows appear in their exact previous positions, sizes, and z-order within 2 seconds of launch.
2. **Given** a user has notes and drawings in their windows from a previous session, **When** the application starts, **Then** each window contains the exact content (text, drawings) from the previous session.
3. **Given** a user has never used the application before (no persisted state exists), **When** the user launches the application, **Then** the application starts with a clean default state (no windows open, overlay in default mode).
4. **Given** persisted state data is corrupted or invalid, **When** the application attempts to load state, **Then** the application falls back to default state and logs the error without crashing.

---

### User Story 2 - Automatic State Persistence During Use (Priority: P2)

While a user works with the overlay, the system automatically saves their state at appropriate moments - when they create or close windows, change overlay modes, or finish dragging/resizing windows. The user never needs to manually save; their work is protected automatically. The system is smart enough to wait until interactions are complete rather than saving continuously during active drag operations.

**Why this priority**: Automatic persistence ensures no data loss during normal use. Without this, users could lose work if the application crashes or is closed unexpectedly. It depends on the state structure from P1.

**Independent Test**: Can be tested by performing various actions (create window, move window, type content), then forcefully terminating the application and reopening to verify state was saved.

**Acceptance Scenarios**:

1. **Given** a user creates a new window, **When** the window creation completes, **Then** the new window state is persisted within 1 second.
2. **Given** a user is actively dragging a window, **When** the drag is in progress, **Then** the system does NOT persist state (avoids unnecessary saves).
3. **Given** a user finishes dragging a window to a new position, **When** the drag interaction ends, **Then** the new position is persisted within 500ms after drag completion.
4. **Given** a user is typing rapidly in a notes window, **When** typing pauses for more than 500ms, **Then** the notes content is persisted (debounced saves).
5. **Given** the user toggles the overlay mode (visible/hidden), **When** the mode changes, **Then** the new mode is persisted within 500ms.

---

### User Story 3 - Permanent Window Closure (Priority: P2)

When a user closes a window, that window and all its associated data are completely removed from both memory and disk storage. All window closures are permanent - the window cannot be recovered in future sessions. This ensures users have control over their data and no orphaned files accumulate.

**Why this priority**: Equal to P2 as it's the counterpart to automatic persistence. Users must be able to remove windows permanently; otherwise storage would grow indefinitely and users couldn't clean up unwanted content.

**Independent Test**: Can be tested by creating a window with content, closing it, restarting the application, and verifying the window does not reappear and no orphaned data files exist.

**Acceptance Scenarios**:

1. **Given** a user has a window with content, **When** the user closes the window, **Then** the window is immediately removed from the in-memory state.
2. **Given** a window has been closed, **When** the state is persisted, **Then** no data for that window exists in the persisted state file.
3. **Given** a window had associated persisted data files, **When** the window is closed, **Then** all associated data files are deleted from disk within 1 second.
4. **Given** a window was closed, **When** the application is restarted, **Then** the window does not reappear and cannot be recovered.

---

### User Story 4 - State Versioning for Future Compatibility (Priority: P3)

The persisted state includes version information that allows the system to handle state format changes gracefully in future application updates. If the state format changes between versions, the system can detect version mismatches and reset to defaults safely. The code structure includes migration hooks so that future versions can implement data migrations when needed, but the initial implementation only supports reset behavior.

**Why this priority**: While important for long-term maintainability, this is less critical for initial functionality. The application resets to defaults on version mismatch initially; migrations can be added later.

**Independent Test**: Can be tested by creating state with version 1 format, updating the expected version number, and verifying the system handles the mismatch appropriately.

**Acceptance Scenarios**:

1. **Given** state is persisted, **When** the state file is examined, **Then** it contains a version identifier.
2. **Given** the application loads state from a compatible version, **When** hydration occurs, **Then** the state is restored normally.
3. **Given** the application loads state from an incompatible/unknown version, **When** hydration is attempted, **Then** the system falls back to default state and notifies the user that previous state could not be restored.

---

### Edge Cases

- What happens when disk space is full during a persist operation?
  - System logs the error and continues operating with in-memory state; notifies user that state could not be saved
- What happens if the application crashes during a persist operation?
  - System uses atomic write operations (write to temp file, then rename) to prevent corruption
- What happens when multiple state changes occur in rapid succession?
  - Debounce mechanism consolidates changes and persists only the final stable state
- What happens if the persisted file is manually deleted by the user?
  - Application detects missing file on load and starts with default state
- What happens if the persisted file is read-only or inaccessible?
  - Application logs the error, continues with in-memory state, and notifies user
- What happens if a user tries to launch the application while it's already running?
  - System enforces single instance; the existing window is focused instead of launching a new instance
- What happens if a `window-{id}.json` content file is missing but the window is listed in `state.json`?
  - The window is restored with its structural data (position, size) but with empty/default content; the missing content file is logged as a warning

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST maintain all overlay state in memory as the single source of truth in a centralized store
- **FR-002**: System MUST persist global overlay state including mode (windowed/fullscreen) and visibility settings
- **FR-003**: System MUST persist structural window state including identifier, type, position (x, y), size (width, height), z-order, and flags (minimized, maximized, etc.)
- **FR-004**: System MUST persist internal state of each embedded application (notes content, drawing data, etc.)
- **FR-005**: System MUST expose serialization capability to convert in-memory state to a persistable format
- **FR-006**: System MUST expose hydration capability to reconstruct in-memory state from persisted data
- **FR-007**: System MUST trigger persistence on window creation events
- **FR-008**: System MUST trigger persistence on window closure events (all closures are permanent)
- **FR-009**: System MUST trigger persistence on overlay mode changes
- **FR-010**: System MUST trigger persistence at the end of user interactions (drag completion, resize completion)
- **FR-011**: System MUST apply debounce to consolidate high-frequency changes (such as typing or rapid adjustments) and persist only when state becomes stable
- **FR-012**: System MUST immediately remove window and its internal data from in-memory state when user closes a window
- **FR-013**: System MUST persist window removal so closed windows cannot be restored in future sessions
- **FR-014**: Backend storage layer MUST NOT contain business logic - only save, load, and delete operations
- **FR-015**: System MUST store persisted state in the application's designated data directory (OS-specific location)
- **FR-016**: System MUST include version information in persisted state for future compatibility
- **FR-016a**: System MUST be structured with migration hooks to allow future version migrations, even though initial implementation only resets to defaults on version mismatch
- **FR-017**: Backend MUST delete the `window-{id}.json` content file when that window is closed, and update `state.json` to remove the window's structural entry
- **FR-018**: System MUST request and load last saved state on application startup, blocking UI render until hydration completes (displaying a loading/splash screen)
- **FR-019**: System MUST fall back to default state if no persisted data exists or if persisted data is invalid/corrupted
- **FR-020**: System MUST use atomic write operations to prevent state corruption during persist operations
- **FR-021**: System MUST enforce single instance; if the application is already running, focus the existing window instead of launching a new instance

### Key Entities

- **OverlayState**: The root state container representing the complete application state, including version, global settings, and all windows
- **GlobalSettings**: Application-wide settings including overlay mode (active/inactive), visibility state, and any global preferences
- **WindowState**: Individual window data including unique identifier, window type (notes, drawing, etc.), position (x, y coordinates), size (width, height), z-order for stacking, and window flags (minimized, maximized, locked)
- **EmbeddedApplicationState**: Internal state specific to each window type - notes content for notes windows, drawing data for drawing windows, etc. Polymorphic based on window type
- **PersistedStateFile** (`state.json`): Contains version metadata, global settings, and an array of window structural data (ID, type, position, size, z-order, flags) - but NOT window content
- **WindowContentFile** (`window-{id}.json`): Contains the internal state/content for a specific window (notes text, drawing data, etc.), referenced by window ID

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Application restores previous session state within 2 seconds of launch for typical usage (up to 20 windows)
- **SC-002**: State persistence operations complete within 500ms of trigger event under normal conditions
- **SC-003**: No data loss occurs during normal application usage - all changes made more than 2 seconds before shutdown are preserved
- **SC-004**: Zero orphaned data files remain on disk after windows are closed
- **SC-005**: Application handles corrupted or missing state files gracefully, starting with defaults 100% of the time without crashing
- **SC-006**: Debounce mechanism reduces persist operations by at least 80% during rapid user interactions (e.g., continuous typing)
- **SC-007**: State file size grows linearly with number of windows and content, with no unbounded growth

## Assumptions

- The application already has an existing window management system that this persistence system will integrate with
- Windows are uniquely identifiable through persistent IDs that remain stable across sessions
- Embedded applications (notes, drawings) have internal state that can be serialized and deserialized
- The target platform provides a writable application data directory
- Users expect automatic persistence and do not require manual save functionality
- A hybrid file structure is used: `state.json` for global settings and window structure, plus separate `window-{id}.json` files for each window's content (notes text, drawing data, etc.)
- Debounce delay of 500ms is acceptable for most user interactions
- No encryption is required for persisted state files; OS-level file permissions in the app data directory provide sufficient protection for this local desktop application
