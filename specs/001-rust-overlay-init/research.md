# Research: RAIC Overlay Project Initialization

**Branch**: `001-rust-overlay-init` | **Date**: 2025-12-12

## Research Summary

This document captures research findings for implementing a Windows overlay application using Tauri 2.x with React, per the Constitution's Research-First Development principle.

---

## 1. Framework Selection: Tauri 2.x

### Decision
Use **Tauri 2.x** as the hybrid Rust-React framework for building the overlay application.

### Rationale
- Tauri provides native Rust backend with web-based UI rendering
- Built-in window management APIs for transparent, always-on-top windows
- Official plugin ecosystem for global shortcuts
- Small binary size (~10MB vs Electron's ~150MB)
- Direct access to Windows APIs when needed via Rust

### Alternatives Considered
| Alternative | Reason Rejected |
|-------------|-----------------|
| Electron | Larger binary size, higher memory footprint, overkill for overlay |
| Pure Rust (egui) | Less flexible UI, steeper learning curve for React-style components |
| C++/Qt | Higher complexity, less modern tooling |

### Sources
- [Tauri v2 Documentation](https://v2.tauri.app/)
- [Tauri GitHub](https://github.com/tauri-apps/tauri)

---

## 2. Global Hotkey Registration (F12)

### Decision
Use **tauri-plugin-global-shortcut** version 2.0.0 for F12 hotkey registration.

### Implementation Pattern

**Rust Setup (src-tauri/src/main.rs)**:
```rust
use tauri_plugin_global_shortcut::{Code, Modifiers, ShortcutState, GlobalShortcutExt};

fn main() {
    tauri::Builder::default()
        .plugin(
            tauri_plugin_global_shortcut::Builder::new()
                .with_handler(|app, shortcut, event| {
                    if event.state == ShortcutState::Pressed {
                        if shortcut.matches(Modifiers::empty(), Code::F12) {
                            // Emit event to frontend to toggle visibility
                            let _ = app.emit("toggle-overlay", ());
                        }
                    }
                })
                .build(),
        )
        .setup(|app| {
            // Register F12 as global shortcut
            app.global_shortcut().register("F12")?;
            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
```

**JavaScript Event Listener (src/App.tsx)**:
```typescript
import { listen } from '@tauri-apps/api/event';

useEffect(() => {
  const unlisten = listen('toggle-overlay', () => {
    setVisible(prev => !prev);
  });
  return () => { unlisten.then(f => f()); };
}, []);
```

### Dependencies Required
```toml
# Cargo.toml
[target."cfg(not(any(target_os = \"android\", target_os = \"ios\")))".dependencies]
tauri-plugin-global-shortcut = "2.0.0"
```

```json
// package.json
"@tauri-apps/plugin-global-shortcut": "^2.0.0"
```

### Permissions Configuration
```json
// src-tauri/capabilities/default.json
{
  "permissions": [
    "global-shortcut:allow-register",
    "global-shortcut:allow-unregister",
    "global-shortcut:allow-is-registered"
  ]
}
```

### Windows-Specific Behavior
- Windows uses `MOD_NOREPEAT` by default, preventing repeated activation when key held
- F12 works globally regardless of which window has focus
- Note: F12 may conflict with browser dev tools in development mode

### Sources
- [Tauri Global Shortcut Plugin](https://v2.tauri.app/plugin/global-shortcut/)
- [Plugin Workspace GitHub](https://github.com/tauri-apps/plugins-workspace)

---

## 3. Transparent Overlay Window

### Decision
Configure Tauri window with **transparent background**, **no decorations**, and **always-on-top** positioning.

### Implementation Pattern

**Window Configuration (src-tauri/tauri.conf.json)**:
```json
{
  "app": {
    "windows": [
      {
        "title": "RAIC Overlay",
        "width": 400,
        "height": 60,
        "x": null,
        "y": 0,
        "center": false,
        "resizable": false,
        "fullscreen": false,
        "decorations": false,
        "transparent": true,
        "alwaysOnTop": true,
        "visible": false,
        "skipTaskbar": true
      }
    ]
  }
}
```

**Positioning at Top Center (JavaScript)**:
```typescript
import { getCurrentWindow } from '@tauri-apps/api/window';
import { availableMonitors, currentMonitor } from '@tauri-apps/api/window';

async function positionAtTopCenter() {
  const window = getCurrentWindow();
  const monitor = await currentMonitor();
  if (monitor) {
    const x = Math.floor((monitor.size.width - 400) / 2);
    await window.setPosition({ x, y: 0 });
  }
}
```

### Key Window APIs
| API | Purpose |
|-----|---------|
| `setAlwaysOnTop(true)` | Keep overlay above game window |
| `setDecorations(false)` | Remove OS window chrome |
| `setVisible(bool)` | Toggle panel visibility |
| `setSkipTaskbar(true)` | Hide from Alt+Tab and taskbar |

### Sources
- [Tauri Window Customization](https://v2.tauri.app/learn/window-customization/)
- [Tauri Window API Reference](https://v2.tauri.app/reference/javascript/api/namespacewindow)

---

## 4. Click-Through Behavior

### Decision
Use **`setIgnoreCursorEvents()`** API to enable click-through when overlay panel is hidden.

### Implementation Pattern

**Toggle Click-Through with Visibility**:
```typescript
import { getCurrentWindow } from '@tauri-apps/api/window';

async function setOverlayVisible(visible: boolean) {
  const window = getCurrentWindow();

  if (visible) {
    // Show panel - capture mouse events
    await window.setIgnoreCursorEvents(false);
    await window.show();
  } else {
    // Hide panel - pass through mouse events
    await window.setIgnoreCursorEvents(true);
    // Keep window "visible" but transparent for hotkey to work
  }
}
```

### Known Limitations
- `setIgnoreCursorEvents(true)` makes entire window click-through
- Cannot have selective click-through (some areas clickable, others pass-through)
- Workaround exists via `tauri-plugin-polygon` but adds complexity

### Recommendation for This Feature
Since the overlay has only two states (fully visible header panel OR fully hidden/transparent), the simple toggle approach is sufficient. When hidden, the entire window is click-through. When visible, the 400x60 header panel captures input.

### Sources
- [Tauri setIgnoreCursorEvents API](https://v2.tauri.app/reference/javascript/api/namespacewebviewwindow)
- [GitHub Issue: Click-Through Support](https://github.com/tauri-apps/tauri/issues/13070)
- [tauri-plugin-polygon](https://github.com/houycth/tauri-plugin-polygon)

---

## 5. React UI Layer

### Decision
Use **React 19.2 with TypeScript** for the header panel UI, styled with CSS (no additional UI framework needed for this simple component).

### Implementation Pattern

**HeaderPanel Component (src/components/HeaderPanel.tsx)**:
```tsx
interface HeaderPanelProps {
  visible: boolean;
}

export function HeaderPanel({ visible }: HeaderPanelProps) {
  if (!visible) return null;

  return (
    <div className="header-panel">
      <h1>RAIC Overlay</h1>
    </div>
  );
}
```

**Styling (src/styles/overlay.css)**:
```css
.header-panel {
  width: 400px;
  height: 60px;
  background-color: #000000;
  border: 2px solid #444444;
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.header-panel h1 {
  color: #ffffff;
  font-size: 18px;
  font-weight: 600;
  margin: 0;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
}

/* Ensure HTML/body are transparent */
html, body {
  background: transparent;
  margin: 0;
  padding: 0;
}
```

### Rationale
- No UI framework (Tailwind, Material UI) needed for single component
- Plain CSS keeps bundle size minimal
- React state manages visibility toggle from Rust events

---

## 6. Project Initialization

### Decision
Use **Tauri CLI** to scaffold the project with React + TypeScript template.

### Commands
```bash
# Create new Tauri project with React template
npm create tauri-app@latest raic-overlay -- --template react-ts

# Or if starting from scratch in existing repo
npm init
npm install react react-dom
npm install -D @types/react @types/react-dom typescript vite @vitejs/plugin-react
npm install @tauri-apps/api @tauri-apps/cli
npx tauri init
```

### Required Rust Version
- Minimum: Rust 1.77.2 (for tauri-plugin-global-shortcut)
- Using: Rust 1.92 (latest stable)

### Sources
- [Tauri Quick Start](https://v2.tauri.app/start/)

---

## 7. Testing Strategy

### Decision
- **Rust**: `cargo test` for hotkey registration logic
- **React**: Vitest for component rendering tests
- **Integration**: Manual testing for window behavior (hotkey, visibility, positioning)

### Rationale
Per Constitution Testing Standards, integration tests are prioritized. For this overlay feature:
- Component test: HeaderPanel renders with correct styling
- Integration test: F12 toggle cycles visibility state
- Manual verification: Window appears above game, click-through works

### Test Framework Setup
```toml
# Cargo.toml
[dev-dependencies]
# Tauri provides test utilities
```

```json
// package.json
{
  "devDependencies": {
    "vitest": "^1.0.0",
    "@testing-library/react": "^14.0.0"
  }
}
```

---

## 8. Performance Considerations

### Decision
Optimize for minimal resource usage to meet <1% FPS impact requirement.

### Techniques
1. **Lazy rendering**: Only render React component when visible
2. **Minimal DOM**: Single div with h1, no complex hierarchy
3. **No animations**: Instant show/hide, no transitions
4. **Event debouncing**: Ignore rapid F12 presses within 50ms

### Expected Performance
- Memory: ~30-50MB (Tauri typical)
- CPU: Near-zero when hidden (no rendering)
- Startup: <3s with release build optimizations

---

## Research Completion Status

| Topic | Status | Confidence |
|-------|--------|------------|
| Framework (Tauri 2.x) | ✅ Resolved | High |
| Global Hotkey (F12) | ✅ Resolved | High |
| Transparent Window | ✅ Resolved | High |
| Click-Through | ✅ Resolved | High |
| React UI | ✅ Resolved | High |
| Project Init | ✅ Resolved | High |
| Testing | ✅ Resolved | Medium |
| Performance | ✅ Resolved | Medium |

**All NEEDS CLARIFICATION items resolved. Ready for Phase 1: Design & Contracts.**
