# Quickstart Guide: RAIC Overlay

**Branch**: `001-rust-overlay-init` | **Date**: 2025-12-12

## Prerequisites

- **Rust**: 1.92 ([rustup.rs](https://rustup.rs))
- **Node.js**: 20.x or later (for React 19.2)
- **Windows**: 11 (64-bit)

Verify installations:
```bash
rustc --version    # Should be 1.92.x
node --version     # Should be 20.x+
npm --version      # Should be 10.x+
```

---

## Project Setup

### 1. Initialize Tauri Project

```bash
# From repository root
npm create tauri-app@latest . -- --template react-ts --yes

# Or if npm create fails, manual setup:
npm init -y
npm install react@19.2 react-dom@19.2
npm install -D typescript @types/react @types/react-dom vite @vitejs/plugin-react
npm install @tauri-apps/api @tauri-apps/cli
npx tauri init
```

### 2. Install Dependencies

**Frontend (package.json)**:
```bash
npm install @tauri-apps/api @tauri-apps/plugin-global-shortcut
npm install -D vitest @testing-library/react @vitejs/plugin-react
```

**Backend (src-tauri/Cargo.toml)**:
```bash
cd src-tauri
cargo add tauri --features "macos-private-api"
cargo add tauri-plugin-global-shortcut --target 'cfg(any(target_os = "macos", windows, target_os = "linux"))'
cargo add serde --features derive
cargo add serde_json
```

---

## Configuration

### 3. Configure Tauri Window (src-tauri/tauri.conf.json)

Update the windows configuration:

```json
{
  "app": {
    "windows": [
      {
        "label": "main",
        "title": "RAIC Overlay",
        "width": 400,
        "height": 60,
        "x": null,
        "y": 0,
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

### 4. Configure Permissions (src-tauri/capabilities/default.json)

Create or update the capabilities file:

```json
{
  "$schema": "../gen/schemas/desktop-schema.json",
  "identifier": "default",
  "description": "Default capabilities for RAIC Overlay",
  "windows": ["main"],
  "permissions": [
    "core:default",
    "core:window:allow-show",
    "core:window:allow-hide",
    "core:window:allow-set-ignore-cursor-events",
    "core:window:allow-set-position",
    "core:window:allow-set-always-on-top",
    "global-shortcut:allow-register",
    "global-shortcut:allow-unregister",
    "global-shortcut:allow-is-registered"
  ]
}
```

---

## Development

### 5. Run in Development Mode

```bash
npm run tauri dev
```

This starts:
- Vite dev server (React hot reload)
- Tauri development window

### 6. Test F12 Toggle

1. Launch the app (`npm run tauri dev`)
2. The overlay window starts hidden
3. Press **F12** to show the header panel
4. Press **F12** again to hide it
5. The panel should appear at top-center with black background

---

## Building

### 7. Build for Production

```bash
npm run tauri build
```

Output location: `src-tauri/target/release/`

**Build artifacts**:
- `raic-overlay.exe` - Main executable
- `raic-overlay_x.x.x_x64_en-US.msi` - Windows installer

---

## Project Structure

```
raic-overlay/
├── src/                      # React frontend
│   ├── components/
│   │   └── HeaderPanel.tsx   # Main overlay panel
│   ├── App.tsx               # Root component
│   ├── main.tsx              # Entry point
│   └── styles/
│       └── overlay.css       # Panel styling
├── src-tauri/                # Rust backend
│   ├── src/
│   │   ├── main.rs           # App entry + hotkey setup
│   │   └── lib.rs            # Shared code
│   ├── Cargo.toml            # Rust dependencies
│   ├── tauri.conf.json       # Tauri configuration
│   └── capabilities/
│       └── default.json      # Permissions
├── package.json              # Node dependencies
└── vite.config.ts            # Vite configuration
```

---

## Troubleshooting

### F12 Not Working

1. Check if another application is using F12 globally
2. Ensure global-shortcut permissions are configured
3. Check console for registration errors:
   ```bash
   npm run tauri dev -- --verbose
   ```

### Window Not Transparent

1. Verify `transparent: true` in tauri.conf.json
2. Ensure CSS has `background: transparent` on html/body
3. Check WebView background:
   ```css
   html, body { background: transparent !important; }
   ```

### Click-Through Not Working

1. Verify `setIgnoreCursorEvents(true)` is called when hidden
2. Check window permissions include `core:window:allow-set-ignore-cursor-events`

### Build Fails

```bash
# Clean and rebuild
cd src-tauri
cargo clean
cd ..
npm run tauri build
```

---

## Useful Commands

| Command | Purpose |
|---------|---------|
| `npm run tauri dev` | Development mode |
| `npm run tauri build` | Production build |
| `npm run tauri dev -- --verbose` | Debug logging |
| `cargo test` | Run Rust tests |
| `npm test` | Run React tests |

---

## Next Steps

After completing this feature:
1. Run `/speckit.tasks` to generate implementation tasks
2. Implement tasks in priority order (P1 first)
3. Test with Star Citizen in borderless windowed mode
