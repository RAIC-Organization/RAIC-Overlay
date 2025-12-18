"use client";

import { useEffect } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Underline from "@tiptap/extension-underline";
import TextAlign from "@tiptap/extension-text-align";
import { NotesToolbar } from "./NotesToolbar";

export interface NotesContentProps {
  isInteractive: boolean;
}

export function NotesContent({ isInteractive }: NotesContentProps) {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [1, 2, 3] },
      }),
      Underline,
      TextAlign.configure({
        types: ["heading", "paragraph"],
      }),
    ],
    content: "",
    editable: isInteractive,
    immediatelyRender: false,
  });

  // Sync editable state with interaction mode
  useEffect(() => {
    if (editor) {
      editor.setEditable(isInteractive);
    }
  }, [editor, isInteractive]);

  return (
    <div className="flex flex-col h-full">
      {isInteractive && <NotesToolbar editor={editor} />}
      <EditorContent
        editor={editor}
        className="flex-1 overflow-auto p-2 prose prose-sm max-w-none dark:prose-invert"
      />
    </div>
  );
}
