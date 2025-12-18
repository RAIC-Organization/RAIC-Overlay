# Research: TipTap Notes Component

**Feature**: 008-tiptap-notes-component
**Date**: 2025-12-18
**Status**: Complete

## Research Tasks

### 1. TipTap v3 Installation & Setup

**Decision**: Use @tiptap/react + @tiptap/pm + @tiptap/starter-kit + @tiptap/extension-text-align

**Rationale**: 
- Official TipTap documentation recommends these core packages for React integration
- StarterKit includes most required extensions (bold, italic, underline, strike, headings, lists)
- TextAlign extension needed separately as it's not in StarterKit
- Version 3.x is current stable release with active maintenance

**Alternatives Considered**:
- Slate.js: More complex setup, steeper learning curve, less out-of-box features
- Draft.js: Meta project, less actively maintained
- Quill: Less customizable, older architecture
- ProseMirror directly: Too low-level, TipTap provides better DX

**Installation Command**:
```bash
npm install @tiptap/react @tiptap/pm @tiptap/starter-kit @tiptap/extension-text-align
```

### 2. StarterKit Extensions Coverage

**Decision**: StarterKit provides most required features, only TextAlign needs separate installation

**Included in StarterKit (v3)**:
| Extension | Spec Requirement | Status |
|-----------|------------------|--------|
| Bold | FR-009 | Included |
| Italic | FR-009 | Included |
| Underline | FR-009 | Included (new in v3) |
| Strike | FR-009 | Included |
| Heading | FR-010 (H1, H2, H3) | Included (configure levels) |
| BulletList | FR-011 | Included |
| OrderedList | FR-011 | Included |
| Paragraph | Basic | Included |
| Document | Basic | Included |

**NOT in StarterKit**:
| Extension | Spec Requirement | Solution |
|-----------|------------------|----------|
| TextAlign | FR-012 | Install @tiptap/extension-text-align |

**Configuration**:
```typescript
import StarterKit from '@tiptap/starter-kit'
import TextAlign from '@tiptap/extension-text-align'

const extensions = [
  StarterKit.configure({
    heading: { levels: [1, 2, 3] },
  }),
  TextAlign.configure({
    types: ['heading', 'paragraph'],
  }),
]
```

### 3. SSR Compatibility (Next.js)

**Decision**: Use `immediatelyRender: false` option and `'use client'` directive

**Rationale**: 
- Next.js 16.x uses server-side rendering by default
- TipTap editor requires DOM access which isn't available on server
- Setting `immediatelyRender: false` prevents hydration mismatches
- Component must be marked as client component

**Implementation Pattern**:
```typescript
'use client'

import { useEditor, EditorContent } from '@tiptap/react'

const NotesContent = () => {
  const editor = useEditor({
    extensions: [...],
    content: '',
    immediatelyRender: false, // Critical for SSR
  })
  
  return <EditorContent editor={editor} />
}
```

### 4. Toolbar Visibility Control

**Decision**: Conditionally render toolbar based on `isInteractive` prop

**Rationale**:
- Spec requires toolbar visible only in interaction mode (FR-006, FR-007)
- Simple conditional rendering is cleanest approach
- No need for complex state management - just prop-based rendering

**Pattern**:
```typescript
interface NotesContentProps {
  isInteractive: boolean
}

const NotesContent = ({ isInteractive }: NotesContentProps) => {
  return (
    <div className="flex flex-col h-full">
      {isInteractive && <NotesToolbar editor={editor} />}
      <EditorContent editor={editor} className="flex-1 overflow-auto" />
    </div>
  )
}
```

### 5. Editor Read-Only Mode

**Decision**: Use TipTap's built-in `editable` option synced to interaction mode

**Rationale**:
- Spec requires content read-only in non-interaction mode (FR-014, FR-015)
- TipTap provides native `setEditable()` method
- React effect can sync editable state with mode prop

**Implementation**:
```typescript
const editor = useEditor({
  extensions: [...],
  editable: isInteractive,
  immediatelyRender: false,
})

// Sync editable state when mode changes
useEffect(() => {
  if (editor) {
    editor.setEditable(isInteractive)
  }
}, [editor, isInteractive])
```

### 6. Window Integration Pattern

**Decision**: Follow TestWindowContent.tsx pattern for window content component

**Rationale**:
- Existing pattern is simple and proven
- Props passed through window system (componentProps)
- No direct coupling to window management

**Reference Pattern** (from TestWindowContent.tsx):
```typescript
interface NotesContentProps {
  isInteractive: boolean
}

export function NotesContent({ isInteractive }: NotesContentProps) {
  // Component implementation
}
```

**Menu Integration** (from MainMenu.tsx):
```typescript
const handleOpenNotes = () => {
  windowEvents.emit('window:open', {
    component: NotesContent,
    title: 'Notes',
    componentProps: { isInteractive: mode === 'windowed' },
  })
}
```

### 7. Multiple Instance Support

**Decision**: Each NotesContent instance manages its own useEditor hook

**Rationale**:
- Spec requires independent state per window (FR-005, FR-017)
- useEditor hook creates unique editor instance per component mount
- No shared state between windows - each is isolated
- Closing window destroys component and editor instance (ephemeral by design)

**Behavior**:
- Each window mount → new useEditor instance → independent state
- Window close → component unmount → editor destroyed → content lost (FR-013)

### 8. Toolbar Component Design

**Decision**: Create inline toolbar with icon buttons using existing shadcn Button component

**Rationale**:
- Matches existing UI patterns in codebase
- Uses lucide-react icons (already installed)
- Consistent with shadcn/ui design system
- Grouped by function: text style, headings, lists, alignment

**Toolbar Structure**:
```
[B] [I] [U] [S] | [H1] [H2] [H3] | [•] [1.] | [⫷] [⫶] [⫸]
```

**Button Actions** (using editor.chain().focus()...run()):
- Bold: `toggleBold()`
- Italic: `toggleItalic()`
- Underline: `toggleUnderline()`
- Strike: `toggleStrike()`
- H1/H2/H3: `toggleHeading({ level: N })`
- Bullet: `toggleBulletList()`
- Ordered: `toggleOrderedList()`
- Align: `setTextAlign('left' | 'center' | 'right')`

## Summary

All NEEDS CLARIFICATION items resolved. Technical approach validated against TipTap v3 documentation.

**Key Findings**:
1. TipTap v3 is well-suited for this use case with minimal configuration
2. StarterKit + TextAlign covers all formatting requirements
3. SSR compatibility requires `immediatelyRender: false`
4. Mode-aware behavior (toolbar, editable) implemented via props
5. Existing window system handles all window management concerns

**Sources**:
- [TipTap React Installation](https://tiptap.dev/docs/editor/getting-started/install/react)
- [TipTap StarterKit](https://tiptap.dev/docs/editor/extensions/functionality/starterkit)
- [TipTap TextAlign Extension](https://tiptap.dev/docs/editor/extensions/functionality/textalign)
- [TipTap Configuration](https://tiptap.dev/docs/editor/getting-started/configure)
