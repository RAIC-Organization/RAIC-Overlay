# Quickstart: Check for Update Button in Settings Panel

**Feature**: 052-settings-update-button
**Date**: 2026-01-03

## Prerequisites

- Node.js and pnpm installed
- Rust toolchain installed
- Project dependencies installed (`pnpm install`)

## Development Setup

```bash
# Start the Tauri dev server
pnpm tauri dev
```

## Testing the Feature

### Manual Test Flow

1. **Open Settings Panel**
   - Right-click the system tray icon
   - Select "Settings" from the context menu

2. **Locate Updates Section**
   - Scroll to the bottom of the Settings panel (after Startup section)
   - Verify the Updates section is visible with:
     - Current version display
     - "Check for Updates" button

3. **Test Update Check (No Update Available)**
   - Click "Check for Updates" button
   - Verify button shows loading spinner and "Checking..." text
   - Verify button is disabled during check
   - If already on latest version: verify green "You're running the latest version" message appears

4. **Test Update Check (Update Available)**
   - Simulate by testing against a newer version on GitHub releases
   - Click "Check for Updates" button
   - Verify update notification window opens
   - Verify Settings panel remains accessible

5. **Test Error Handling**
   - Disconnect from network
   - Click "Check for Updates" button
   - Verify red error message appears below button
   - Reconnect and verify retry works

6. **Test Edge Cases**
   - Rapidly click button multiple times → should only trigger one check
   - Close Settings during check → update window should still open if found
   - Click with update window already open → should focus existing window

## File Locations

| File | Purpose |
|------|---------|
| `src/components/settings/UpdatesSection.tsx` | New component (create) |
| `src/components/settings/SettingsPanel.tsx` | Parent component (modify) |
| `src/types/update.ts` | Type definitions (existing) |

## Key Commands Used

```typescript
// Check for updates
import { invoke } from '@tauri-apps/api/core';
const result = await invoke<UpdateCheckResult>('check_for_updates');

// Get app version
import { getVersion } from '@tauri-apps/api/app';
const version = await getVersion();
```

## Build Verification

```bash
# Run TypeScript check
pnpm tsc --noEmit

# Run linter
pnpm lint

# Build for production
pnpm tauri build
```
