# Research: Shadcn Design System Integration with Dark Theme

**Feature Branch**: `002-shadcn-dark-theme`
**Research Date**: 2025-12-12

## Summary

Research findings for integrating shadcn/ui design system with Tailwind CSS into an existing Vite + React 19.2 + Tauri 2.x application, with dark mode only theming.

---

## 1. Shadcn/UI Installation for Vite + React

### Decision: Use shadcn CLI with Vite installation guide

**Rationale**: The official shadcn documentation provides a dedicated Vite installation path that is optimized for React + TypeScript projects. This is the recommended approach.

**Alternatives Considered**:
- Manual installation: More control but higher complexity and maintenance burden
- Copy-paste components: Viable but loses CLI benefits for future component additions

### Installation Steps (from Context7 docs)

1. Install Tailwind CSS and Vite plugin:
   ```bash
   npm install tailwindcss @tailwindcss/vite
   ```

2. Install Node.js types for Vite configuration:
   ```bash
   npm install -D @types/node
   ```

3. Configure Vite plugin in `vite.config.ts`:
   ```typescript
   import { defineConfig } from 'vite'
   import react from '@vitejs/plugin-react'
   import tailwindcss from '@tailwindcss/vite'

   export default defineConfig({
     plugins: [
       tailwindcss(),
       react(),
     ],
   })
   ```

4. Run shadcn init:
   ```bash
   npx shadcn@latest init
   ```

---

## 2. Dark Mode Only Configuration

### Decision: Apply `dark` class permanently to root element, no theme switching

**Rationale**: The spec explicitly requires dark mode only with no system preference override. This is simpler than implementing a ThemeProvider.

**Alternatives Considered**:
- ThemeProvider with defaultTheme="dark": Adds unnecessary complexity for theme switching that won't be used
- prefers-color-scheme media query: Would respect system preferences, which is explicitly not wanted

### Implementation Approach

1. Add `class="dark"` to the `<html>` element in `index.html`
2. Define only dark theme CSS variables (no light mode fallback)
3. Skip ThemeProvider component entirely

---

## 3. CSS Variables Theme Configuration

### Decision: Use user-provided HSL values directly in global.css

**Rationale**: The user provided specific HSL color values that must be used exactly. These will be defined as CSS custom properties.

**User-Provided Theme (HSL format)**:
```css
:root {
  --background: 224 71.4% 4.1%;
  --foreground: 210 20% 98%;
  --card: 224 71.4% 4.1%;
  --card-foreground: 210 20% 98%;
  --popover: 224 71.4% 4.1%;
  --popover-foreground: 210 20% 98%;
  --primary: 210 20% 98%;
  --primary-foreground: 220.9 39.3% 11%;
  --secondary: 215 27.9% 16.9%;
  --secondary-foreground: 210 20% 98%;
  --muted: 215 27.9% 16.9%;
  --muted-foreground: 217.9 10.6% 64.9%;
  --accent: 215 27.9% 16.9%;
  --accent-foreground: 210 20% 98%;
  --destructive: 0 62.8% 30.6%;
  --destructive-foreground: 210 20% 98%;
  --border: 215 27.9% 16.9%;
  --input: 215 27.9% 16.9%;
  --ring: 216 12.2% 83.9%;
  --radius: 0.5rem;
}
```

### Integration with Tailwind

The CSS variables integrate with Tailwind via the `@theme inline` directive:
```css
@theme inline {
  --color-background: var(--background);
  --color-foreground: var(--foreground);
  /* ... etc */
}
```

---

## 4. Overlay Transparency Requirements

### Decision: Keep html/body/#root transparent, apply theme only to UI components

**Rationale**: This is a Tauri overlay application. The window needs transparency for click-through behavior. Only the HeaderPanel and future UI components should receive themed backgrounds.

**Implementation**:
```css
html, body, #root {
  background: transparent !important;
}
```

This must be preserved even after Tailwind integration, as Tailwind's base styles apply `bg-background` to body.

---

## 5. React 19 Compatibility

### Decision: Use `--force` or `--legacy-peer-deps` if needed for shadcn dependencies

**Rationale**: From Context7 docs, some shadcn dependencies may not yet declare React 19 peer dependencies. The recommended workaround is:
```bash
npm i <package> --force
# or
npm i <package> --legacy-peer-deps
```

**Note**: React 19.0.0 is already installed in the project. Most shadcn components are compatible.

---

## 6. HeaderPanel Refactoring Strategy

### Decision: Replace custom CSS with Tailwind utility classes

**Rationale**: Simpler maintenance, consistent with shadcn patterns, smaller CSS bundle.

**Current CSS**:
```css
.header-panel {
  width: 400px;
  height: 60px;
  background-color: #000000;
  border: 2px solid #444444;
  border-radius: 4px;
  /* ... */
}
```

**Refactored with Tailwind**:
```tsx
<div className="w-[400px] h-[60px] bg-background border-2 border-border rounded-md flex items-center justify-center">
```

---

## 7. File Structure Changes

### New Files Required
- `src/styles/globals.css` - Theme variables and Tailwind imports
- `src/lib/utils.ts` - shadcn utility functions (cn helper)

### Modified Files
- `vite.config.ts` - Add Tailwind plugin
- `tsconfig.json` - Add path aliases for `@/`
- `src/main.tsx` - Import globals.css
- `src/components/HeaderPanel.tsx` - Refactor to Tailwind
- `index.html` - Add `class="dark"` to html element

### Removed Files
- `src/styles/overlay.css` - Replaced by globals.css (transparency rules merged)

---

## 8. Path Aliases Configuration

### Decision: Use `@/` alias pointing to `src/`

**Rationale**: Standard shadcn convention, enables clean imports like `@/components/ui/button`.

**tsconfig.json**:
```json
{
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"]
    }
  }
}
```

**vite.config.ts**:
```typescript
import path from "path"

export default defineConfig({
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
})
```

---

## Dependencies to Install

| Package | Version | Purpose |
|---------|---------|---------|
| tailwindcss | latest | CSS framework |
| @tailwindcss/vite | latest | Vite plugin |
| @types/node | latest (dev) | Node types for vite config |
| clsx | latest | Class merging utility |
| tailwind-merge | latest | Tailwind class merging |
| class-variance-authority | latest | Variant management (optional, for future components) |

---

## Risks and Mitigations

| Risk | Mitigation |
|------|------------|
| Tailwind base styles override overlay transparency | Add `!important` to transparency rules; ensure they load after Tailwind base |
| React 19 peer dependency warnings | Use `--force` flag during installation |
| CSS variable format mismatch (HSL vs OKLCH) | Use HSL format as provided by user; shadcn supports both |
| Existing overlay.css conflicts | Fully migrate to Tailwind, remove old file |
