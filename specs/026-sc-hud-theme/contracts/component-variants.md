# Component Variants Contract

**Feature**: 026-sc-hud-theme
**Date**: 2025-12-23

This document defines the expected variants and states for each themed component.

## Button Component

### Variants

| Variant | Background | Border | Text | Hover Effect |
|---------|------------|--------|------|--------------|
| `default` | `--sc-cyan` | none | `--sc-text-inverse` | Brightness increase, glow |
| `secondary` | transparent | `--sc-border` | `--sc-cyan` | Border glow, bg subtle |
| `ghost` | transparent | none | `--sc-text-primary` | Subtle bg tint |
| `destructive` | `--sc-danger` | none | white | Brightness increase |
| `outline` | transparent | `--sc-cyan` | `--sc-cyan` | Fill with cyan |

### States

| State | Visual Change |
|-------|---------------|
| `:hover` | Add glow shadow, increase brightness |
| `:focus-visible` | Focus ring with glow |
| `:active` | Scale down 0.98, reduce glow |
| `:disabled` | 50% opacity, no interactions |

### Size Variants (unchanged)

- `default`: h-10 px-4
- `sm`: h-9 px-3
- `lg`: h-11 px-8
- `icon`: h-10 w-10

---

## Input Component

### Default State

- Background: `--sc-bg-elevated`
- Border: 1px `--sc-border-dim`
- Text: `--sc-text-primary`
- Placeholder: `--sc-text-muted`

### States

| State | Visual Change |
|-------|---------------|
| `:hover` | Border brightens to `--sc-border` |
| `:focus` | Border `--sc-border-focus`, glow effect |
| `:disabled` | 50% opacity, cursor not-allowed |
| `[aria-invalid]` | Border `--sc-danger`, subtle red glow |

---

## Card Component

### Default State

- Background: `--sc-bg-elevated`
- Border: 1px `--sc-border-dim`
- Border radius: `--sc-card-radius`
- No corner accents (cards are simpler than windows)

### Variants

| Variant | Description |
|---------|-------------|
| `default` | Standard card styling |
| `elevated` | Adds subtle shadow for depth |
| `interactive` | Hover state with border glow |

---

## Window Component

### Default State

- Background: `--sc-bg-elevated`
- Border: 1px `--sc-border`
- Border radius: `--sc-window-radius`
- Shadow: `--sc-shadow-md`
- Corner accents: `.sc-corner-accents` class applied

### States (Interactive Mode)

| State | Visual Change |
|-------|---------------|
| `default` | Standard border and shadow |
| `focused` | Border `--sc-border-glow`, add glow shadow |
| `dragging` | Opacity 0.8, shadow reduced |

### States (Passive Mode)

| State | Visual Change |
|-------|---------------|
| `default` | Subtle border, backdrop blur |
| `transparent` | No border, no shadow, no blur |

---

## Window Header Component

### Default State

- Background: `--sc-bg-muted` at 50% opacity
- Border bottom: 1px `--sc-border-dim`
- Title font: `--sc-font-display`
- Title transform: uppercase
- Title tracking: `--sc-tracking-wide`

### Close Button

- Background: transparent
- Icon color: `--sc-text-secondary`
- Hover: bg `--sc-bg-muted`, icon `--sc-text-primary`

---

## Slider Component

### Track

- Background: `--sc-bg-muted`
- Height: 4px
- Border radius: 2px

### Range (filled portion)

- Background: `--sc-cyan`

### Thumb

- Background: `--sc-cyan`
- Border: 2px `--sc-bg`
- Size: 16px
- Shadow: `--sc-shadow-glow-sm`
- Hover: `--sc-shadow-glow-md`

---

## Separator Component

### Default State

- Background: `--sc-border-dim`
- Height: 1px (horizontal) or Width: 1px (vertical)

### Glow Variant (optional)

- Background: gradient from transparent → cyan → transparent
- Shadow: subtle cyan glow

---

## ButtonGroup Component

### Default State

- Gap: 0 (buttons touch)
- First button: rounded left corners
- Last button: rounded right corners
- Middle buttons: no border radius

### Divider

- 1px border between buttons using `--sc-border-dim`
