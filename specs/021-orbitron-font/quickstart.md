# Quickstart: Orbitron Font Integration

**Feature**: 021-orbitron-font
**Estimated Changes**: 2 files modified, ~20 lines added

## Prerequisites

- Next.js 16.x (already in project)
- No additional dependencies required

## Implementation Steps

### Step 1: Add Orbitron Font to Layout

**File**: `app/layout.tsx`

```typescript
import type { Metadata } from "next";
import { Orbitron } from 'next/font/google';
import "./globals.css";

const orbitron = Orbitron({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-orbitron',
  weight: ['400', '500', '600', '700', '800', '900'],
});

export const metadata: Metadata = {
  title: "RAIC Overlay",
  description: "RAIC Overlay Application",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={orbitron.variable}>
      <body>
        <div id="root">{children}</div>
      </body>
    </html>
  );
}
```

### Step 2: Add Tailwind Font Utility

**File**: `app/globals.css`

Add to the `@theme inline` block:

```css
@theme inline {
  /* ... existing theme variables ... */
  --font-display: var(--font-orbitron), ui-sans-serif, system-ui, sans-serif;
}
```

### Step 3: Apply Font to UI Elements

Use the `font-display` utility class on UI chrome elements:

```tsx
// Window title example
<h2 className="font-display text-lg font-semibold">Window Title</h2>

// Menu header example
<div className="font-display text-sm font-medium">Menu</div>

// Button example
<button className="font-display font-medium">Click Me</button>
```

## Verification

1. Run `npm run dev` to start the development server
2. Open the application in browser or Tauri
3. Verify Orbitron font appears on:
   - Window titles
   - Menu headers
   - Button labels
   - Navigation items
4. Verify body text and editor content retain system fonts
5. Test offline: disconnect network, refresh - font should still render (self-hosted)

## Font Weight Reference

| Weight | CSS Value | Use Case |
|--------|-----------|----------|
| Regular | 400 | Default labels |
| Medium | 500 | Emphasized labels |
| SemiBold | 600 | Subheadings |
| Bold | 700 | Primary headings |
| ExtraBold | 800 | Hero text |
| Black | 900 | Maximum emphasis |

## Troubleshooting

### Font not appearing
1. Check browser DevTools > Elements > Computed styles for `font-family`
2. Verify `orbitron.variable` is applied to `<html>` element
3. Ensure `--font-orbitron` CSS variable is defined

### Font loading slowly
- This shouldn't happen with self-hosting
- Check Next.js build output for font file inclusion
- Verify `display: 'swap'` is set (shows fallback immediately)

### Flash of unstyled text (FOUT)
- Expected behavior with `display: 'swap'`
- Text shows with fallback, then swaps to Orbitron
- Preferable to invisible text (FOIT)
