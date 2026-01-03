# Quickstart: Ko-fi Button Replacement

**Feature**: 056-kofi-button
**Date**: 2026-01-03

## Overview

Replace the Buy Me A Coffee button with a Ko-fi button in the settings panel.

## Prerequisites

- Development environment already set up for RAICOverlay
- No new dependencies required

## Implementation Steps

### Step 1: Update the Click Handler URL

In `src/components/settings/SettingsPanel.tsx`, modify the `handleOpenBuyMeCoffee` function (rename to `handleOpenKofi`):

**Before** (lines 75-82):
```typescript
const handleOpenBuyMeCoffee = async () => {
  try {
    await openUrl("https://www.buymeacoffee.com/braindaamage");
  } catch (e) {
    console.error("Failed to open Buy Me A Coffee page:", e);
  }
};
```

**After**:
```typescript
const handleOpenKofi = async () => {
  try {
    await openUrl("https://ko-fi.com/Y8Y01QVRYF");
  } catch (e) {
    console.error("Failed to open Ko-fi page:", e);
  }
};
```

### Step 2: Update the Button JSX

**Before** (lines 237-247):
```tsx
{/* T053: Buy Me A Coffee button */}
<button
  onClick={handleOpenBuyMeCoffee}
  className="w-full mt-3 flex justify-center cursor-pointer hover:opacity-80 transition-opacity"
>
  <img
    src="https://img.buymeacoffee.com/button-api/?text=Buy me a coffee&emoji=☕&slug=braindaamage&button_colour=0b0e13&font_colour=ffffff&font_family=Cookie&outline_colour=ffffff&coffee_colour=FFDD00"
    alt="Buy Me A Coffee"
    className="h-10"
  />
</button>
```

**After**:
```tsx
{/* T056: Ko-fi support button */}
<button
  onClick={handleOpenKofi}
  className="w-full mt-3 flex justify-center cursor-pointer hover:opacity-80 transition-opacity"
>
  <img
    src="https://storage.ko-fi.com/cdn/kofi3.png?v=6"
    alt="Buy Me a Coffee at ko-fi.com"
    height={36}
    style={{ height: '36px', border: 0 }}
  />
</button>
```

## Verification

1. Run the application: `npm run tauri dev`
2. Open the settings panel (tray icon → Settings)
3. Verify the Ko-fi button is displayed in the footer
4. Click the button and verify it opens `https://ko-fi.com/Y8Y01QVRYF` in the default browser
5. Hover over the button and verify the opacity effect works

## Rollback

To rollback, restore the original Buy Me A Coffee URL and image source from the previous implementation.
