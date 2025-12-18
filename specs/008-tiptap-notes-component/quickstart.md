# Quickstart: TipTap Notes Component

**Feature**: 008-tiptap-notes-component
**Date**: 2025-12-18

## Prerequisites

Ensure the following are in place before starting:
- [ ] Feature branch \`008-tiptap-notes-component\` checked out
- [ ] Windows system (007) is complete and working
- [ ] MainMenu component (006) exists and renders in interaction mode

## Step 1: Install Dependencies

\`\`\`bash
npm install @tiptap/react @tiptap/pm @tiptap/starter-kit @tiptap/extension-text-align
\`\`\`

## Step 2: Create NotesContent Component

Create \`src/components/windows/NotesContent.tsx\`:

\`\`\`typescript
'use client'

import { useEffect } from 'react'
import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import TextAlign from '@tiptap/extension-text-align'
import { NotesToolbar } from './NotesToolbar'

export interface NotesContentProps {
  isInteractive: boolean
}

export function NotesContent({ isInteractive }: NotesContentProps) {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [1, 2, 3] },
      }),
      TextAlign.configure({
        types: ['heading', 'paragraph'],
      }),
    ],
    content: '',
    editable: isInteractive,
    immediatelyRender: false,
  })

  // Sync editable state with interaction mode
  useEffect(() => {
    if (editor) {
      editor.setEditable(isInteractive)
    }
  }, [editor, isInteractive])

  return (
    <div className="flex flex-col h-full">
      {isInteractive && <NotesToolbar editor={editor} />}
      <EditorContent 
        editor={editor} 
        className="flex-1 overflow-auto p-2 prose prose-sm max-w-none"
      />
    </div>
  )
}
\`\`\`

## Step 3: Create NotesToolbar Component

Create \`src/components/windows/NotesToolbar.tsx\`:

\`\`\`typescript
'use client'

import type { Editor } from '@tiptap/react'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import {
  Bold, Italic, Underline, Strikethrough,
  Heading1, Heading2, Heading3,
  List, ListOrdered,
  AlignLeft, AlignCenter, AlignRight,
} from 'lucide-react'

interface NotesToolbarProps {
  editor: Editor | null
}

export function NotesToolbar({ editor }: NotesToolbarProps) {
  if (!editor) return null

  return (
    <div className="flex items-center gap-1 p-2 border-b border-border flex-wrap">
      {/* Text formatting */}
      <Button
        variant="ghost"
        size="icon"
        onClick={() => editor.chain().focus().toggleBold().run()}
        data-active={editor.isActive('bold')}
        className="h-8 w-8 data-[active=true]:bg-accent"
      >
        <Bold className="h-4 w-4" />
      </Button>
      {/* ... more buttons following same pattern */}
    </div>
  )
}
\`\`\`

## Step 4: Update MainMenu

Modify \`src/components/MainMenu.tsx\`:

1. Import NotesContent
2. Replace button groups with single group
3. Add Notes button handler

\`\`\`typescript
import { NotesContent } from './windows/NotesContent'

// In component:
const handleOpenNotes = () => {
  windowEvents.emit('window:open', {
    component: NotesContent,
    title: 'Notes',
    componentProps: { isInteractive: mode === 'windowed' },
  })
}

// In render - single button group:
<div className="flex gap-1">
  <Button onClick={handleOpenNotes}>Notes</Button>
  <Button onClick={handleTestWindows}>Test Windows</Button>
</div>
\`\`\`

## Step 5: Verify Integration

1. Run \`npm run tauri:dev\`
2. Press F5 to enter interaction mode
3. Click "Notes" button in menu
4. Verify:
   - [ ] Notes window opens centered
   - [ ] Toolbar visible with formatting buttons
   - [ ] Can type and format text
5. Press F5 to exit interaction mode
6. Verify:
   - [ ] Toolbar disappears
   - [ ] Content still visible but not editable
7. Press F5, close window, open new Notes
8. Verify:
   - [ ] New window starts empty (no persistence)

## Quick Reference

### Key Files

| File | Purpose |
|------|---------|
| \`src/components/windows/NotesContent.tsx\` | Main editor component |
| \`src/components/windows/NotesToolbar.tsx\` | Formatting toolbar |
| \`src/components/MainMenu.tsx\` | Menu with Notes button |

### TipTap Commands

\`\`\`typescript
// Toggle formatting
editor.chain().focus().toggleBold().run()
editor.chain().focus().toggleItalic().run()

// Set heading
editor.chain().focus().toggleHeading({ level: 1 }).run()

// Set alignment
editor.chain().focus().setTextAlign('center').run()
\`\`\`

### Check Active State

\`\`\`typescript
editor.isActive('bold')           // true if bold active
editor.isActive('heading', { level: 1 })  // true if H1
editor.isActive({ textAlign: 'center' })  // true if centered
\`\`\`
