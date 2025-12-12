# Quickstart: Shadcn Design System Integration

**Feature Branch**: `002-shadcn-dark-theme`
**Date**: 2025-12-12

## Prerequisites

- Node.js 18+
- npm 9+
- Existing RAICOverlay project cloned and on branch `002-shadcn-dark-theme`

---

## Setup Steps

### 1. Install Dependencies

```bash
# Install Tailwind CSS and Vite plugin
npm install tailwindcss @tailwindcss/vite

# Install Node types for Vite config
npm install -D @types/node

# Install shadcn utilities
npm install clsx tailwind-merge
```

### 2. Initialize shadcn (Interactive)

```bash
npx shadcn@latest init
```

When prompted:
- Style: **Default**
- Base color: **Neutral** (we'll override with custom theme)
- CSS variables: **Yes**
- Tailwind config: **tailwind.config.js** (if asked)
- Components location: **@/components**
- Utils location: **@/lib/utils**

### 3. Verify Configuration Files

After init, these files should exist:
- `components.json` - shadcn CLI config
- `src/lib/utils.ts` - cn() utility

---

## Running the Application

### Development Mode

```bash
# Frontend only (for quick CSS iteration)
npm run dev

# Full Tauri app
npm run tauri dev
```

### Verify Theme

1. Press F3 to toggle overlay visibility
2. HeaderPanel should display with dark theme colors:
   - Background: Deep navy (`#070b14` approximately)
   - Text: Off-white (`#f5f5f7` approximately)
   - Border: Muted blue-gray

---

## Adding New shadcn Components

```bash
# Example: Add button component
npx shadcn@latest add button

# Example: Add card component
npx shadcn@latest add card
```

Components are added to `src/components/ui/` and automatically use the dark theme.

---

## File Structure After Setup

```
src/
├── components/
│   ├── ui/           # shadcn components (added via CLI)
│   └── HeaderPanel.tsx
├── lib/
│   └── utils.ts      # cn() utility
├── styles/
│   └── globals.css   # Theme + Tailwind
├── App.tsx
└── main.tsx
```

---

## Troubleshooting

### Tailwind classes not applying
- Ensure `globals.css` is imported in `main.tsx`
- Check that Tailwind Vite plugin is in `vite.config.ts`

### Overlay not transparent
- Verify `html, body, #root { background: transparent !important; }` in globals.css

### Component imports fail
- Check `tsconfig.json` has `@/*` path alias
- Check `vite.config.ts` has resolve alias

### React 19 peer dependency warnings
```bash
npm install <package> --force
```
