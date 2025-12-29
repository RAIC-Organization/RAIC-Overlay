# Research: Process Not Found Popup Liquid Glass Style

**Feature**: 037-process-popup-glass
**Date**: 2025-12-29

## Research Questions

### 1. What existing CSS patterns should be reused?

**Decision**: Reuse `.sc-corner-accents`, `.sc-glow-transition`, and adapt `.liquid-glass-text` pattern

**Rationale**: These patterns already implement the SC HUD aesthetic used by overlay windows. Reusing them ensures visual consistency and avoids code duplication.

**Existing Patterns Found**:

1. **SC Corner Accents** (`src/styles/sc-theme.css`):
   ```css
   .sc-corner-accents::before {
     /* Top-left corner accent */
     border-top: 2px solid hsl(var(--sc-border-glow));
     border-left: 2px solid hsl(var(--sc-border-glow));
   }
   .sc-corner-accents::after {
     /* Bottom-right corner accent */
     border-bottom: 2px solid hsl(var(--sc-border-glow));
     border-right: 2px solid hsl(var(--sc-border-glow));
   }
   ```

2. **Glow Shadow Tokens** (`app/globals.css`):
   ```css
   --shadow-glow-sm: 0 0 4px rgba(0, 212, 255, 0.3);
   --shadow-glow-md: 0 0 8px rgba(0, 212, 255, 0.4);
   ```

3. **Liquid Glass Effect** (`app/globals.css`):
   ```css
   .liquid-glass-text {
     background: rgba(59, 130, 246, 0.08);
     backdrop-filter: blur(12px) saturate(150%);
     box-shadow: 0 0 20px rgba(59, 130, 246, 0.25);
     color: rgba(255, 255, 255, 0.95);
   }
   ```

**Alternatives Considered**:
- Creating entirely new CSS classes: Rejected - would create duplication
- Using inline styles only: Rejected - less maintainable

### 2. How does Window.tsx structure its header?

**Decision**: Adapt the window header structure with title left, X button right, but without drag/opacity/background controls

**Rationale**: The error modal needs the same visual structure but simpler functionality (just close button).

**Window Header Structure** (`src/components/windows/WindowHeader.tsx`):
```jsx
<div className="flex items-center justify-between px-3 bg-muted/50 border-b border-border">
  <span className="font-display text-sm font-medium uppercase tracking-wide truncate flex-1">
    {title}
  </span>
  <div className="flex items-center gap-2">
    {/* Opacity slider, background toggle - NOT NEEDED for error modal */}
    <button className="p-1 rounded sc-glow-transition hover:bg-muted/50 hover:shadow-glow-sm">
      <X className="h-4 w-4" />
    </button>
  </div>
</div>
```

**ErrorModal Header Adaptation**:
- Keep: Title styling (font-display, uppercase, tracking-wide)
- Keep: X button with glow transition
- Remove: Drag functionality (no cursor-move)
- Remove: Opacity slider
- Remove: Background toggle

### 3. How does Window.tsx apply SC theme border?

**Decision**: Apply same border/shadow classes to error modal container

**Rationale**: Ensures visual consistency with overlay windows.

**Window Container Classes** (`src/components/windows/Window.tsx`):
```jsx
const modeClasses = 'border border-border rounded-lg sc-glow-transition sc-corner-accents shadow-glow-sm hover:shadow-glow-md';
```

**ErrorModal Adaptation**:
- Use: `border border-border rounded-lg`
- Use: `sc-glow-transition sc-corner-accents`
- Use: `shadow-glow-sm` (no hover state needed for modal)
- Add: Liquid glass background effect

### 4. How should the warning icon be styled?

**Decision**: Apply blue glow filter to the existing SVG warning triangle

**Rationale**: Maintains recognizable warning semantics while matching the glass theme.

**Current Icon** (`src/components/ErrorModal.tsx`):
```jsx
<svg className="h-6 w-6 text-destructive" /* red color */>
  <path d="M12 9v2m0 4h.01m-6.938 4h13.856..." />
</svg>
```

**Styled Icon**:
```jsx
<svg
  className="h-6 w-6"
  style={{
    color: 'rgba(59, 130, 246, 0.9)',
    filter: 'drop-shadow(0 0 8px rgba(59, 130, 246, 0.6))'
  }}
>
```

### 5. What Orbitron font classes are available?

**Decision**: Use `font-display` class which maps to Orbitron

**Rationale**: Consistent with other window headers in the overlay system.

**Font Configuration** (`app/globals.css`):
```css
--font-display: var(--font-orbitron), ui-sans-serif, system-ui, sans-serif;
```

**Usage in Components**:
- Window headers use: `className="font-display text-sm font-medium uppercase tracking-wide"`
- Apply same to error modal title and content text

## Implementation Approach

### ErrorModal Component Structure

```jsx
<motion.div className="fixed inset-0 flex items-center justify-center z-50">
  {/* Modal container with SC theme + liquid glass */}
  <div className="error-modal-container border border-border rounded-lg sc-glow-transition sc-corner-accents shadow-glow-sm bg-background/80 backdrop-blur-xl">

    {/* Header - matches WindowHeader structure */}
    <div className="flex items-center justify-between px-3 py-2 border-b border-border">
      <span className="font-display text-sm font-medium uppercase tracking-wide">
        {targetName} Not Found
      </span>
      <button onClick={onDismiss} className="p-1 rounded sc-glow-transition hover:shadow-glow-sm">
        <X className="h-4 w-4" />
      </button>
    </div>

    {/* Content area */}
    <div className="p-6 flex flex-col items-center gap-4">
      {/* Warning icon with blue glow */}
      {/* Error message */}
      {/* Countdown timer */}
    </div>
  </div>
</motion.div>
```

### CSS Classes to Add (if needed)

If inline styles become unwieldy, add to `app/globals.css`:

```css
/* Error Modal Liquid Glass Container - Feature 037-process-popup-glass */
.error-modal-glass {
  background: rgba(15, 23, 42, 0.85);
  backdrop-filter: blur(16px) saturate(150%);
  -webkit-backdrop-filter: blur(16px) saturate(150%);
}
```

## Files to Modify

| File | Change |
|------|--------|
| `src/components/ErrorModal.tsx` | Restructure with window header, apply SC theme + liquid glass styling |
| `app/globals.css` | Optional: Add `.error-modal-glass` class if needed |

## No External Research Needed

This feature uses only existing patterns from the codebase:
- SC theme utilities from feature 026
- Liquid glass effect from feature 036
- Window header structure from feature 007
- Orbitron font from feature 021

No Context7 or web search required - all patterns are documented in existing specs and implemented in the codebase.
