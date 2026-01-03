# Research: Buy Me A Coffee Button

**Feature**: 053-buymeacoffee-button
**Date**: 2026-01-03

## Research Summary

This feature has minimal research needs as it leverages existing patterns and dependencies already established in the codebase.

## Findings

### 1. External URL Opening Pattern

**Decision**: Use `openUrl` from `@tauri-apps/plugin-opener`

**Rationale**:
- Already used in the codebase (see `src/hooks/useUpdateChecker.ts:29` and `src/components/update/UpdatePage.tsx:15`)
- Plugin already installed and configured (`@tauri-apps/plugin-opener: ^2.5.2`)
- Proven to work for opening external URLs in default browser

**Alternatives Considered**:
- `window.open()` - Would open in WebView, not external browser (rejected)
- `shell.open()` - Legacy Tauri v1 API, deprecated (rejected)

**Code Pattern** (from existing codebase):
```typescript
import { openUrl } from "@tauri-apps/plugin-opener";

const handleClick = async () => {
  try {
    await openUrl("https://www.buymeacoffee.com/braindaamage");
  } catch (err) {
    console.error("Failed to open URL:", err);
  }
};
```

### 2. Button Placement in Settings Panel

**Decision**: Add button in footer div, between Save button and version display

**Rationale**:
- User explicitly requested this placement
- Footer already has vertical spacing (`space-y-3` would become `mt-3` per element)
- Natural visual hierarchy: primary action (Save) → support action (BMC) → info (version)

**Location in SettingsPanel.tsx**: Lines 196-223 (footer section)

### 3. Button Styling Approach

**Decision**: Use themed button matching Settings panel aesthetic with BMC brand colors

**Rationale**:
- Settings panel uses SC HUD theme with `sc-glow-transition` effects
- BMC brand color is `#FFDD00` (yellow) - can be used as accent
- Button should be recognizable but not visually overwhelming

**Styling Options**:
| Option | Description | Chosen |
|--------|-------------|--------|
| BMC official image | Use the official BMC button image | Alternative |
| Text button with icon | "☕ Buy Me A Coffee" with theme styling | Preferred |
| Minimal link | Simple text link | Rejected (not prominent enough) |

**Preferred Implementation**:
```tsx
<button
  onClick={handleOpenBMC}
  className="w-full py-2 px-4 rounded font-display text-sm uppercase tracking-wide sc-glow-transition bg-[#FFDD00]/20 hover:bg-[#FFDD00]/30 text-[#FFDD00] border border-[#FFDD00]/30 hover:shadow-glow-sm cursor-pointer"
>
  ☕ Buy Me A Coffee
</button>
```

### 4. Error Handling

**Decision**: Silent failure with console logging

**Rationale**:
- OS handles "no browser configured" errors
- Network errors are browser's responsibility
- No need to show error UI to user for this non-critical feature

## No NEEDS CLARIFICATION Items

All technical decisions are resolved based on existing codebase patterns and user requirements.

## Dependencies Verified

| Dependency | Version | Status | Usage |
|------------|---------|--------|-------|
| @tauri-apps/plugin-opener | ^2.5.2 | Already installed | `openUrl()` function |
| lucide-react | ^0.562.0 | Already installed | Optional icon (Coffee icon available) |

## Conclusion

Feature is ready for implementation. No additional research or clarifications needed.
