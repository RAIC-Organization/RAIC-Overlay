# Research: App Icon Branding

**Feature**: 011-app-icon-branding
**Date**: 2025-12-20

## 1. Existing Animation Patterns (from HeaderPanel)

**Decision**: Follow the exact same animation pattern used in HeaderPanel for consistency

**Key patterns identified from `src/components/HeaderPanel.tsx`**:

```typescript
// Import pattern
import { motion, AnimatePresence, useReducedMotion } from "motion/react";

// Reduced motion support
const prefersReducedMotion = useReducedMotion();
const showHideDuration = prefersReducedMotion ? 0 : 0.3;
const modeChangeDuration = prefersReducedMotion ? 0 : 0.25;

// Opacity calculation
const targetOpacity = mode === "fullscreen" ? 0.4 : 1;

// Click-through behavior
const pointerEventsClass = mode === "fullscreen" ? "pointer-events-none" : "";

// Animation structure
<AnimatePresence>
  {visible && (
    <motion.div
      key="unique-key"
      initial={{ opacity: 0 }}
      animate={{ opacity: targetOpacity }}
      exit={{ opacity: 0 }}
      transition={{ duration: showHideDuration, ease: "easeOut" }}
      className={pointerEventsClass}
    >
      {/* Inner motion.div for mode transitions */}
      <motion.div
        animate={{ opacity: targetOpacity }}
        transition={{ duration: modeChangeDuration, ease: "easeOut" }}
      >
        {/* Content */}
      </motion.div>
    </motion.div>
  )}
</AnimatePresence>
```

**Rationale**: Using identical patterns ensures visual consistency across the overlay and simplifies maintenance.

**Alternatives considered**:
- CSS transitions: Rejected - would break consistency with existing components
- Different animation library: Rejected - motion/react already in use

## 2. Icon Positioning Strategy

**Decision**: Use fixed positioning with explicit pixel margins

**Implementation approach**:
```typescript
// Fixed positioning in top-left corner
className="fixed top-[50px] left-[50px]"

// OR via style prop
style={{ position: 'fixed', top: 50, left: 50 }}
```

**Rationale**:
- Spec requires exactly 50px margin from both edges
- Fixed positioning ensures icon stays in place regardless of other overlay content
- Simpler than the HeaderPanel's flexible positioning (which handled top/bottom)

**Alternatives considered**:
- Absolute positioning: Would require a positioned parent container
- Tailwind arbitrary values: `top-[50px] left-[50px]` - chosen for readability

## 3. Image Asset Handling in Next.js

**Decision**: Use Next.js `<Image>` component with static import

**Implementation approach**:
```typescript
import Image from 'next/image';
import iconSrc from '@/assets/icon.png';

<Image
  src={iconSrc}
  alt="RAIC Overlay"
  width={50}
  height={50}
  priority // Load immediately, don't lazy load
/>
```

**Rationale**:
- Next.js Image component provides automatic optimization
- Static import enables type safety and build-time validation
- `priority` prop ensures icon loads immediately with the overlay

**Asset location**: Move `temp/Icon.png` to `src/assets/icon.png`
- `src/assets/` follows Next.js convention for imported assets
- Import path alias: `@/assets/icon.png`

**Alternatives considered**:
- Public folder (`/public/icon.png`): Would work but doesn't get build-time optimization
- Raw `<img>` tag: Loses Next.js optimization benefits

## 4. Component Props Simplification

**Decision**: AppIcon needs fewer props than HeaderPanel

**AppIcon props**:
```typescript
interface AppIconProps {
  visible?: boolean;   // Whether to render the icon
  mode?: OverlayMode;  // 'windowed' | 'fullscreen' - determines opacity
}
```

**Removed from HeaderPanel**:
- `targetRect`: Not needed - icon size is fixed at 50x50px
- `position`: Not needed - always top-left corner

**Rationale**: The icon has a fixed position and size unlike the flexible HeaderPanel.

## 5. HeaderPanel Removal Impact

**Files affected by HeaderPanel removal**:

| File | Change Required |
|------|-----------------|
| `src/components/HeaderPanel.tsx` | DELETE |
| `tests/react/HeaderPanel.test.tsx` | DELETE |
| `app/page.tsx` | Remove import and usage |

**No other direct imports** - HeaderPanel is only used in `app/page.tsx` at line 20 and 162.

## 6. Accessibility Considerations

**Decision**: Minimal accessibility requirements for decorative icon

**Implementation**:
```typescript
<Image
  src={iconSrc}
  alt="RAIC Overlay"  // Meaningful alt text for screen readers
  width={50}
  height={50}
  // No role="status" or aria-live - icon is static, not status indicator
/>
```

**Rationale**: Unlike HeaderPanel which was a status indicator with `role="status"` and `aria-live="polite"`, the icon is purely decorative branding. A meaningful `alt` text is sufficient.

## 7. Test Strategy

**Decision**: Integration tests matching HeaderPanel test patterns

**Test cases**:
1. Icon renders when visible=true
2. Icon does not render when visible=false
3. Icon has correct dimensions (50x50)
4. Icon has 100% opacity in windowed mode
5. Icon has 40% opacity in fullscreen mode
6. Icon has pointer-events-none in fullscreen mode
7. Icon respects reduced motion preferences

**Test file**: `tests/react/AppIcon.test.tsx`

## Summary of Decisions

| Topic | Decision |
|-------|----------|
| Animation library | motion/react (existing) |
| Animation pattern | Copy HeaderPanel pattern exactly |
| Positioning | Fixed, 50px from top-left |
| Image handling | Next.js Image with static import |
| Asset location | `src/assets/icon.png` |
| Accessibility | `alt` text only (decorative) |
| Props | `visible`, `mode` only |
