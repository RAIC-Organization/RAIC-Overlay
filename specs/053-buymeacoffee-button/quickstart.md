# Quickstart: Buy Me A Coffee Button

**Feature**: 053-buymeacoffee-button
**Date**: 2026-01-03

## Implementation Summary

Add a "Buy Me A Coffee" donation button to the Settings panel footer.

## Prerequisites

- No new dependencies required
- `@tauri-apps/plugin-opener` already installed

## Implementation Steps

### Step 1: Add import to SettingsPanel.tsx

```typescript
import { openUrl } from "@tauri-apps/plugin-opener";
```

### Step 2: Add click handler

```typescript
const handleOpenBuyMeCoffee = async () => {
  try {
    await openUrl("https://www.buymeacoffee.com/braindaamage");
  } catch (err) {
    console.error("Failed to open Buy Me A Coffee page:", err);
  }
};
```

### Step 3: Add button to footer (after Save button, before version)

```tsx
{/* Buy Me A Coffee button */}
<button
  onClick={handleOpenBuyMeCoffee}
  className="w-full py-2 px-4 rounded font-display text-sm tracking-wide sc-glow-transition bg-[#FFDD00]/20 hover:bg-[#FFDD00]/30 text-[#FFDD00] border border-[#FFDD00]/30 hover:shadow-glow-sm cursor-pointer flex items-center justify-center gap-2"
>
  ☕ Buy Me A Coffee
</button>
```

## File Changes

| File | Change Type | Description |
|------|-------------|-------------|
| `src/components/settings/SettingsPanel.tsx` | Modified | Add import, handler, and button JSX |

## Testing

1. Open Settings panel
2. Verify button appears between Save and version
3. Click button
4. Verify external browser opens to `https://www.buymeacoffee.com/braindaamage`
5. Verify Settings panel remains functional after click

## Visual Reference

```
┌─────────────────────────────────────┐
│ Settings                          X │
├─────────────────────────────────────┤
│                                     │
│  [Hotkeys Section]                  │
│  [Startup Section]                  │
│  [Updates Section]                  │
│                                     │
├─────────────────────────────────────┤
│  [ Save Settings ]                  │
│  [ ☕ Buy Me A Coffee ]  ← NEW      │
│        v0.1.0                       │
└─────────────────────────────────────┘
```
