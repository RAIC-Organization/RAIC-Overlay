# Research: Settings Version Display

**Feature**: 047-settings-version-display
**Date**: 2026-01-02

## Research Questions

### 1. How to retrieve application version at runtime in Tauri 2.x?

**Decision**: Use `getVersion()` from `@tauri-apps/api/app`

**Rationale**:
- Tauri 2.x provides a dedicated `app` module with `getVersion()` function
- Returns a `Promise<string>` that resolves to the version from `tauri.conf.json`
- Already available in the project's `@tauri-apps/api` 2.0.0 dependency
- No additional plugins or Rust backend changes required

**Alternatives Considered**:
1. **Create custom Rust command**: Rejected - unnecessary complexity when Tauri provides built-in API
2. **Read version from package.json**: Rejected - would require bundler configuration and doesn't match Tauri's authoritative version source
3. **Hardcode version**: Rejected - violates DRY principle and requires manual updates

**Implementation Pattern**:
```typescript
import { getVersion } from '@tauri-apps/api/app';

// In component
const [version, setVersion] = useState<string | null>(null);

useEffect(() => {
  getVersion()
    .then(setVersion)
    .catch(() => setVersion(null));
}, []);
```

**Source**: [Tauri 2.x App Module API Reference](https://v2.tauri.app/reference/javascript/api/namespaceapp/)

---

### 2. Where to position version text following UI standards?

**Decision**: Bottom-left of footer section, after the Save button

**Rationale**:
- Industry standard placement (Windows Settings, macOS System Preferences, VS Code, Discord, Slack)
- Footer area is fixed and always visible (not affected by scroll)
- Existing SettingsPanel footer already has the right structure
- Position does not interfere with primary action (Save button)

**Alternatives Considered**:
1. **Header area**: Rejected - competes with title and close button
2. **Separate "About" section**: Rejected - over-engineering for a single version string
3. **Bottom-center**: Acceptable but bottom-left preferred for left-to-right reading flow

---

### 3. What styling matches existing SC HUD theme?

**Decision**: Use `text-xs text-muted-foreground font-display` classes

**Rationale**:
- `text-xs`: Smaller than regular content (matches FR-002)
- `text-muted-foreground`: Subtle/non-intrusive (matches FR-003)
- `font-display`: Consistent with other settings panel text
- Matches existing section headers styling pattern

**Code Pattern**:
```tsx
<span className="text-xs text-muted-foreground font-display">
  v{version}
</span>
```

---

### 4. How to handle version retrieval failure?

**Decision**: Display "Version unavailable" fallback text

**Rationale**:
- Graceful degradation as specified in FR-006
- Same position and styling as successful version display
- Does not block panel functionality
- Provides user feedback instead of empty space

**Implementation**:
```tsx
{version ? `v${version}` : 'Version unavailable'}
```

## Summary

All research questions resolved. The implementation requires:
1. Import `getVersion` from `@tauri-apps/api/app`
2. Add version state and fetch on mount
3. Display version in footer with muted styling
4. Handle null/error state with fallback text

No new dependencies, plugins, or Rust changes required.
