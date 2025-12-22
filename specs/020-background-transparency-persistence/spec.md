# Feature Specification: Background Transparency Persistence Fix

**Feature Branch**: `020-background-transparency-persistence`
**Created**: 2025-12-22
**Status**: Draft
**Input**: User description: "Fix the background transparency toggle windows persistence, when the user activates fully transparent mode this setting is not persisted in the state.json file"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Persist Background Transparency Setting (Priority: P1)

As a user, I want my window background transparency toggle setting to be saved to the state.json file, so that when I restart the application, each window retains its background mode (solid or transparent) exactly as I configured it.

**Why this priority**: This is the core bug being fixed. The background transparency setting is changed but never persisted, causing users to lose their configuration on every application restart.

**Independent Test**: Can be fully tested by toggling a window background to transparent, closing the application, inspecting state.json to verify `backgroundTransparent: true` is present, then reopening the application and verifying the window appears with a transparent background.

**Acceptance Scenarios**:

1. **Given** a window has a solid background (default), **When** I click the background toggle to enable transparency, **Then** the `backgroundTransparent` property in state.json is updated to `true` for that window
2. **Given** a window has a transparent background, **When** I click the background toggle to disable transparency, **Then** the `backgroundTransparent` property in state.json is updated to `false` for that window
3. **Given** I have configured multiple windows with different background modes, **When** I restart the application, **Then** each window restores with its individually configured background mode from state.json

---

### User Story 2 - Immediate Persistence on Toggle (Priority: P2)

As a user, I want my background transparency change to be saved immediately after toggling, so that if the application unexpectedly closes, my setting is not lost.

**Why this priority**: Reliability of persistence is critical, but secondary to the core issue of persistence not happening at all.

**Independent Test**: Can be tested by toggling background transparency, waiting 500ms (within the debounce window), and inspecting state.json to verify the change was written.

**Acceptance Scenarios**:

1. **Given** I toggle the background transparency on a window, **When** I wait for the debounce period to complete, **Then** the state.json file reflects the updated `backgroundTransparent` value
2. **Given** I toggle the background transparency and the opacity slider in quick succession, **When** I inspect the state.json after both changes, **Then** both the `opacity` and `backgroundTransparent` values are correctly persisted

---

### Edge Cases

- What happens when the state update and persistence trigger race? The system must ensure the latest state is persisted, not a stale snapshot.
- What happens if `backgroundTransparent` is missing from persisted state (legacy data)? The system defaults to `false` (solid background) - this is already implemented.
- How does the toggle interact with the opacity slider? Both controls should persist independently without interfering with each other.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST persist the `backgroundTransparent` boolean value to state.json when the toggle is clicked
- **FR-002**: System MUST use the current state (not a stale reference) when serializing windows for persistence
- **FR-003**: System MUST persist the toggle change within the standard debounce window (currently 500ms for other window state changes)
- **FR-004**: System MUST restore the correct `backgroundTransparent` value from state.json on application startup (already working)
- **FR-005**: System MUST handle concurrent state updates (opacity + background toggle) without losing either value

### Key Entities

- **WindowStructure**: Already has `backgroundTransparent: boolean` field defined in persistence types - this is correct
- **WindowInstance**: Already has `backgroundTransparent: boolean` field in runtime state - this is correct
- **serializeWindow**: Already serializes `backgroundTransparent` field - this is correct
- **PersistenceContext.onWindowMoved**: The callback that triggers state persistence - this is where the bug likely exists (stale closure over `windows`)

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: When background transparency is toggled, state.json contains the updated `backgroundTransparent` value within 1 second
- **SC-002**: 100% of windows restore with correct background transparency mode on application restart
- **SC-003**: Background transparency setting persists correctly regardless of when other window properties (opacity, position, size) are changed
- **SC-004**: No data loss occurs when toggling background transparency and opacity slider in rapid succession

## Assumptions

- The existing persistence infrastructure (state.json file, Tauri IPC, debounce mechanism) is functioning correctly
- The bug is caused by a stale state reference in the persistence callback, not a serialization or file writing issue
- The `backgroundTransparent` field is already correctly defined in all type interfaces (confirmed via code inspection)
- The window restoration logic already correctly reads and applies the `backgroundTransparent` field (confirmed in app/page.tsx WindowRestorer)

## Root Cause Analysis

Based on code inspection, the likely root cause is in `PersistenceContext.tsx`:

```typescript
const onWindowMoved = useCallback(() => {
  saveStateDebounced(windows);  // 'windows' may be stale when callback executes
}, [windows, saveStateDebounced]);
```

When `BackgroundToggle` calls `onBackgroundTransparentChange(newValue)` followed by `onCommit()`:
1. `setWindowBackgroundTransparent` dispatches state update to WindowsContext
2. `onCommit()` calls `persistence?.onWindowMoved()`
3. The `onWindowMoved` callback may execute with the old `windows` array before React has re-rendered with the updated `backgroundTransparent` value

The fix needs to ensure that the state being persisted reflects the latest changes, either by:
- Reading state at persistence time rather than at callback creation
- Using a state getter function instead of a stale closure
- Ensuring state updates are flushed before persistence triggers
