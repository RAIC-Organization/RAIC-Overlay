# Research: Fix Browser and File Viewer First-Session Persistence

**Branch**: `034-fix-browser-persist`
**Date**: 2025-12-29

## Overview

This bug fix requires no external research. The solution follows an established pattern already present in the codebase.

## Findings

### Decision: Follow Existing Pattern

**Decision**: Use the same callback injection pattern already implemented for Notes and Draw windows.

**Rationale**:
- The pattern is proven to work (Notes and Draw windows persist correctly on first session)
- Maintains code consistency across all window types
- No new dependencies or abstractions required
- Single file modification with minimal risk

**Alternatives Considered**:
1. **Enhance fallback mechanism in content components**: Rejected because the primary path (callback injection) is the correct solution. The fallback exists as a safety net, not the primary persistence mechanism.
2. **Centralized persistence in WindowsContext**: Rejected because it would require significant refactoring and the current architecture is already correct - it just has missing implementations.

### Codebase Analysis

**Existing Working Pattern (Notes windows)**:
- `useWindowEvents.ts:51-59`: Injects `onContentChange` callback
- `NotesContent.tsx`: Receives callback via props
- `PersistenceContext.tsx:261-263`: `onNotesContentChange` triggers debounced save

**Bug Location**:
- `useWindowEvents.ts:70`: Missing handler for `browser` content type
- `useWindowEvents.ts:70`: Missing handler for `fileviewer` content type

**Required Callbacks Already Exist**:
- `PersistenceContext.tsx:275-280`: `onBrowserContentChange` is already implemented
- `PersistenceContext.tsx:283-288`: `onFileViewerContentChange` is already implemented

### Type Definitions

**Browser callback signature** (from `BrowserContentProps`):
```typescript
onContentChange?: (url: string, zoom: number) => void;
```

**File Viewer callback signature** (from `FileViewerContentProps`):
```typescript
onContentChange?: (filePath: string, fileType: FileType, zoom: number) => void;
```

**FileType enum** (from `@/types/persistence`):
```typescript
type FileType = 'pdf' | 'markdown' | 'image' | 'unknown';
```

## Conclusion

No external research required. All necessary infrastructure exists; only the callback injection code is missing from `useWindowEvents.ts`.
