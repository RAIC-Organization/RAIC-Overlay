# Research: Next.js Migration with Motion Animations

**Feature**: 005-nextjs-motion-refactor
**Date**: 2025-12-18
**Status**: Complete

## Research Topics

### 1. Next.js Static Export with Tauri v2

**Decision**: Use Next.js 15.x with `output: 'export'` configuration for static HTML/JS generation compatible with Tauri v2.

**Rationale**: Tauri doesn't support server-based solutions and requires static assets. The official Tauri v2 documentation explicitly recommends static exports. This approach generates pure HTML/CSS/JS that Tauri's webview can load directly without a Node.js runtime.

**Alternatives Considered**:
- SSR/SSG with server: Not supported by Tauri architecture
- Standalone output: Requires Node.js server, not compatible with Tauri
- Keep Vite: Would not achieve the migration goal requested by user

**Key Configuration** (`next.config.mjs`):
```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  images: { unoptimized: true },  // Required: next/image optimization not available in static export
  // assetPrefix may be needed for dev server
};

export default nextConfig;
```

**Tauri Configuration** (`tauri.conf.json`):
```json
{
  "build": {
    "beforeDevCommand": "npm run dev",
    "beforeBuildCommand": "npm run build",
    "devUrl": "http://localhost:3000",
    "frontendDist": "../out"  // Next.js static export output directory
  }
}
```

**Limitations**:
- No middleware support
- No server actions (`'use server'`)
- No API routes
- No edge functions
- `next/image` optimization must be disabled

**Sources**:
- [Next.js | Tauri v2 Documentation](https://v2.tauri.app/start/frontend/nextjs/)
- [Tauri + Next.js Starter Template](https://github.com/motz0815/tauri-nextjs-starter)
- [Next.js Static Exports Guide](https://nextjs.org/docs/pages/guides/static-exports)
- [next.config.js output option](https://nextjs.org/docs/app/api-reference/config/next-config-js/output)

---

### 2. Motion (motion.dev) for React Animations

**Decision**: Use `motion` package (formerly Framer Motion) with `AnimatePresence` for smooth fade animations on show/hide and opacity mode transitions.

**Rationale**: Motion is the industry-leading React animation library with 12M+ monthly npm downloads. It provides declarative animations that feel like a natural extension of React, with hardware-accelerated performance. The hybrid engine combines browser animation performance with JavaScript flexibility.

**Alternatives Considered**:
- CSS transitions only: Limited control over interruptions and exit animations
- React Spring: More complex API, less declarative
- GSAP: Heavier bundle, imperative API
- Anime.js: Less React-specific integration

**Installation**:
```bash
npm install motion
```

**Import Pattern**:
```javascript
import { motion, AnimatePresence } from "motion/react";
```

**Fade Animation Pattern for Show/Hide**:
```jsx
<AnimatePresence>
  {isVisible && (
    <motion.div
      key="overlay"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
    />
  )}
</AnimatePresence>
```

**Opacity Mode Transition Pattern**:
```jsx
<motion.div
  animate={{ opacity: mode === "fullscreen" ? 0.6 : 1 }}
  transition={{ duration: 0.25 }}
/>
```

**Key Requirements**:
- Direct children of `AnimatePresence` must have unique `key` props
- Exit animations only work on direct children of `AnimatePresence`
- Use `useReducedMotion` hook to respect system accessibility preferences

**Performance Considerations**:
- Motion components animate without triggering React re-renders
- Hardware-accelerated for opacity and transform animations
- Bundle size: ~15-30KB gzipped (well within 150KB budget)

**Sources**:
- [Motion for React](https://motion.dev/)
- [AnimatePresence Documentation](https://motion.dev/docs/react-animate-presence)
- [React Animation Guide](https://motion.dev/docs/react-animation)
- [React Transitions](https://motion.dev/docs/react-transitions)
- [LogRocket Motion Guide (2025)](https://blog.logrocket.com/creating-react-animations-with-motion/)

---

### 3. shadcn/ui with Next.js 15 App Router

**Decision**: Re-initialize shadcn/ui for Next.js 15 with Tailwind CSS v4, preserving existing Card component.

**Rationale**: shadcn/ui is already used in the project. It has full Next.js 15 App Router support and works with Server Components. Components are source code copied into the project, not black-box dependencies.

**Alternatives Considered**:
- Start fresh without shadcn: Would lose existing Card styling and design system consistency
- Use different component library: Would require rewriting existing components

**Re-initialization Steps**:
```bash
npx shadcn@latest init
# Select existing style preferences
# Tailwind CSS v4 is default
```

**Key Points**:
- Tailwind CSS v4 requires no config file (inline in globals.css)
- With React 19, may need `--legacy-peer-deps` flag
- TypeScript paths must be configured in `tsconfig.json`

**Sources**:
- [shadcn/ui Next.js Installation](https://ui.shadcn.com/docs/installation/next)
- [Setting Up Next.js 15 with ShadCN & Tailwind CSS v4](https://dev.to/darshan_bajgain/setting-up-2025-nextjs-15-with-shadcn-tailwind-css-v4-no-config-needed-dark-mode-5kl)

---

### 4. Animation Timing and Easing

**Decision**: Use 300ms duration for show/hide fade, 250ms for opacity mode transitions, with `ease-out` easing.

**Rationale**: These durations fall within the spec requirements (200-400ms for show/hide, 200-300ms for mode transitions) and provide a balance between smooth perception and responsive feel. Ease-out provides a natural deceleration that feels polished.

**Configuration**:
```javascript
const animationConfig = {
  showHide: {
    duration: 0.3,  // 300ms
    ease: "easeOut"
  },
  modeChange: {
    duration: 0.25,  // 250ms
    ease: "easeOut"
  },
  errorModal: {
    duration: 0.2,  // 200ms - slightly faster for modals
    ease: "easeOut"
  }
};
```

**Accessibility**: Will implement `useReducedMotion` hook to respect user system preferences, falling back to instant transitions.

---

## Summary of Technical Decisions

| Topic | Decision | Key Detail |
|-------|----------|------------|
| Next.js Mode | Static Export | `output: 'export'` in next.config.mjs |
| Build Output | `out/` directory | Configured in tauri.conf.json |
| Animation Library | motion (motion.dev) | ~15-30KB gzipped |
| Show/Hide Animation | Fade (opacity 0↔1) | 300ms, ease-out |
| Mode Animation | Opacity (60%↔100%) | 250ms, ease-out |
| Exit Animations | AnimatePresence | Required for fade-out before unmount |
| Accessibility | useReducedMotion | Respects system preferences |
| shadcn/ui | Re-initialize | Tailwind CSS v4 compatible |

## Unresolved Items

None - all research questions have been answered.
