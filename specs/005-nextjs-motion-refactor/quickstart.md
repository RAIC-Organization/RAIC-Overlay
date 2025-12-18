# Quickstart: Next.js Migration with Motion Animations

**Feature**: 005-nextjs-motion-refactor
**Date**: 2025-12-18

## Prerequisites

- Node.js 18+ installed
- Rust toolchain installed (for Tauri)
- Existing RAIC Overlay codebase on `main` branch
- Windows 11 development environment

## Migration Steps Overview

### 1. Install Next.js and Motion Dependencies

```bash
# Remove Vite-specific dependencies
npm uninstall vite @vitejs/plugin-react

# Install Next.js
npm install next@latest

# Install Motion for animations
npm install motion

# Ensure React 19 compatibility
npm install react@latest react-dom@latest
```

### 2. Create Next.js Configuration

Create `next.config.mjs` in project root:

```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  images: { unoptimized: true },
  // Disable strict mode if needed for animation debugging
  reactStrictMode: true,
};

export default nextConfig;
```

### 3. Restructure for App Router

```bash
# Create app directory structure
mkdir -p app

# Move/transform files:
# src/App.tsx → app/page.tsx (converted to client component)
# src/main.tsx → app/layout.tsx
# src/styles/globals.css → app/globals.css
```

### 4. Update Tauri Configuration

Update `src-tauri/tauri.conf.json`:

```json
{
  "build": {
    "beforeDevCommand": "npm run dev",
    "beforeBuildCommand": "npm run build",
    "devUrl": "http://localhost:3000",
    "frontendDist": "../out"
  }
}
```

### 5. Update package.json Scripts

```json
{
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "tauri": "tauri",
    "tauri:dev": "tauri dev",
    "tauri:build": "tauri build",
    "test": "vitest"
  }
}
```

### 6. Re-initialize shadcn/ui

```bash
npx shadcn@latest init
# Select: New York style, Slate base color, CSS variables
```

## Animation Implementation

### HeaderPanel with Fade Animation

```tsx
"use client";

import { motion, AnimatePresence, useReducedMotion } from "motion/react";

export function HeaderPanel({ visible, mode, targetRect }) {
  const reducedMotion = useReducedMotion();

  const opacity = mode === "fullscreen" ? 0.6 : 1;
  const duration = reducedMotion ? 0 : 0.3;

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          key="header-panel"
          initial={{ opacity: 0 }}
          animate={{ opacity }}
          exit={{ opacity: 0 }}
          transition={{ duration, ease: "easeOut" }}
        >
          {/* Card content */}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
```

### ErrorModal with Entrance/Exit Animation

```tsx
"use client";

import { motion, AnimatePresence, useReducedMotion } from "motion/react";

export function ErrorModal({ visible, onDismiss, ...props }) {
  const reducedMotion = useReducedMotion();
  const duration = reducedMotion ? 0 : 0.2;

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          key="error-modal"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          transition={{ duration, ease: "easeOut" }}
          className="fixed inset-0 flex items-center justify-center z-50"
        >
          {/* Modal content */}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
```

## Verification Checklist

After migration, verify:

- [ ] `npm run dev` starts Next.js dev server on port 3000
- [ ] `npm run tauri:dev` launches Tauri app with Next.js frontend
- [ ] F3 toggles visibility with smooth fade animation
- [ ] F5 toggles mode with smooth opacity transition (60% ↔ 100%)
- [ ] Error modal animates in/out when triggered
- [ ] Click-through works in fullscreen mode
- [ ] Target window attachment positions overlay correctly
- [ ] `npm run build` generates static files in `out/` directory
- [ ] `npm run tauri:build` creates distributable app

## Troubleshooting

### "Module not found" errors after migration
- Ensure TypeScript paths are configured in `tsconfig.json`
- Check that `@/` alias points to correct directory

### Animations not working
- Verify `motion` package is installed
- Ensure components are marked `"use client"`
- Check that `AnimatePresence` wraps conditional rendering

### Tauri can't find frontend
- Verify `frontendDist: "../out"` in tauri.conf.json
- Run `npm run build` to generate `out/` directory
- Check that `output: 'export'` is set in next.config.mjs

### Hydration errors
- Ensure client components have `"use client"` directive
- Move browser-specific code (Tauri APIs) to useEffect hooks
