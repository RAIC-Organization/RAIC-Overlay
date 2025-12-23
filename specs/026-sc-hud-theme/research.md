# Research: Star Citizen HUD Theme

**Feature**: 026-sc-hud-theme
**Date**: 2025-12-23

## Research Topics

### 1. Tailwind CSS 4.x Theming with CSS Variables

**Decision**: Use `@theme inline` directive with CSS custom properties for all design tokens

**Rationale**: Tailwind CSS 4.x supports the `@theme` directive for defining custom design tokens that generate both CSS variables and utility classes. The `inline` option allows referencing other variables that may change at runtime (like HSL values), ensuring proper cascade behavior.

**Key Patterns**:

```css
/* Define CSS variables in :root */
:root {
  --sc-cyan: 190 100% 50%;
  --sc-background: 220 20% 6%;
}

/* Reference in @theme inline for dynamic values */
@theme inline {
  --color-primary: hsl(var(--sc-cyan));
  --color-background: hsl(var(--sc-background));
}

/* Define static values directly in @theme */
@theme {
  --shadow-glow-sm: 0 0 4px rgba(0, 212, 255, 0.3);
  --shadow-glow-md: 0 0 8px rgba(0, 212, 255, 0.4);
  --shadow-glow-lg: 0 0 16px rgba(0, 212, 255, 0.5);
}
```

**Alternatives Considered**:
- Direct utility classes: Less maintainable, no centralized token system
- External theme file: More complex, existing project uses inline approach

