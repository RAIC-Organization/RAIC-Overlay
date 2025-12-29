# Contracts: Process Not Found Popup Liquid Glass Style

**Feature**: 037-process-popup-glass
**Date**: 2025-12-29

## Overview

This feature modifies visual styling only. No API contracts change. This document defines the CSS contract for the refactored ErrorModal component.

## CSS Class Contract

### Container Classes

The error modal container MUST apply these classes:

```css
/* Required classes for SC theme consistency */
.error-modal-container {
  /* Structure */
  border border-border rounded-lg overflow-hidden

  /* SC Theme */
  sc-glow-transition sc-corner-accents shadow-glow-sm

  /* Liquid Glass Background */
  bg-background/80 backdrop-blur-xl

  /* Fixed dimensions */
  max-w-md w-full
}
```

### Header Classes

The modal header MUST match WindowHeader styling:

```css
/* Header container */
.error-modal-header {
  /* Layout */
  flex items-center justify-between px-3 py-2

  /* Border */
  border-b border-border

  /* Background (optional semi-transparent) */
  bg-muted/50
}

/* Title */
.error-modal-title {
  /* Typography - matches WindowHeader */
  font-display text-sm font-medium uppercase tracking-wide truncate
}

/* Close button */
.error-modal-close {
  /* Layout */
  p-1 rounded

  /* SC Theme interaction */
  sc-glow-transition hover:bg-muted/50 hover:shadow-glow-sm

  /* Accessibility */
  cursor-pointer
}
```

### Content Classes

```css
/* Content container */
.error-modal-content {
  /* Spacing */
  p-6

  /* Layout */
  flex flex-col items-center gap-4
}

/* Text styling */
.error-modal-text {
  /* Typography */
  font-display text-sm text-center

  /* Color */
  text-foreground
}

/* Countdown */
.error-modal-countdown {
  /* Typography */
  font-display text-xs

  /* Color */
  text-muted-foreground
}
```

### Icon Styling

The warning icon MUST have blue glow effect:

```css
.error-modal-icon {
  /* Color - blue instead of red */
  color: rgba(59, 130, 246, 0.9);

  /* Glow effect */
  filter: drop-shadow(0 0 8px rgba(59, 130, 246, 0.6));
}

/* Icon container */
.error-modal-icon-container {
  /* Size */
  w-12 h-12

  /* Layout */
  rounded-full flex items-center justify-center

  /* Background - blue tinted */
  bg-blue-500/10
}
```

## Animation Contract

Animations MUST match existing ErrorModal behavior:

```typescript
// Entry animation
initial={{ opacity: 0, scale: 0.95 }}
animate={{ opacity: 1, scale: 1 }}

// Exit animation
exit={{ opacity: 0, scale: 0.95 }}

// Timing
transition={{ duration: 0.2, ease: "easeOut" }}

// Reduced motion support
const prefersReducedMotion = useReducedMotion();
const duration = prefersReducedMotion ? 0 : 0.2;
```

## Accessibility Contract

The modal MUST maintain these accessibility attributes:

```typescript
// ARIA attributes
role="alertdialog"
aria-modal="true"
aria-labelledby="error-modal-title"
aria-describedby="error-modal-description"

// Keyboard support
// - X button focusable
// - Escape key dismisses (existing behavior)
// - Tab navigation within modal
```

## Visual Comparison Reference

The styled ErrorModal should visually match:

| Element | Reference Component | Key Classes |
|---------|---------------------|-------------|
| Container border/shadow | Window.tsx | `border-border sc-corner-accents shadow-glow-sm` |
| Header layout | WindowHeader.tsx | `flex items-center justify-between px-3` |
| Title typography | WindowHeader.tsx | `font-display text-sm uppercase tracking-wide` |
| X button | WindowHeader.tsx | `sc-glow-transition hover:shadow-glow-sm` |
| Glass effect | liquid-glass-text | `backdrop-blur-xl bg-background/80` |
