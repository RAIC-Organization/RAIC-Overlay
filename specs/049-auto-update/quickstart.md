# Quickstart: Auto-Update System

**Feature Branch**: `049-auto-update`
**Date**: 2026-01-02

## Prerequisites

- Rust 2021 Edition with Cargo
- Node.js 20+ with npm
- Windows 11 (target platform)
- Existing RAIC Overlay development environment

---

## Setup

### 1. Install Rust Dependencies

Add to `src-tauri/Cargo.toml`:

```toml
[dependencies]
reqwest = { version = "0.12", features = ["json", "stream"] }
semver = "1"
tokio-stream = "0.1"
```

### 2. Install Frontend Dependencies

```bash
npm install @tauri-apps/plugin-process
```

### 3. Register Tauri Plugin

In `src-tauri/src/lib.rs`, add the process plugin:

```rust
.plugin(tauri_plugin_process::init())
```

---

## File Structure to Create

### Backend (Rust)

```
src-tauri/src/
└── update/
    ├── mod.rs           # Module exports
    ├── types.rs         # Type definitions
    ├── checker.rs       # GitHub API check logic
    ├── downloader.rs    # Download with progress
    ├── installer.rs     # MSI launch + exit
    └── state.rs         # State persistence
```

### Frontend (TypeScript/React)

```
src/
├── components/
│   └── update/
│       ├── UpdateNotification.tsx
│       ├── DownloadProgress.tsx
│       └── index.ts
├── hooks/
│   └── useUpdateChecker.ts
└── types/
    └── update.ts
```

---

## Implementation Order

### Phase 1: Core Backend

1. **Create type definitions** (`update/types.rs`)
   - `UpdateState`, `GitHubRelease`, `UpdateInfo`, `DownloadEvent`

2. **Implement state persistence** (`update/state.rs`)
   - Load/save `update-state.json`
   - Cleanup old installers on startup

3. **Implement version checker** (`update/checker.rs`)
   - GitHub API request with reqwest
   - Version comparison with semver
   - Find MSI asset in release

### Phase 2: Download & Install

4. **Implement downloader** (`update/downloader.rs`)
   - Streaming download with progress events
   - Save to app data directory

5. **Implement installer launcher** (`update/installer.rs`)
   - Spawn msiexec process
   - Exit application

### Phase 3: Frontend UI

6. **Create TypeScript types** (`types/update.ts`)

7. **Create update hook** (`hooks/useUpdateChecker.ts`)
   - Check on mount + 24h interval
   - Manage update state

8. **Create notification component** (`components/update/UpdateNotification.tsx`)
   - Display version number
   - Accept/Later buttons

9. **Create progress component** (`components/update/DownloadProgress.tsx`)
   - Progress bar
   - Cancel/Retry options

### Phase 4: Integration

10. **Register commands** in `lib.rs`
11. **Add hook** to main App component
12. **Test full flow**

---

## Testing

### Manual Testing

1. **Version Check**
   ```bash
   # Build with older version
   # Publish newer release on GitHub
   # Launch app - should show notification
   ```

2. **Download Flow**
   ```bash
   # Click Accept
   # Verify progress bar appears
   # Verify download completes
   ```

3. **Install Flow**
   ```bash
   # After download, verify installer launches
   # Verify app exits
   # Verify installer UI appears
   ```

4. **Ask Later Flow**
   ```bash
   # Click "Ask Again Later"
   # Verify notification closes
   # Restart app - should show notification again
   ```

5. **Network Failure**
   ```bash
   # Disconnect network
   # Launch app - should start normally
   # No error messages
   ```

### Unit Tests

```typescript
// tests/unit/update/version-compare.test.ts
describe('version comparison', () => {
  it('detects newer version', () => {
    expect(isNewerVersion('1.0.0', '1.1.0')).toBe(true);
  });

  it('handles v prefix', () => {
    expect(isNewerVersion('v1.0.0', 'v1.1.0')).toBe(true);
  });

  it('returns false for same version', () => {
    expect(isNewerVersion('1.0.0', '1.0.0')).toBe(false);
  });
});
```

---

## Configuration

### GitHub Repository

The update checker needs to know which GitHub repository to check. This is configured at build time:

**Option A: Hardcoded (Recommended)**
```rust
const GITHUB_OWNER: &str = "your-username";
const GITHUB_REPO: &str = "RAICOverlay";
```

**Option B: Environment Variable**
```rust
let owner = env!("UPDATE_GITHUB_OWNER");
let repo = env!("UPDATE_GITHUB_REPO");
```

### Current Version

Read from `tauri.conf.json` at runtime:
```rust
let current_version = app.package_info().version.to_string();
```

---

## Common Issues

### Issue: Rate Limiting
**Symptom**: 403 response from GitHub API
**Solution**: Wait 1 hour or add GitHub token for higher limits

### Issue: No MSI Asset Found
**Symptom**: Update detected but download fails
**Solution**: Ensure release has attached `.msi` file with correct name

### Issue: Installer Blocked
**Symptom**: Windows SmartScreen blocks installer
**Solution**: Code sign the MSI (separate feature)

### Issue: App Doesn't Exit
**Symptom**: Installer runs but old app still running
**Solution**: Check process plugin is registered, use `app.exit(0)` not `std::process::exit`

---

## Debug Commands

```typescript
// Check current state
const state = await invoke<UpdateState>('get_update_state');
console.log('Update state:', state);

// Force check (ignore 24h interval)
const result = await invoke<UpdateCheckResult>('check_for_updates');
console.log('Check result:', result);

// Manual cleanup
await invoke('cleanup_old_installers');
```