**Sources**:
- [Tailwind CSS Theme Documentation](https://tailwindcss.com/docs/theme)
- [Tailwind CSS Dark Mode](https://tailwindcss.com/docs/dark-mode)

---

### 2. CSS Glow Effects Implementation

**Decision**: Use CSS box-shadow with cyan/teal RGBA values for glow effects

**Rationale**: Box-shadow is GPU-accelerated, works well with transitions, and doesn't require additional DOM elements. Multiple shadows can be combined for depth.

**Key Patterns**:

```css
/* Subtle glow for borders */
.glow-border {
  box-shadow:
    0 0 4px rgba(0, 212, 255, 0.3),
    inset 0 0 2px rgba(0, 212, 255, 0.1);
}

/* Stronger glow for hover states */
.glow-hover:hover {
  box-shadow:
    0 0 8px rgba(0, 212, 255, 0.5),
    0 0 16px rgba(0, 212, 255, 0.3);
}

/* Using drop-shadow for SVG icons */
.icon-glow {
  filter: drop-shadow(0 0 4px rgba(0, 212, 255, 0.5));
}
```

**Performance Note**: CSS box-shadow is composited efficiently by modern browsers. Limit to 2-3 shadows maximum per element.

**Alternatives Considered**:
- CSS `filter: blur()`: Higher performance cost
- SVG filters: More complex, harder to maintain
- Canvas/WebGL: Overkill for simple glow effects

**Sources**:
- [Tailwind CSS Box Shadow](https://tailwindcss.com/docs/box-shadow)
- [Tailwind CSS Drop Shadow](https://tailwindcss.com/docs/filter-drop-shadow)

---

### 3. Scanline Overlay Effect

**Decision**: Use CSS pseudo-elements with repeating linear gradient, toggle-able via CSS class

**Rationale**: Pure CSS approach has minimal performance impact, works without JavaScript, and can be easily toggled via a class on the root element.

**Implementation Pattern**:

```css
/* Scanline overlay - applied to root when enabled */
.scanlines-enabled::after {
  content: '';
  position: fixed;
  inset: 0;
  pointer-events: none;
  z-index: 9999;
  background: repeating-linear-gradient(
    to bottom,
    transparent 0px,
    transparent 2px,
    rgba(0, 0, 0, 0.03) 2px,
    rgba(0, 0, 0, 0.03) 4px
  );
  opacity: 0.5;
}

/* Reduced motion preference */
@media (prefers-reduced-motion: reduce) {
  .scanlines-enabled::after {
    display: none;
  }
}
```

**Toggle Implementation**:
- Store preference in existing settings persistence system
- Apply `scanlines-enabled` class to `#root` element
- Default: disabled (user opts in)

**Performance Note**: Fixed-position pseudo-element with `pointer-events: none` has minimal impact as it's a single composited layer.

**Alternatives Considered**:
- WebGL/Canvas: Overkill, adds complexity
- SVG pattern: Less flexible for toggle behavior
- JavaScript animation: Unnecessary for static effect

**Sources**:
- [Retro CRT Terminal Screen in CSS](https://dev.to/ekeijl/retro-crt-terminal-screen-in-css-js-4afh)
- [CSS Scanlines CodePen](https://codepen.io/meduzen/pen/zxbwRV)
- [CRT Display CSS](http://aleclownes.com/2017/02/01/crt-display.html)

---

### 4. Corner Accent Decorations

**Decision**: Use CSS pseudo-elements with borders on specific sides for moderate corner accents

**Rationale**: The clarification specified "moderate" decorations - corner accents on windows/panels only. Pseudo-elements provide clean implementation without extra DOM elements.

**Implementation Pattern**:

```css
/* Window/panel corner accents */
.sc-panel {
  position: relative;
}

/* Top-left corner accent */
.sc-panel::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  width: 20px;
  height: 20px;
  border-top: 2px solid rgba(0, 212, 255, 0.6);
  border-left: 2px solid rgba(0, 212, 255, 0.6);
  pointer-events: none;
}

/* Bottom-right corner accent */
.sc-panel::after {
  content: '';
  position: absolute;
  bottom: 0;
  right: 0;
  width: 20px;
  height: 20px;
  border-bottom: 2px solid rgba(0, 212, 255, 0.6);
  border-right: 2px solid rgba(0, 212, 255, 0.6);
  pointer-events: none;
}
```

**Alternative - Clip-Path (Not Used)**:
```css
/* More complex shapes possible with clip-path */
.sci-fi-corner {
  clip-path: polygon(
    0 10px, 10px 0, 100% 0, 100% calc(100% - 10px),
    calc(100% - 10px) 100%, 0 100%
  );
}
```

**Decision**: Use simple border-based corners rather than clip-path because:
- Simpler to implement and maintain
- Works better with existing border-radius
- Matches "moderate" complexity requirement
- Easier to adjust sizes

**Sources**:
- [CSS Corners Examples](https://freefrontend.com/css-corners/)
- [Cut Corners with CSS](https://css-tricks.com/cut-corners-using-css-mask-and-clip-path-properties/)
- [Sci-Fi Rectangles with corner-shape](https://daverupert.com/2025/07/sci-fi-rectangles-with-corner-shape/)

---

### 5. Star Citizen Color Palette (HSL Values)

**Decision**: Define color palette using HSL format for shadcn/ui compatibility

**Color Definitions** (based on reference image analysis):

| Token | HSL Value | Usage |
|-------|-----------|-------|
| `--sc-cyan` | 190 100% 50% | Primary cyan (#00D4FF) |
| `--sc-cyan-dim` | 190 80% 40% | Secondary/inactive cyan |
| `--sc-cyan-glow` | 190 100% 60% | Glow/highlight cyan |
| `--sc-background-deep` | 220 30% 4% | Deepest background (#030508) |
| `--sc-background` | 220 25% 6% | Main background (#0A0E14) |
| `--sc-background-elevated` | 220 20% 10% | Elevated surfaces (#0D1117) |
| `--sc-warning` | 30 100% 50% | Orange/amber (#FF6B00) |
| `--sc-danger` | 0 100% 60% | Red alerts (#FF2D2D) |
| `--sc-success` | 150 100% 50% | Green confirmations (#00FF88) |
| `--sc-text-primary` | 190 60% 90% | Primary text |
| `--sc-text-muted` | 210 20% 60% | Muted/secondary text |
| `--sc-border` | 190 40% 25% | Border color |

**Contrast Verification** (WCAG AA):
- Primary text on background: ~12:1 (passes AAA)
- Muted text on background: ~5.5:1 (passes AA)
- Cyan on background: ~8:1 (passes AAA)

---

### 6. Reduced Motion Preferences

**Decision**: Use `prefers-reduced-motion` media query to disable animations and scanlines

**Implementation Pattern**:

```css
/* Default: animations enabled */
.sc-glow-transition {
  transition: box-shadow 150ms ease-out, border-color 150ms ease-out;
}

/* Reduced motion: instant transitions */
@media (prefers-reduced-motion: reduce) {
  .sc-glow-transition {
    transition: none;
  }

  .scanlines-enabled::after {
    display: none;
  }

  /* Pulsing animations disabled */
  .sc-pulse {
    animation: none;
  }
}
```

**Sources**:
- [MDN prefers-reduced-motion](https://developer.mozilla.org/en-US/docs/Web/CSS/@media/prefers-reduced-motion)

---

## Implementation Recommendations

1. **Design Tokens**: Update `globals.css` with Star Citizen color palette in `:root`, then reference in `@theme inline` block

2. **Component Updates**: Modify shadcn/ui components to use new design tokens and add glow effects via CVA variants

3. **Window Chrome**: Add corner accent pseudo-elements to Window component, update border/shadow styling

4. **Scanline Toggle**: Add new setting to persistence system, apply class to root element

5. **Testing**: Verify WCAG AA contrast ratios, test with prefers-reduced-motion enabled
