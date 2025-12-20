# Research: Browser Window Persistence

**Feature**: 015-browser-persistence
**Date**: 2025-12-20

## Research Summary

This feature extends the existing state persistence system (010) to include Browser windows. Since the persistence infrastructure is already implemented and proven, research focused on understanding the existing patterns rather than evaluating alternatives.

## Existing Persistence Pattern Analysis

### 1. WindowType Enum Extension

**Decision**: Add `'browser'` to the existing `WindowType` union type

**Rationale**:
- Existing pattern: `WindowType = 'notes' | 'draw'`
- Extension is straightforward: `WindowType = 'notes' | 'draw' | 'browser'`
- Rust enum already uses serde with `#[serde(rename_all = "lowercase")]`
- No breaking changes to existing functionality

**Alternatives Considered**:
- Creating a separate persistence mechanism for Browser windows: Rejected (violates DRY, increases complexity)
- Using a generic "webview" type: Rejected (less specific, no benefit)

### 2. Browser Content Structure

**Decision**: Create `BrowserPersistedContent` interface with `url: string` and `zoom: number`

**Rationale**:
- Follows established pattern from `NotesContent` and `DrawContent`
- Minimal data - only URL and zoom need persistence (per spec)
- Navigation history explicitly NOT persisted (per spec FR-014)
- Simple JSON structure matches existing window content files

**Current BrowserContent State** (from `src/components/windows/BrowserContent.tsx`):
```typescript
const [url, setUrl] = useState(BROWSER_DEFAULTS.DEFAULT_URL);        // PERSIST
const [zoom, setZoom] = useState(BROWSER_DEFAULTS.DEFAULT_ZOOM);     // PERSIST
const [historyStack, setHistoryStack] = useState([...]);             // NOT persisted
const [historyIndex, setHistoryIndex] = useState(0);                 // NOT persisted
const [isLoading, setIsLoading] = useState(false);                   // NOT persisted
const [iframeKey, setIframeKey] = useState(0);                       // NOT persisted
```

**Alternatives Considered**:
- Persisting history stack: Rejected (spec explicitly excludes, adds complexity)
- Storing favicon/title: Rejected (can be derived from URL, adds maintenance burden)

### 3. Persistence Trigger Timing

**Decision**: Persist URL after iframe `onLoad` event, persist zoom immediately with debounce

**Rationale**:
- URL persistence after load captures final URL (handles redirects per FR-008)
- Zoom changes are user-initiated, benefit from immediate feedback persistence
- Both use existing 500ms debounce mechanism for consistency

**Existing Debounce Pattern** (from 010-state-persistence-system):
- Window move/resize: 500ms debounce
- Content changes (Notes typing): 500ms debounce
- Immediate events (window create/close): No debounce

**Browser-specific Mapping**:
| Trigger | Debounce | Rationale |
|---------|----------|-----------|
| URL navigation complete | 500ms | Handles redirect chains |
| Zoom change | 500ms | Matches content change pattern |
| Window opacity change | 500ms | Already handled by existing system |
| Window move/resize | 500ms | Already handled by existing system |

### 4. Validation and Clamping

**Decision**: Clamp invalid persisted values to valid ranges on load

**Rationale**:
- Matches edge case handling from spec
- Zoom range: 10% - 200% (from `BROWSER_DEFAULTS`)
- Opacity range: 30% - 100% (from existing opacity control)
- Graceful degradation over errors

**Implementation Approach**:
```typescript
const clampZoom = (value: number): number =>
  Math.max(BROWSER_DEFAULTS.ZOOM_MIN, Math.min(BROWSER_DEFAULTS.ZOOM_MAX, value));
```

### 5. BrowserContent Component Modification

**Decision**: Add props for initial state and change callbacks; lift state management to parent when persisted

**Rationale**:
- Component currently uses internal `useState` for all state
- For persistence, parent (WindowsContainer) must:
  1. Provide initial URL/zoom from hydration
  2. Receive change callbacks to trigger persistence
- Pattern matches how Notes/Draw handle persistence

**Current Props**:
```typescript
interface BrowserContentProps {
  isInteractive: boolean;
}
```

**Extended Props**:
```typescript
interface BrowserContentProps {
  isInteractive: boolean;
  windowId: string;
  initialUrl?: string;
  initialZoom?: number;
  onUrlChange?: (url: string) => void;
  onZoomChange?: (zoom: number) => void;
}
```

## Files Requiring Modification

| File | Change Type | Description |
|------|-------------|-------------|
| `src/types/persistence.ts` | Add types | Add `BrowserPersistedContent`, extend `WindowType` |
| `src/lib/serialization.ts` | Add case | Handle 'browser' type in serialization |
| `src/components/windows/BrowserContent.tsx` | Add props | Accept initial state, emit change events |
| `src-tauri/src/persistence_types.rs` | Add variant | Add `Browser` to `WindowType` enum |

## Dependencies

### Existing (No New Dependencies)
- `@tauri-apps/api` 2.0.0 - IPC for persistence commands
- `serde/serde_json` - Rust serialization (already used)

### No External Research Required
- All patterns established in 010-state-persistence-system
- No new libraries or APIs needed
- No Context7 lookups required (internal codebase extension)

## Risks and Mitigations

| Risk | Mitigation |
|------|------------|
| Iframe URL not readable due to CORS | Persist user-entered URL instead of iframe.contentWindow.location |
| Browser windows overwhelm storage | No concern - URL+zoom is ~100 bytes per window |
| Breaking change to persistence format | state.json version check already handles this |

## Conclusion

Implementation is straightforward extension of existing patterns. No architectural decisions required - follow established 010-state-persistence-system conventions throughout.
