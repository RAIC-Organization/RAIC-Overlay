"use client";

import { useEffect, useRef } from "react";
import { useEditor, EditorContent, type JSONContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Underline from "@tiptap/extension-underline";
import TextAlign from "@tiptap/extension-text-align";
import { NotesToolbar } from "./NotesToolbar";

export interface NotesContentProps {
  isInteractive: boolean;
  /** Initial content from persistence (TipTap JSON) */
  initialContent?: JSONContent;
  /** Callback when content changes (for persistence) */
  onContentChange?: (content: JSONContent) => void;
}

export function NotesContent({
  isInteractive,
  initialContent,
  onContentChange,
}: NotesContentProps) {
  const onContentChangeRef = useRef(onContentChange);
  onContentChangeRef.current = onContentChange;

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
    content: initialContent ?? "",
    editable: isInteractive,
    immediatelyRender: false,
    onUpdate: ({ editor }) => {
      if (onContentChangeRef.current) {
        onContentChangeRef.current(editor.getJSON());
      }
    },
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
