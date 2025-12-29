# Quickstart: Liquid Glass Clock Widget

**Feature**: 036-liquid-glass-clock
**Date**: 2025-12-29

## Overview

This feature replaces the clock widget's current white text with blue stroke styling with an Apple-inspired liquid glass text effect. The effect uses a blue tint to maintain visual consistency with the existing UI accent color.

## Prerequisites

- Existing `ClockWidgetContent.tsx` component working correctly
- Tailwind CSS 4.x configured in the project
- Development environment running (`npm run tauri:dev`)

## Implementation Steps

### Step 1: Add Liquid Glass CSS Class (Optional)

If you prefer a reusable utility class, add to `app/globals.css`:

```css
/* Liquid Glass Text Effect - Feature 036 */
.liquid-glass-text {
  /* Semi-transparent blue-tinted background */
  background: rgba(59, 130, 246, 0.08);

  /* Frosted glass blur effect */
  backdrop-filter: blur(12px) saturate(150%);
  -webkit-backdrop-filter: blur(12px) saturate(150%);

  /* Subtle glass border */
  border: 1px solid rgba(255, 255, 255, 0.15);
  border-radius: 0.5rem;

  /* Luminous glow */
  box-shadow:
    0 0 20px rgba(59, 130, 246, 0.25),
    inset 0 0 15px rgba(255, 255, 255, 0.05);

  /* High-contrast white text with blue glow */
  color: rgba(255, 255, 255, 0.95);
  text-shadow:
    0 0 8px rgba(59, 130, 246, 0.6),
    0 0 16px rgba(59, 130, 246, 0.4),
    0 0 32px rgba(59, 130, 246, 0.2);

  /* Padding for glass container */
  padding: 0.5rem 1rem;
}
```

### Step 2: Update ClockWidgetContent Component

Modify `src/components/widgets/ClockWidgetContent.tsx`:

**Before (current styling):**
```tsx
<span
  className="pointer-events-auto cursor-move select-none font-orbitron"
  style={{
    color: 'white',
    WebkitTextStroke: '2px #3b82f6',
    paintOrder: 'stroke fill',
    fontSize: `${fontSize}px`,
  }}
>
  {formattedTime}
</span>
```

**After (liquid glass styling):**
```tsx
<span
  className="pointer-events-auto cursor-move select-none font-orbitron liquid-glass-text"
  style={{
    fontSize: `${fontSize}px`,
  }}
>
  {formattedTime}
</span>
```

Or, if using inline styles instead of the utility class:

```tsx
<span
  className="pointer-events-auto cursor-move select-none font-orbitron"
  style={{
    // Dynamic font size from ResizeObserver
    fontSize: `${fontSize}px`,
    // Liquid glass background
    background: 'rgba(59, 130, 246, 0.08)',
    backdropFilter: 'blur(12px) saturate(150%)',
    WebkitBackdropFilter: 'blur(12px) saturate(150%)',
    // Glass border
    border: '1px solid rgba(255, 255, 255, 0.15)',
    borderRadius: '0.5rem',
    // Luminous glow
    boxShadow: '0 0 20px rgba(59, 130, 246, 0.25), inset 0 0 15px rgba(255, 255, 255, 0.05)',
    // Text styling
    color: 'rgba(255, 255, 255, 0.95)',
    textShadow: '0 0 8px rgba(59, 130, 246, 0.6), 0 0 16px rgba(59, 130, 246, 0.4), 0 0 32px rgba(59, 130, 246, 0.2)',
    // Padding for glass container
    padding: '0.5rem 1rem',
  }}
>
  {formattedTime}
</span>
```

### Step 3: Update Component Documentation

Update the component's JSDoc header:

```tsx
/**
 * ClockWidgetContent Component
 *
 * Displays system time in 24-hour format (HH:mm:ss) with Orbitron font
 * and Apple-inspired liquid glass text effect with blue tint.
 * Auto-scales text based on container size using ResizeObserver.
 *
 * @feature 036-liquid-glass-clock
 */
```

## Verification

1. **Visual Check**: Clock should display with:
   - Frosted/blurred background effect
   - Blue glow around text
   - Subtle blue tint to the glass
   - High contrast white text

2. **Scaling Test**: Resize the widget - glass effect should scale with font size

3. **Background Test**: Move clock over different backgrounds - text should remain readable

4. **Performance Test**: Watch clock for 10+ seconds - no stuttering during time updates

## Rollback

If issues arise, revert to original styling:

```tsx
style={{
  color: 'white',
  WebkitTextStroke: '2px #3b82f6',
  paintOrder: 'stroke fill',
  fontSize: `${fontSize}px`,
}}
```

## Related Files

| File | Purpose |
|------|---------|
| `src/components/widgets/ClockWidgetContent.tsx` | Primary implementation target |
| `app/globals.css` | Optional utility class location |
| `specs/036-liquid-glass-clock/research.md` | Technical decisions and rationale |
