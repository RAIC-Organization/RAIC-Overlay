# Research: Orbitron Font Integration

**Feature**: 021-orbitron-font
**Date**: 2025-12-22
**Sources**: Context7 (Next.js v16.0.3), Google Fonts, Web Search

## Research Questions

### 1. How to integrate Google Fonts with Next.js 16?

**Decision**: Use `next/font/google` built-in module with CSS variable approach

**Rationale**:
- `next/font/google` is the official, built-in solution for Next.js
- Automatically self-hosts fonts at build time (no external requests at runtime)
- Provides `display: 'swap'` for optimal perceived performance
- Supports CSS variables for Tailwind CSS integration
- No additional npm packages required

**Alternatives Considered**:
| Alternative | Rejected Because |
|-------------|------------------|
| Manual `<link>` tag | External request to Google CDN; no self-hosting; slower |
| @fontsource package | Additional dependency; next/font is built-in and equivalent |
| Local font files | Unnecessary complexity; next/font handles self-hosting automatically |

**Implementation Pattern** (from Next.js docs):
```typescript
import { Orbitron } from 'next/font/google'

const orbitron = Orbitron({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-orbitron',
  weight: ['400', '500', '600', '700', '800', '900'],
})

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={orbitron.variable}>
      <body>{children}</body>
    </html>
  )
}
```

### 2. How to integrate with Tailwind CSS 4.x?

**Decision**: Use `@theme inline` block to map CSS variable to Tailwind font utility

**Rationale**:
- Tailwind CSS 4.x uses CSS-first configuration with `@theme` blocks
- CSS variables from next/font integrate seamlessly
- Enables `font-display` utility class throughout the app

**Implementation Pattern** (from Next.js docs for Tailwind):
```css
@import 'tailwindcss';

@theme inline {
  --font-display: var(--font-orbitron);
}
```

Then use in components:
```html
<h1 class="font-display">Window Title</h1>
```

### 3. Is Orbitron available in next/font/google?

**Decision**: Yes, Orbitron is available

**Rationale**:
- Orbitron is part of the Google Fonts catalog
- Available weights: 400, 500, 600, 700, 800, 900
- SIL Open Font License (free for all use)
- Non-variable font requiring explicit weight specification

**Font Characteristics**:
- Type: Geometric sans-serif display font
- Designer: Matt McInerney / The League of Moveable Type
- Use case: Display/heading text, futuristic/tech aesthetic
- Not suitable for: Body text at small sizes

### 4. What is the optimal font loading strategy for Tauri?

**Decision**: Self-hosted fonts with `display: 'swap'` fallback

**Rationale**:
- Tauri webview runs locally; self-hosting eliminates network dependency
- `display: 'swap'` ensures text is always visible (FOUT preferred over FOIT)
- Font files bundled into the app at build time
- Works offline after initial build

**Fallback Stack**:
```css
font-family: 'Orbitron', ui-sans-serif, system-ui, -apple-system, sans-serif;
```

### 5. Which elements should use Orbitron vs system fonts?

**Decision**: Orbitron for UI chrome only; system fonts for content

**Rationale**:
- Orbitron is a display font optimized for headings/titles
- Body text readability suffers with geometric display fonts
- Consistency with spec requirements (FR-002, Font Application Scope)

**Application Matrix**:
| Element Type | Font | Reasoning |
|--------------|------|-----------|
| Window titles | Orbitron | Brand identity, large size |
| Menu headers | Orbitron | Navigation prominence |
| Button labels | Orbitron | UI action emphasis |
| Tab labels | Orbitron | Navigation consistency |
| Body text | System | Readability |
| TipTap editor | Editor default | User content |
| Browser content | Website fonts | External content |
| File viewer | System/mono | Document content |

## Key Findings

1. **No new dependencies needed**: `next/font/google` is built into Next.js 16
2. **Self-hosting is automatic**: Fonts bundled at build time, no CDN requests
3. **Tailwind 4.x integration**: Use `@theme inline` block for CSS variables
4. **Orbitron weights available**: 400-900 (6 weights)
5. **Non-blocking loading**: `display: 'swap'` shows fallback immediately

## Version-Specific Notes

- **Next.js 16.x**: Full support for `next/font/google` with variable fonts
- **Tailwind CSS 4.x**: Uses `@theme inline` (not `tailwind.config.js`)
- **Orbitron**: Static font (not variable); must specify weights explicitly
