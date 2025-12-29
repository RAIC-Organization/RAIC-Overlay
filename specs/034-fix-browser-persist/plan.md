# Implementation Plan: Fix Browser and File Viewer First-Session Persistence

**Branch**: `034-fix-browser-persist` | **Date**: 2025-12-29 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/034-fix-browser-persist/spec.md`

## Summary

Fix a bug where browser and file viewer windows do not persist URL/zoom/file changes during their first session. The root cause is that `useWindowEvents.ts` only injects persistence callbacks for `notes` and `draw` content types, but not for `browser` and `fileviewer` types. The fix follows the established pattern already used for Notes and Draw windows.

## Technical Context

**Language/Version**: TypeScript 5.7.2 (React 19.0.0 frontend), Rust 2021 Edition (Tauri backend - unchanged)
**Primary Dependencies**: React 19.0.0, Next.js 16.x, Tauri 2.x, @tauri-apps/api 2.0.0
**Storage**: JSON files in Tauri app data directory (state.json + window-{id}.json)
**Testing**: Manual testing (integration), type checking via TypeScript
**Target Platform**: Windows 11 (64-bit)
**Project Type**: Desktop application (Tauri + React/Next.js)
**Performance Goals**: Persistence within 500ms debounce period
**Constraints**: Must follow existing patterns for Notes/Draw windows
**Scale/Scope**: Single file modification (~20 lines of code)

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Status | Notes |
|-----------|--------|-------|
| I. Code Quality | PASS | Fix follows existing code patterns, maintains single responsibility |
| II. Testing Standards | PASS* | *Manual integration testing per verification steps; automated tests not added because: (1) fix is ~25 lines following existing pattern, (2) no new logic introduced, (3) verifies existing infrastructure works correctly. See Verification Steps section. |
| III. User Experience Consistency | PASS | Fix ensures all window types behave consistently |
| IV. Performance Requirements | PASS | No performance impact; uses existing debounced save mechanism |
| V. Research-First Development | PASS | No new libraries; follows established codebase patterns |

**Simplicity Standard Check:**
- Solution uses the simplest approach: add 2 conditional blocks following existing pattern
- No new dependencies required
- No new abstractions introduced
- Code duplication eliminated by following consistent pattern across all window types

## Project Structure

### Documentation (this feature)

```text
specs/034-fix-browser-persist/
├── plan.md              # This file
├── research.md          # Phase 0 output (minimal - no unknowns)
├── data-model.md        # Phase 1 output (N/A - no data model changes)
├── quickstart.md        # Phase 1 output
└── tasks.md             # Phase 2 output (created by /speckit.tasks)
```

### Source Code (repository root)

```text
src/
├── hooks/
│   └── useWindowEvents.ts    # PRIMARY CHANGE: Add browser/fileviewer callback injection
├── components/
│   └── windows/
│       ├── BrowserContent.tsx      # Reference: has fallback mechanism (unchanged)
│       └── FileViewerContent.tsx   # Reference: has fallback mechanism (unchanged)
├── contexts/
│   └── PersistenceContext.tsx      # Reference: provides persistence callbacks (unchanged)
└── types/
    └── persistence.ts              # Reference: type definitions (unchanged)
```

**Structure Decision**: Single project structure. Only `src/hooks/useWindowEvents.ts` requires modification.

## Complexity Tracking

> No violations. This is a minimal bug fix following established patterns.

## Root Cause Analysis

### Current Code Flow (Broken)

```
MainMenu.tsx
  └─ windowEvents.emit('window:open', { contentType: 'browser', ... })
        └─ useWindowEvents.ts:openWindowWithPersistence()
              ├─ Handles 'notes' → injects onContentChange callback ✓
              ├─ Handles 'draw' → injects onContentChange callback ✓
              ├─ Handles 'browser' → NO CALLBACK INJECTION ✗
              └─ Handles 'fileviewer' → NO CALLBACK INJECTION ✗
```

### Fixed Code Flow

```
MainMenu.tsx
  └─ windowEvents.emit('window:open', { contentType: 'browser', ... })
        └─ useWindowEvents.ts:openWindowWithPersistence()
              ├─ Handles 'notes' → injects onContentChange callback ✓
              ├─ Handles 'draw' → injects onContentChange callback ✓
              ├─ Handles 'browser' → injects onContentChange callback ✓ (NEW)
              └─ Handles 'fileviewer' → injects onContentChange callback ✓ (NEW)
```

## Implementation Details

### File: `src/hooks/useWindowEvents.ts`

**Location**: After line 70 (after the draw window handler, before `return openWindow(enhancedPayload)`)

**Pattern to follow** (from existing notes handler, lines 51-59):
```typescript
if (payload.contentType === 'notes' && persistenceRef.current) {
  enhancedPayload.componentProps = {
    ...enhancedPayload.componentProps,
    onContentChange: (content: any) => {
      persistenceRef.current?.onNotesContentChange(windowId, content);
    },
  };
}
```

**New code to add for browser windows**:
```typescript
// Add content change callback for browser windows
if (payload.contentType === 'browser' && persistenceRef.current) {
  enhancedPayload.componentProps = {
    ...enhancedPayload.componentProps,
    onContentChange: (url: string, zoom: number) => {
      persistenceRef.current?.onBrowserContentChange(windowId, url, zoom);
    },
  };
}
```

**New code to add for file viewer windows**:
```typescript
// Add content change callback for file viewer windows
if (payload.contentType === 'fileviewer' && persistenceRef.current) {
  enhancedPayload.componentProps = {
    ...enhancedPayload.componentProps,
    onContentChange: (filePath: string, fileType: FileType, zoom: number) => {
      persistenceRef.current?.onFileViewerContentChange(windowId, filePath, fileType, zoom);
    },
  };
}
```

**Required import** (add to existing imports):
```typescript
import type { FileType } from '@/types/persistence';
```

## Verification Steps

1. **Pre-fix verification** (confirm bug exists):
   - Start app fresh (delete state.json and window-*.json)
   - Create browser window, navigate to https://google.com
   - Close app
   - Restart app
   - Observe: Browser shows https://example.com (bug)

2. **Post-fix verification**:
   - Start app fresh (delete state files)
   - Create browser window, navigate to https://google.com
   - Close app
   - Restart app
   - Observe: Browser shows https://google.com (fixed)

3. **File viewer verification**:
   - Same flow with file viewer: open file, adjust zoom, restart
   - Verify file and zoom are restored

4. **Regression check**:
   - Verify Notes and Draw windows still persist correctly
   - Verify restored windows (after second restart) still work
