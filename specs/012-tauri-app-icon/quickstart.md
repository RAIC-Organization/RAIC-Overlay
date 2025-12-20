# Quickstart: Tauri App Icon Update

**Feature**: 012-tauri-app-icon
**Time to Complete**: ~2 minutes

## Prerequisites

- Node.js and npm installed
- Project dependencies installed (`npm install`)
- Source icon exists at `src/assets/icon.png`

## Steps

### 1. Generate Icons

Run the Tauri icon command from the project root:

```bash
npm run tauri icon src/assets/icon.png
```

This generates all required icon formats and places them in `src-tauri/icons/`.

### 2. Verify Generation

Check that icons were created:

```bash
ls src-tauri/icons/
```

Expected files:
- `icon.ico` (Windows)
- `icon.icns` (macOS)
- `icon.png`, `32x32.png`, `64x64.png`, `128x128.png`, `128x128@2x.png`
- `Square30x30Logo.png` through `Square310x310Logo.png`
- `StoreLogo.png`

### 3. Test Build

Build the application to verify icons are included:

```bash
npm run tauri build
```

### 4. Visual Verification

After building:
1. Run the built executable
2. Check Windows taskbar icon matches the branded RAIC icon
3. Check window title bar icon
4. (Optional) Check system tray if applicable

## Troubleshooting

### "Icon must be square"
The source icon must have equal width and height. Verify with:
```bash
node -e "require('sharp')('src/assets/icon.png').metadata().then(m => console.log(m.width, m.height))"
```

### "Icon too small"
Source should be at least 512x512 pixels. Current source is 1024x1024.

### Icons not updating in build
Clear the build cache and rebuild:
```bash
rm -rf src-tauri/target
npm run tauri build
```

## Done

The Tauri application now uses the branded RAIC icon in all system contexts (taskbar, title bar, executable).
