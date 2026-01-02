# Quickstart: Settings Version Display

**Feature**: 047-settings-version-display
**Date**: 2026-01-02

## Overview

Add application version display to the settings panel footer using Tauri's built-in `getVersion()` API.

## Prerequisites

- Existing `@tauri-apps/api` 2.0.0 (already installed)
- Access to `SettingsPanel.tsx` component

## Implementation Steps

### Step 1: Add Version State and Import

In `src/components/settings/SettingsPanel.tsx`:

```typescript
// Add to imports
import { getVersion } from '@tauri-apps/api/app';

// Add state in component
const [appVersion, setAppVersion] = useState<string | null>(null);
```

### Step 2: Fetch Version on Mount

Add to the existing `useEffect` or create new one:

```typescript
useEffect(() => {
  getVersion()
    .then(setAppVersion)
    .catch(() => setAppVersion(null));
}, []);
```

### Step 3: Display Version in Footer

Modify the footer section to include version text:

```tsx
{/* Footer with Save button */}
<div className="shrink-0 p-4 border-t border-border bg-muted/30">
  <button /* existing save button */ />

  {/* Version display - bottom left */}
  <div className="mt-3 text-center">
    <span className="text-xs text-muted-foreground font-display">
      {appVersion ? `v${appVersion}` : 'Version unavailable'}
    </span>
  </div>
</div>
```

## Verification

1. Run `npm run tauri:dev`
2. Open settings panel
3. Verify version displays at bottom in small, muted text
4. Verify version matches `tauri.conf.json` version field

## Files Modified

| File | Change |
|------|--------|
| `src/components/settings/SettingsPanel.tsx` | Add import, state, effect, and JSX |

## Rollback

Remove the added import, state, effect, and JSX elements. No other files affected.
