# Data Model: TipTap Notes Component

**Feature**: 008-tiptap-notes-component
**Date**: 2025-12-18

## Component Interfaces

### NotesContent Component

Primary component that renders inside a window.

\`\`\`typescript
interface NotesContentProps {
  /**
   * Whether the overlay is in interaction mode (F5 toggled)
   * Controls: toolbar visibility, editor editability
   */
  isInteractive: boolean
}
\`\`\`

**Behavior by Mode**:
| isInteractive | Toolbar | Editor |
|---------------|---------|--------|
| true | Visible | Editable |
| false | Hidden | Read-only |

### NotesToolbar Component

Internal toolbar component (not exported).

\`\`\`typescript
interface NotesToolbarProps {
  /**
   * TipTap editor instance for executing commands
   */
  editor: Editor | null
}
\`\`\`

## Editor Configuration

### TipTap Extensions

\`\`\`typescript
const notesExtensions = [
  StarterKit.configure({
    heading: {
      levels: [1, 2, 3],  // H1, H2, H3 only per FR-010
    },
  }),
  TextAlign.configure({
    types: ['heading', 'paragraph'],  // Apply to text blocks
    alignments: ['left', 'center', 'right'],  // Per FR-012
  }),
]
\`\`\`

### Editor Options

\`\`\`typescript
const editorOptions = {
  extensions: notesExtensions,
  content: '',                    // Start empty per SC-006
  editable: isInteractive,        // Sync with mode per FR-014/FR-015
  immediatelyRender: false,       // SSR compatibility
}
\`\`\`

## Toolbar Actions

### Formatting Commands

| Action | Command | Keyboard Shortcut |
|--------|---------|-------------------|
| Bold | \`toggleBold()\` | Ctrl+B |
| Italic | \`toggleItalic()\` | Ctrl+I |
| Underline | \`toggleUnderline()\` | Ctrl+U |
| Strikethrough | \`toggleStrike()\` | Ctrl+Shift+S |

### Heading Commands

| Action | Command |
|--------|---------|
| Heading 1 | \`toggleHeading({ level: 1 })\` |
| Heading 2 | \`toggleHeading({ level: 2 })\` |
| Heading 3 | \`toggleHeading({ level: 3 })\` |

### List Commands

| Action | Command |
|--------|---------|
| Bullet List | \`toggleBulletList()\` |
| Ordered List | \`toggleOrderedList()\` |

### Alignment Commands

| Action | Command |
|--------|---------|
| Align Left | \`setTextAlign('left')\` |
| Align Center | \`setTextAlign('center')\` |
| Align Right | \`setTextAlign('right')\` |

## State Management

### Editor State (per instance)

TipTap internally manages:
- Document content (HTML/JSON)
- Selection/cursor position
- Active marks (bold, italic, etc.)
- History (undo/redo via StarterKit)

### No External State

- No React context for notes
- No persistence layer
- Each window instance is fully isolated
- State destroyed on component unmount (window close)

## Window Integration

### Opening a Notes Window

\`\`\`typescript
// In MainMenu.tsx
windowEvents.emit('window:open', {
  component: NotesContent,
  title: 'Notes',
  componentProps: { isInteractive: true },  // Initial mode
})
\`\`\`

### Props Flow

\`\`\`
app/page.tsx (mode state)
  └── WindowsContainer (receives mode)
        └── Window (derives isInteractive from mode)
              └── NotesContent (receives isInteractive prop)
                    └── NotesToolbar (conditionally rendered)
\`\`\`

## Styling Structure

\`\`\`typescript
// NotesContent layout
<div className="flex flex-col h-full">
  {isInteractive && <NotesToolbar />}  // Conditional
  <EditorContent className="flex-1 overflow-auto p-2" />
</div>

// NotesToolbar layout
<div className="flex items-center gap-1 p-2 border-b border-border">
  {/* Button groups with Separator between */}
</div>
\`\`\`

## Type Exports

\`\`\`typescript
// src/components/windows/NotesContent.tsx
export interface NotesContentProps {
  isInteractive: boolean
}

export function NotesContent(props: NotesContentProps): JSX.Element
\`\`\`

No additional types needed - uses existing window system types.
