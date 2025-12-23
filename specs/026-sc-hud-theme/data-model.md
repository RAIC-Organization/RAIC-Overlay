# Data Model: Star Citizen HUD Theme

**Feature**: 026-sc-hud-theme
**Date**: 2025-12-23

## Overview

This feature is primarily CSS-focused with minimal data model requirements. The main data entity is the theme settings stored in the existing persistence system.

## Entities

### ThemeSettings

Extends the existing application settings to include theme-specific options.

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `scanlinesEnabled` | boolean | `false` | Whether scanline overlay effect is visible |

**Storage**: JSON file in Tauri app data directory (extends existing `state.json`)

**State Transitions**:
- `scanlinesEnabled`: Toggled via settings UI, persisted immediately

### Design Tokens (CSS Custom Properties)

Not stored as data - defined in CSS. Documented here for reference.

#### Core Colors

| Token | HSL Value | Hex Equivalent | Purpose |
|-------|-----------|----------------|---------|
| `--sc-cyan` | 190 100% 50% | #00D4FF | Primary accent |
| `--sc-cyan-dim` | 190 80% 40% | #147D99 | Secondary/inactive |
| `--sc-cyan-glow` | 190 100% 60% | #33DBFF | Glow highlights |
| `--sc-bg-deep` | 220 30% 4% | #030508 | Deepest background |
| `--sc-bg` | 220 25% 6% | #0A0E14 | Main background |
| `--sc-bg-elevated` | 220 20% 10% | #121820 | Elevated surfaces |
| `--sc-bg-muted` | 215 25% 14% | #151C26 | Muted panels |
| `--sc-warning` | 30 100% 50% | #FF9900 | Warning states |
| `--sc-danger` | 0 70% 50% | #D93636 | Error/danger states |
| `--sc-success` | 150 80% 45% | #17CC70 | Success states |
| `--sc-border` | 190 40% 25% | #26596B | Default borders |
| `--sc-border-glow` | 190 60% 35% | #248BA8 | Glowing borders |

#### Typography

| Token | Value | Purpose |
|-------|-------|---------|
| `--font-display` | Orbitron, system-ui, sans-serif | Headers, labels |
| `--font-body` | system-ui, sans-serif | Body text |

#### Shadows/Glows

| Token | Value | Purpose |
|-------|-------|---------|
| `--shadow-glow-sm` | 0 0 4px rgba(0,212,255,0.3) | Subtle glow |
| `--shadow-glow-md` | 0 0 8px rgba(0,212,255,0.4) | Medium glow |
| `--shadow-glow-lg` | 0 0 16px rgba(0,212,255,0.5) | Strong glow |
| `--shadow-glow-hover` | 0 0 12px rgba(0,212,255,0.6) | Hover state glow |

#### Spacing & Sizing

Uses existing Tailwind spacing scale. No custom tokens needed.

## Component Variants

### Button Variants (CVA)

| Variant | Description |
|---------|-------------|
| `default` | Cyan background, dark text, glow on hover |
| `secondary` | Transparent background, cyan border, subtle glow |
| `ghost` | No background, text-only, subtle hover |
| `destructive` | Red/danger color scheme |
| `outline` | Border-only, cyan accents |

### Window States

| State | Visual Treatment |
|-------|------------------|
| `default` | Muted border, subtle shadow |
| `focused` | Bright cyan border, glow effect |
| `dragging` | Reduced opacity, no glow |

## Relationships

```
ThemeSettings (state.json)
    └── scanlinesEnabled → Root element class toggle

Design Tokens (globals.css)
    ├── Colors → All components
    ├── Shadows → Buttons, Windows, Cards
    └── Typography → All text elements

Components
    ├── Button → Uses color + shadow tokens
    ├── Window → Uses color + shadow + corner accents
    ├── Card → Uses color + border tokens
    └── Input → Uses color + border + focus tokens
```

## Validation Rules

1. **Color Contrast**: All text/background combinations must meet WCAG AA (4.5:1 minimum)
2. **Glow Intensity**: Maximum 3 box-shadows per element for performance
3. **Scanline Opacity**: Fixed at 50% for subtlety, respects reduced-motion preference

## Migration Notes

No data migration required. New `scanlinesEnabled` field defaults to `false` if not present in existing settings.
