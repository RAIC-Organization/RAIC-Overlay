# Data Model: Shadcn Design System Integration with Dark Theme

**Feature Branch**: `002-shadcn-dark-theme`
**Date**: 2025-12-12

## Overview

This feature involves UI theming configuration, not data persistence. The "data model" here represents the CSS custom properties (theme tokens) that define the design system.

---

## Theme Configuration Entity

### CSS Custom Properties (Theme Tokens)

The theme is defined as CSS custom properties that shadcn components consume. All values use HSL color format.

| Token | HSL Value | Usage |
|-------|-----------|-------|
| `--background` | `224 71.4% 4.1%` | Page/app background |
| `--foreground` | `210 20% 98%` | Default text color |
| `--card` | `224 71.4% 4.1%` | Card backgrounds |
| `--card-foreground` | `210 20% 98%` | Card text |
| `--popover` | `224 71.4% 4.1%` | Popover backgrounds |
| `--popover-foreground` | `210 20% 98%` | Popover text |
| `--primary` | `210 20% 98%` | Primary action color |
| `--primary-foreground` | `220.9 39.3% 11%` | Primary action text |
| `--secondary` | `215 27.9% 16.9%` | Secondary elements |
| `--secondary-foreground` | `210 20% 98%` | Secondary text |
| `--muted` | `215 27.9% 16.9%` | Muted backgrounds |
| `--muted-foreground` | `217.9 10.6% 64.9%` | Muted text |
| `--accent` | `215 27.9% 16.9%` | Accent elements |
| `--accent-foreground` | `210 20% 98%` | Accent text |
| `--destructive` | `0 62.8% 30.6%` | Destructive actions |
| `--destructive-foreground` | `210 20% 98%` | Destructive text |
| `--border` | `215 27.9% 16.9%` | Border color |
| `--input` | `215 27.9% 16.9%` | Input backgrounds |
| `--ring` | `216 12.2% 83.9%` | Focus ring color |
| `--radius` | `0.5rem` | Border radius base |

---

## Component State Model

### HeaderPanel Component

| Property | Type | Description |
|----------|------|-------------|
| `visible` | `boolean` | Controls panel visibility |

**State Transitions**:
- `visible: false` → `visible: true` (F3 key press)
- `visible: true` → `visible: false` (F3 key press)

**No changes to existing state model** - only styling changes.

---

## File Artifacts

### Theme Configuration Files

| File | Purpose |
|------|---------|
| `src/styles/globals.css` | CSS variables + Tailwind imports |
| `src/lib/utils.ts` | `cn()` utility for class merging |
| `components.json` | shadcn CLI configuration |
| `tailwind.config.js` | Tailwind configuration (if needed) |

### Relationships

```
index.html (dark class)
    └── src/main.tsx
            └── imports globals.css
                    └── defines CSS variables
                            └── consumed by Tailwind utilities
                                    └── used in HeaderPanel.tsx
```

---

## Validation Rules

| Rule | Constraint |
|------|------------|
| Theme mode | Must always be dark (no light mode) |
| Overlay transparency | html, body, #root must have transparent background |
| Color format | HSL values as specified |
| Radius | 0.5rem base radius |

---

## No Database/Storage

This feature does not involve any data persistence. All theme configuration is static CSS.
