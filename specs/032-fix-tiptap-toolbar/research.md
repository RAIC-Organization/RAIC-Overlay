# Research: Fix TipTap Notes Toolbar

**Feature**: 032-fix-tiptap-toolbar
**Date**: 2025-12-28

## Research Questions

### 1. Why are TipTap headings and lists not visually styled?

**Finding**: The codebase uses Tailwind CSS `prose` classes on the editor content (`prose prose-sm dark:prose-invert`), but the `@tailwindcss/typography` plugin is NOT installed. Without this plugin, the `prose` classes have no effect and provide no styling for HTML elements like `h1`, `h2`, `h3`, `ul`, `ol`, `li`.

**Evidence**:
- `package.json` does not include `@tailwindcss/typography`
- `NotesContent.tsx` line 58: `className="flex-1 overflow-auto p-2 prose prose-sm max-w-none dark:prose-invert"`
- The TipTap commands ARE working (toggling node types), but there's no CSS to visually render them

### 2. What is the recommended way to style TipTap content?

**Finding**: TipTap documentation recommends using CSS scoped to the `.tiptap` class selector. This is the class TipTap automatically applies to the editor container.

**Source**: TipTap Official Documentation (Context7)

**Recommended Pattern**:
```css
.tiptap p {
  margin: 1em 0;
}

.tiptap h1 {
  @apply text-3xl font-bold mt-8 mb-4 first:mt-0 last:mb-0;
}
```

### 3. Should we install `@tailwindcss/typography` or use custom CSS?

**Decision**: Use custom CSS with `.tiptap` scoped selectors

**Rationale**:
1. **Simplicity Standard**: Avoids adding a new dependency
2. **Theme Consistency**: Full control over colors to match Star Citizen HUD theme
3. **Targeted Fix**: Only need styles for headings and lists, not full prose styling
4. **TipTap Best Practice**: Aligns with official TipTap documentation recommendations

**Alternatives Considered**:
- Installing `@tailwindcss/typography`: Would work but adds dependency and may introduce unwanted default styles
- Inline styles via TipTap HTMLAttributes: Possible but more verbose and harder to maintain

### 4. How does Tailwind CSS v4 handle plugin imports?

**Finding**: Tailwind CSS v4 uses `@import` in CSS files for plugins, not `tailwind.config.js`.

**Pattern for v4**:
```css
@import "tailwindcss";
@import "@tailwindcss/typography";
```

However, since we're using custom CSS instead of the typography plugin, this is not needed.

## Key Technical Details

### TipTap Class Structure

TipTap automatically wraps editor content with a `.tiptap` class. The HTML structure:
```html
<div class="tiptap ProseMirror">
  <h1>Heading</h1>
  <p>Paragraph</p>
  <ul>
    <li>List item</li>
  </ul>
</div>
```

### CSS Inheritance Consideration

The existing Star Citizen HUD theme uses CSS custom properties. The TipTap styles should:
- Use `hsl(var(--foreground))` for text color consistency
- Avoid hardcoded colors that might clash with the theme
- Maintain proper contrast in dark mode (the only mode used)

### Browser Default Styles Reset

Modern CSS resets (like Tailwind's Preflight) remove default heading sizes and list styles. This is why:
- Headings appear same size as paragraphs
- Lists have no bullets or numbers

The fix must explicitly restore these styles for the TipTap editor content.

## Conclusion

The root cause is confirmed: missing CSS styles for TipTap content. The recommended fix is to create a dedicated `tiptap.css` file with scoped styles for headings and lists, then import it in `globals.css`.
