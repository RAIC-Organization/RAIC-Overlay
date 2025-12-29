# Quickstart: Fix File Viewer Window Transparency

**Feature**: 035-fix-file-viewer-transparency
**Estimated Changes**: 4 files, ~40 lines modified

## Overview

This bug fix propagates the `backgroundTransparent` prop from the Window component through the FileViewerContent component to the individual renderer components (PDF, Markdown, Image).

## Files to Modify

| File | Change Description |
|------|-------------------|
| `src/components/windows/FileViewerContent.tsx` | Add `backgroundTransparent` prop and pass to renderers |
| `src/components/windows/renderers/PDFRenderer.tsx` | Add prop, conditionally apply `bg-muted/30` |
| `src/components/windows/renderers/MarkdownRenderer.tsx` | Add prop for consistency |
| `src/components/windows/renderers/ImageRenderer.tsx` | Add prop, conditionally apply `bg-muted/30` |

## Implementation Pattern

Reference implementation from `DrawContent.tsx`:

```typescript
// 1. Add to props interface
export interface FileViewerContentProps {
  isInteractive: boolean;
  backgroundTransparent?: boolean;  // Add this
  // ... other props
}

// 2. Calculate effective transparency
const isEffectivelyTransparent = backgroundTransparent === true && !isInteractive;

// 3. Conditionally apply background class
const backgroundClass = isEffectivelyTransparent ? '' : 'bg-muted/30';
```

## Testing

### Manual Verification Steps

1. Open the application with `pnpm tauri:dev`
2. Create a File Viewer window from the menu
3. Load a PDF, Markdown, or Image file
4. Click the transparency toggle (eye icon) in the window header
5. Press F3 to enter non-interactive mode
6. **Verify**: Window background should be transparent (see-through to underlying content)
7. Press F3 to return to interactive mode
8. **Verify**: Window background should be solid again

### Edge Cases to Test

- [ ] Empty file viewer (no file loaded) with transparency enabled
- [ ] Error state (file not found) with transparency enabled
- [ ] All three file types (PDF, Markdown, Image)
- [ ] Rapid F3 toggle doesn't cause visual glitches
- [ ] Persistence: Close and reopen app, verify transparency setting preserved

## Dependencies

No new dependencies required. Uses existing:
- React prop patterns
- Tailwind CSS conditional classes
- Existing `backgroundTransparent` prop from Window component

## Common Issues

**Issue**: Background still shows in non-interactive mode
**Solution**: Ensure `isEffectivelyTransparent` check includes both `!isInteractive` AND `backgroundTransparent === true`

**Issue**: Transparent background in interactive mode
**Solution**: The check should ONLY apply transparency when NOT in interactive mode
