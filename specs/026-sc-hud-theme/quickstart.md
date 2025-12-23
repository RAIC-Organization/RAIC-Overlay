# Quickstart: Star Citizen HUD Theme Implementation

**Feature**: 026-sc-hud-theme
**Date**: 2025-12-23

## Prerequisites

- Existing RAICOverlay codebase with shadcn/ui components
- Tailwind CSS 4.x configured
- Orbitron font already integrated (feature 021)

## Implementation Order

### Phase 1: Design Tokens (globals.css)

1. **Add Star Citizen color variables to `:root`**

   Open `app/globals.css` and add the SC color palette before the existing variables:

   ```css
   :root {
     /* Star Citizen HUD Theme Colors */
     --sc-cyan: 190 100% 50%;
     --sc-cyan-dim: 190 80% 40%;
     --sc-cyan-glow: 190 100% 60%;
     --sc-bg-deep: 220 30% 4%;
     --sc-bg: 220 25% 6%;
     --sc-bg-elevated: 220 20% 10%;
     --sc-bg-muted: 215 25% 14%;
     --sc-warning: 30 100% 50%;
     --sc-danger: 0 70% 50%;
     --sc-success: 150 80% 45%;
     --sc-border: 190 40% 25%;
     --sc-border-glow: 190 60% 35%;

     /* ... existing shadcn variables below ... */
   }
   ```

2. **Update shadcn semantic variables**

   Map the existing shadcn variables to SC colors:

   ```css
   :root {
     --background: var(--sc-bg);
     --foreground: 190 60% 90%;
     --primary: var(--sc-cyan);
     --primary-foreground: 220 30% 10%;
     --secondary: var(--sc-bg-muted);
     --secondary-foreground: 190 60% 90%;
     --muted: var(--sc-bg-muted);
     --muted-foreground: 210 20% 60%;
     --accent: var(--sc-bg-elevated);
     --accent-foreground: 190 60% 90%;
     --destructive: var(--sc-danger);
     --destructive-foreground: 0 0% 100%;
     --border: var(--sc-border);
     --input: var(--sc-bg-elevated);
     --ring: var(--sc-cyan);
   }
   ```

3. **Add glow shadow tokens to `@theme`**

   ```css
   @theme inline {
     --shadow-glow-sm: 0 0 4px rgba(0, 212, 255, 0.3);
     --shadow-glow-md: 0 0 8px rgba(0, 212, 255, 0.4);
     --shadow-glow-lg: 0 0 16px rgba(0, 212, 255, 0.5);
   }
   ```

### Phase 2: Component Updates

1. **Button component** (`src/components/ui/button.tsx`)

   Update the `buttonVariants` CVA to include glow effects:

   ```tsx
   const buttonVariants = cva(
     "font-display inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium uppercase tracking-wide transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:shadow-glow-sm disabled:pointer-events-none disabled:opacity-50",
     {
       variants: {
         variant: {
           default: "bg-primary text-primary-foreground hover:brightness-110 hover:shadow-glow-md",
           secondary: "border border-border bg-transparent text-primary hover:border-primary hover:shadow-glow-sm",
           // ... other variants
         },
       },
     }
   );
   ```

2. **Input component** (`src/components/ui/input.tsx`)

   Add focus glow effect:

   ```tsx
   className={cn(
     "flex h-10 w-full rounded-md border border-input bg-input px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:border-primary focus-visible:shadow-glow-sm disabled:cursor-not-allowed disabled:opacity-50",
     className
   )}
   ```

3. **Window component** (`src/components/windows/Window.tsx`)

   Update border and shadow classes, add corner accent class.

4. **WindowHeader component** (`src/components/windows/WindowHeader.tsx`)

   Update styling for SC aesthetic:

   ```tsx
   className="flex items-center justify-between px-3 bg-muted/30 border-b border-border/50 select-none cursor-move"
   ```

   ```tsx
   <span className="font-display text-sm font-medium uppercase tracking-wide truncate flex-1">{title}</span>
   ```

### Phase 3: Scanline Toggle

1. **Add setting to persistence** (extend existing settings interface)

2. **Create ScanlineToggle component** (similar to BackgroundToggle)

3. **Apply class to root** based on setting:

   ```tsx
   <div id="root" className={scanlinesEnabled ? 'scanlines-enabled' : ''}>
   ```

### Phase 4: Corner Accents

1. **Add SC theme CSS file** (`src/styles/sc-theme.css`)

   ```css
   @import './contracts/theme-contract.css';
   ```

2. **Import in globals.css**

   ```css
   @import '../src/styles/sc-theme.css';
   ```

3. **Apply to Window component**

   ```tsx
   className={`absolute ... sc-corner-accents`}
   ```

## Testing Checklist

- [ ] All text meets WCAG AA contrast (4.5:1)
- [ ] Glow effects visible on hover
- [ ] Focus states have visible ring + glow
- [ ] Scanlines toggle works (when implemented)
- [ ] Corner accents visible on windows
- [ ] Reduced motion preference disables animations
- [ ] All window types styled consistently

## Common Issues

**Issue**: Glow effects not visible
**Solution**: Ensure `shadow-glow-*` classes are defined in `@theme` block

**Issue**: Colors not updating
**Solution**: Check that CSS variables are using HSL format without `hsl()` wrapper in `:root`

**Issue**: Corner accents overlapping content
**Solution**: Ensure `.sc-corner-accents` element has `position: relative`
