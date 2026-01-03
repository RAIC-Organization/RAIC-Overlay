# Research: Check for Update Button in Settings Panel

**Feature**: 052-settings-update-button
**Date**: 2026-01-03

## Research Summary

This feature requires no new external dependencies. All functionality is built on existing codebase infrastructure. Research focused on understanding current implementations.

---

## 1. Existing Update Check Command

**Decision**: Reuse the existing `check_for_updates` Tauri command

**Rationale**:
- Command already implements GitHub release checking logic
- Handles version comparison, pre-release filtering, MSI asset discovery
- Automatically populates `UpdateWindowState` when update found
- Triggers `open_update_window()` when update detected

**Alternatives Considered**:
- Create new command specific to manual checks → Rejected: unnecessary duplication
- Call GitHub API directly from frontend → Rejected: inconsistent with existing architecture

**Key Findings**:
```rust
// src-tauri/src/update/checker.rs
#[tauri::command]
pub async fn check_for_updates(app: tauri::AppHandle) -> Result<UpdateCheckResult, String>
```

Return type:
```typescript
interface UpdateCheckResult {
  updateAvailable: boolean;
  updateInfo: UpdateInfo | null;
}
```

---

## 2. Update Window Management

**Decision**: Reuse existing `open_update_window` mechanism (called automatically by backend)

**Rationale**:
- The `check_for_updates` command already spawns async task to open update window
- No frontend call needed to open window - backend handles it
- If window already exists, it focuses instead of duplicating

**Alternatives Considered**:
- Frontend manually calls `open_update_window` → Rejected: backend already handles this
- Create separate manual update window → Rejected: inconsistent UX

**Key Findings**:
The backend automatically opens the update window when `check_for_updates` detects an update:
```rust
// src-tauri/src/update/checker.rs (lines 89-95)
let app_clone = app.clone();
tauri::async_runtime::spawn(async move {
    if let Err(e) = update_window::open_update_window(app_clone, state_clone).await {
        log::error!("Failed to open update window: {}", e);
    }
});
```

---

## 3. Version Display

**Decision**: Use `getVersion()` from `@tauri-apps/api/app` (existing pattern)

**Rationale**:
- Already used in SettingsPanel footer for version display
- Returns version string from tauri.conf.json
- Consistent with existing codebase pattern

**Alternatives Considered**:
- Hardcode version → Rejected: maintenance burden, inconsistent
- Call separate backend command → Rejected: Tauri API already provides this

**Key Findings**:
```typescript
import { getVersion } from "@tauri-apps/api/app";

useEffect(() => {
  getVersion().then(setAppVersion);
}, []);
```

---

## 4. Settings Section Pattern

**Decision**: Follow existing SettingsPanel section structure

**Rationale**:
- Hotkeys and Startup sections provide consistent template
- Section header with icon + title pattern
- Content area with controls
- Consistent styling with Tailwind classes

**Alternatives Considered**:
- Different layout/styling → Rejected: violates UX consistency principle

**Key Findings** (from SettingsPanel.tsx):
```tsx
{/* Section Structure Pattern */}
<div className="space-y-4">
  {/* Section Header */}
  <div className="flex items-center gap-2">
    <IconComponent className="w-4 h-4 text-cyan-400" />
    <span className="text-sm font-semibold text-cyan-300">Section Title</span>
  </div>
  {/* Section Content */}
  <div className="space-y-3">
    {/* Controls here */}
  </div>
</div>
```

---

## 5. Button Loading State Pattern

**Decision**: Use React state with disabled prop and spinner icon

**Rationale**:
- Standard React pattern for async button actions
- Prevents double-clicks
- Provides immediate visual feedback

**Alternatives Considered**:
- Global loading state → Rejected: over-engineering for single button
- Optimistic UI → Rejected: network operation needs explicit feedback

**Implementation Pattern**:
```tsx
const [isChecking, setIsChecking] = useState(false);

<Button
  onClick={handleCheckForUpdates}
  disabled={isChecking}
>
  {isChecking ? (
    <>
      <Loader2 className="w-4 h-4 animate-spin mr-2" />
      Checking...
    </>
  ) : (
    <>
      <RefreshCw className="w-4 h-4 mr-2" />
      Check for Updates
    </>
  )}
</Button>
```

---

## 6. Inline Status Message Pattern

**Decision**: Conditional text rendering below button with status-based styling

**Rationale**:
- Clarification confirmed inline messages over toast/modal
- Color-coded: success (green), error (red), info (cyan)
- Auto-clears on next check attempt

**Alternatives Considered**:
- Toast notifications → Rejected: user specified inline
- Modal dialogs → Rejected: too intrusive for status messages

**Implementation Pattern**:
```tsx
type StatusType = 'idle' | 'success' | 'error';
const [status, setStatus] = useState<{type: StatusType; message: string}>({
  type: 'idle',
  message: ''
});

{status.message && (
  <p className={cn(
    "text-xs mt-2",
    status.type === 'success' && "text-green-400",
    status.type === 'error' && "text-red-400"
  )}>
    {status.message}
  </p>
)}
```

---

## No Unknowns Remaining

All technical decisions resolved:
1. ✅ Update check mechanism (reuse existing command)
2. ✅ Update window display (handled by backend automatically)
3. ✅ Version access (Tauri API)
4. ✅ Section layout (follow existing pattern)
5. ✅ Loading state (React state + disabled prop)
6. ✅ Status messages (inline text with color coding)
