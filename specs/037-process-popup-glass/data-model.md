# Data Model: Process Not Found Popup Liquid Glass Style

**Feature**: 037-process-popup-glass
**Date**: 2025-12-29

## Overview

This feature is a **visual refactor only** - no data model changes are required. The ErrorModal component props interface remains unchanged.

## Existing Interface (Unchanged)

### ErrorModalProps

```typescript
interface ErrorModalProps {
  /** Whether the modal is visible */
  visible: boolean;
  /** Name of the target process (e.g., "Star Citizen") */
  targetName: string;
  /** Error message to display */
  message: string;
  /** Auto-dismiss timeout in milliseconds */
  autoDismissMs: number;
  /** Callback when modal is dismissed (button click, X click, or auto-dismiss) */
  onDismiss: () => void;
}
```

### Usage (Unchanged)

The ErrorModal is triggered by the Tauri backend via the `show-error-modal` event:

```typescript
// From src-tauri/src/types.rs
#[derive(Clone, serde::Serialize)]
pub struct ShowErrorModalPayload {
    pub target_name: String,
    pub message: String,
    pub auto_dismiss_ms: u64,
}
```

## CSS Tokens Used (Existing)

These CSS custom properties are already defined and will be used:

| Token | Value | Usage |
|-------|-------|-------|
| `--sc-border-glow` | `199 89% 48%` | Corner accent border color |
| `--shadow-glow-sm` | `0 0 4px rgba(0, 212, 255, 0.3)` | Container shadow |
| `--shadow-glow-md` | `0 0 8px rgba(0, 212, 255, 0.4)` | Hover shadow |
| `--font-display` | `var(--font-orbitron)` | Orbitron font family |
| `--border` | HSL color | Standard border color |
| `--background` | HSL color | Background color |

## No New Entities

This feature does not introduce:
- New TypeScript interfaces
- New state management
- New persistence
- New IPC events
- New CSS custom properties (uses existing)
