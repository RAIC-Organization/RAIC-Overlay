"use client";

import type { Editor } from "@tiptap/react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  Bold,
  Italic,
  Underline,
  Strikethrough,
  Heading1,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  AlignLeft,
  AlignCenter,
  AlignRight,
} from "lucide-react";

interface NotesToolbarProps {
  editor: Editor | null;
}

export function NotesToolbar({ editor }: NotesToolbarProps) {
  if (!editor) return null;

  return (
    <div className="flex items-center gap-1 p-2 border-b border-border flex-wrap">
      {/* Text formatting */}
      <Button
        variant="ghost"
        size="icon"
        onClick={() => editor.chain().focus().toggleBold().run()}
        data-active={editor.isActive("bold")}
        className="h-8 w-8 data-[active=true]:bg-accent"
      >
        <Bold className="h-4 w-4" />
      </Button>
      <Button
        variant="ghost"
        size="icon"
        onClick={() => editor.chain().focus().toggleItalic().run()}
        data-active={editor.isActive("italic")}
        className="h-8 w-8 data-[active=true]:bg-accent"
      >
        <Italic className="h-4 w-4" />
      </Button>
      <Button
        variant="ghost"
        size="icon"
        onClick={() => editor.chain().focus().toggleUnderline().run()}
        data-active={editor.isActive("underline")}
        className="h-8 w-8 data-[active=true]:bg-accent"
      >
        <Underline className="h-4 w-4" />
      </Button>
      <Button
        variant="ghost"
        size="icon"
        onClick={() => editor.chain().focus().toggleStrike().run()}
        data-active={editor.isActive("strike")}
        className="h-8 w-8 data-[active=true]:bg-accent"
      >
        <Strikethrough className="h-4 w-4" />
      </Button>

      <Separator orientation="vertical" className="mx-1 h-6" />

      {/* Headings */}
      <Button
        variant="ghost"
        size="icon"
        onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
        data-active={editor.isActive("heading", { level: 1 })}
        className="h-8 w-8 data-[active=true]:bg-accent"
      >
        <Heading1 className="h-4 w-4" />
      </Button>
      <Button
        variant="ghost"
        size="icon"
        onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
        data-active={editor.isActive("heading", { level: 2 })}
        className="h-8 w-8 data-[active=true]:bg-accent"
      >
        <Heading2 className="h-4 w-4" />
      </Button>
      <Button
        variant="ghost"
        size="icon"
        onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
        data-active={editor.isActive("heading", { level: 3 })}
        className="h-8 w-8 data-[active=true]:bg-accent"
      >
        <Heading3 className="h-4 w-4" />
      </Button>

      <Separator orientation="vertical" className="mx-1 h-6" />

      {/* Lists */}
      <Button
        variant="ghost"
        size="icon"
        onClick={() => editor.chain().focus().toggleBulletList().run()}
        data-active={editor.isActive("bulletList")}
        className="h-8 w-8 data-[active=true]:bg-accent"
      >
        <List className="h-4 w-4" />
      </Button>
      <Button
        variant="ghost"
        size="icon"
        onClick={() => editor.chain().focus().toggleOrderedList().run()}
        data-active={editor.isActive("orderedList")}
        className="h-8 w-8 data-[active=true]:bg-accent"
      >
        <ListOrdered className="h-4 w-4" />
      </Button>

      <Separator orientation="vertical" className="mx-1 h-6" />

      {/* Alignment */}
      <Button
        variant="ghost"
        size="icon"
        onClick={() => editor.chain().focus().setTextAlign("left").run()}
        data-active={editor.isActive({ textAlign: "left" })}
        className="h-8 w-8 data-[active=true]:bg-accent"
      >
        <AlignLeft className="h-4 w-4" />
      </Button>
      <Button
        variant="ghost"
        size="icon"
        onClick={() => editor.chain().focus().setTextAlign("center").run()}
        data-active={editor.isActive({ textAlign: "center" })}
        className="h-8 w-8 data-[active=true]:bg-accent"
      >
        <AlignCenter className="h-4 w-4" />
      </Button>
      <Button
        variant="ghost"
        size="icon"
        onClick={() => editor.chain().focus().setTextAlign("right").run()}
        data-active={editor.isActive({ textAlign: "right" })}
        className="h-8 w-8 data-[active=true]:bg-accent"
      >
        <AlignRight className="h-4 w-4" />
      </Button>
    </div>
  );
}
