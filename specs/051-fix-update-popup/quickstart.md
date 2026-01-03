# Quickstart: Fix Update Popup Not Appearing

**Feature**: 051-fix-update-popup
**Date**: 2026-01-03

## Overview

This feature creates a dedicated update notification window that appears in the Windows taskbar, solving the issue where users couldn't see update notifications because the main overlay window starts hidden.

## Key Files to Create/Modify

### Backend (Rust)

| File | Action | Description |
|------|--------|-------------|
| `src-tauri/src/update/window.rs` | CREATE | New update window management module |
| `src-tauri/src/update/mod.rs` | MODIFY | Export window module |
| `src-tauri/src/update/types.rs` | MODIFY | Add `UpdateWindowState`, `OpenUpdateWindowResult` |
| `src-tauri/src/update/checker.rs` | MODIFY | Open window after detecting update |
| `src-tauri/src/lib.rs` | MODIFY | Register new commands and state |

### Frontend (React/Next.js)

| File | Action | Description |
|------|--------|-------------|
| `app/update/page.tsx` | CREATE | Next.js route for update window |
| `src/components/update/UpdatePage.tsx` | CREATE | Page wrapper with update logic |
| `src/components/update/index.ts` | MODIFY | Export UpdatePage |
| `src/hooks/useUpdateChecker.ts` | MODIFY | Remove from main app (now in dedicated window) |
| `app/page.tsx` | MODIFY | Remove UpdateNotification usage |

## Implementation Order

### Phase 1: Backend Window Infrastructure

1. **Add types to `types.rs`**:
   ```rust
   pub struct UpdateWindowState {
       pub update_info: Mutex<Option<UpdateInfo>>,
   }

   pub struct OpenUpdateWindowResult {
       pub success: bool,
       pub created: bool,
       pub error: Option<String>,
   }
   ```

2. **Create `window.rs`** (copy pattern from settings_window.rs):
   - `open_update_window` command
   - `get_pending_update` command
   - `close_update_window` command

3. **Modify `checker.rs`**:
   - After detecting update, set state and call `open_update_window`

4. **Register in `lib.rs`**:
   - Add commands to invoke_handler
   - Add `.manage(UpdateWindowState::default())`

### Phase 2: Frontend Update Window

1. **Create `app/update/page.tsx`**:
   ```tsx
   import { UpdatePage } from "@/components/update/UpdatePage";
   export default function UpdateRoute() {
     return <UpdatePage />;
   }
   ```

2. **Create `UpdatePage.tsx`**:
   - Call `get_pending_update` on mount
   - Render `UpdateNotification` with update info
   - Handle close by calling `close_update_window`

3. **Modify `UpdateNotification.tsx`**:
   - Remove fixed positioning (window handles position)
   - Adjust for full-window layout

### Phase 3: Cleanup Main App

1. **Modify `app/page.tsx`**:
   - Remove `useUpdateChecker` hook usage
   - Remove `UpdateNotification` component

2. **Modify `useUpdateChecker.ts`** (optional):
   - Simplify or mark as deprecated
   - Keep `checkForUpdates` for manual trigger if needed

## Testing Checklist

- [ ] Build and run app with a newer version on GitHub
- [ ] Verify update window appears in taskbar within 5 seconds
- [ ] Click "Update Now" - verify download starts
- [ ] Click "Ask Again Later" - verify window closes
- [ ] Click taskbar icon - verify window focuses
- [ ] Toggle overlay (F3) - verify update window unaffected
- [ ] Close window via X - verify same as "Ask Again Later"

## Key Patterns

### Window Creation (Rust)
```rust
WebviewWindowBuilder::new(&app, "update", WebviewUrl::App("update".into()))
    .title("RAIC Overlay Update")
    .inner_size(350.0, 300.0)
    .decorations(false)
    .transparent(true)
    .skip_taskbar(false)
    .resizable(false)
    .center()
    .build()
```

### Frontend Data Fetching (TypeScript)
```typescript
useEffect(() => {
  const loadUpdateInfo = async () => {
    const info = await invoke<UpdateInfo | null>("get_pending_update");
    if (info) {
      setUpdateInfo(info);
    }
  };
  loadUpdateInfo();
}, []);
```

### Window Close Handler (TypeScript)
```typescript
const handleClose = async () => {
  await invoke("close_update_window", { dismiss: true });
  // Window will be closed by backend
};
```

## Common Issues

1. **Window doesn't appear**: Check `skip_taskbar(false)` is set
2. **Styling broken**: Ensure `transparent(true)` and `decorations(false)` match settings panel
3. **Update info not loaded**: Verify state is set before window opens
4. **Multiple windows**: Check `get_webview_window("update")` before creating new
