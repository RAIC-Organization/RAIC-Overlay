# Quickstart: Fix TipTap Notes Toolbar

**Feature**: 032-fix-tiptap-toolbar
**Time Estimate**: ~15 minutes

## Prerequisites

- Node.js and npm installed
- Repository cloned and dependencies installed (`npm install`)
- Development server can be started (`npm run tauri:dev`)

## Quick Fix Steps

### Step 1: Create TipTap Styles File

Create `src/styles/tiptap.css`:

```css
/*
 * TipTap Editor Styles
 * Feature: 032-fix-tiptap-toolbar
 * Provides visual styling for headings and lists in the Notes window
 */

/* Base editor styling */
.tiptap {
  outline: none;
  min-height: 100%;
}

.tiptap:focus {
  outline: none;
}

/* Paragraph spacing */
.tiptap p {
  margin: 0.5rem 0;
}

.tiptap p:first-child {
  margin-top: 0;
}

.tiptap p:last-child {
  margin-bottom: 0;
}

/* Headings - distinct sizes */
.tiptap h1 {
  font-size: 1.875rem;
  font-weight: 700;
  line-height: 1.2;
  margin: 1rem 0 0.5rem 0;
  color: hsl(var(--foreground));
}

.tiptap h2 {
  font-size: 1.5rem;
  font-weight: 600;
  line-height: 1.25;
  margin: 0.875rem 0 0.5rem 0;
  color: hsl(var(--foreground));
}

.tiptap h3 {
  font-size: 1.25rem;
  font-weight: 600;
  line-height: 1.3;
  margin: 0.75rem 0 0.5rem 0;
  color: hsl(var(--foreground));
}

.tiptap h1:first-child,
.tiptap h2:first-child,
.tiptap h3:first-child {
  margin-top: 0;
}

/* Bullet lists */
.tiptap ul {
  list-style-type: disc;
  padding-left: 1.5rem;
  margin: 0.5rem 0;
}

.tiptap ul ul {
  list-style-type: circle;
}

.tiptap ul ul ul {
  list-style-type: square;
}

/* Ordered lists */
.tiptap ol {
  list-style-type: decimal;
  padding-left: 1.5rem;
  margin: 0.5rem 0;
}

.tiptap ol ol {
  list-style-type: lower-alpha;
}

.tiptap ol ol ol {
  list-style-type: lower-roman;
}

/* List items */
.tiptap li {
  margin: 0.25rem 0;
}

.tiptap li p {
  margin: 0;
}

/* Nested list spacing */
.tiptap li > ul,
.tiptap li > ol {
  margin: 0.25rem 0;
}
```

### Step 2: Import Styles in globals.css

Add this import to `app/globals.css` after the existing imports:

```css
@import "tailwindcss";
@import "../src/styles/sc-theme.css";
@import "../src/styles/tiptap.css";  /* ADD THIS LINE */
```

### Step 3: Clean Up NotesContent.tsx (Optional)

In `src/components/windows/NotesContent.tsx`, the `prose` classes can be removed since they have no effect:

Change line 58 from:
```tsx
className="flex-1 overflow-auto p-2 prose prose-sm max-w-none dark:prose-invert"
```

To:
```tsx
className="flex-1 overflow-auto p-2"
```

### Step 4: Verify

1. Run `npm run tauri:dev`
2. Open a Notes window from the main menu
3. Type some text
4. Click H1 button → Text should become large heading
5. Click bullet list button → Bullet marker should appear
6. Click ordered list button → Number should appear

## Files Changed

| File | Change |
|------|--------|
| `src/styles/tiptap.css` | NEW - TipTap styling |
| `app/globals.css` | Add import for tiptap.css |
| `src/components/windows/NotesContent.tsx` | OPTIONAL - Remove unused prose classes |

## Troubleshooting

**Styles not applying?**
- Check that `tiptap.css` is imported in `globals.css`
- Verify the import path is correct (relative to `app/globals.css`)
- Clear browser cache / restart dev server

**Headings same size as paragraphs?**
- Ensure the `.tiptap` selector is used (TipTap applies this class automatically)
- Check browser DevTools to see if styles are being applied

**List bullets not visible?**
- Verify `list-style-type: disc` is applied to `.tiptap ul`
- Check if any CSS reset is overriding the styles (use `!important` as last resort)
