# Research: MainMenu Component with Grouped Buttons

**Feature Branch**: `006-main-menu-component`
**Date**: 2025-12-18

## Research Topics

### 1. shadcn/ui Button Component

**Decision**: Use shadcn Button component via CLI installation

**Rationale**:
- Official shadcn component, consistent with existing Card component in project
- Provides multiple variants (default, outline, secondary, ghost, destructive, link)
- Multiple sizes available (sm, default, lg, icon)
- Already proven pattern in codebase (card.tsx uses same structure)

**Installation**:
```bash
pnpm dlx shadcn@latest add button
```

**Alternatives considered**:
- Custom button: Rejected - would require reimplementing styling, accessibility, variants
- Third-party button library: Rejected - adds unnecessary dependency when shadcn already in use

### 2. shadcn/ui ButtonGroup Component

**Decision**: Use shadcn ButtonGroup component for grouping related buttons

**Rationale**:
- Official shadcn component added in October 2025 update
- Provides proper semantic grouping with `role="group"`
- Built-in accessibility (keyboard navigation via Tab)
- Supports horizontal/vertical orientation
- ButtonGroupSeparator available for visual division between groups

**Installation**:
```bash
pnpm dlx shadcn@latest add button-group
```

**Key imports**:
```typescript
import { ButtonGroup, ButtonGroupSeparator } from "@/components/ui/button-group"
import { Button } from "@/components/ui/button"
```

**Usage pattern for two separate groups**:
```jsx
<div className="flex gap-2">
  {/* Group 1: Option 1 & Option 2 */}
  <ButtonGroup>
    <Button>Option 1</Button>
    <Button>Option 2</Button>
  </ButtonGroup>

  {/* Group 2: Option 3 */}
  <ButtonGroup>
    <Button>Option 3</Button>
  </ButtonGroup>
</div>
```

**Alternatives considered**:
- Manual div grouping with flexbox: Rejected - loses semantic grouping and ARIA attributes
- Toggle groups: Rejected - ToggleGroup is for state toggles, not action buttons

### 3. Transparent Background Implementation

**Decision**: Use Tailwind's `bg-transparent` class on container, buttons retain their styling

**Rationale**:
- Matches spec requirement: "transparent background means the MainMenu container itself is transparent, while buttons retain their styled appearance"
- Buttons will use shadcn default styling (has subtle background)
- Container transparency achieved via CSS, not opacity (preserves button interactivity)

**Implementation**:
```jsx
<div className="bg-transparent">
  <ButtonGroup>...</ButtonGroup>
</div>
```

**Alternatives considered**:
- Opacity on entire component: Rejected - would make buttons partially transparent and harder to read
- Custom button variant with transparent bg: Rejected - buttons should remain visible and styled

### 4. Animation Pattern (motion library)

**Decision**: Follow existing HeaderPanel animation pattern using motion/react

**Rationale**:
- Consistency with existing components (HeaderPanel, ErrorModal)
- Uses `AnimatePresence` for mount/unmount animations
- Respects `useReducedMotion` preference (accessibility)
- 300ms duration aligns with spec SC-001 requirement

**Key pattern from HeaderPanel**:
```typescript
const showHideDuration = prefersReducedMotion ? 0 : 0.3;

<AnimatePresence>
  {visible && (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: showHideDuration, ease: "easeOut" }}
    >
      {/* content */}
    </motion.div>
  )}
</AnimatePresence>
```

### 5. Layout Positioning Strategy

**Decision**: Use flexbox with `justify-between` in parent container to position MainMenu at top and Header at bottom

**Rationale**:
- Simple CSS solution, no complex positioning
- HeaderPanel already uses flexbox internally
- Parent container in page.tsx can use `flex flex-col justify-between h-full`

**Implementation approach**:
```jsx
// page.tsx layout when interactive mode
<div className="flex flex-col justify-between h-full">
  <MainMenu visible={isInteractive} mode={mode} />
  <HeaderPanel visible={visible} mode={mode} position="bottom" />
</div>
```

**Alternatives considered**:
- Absolute positioning: Rejected - more fragile, harder to maintain
- CSS Grid: Rejected - overkill for simple top/bottom layout

### 6. Button Click Handler Pattern

**Decision**: Use simple onClick handlers that log button name to console

**Rationale**:
- Per spec clarification: "Buttons log to console when clicked (for debugging/demo purposes)"
- Simple implementation, easy to extend later
- No complex state management needed

**Implementation**:
```typescript
const handleButtonClick = (buttonName: string) => {
  console.log(`Button clicked: ${buttonName}`);
};

<Button onClick={() => handleButtonClick("Option 1")}>Option 1</Button>
```

## Version-Specific Considerations

| Dependency | Version | Notes |
|------------|---------|-------|
| shadcn/ui | Latest (2025) | ButtonGroup added Oct 2025 |
| motion | 12.x | Uses motion/react import path |
| Tailwind CSS | 4.x | cursor: default by default (pointer via CSS if needed) |
| React | 19.0.0 | Supports all patterns above |

## Sources

- [shadcn/ui Button Documentation](https://ui.shadcn.com/docs/components/button)
- [shadcn/ui ButtonGroup Documentation](https://ui.shadcn.com/docs/components/button-group)
- Existing codebase: `src/components/HeaderPanel.tsx`, `src/components/ui/card.tsx`
