"use client";

import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Link from "@tiptap/extension-link";
import Image from "@tiptap/extension-image";
import Underline from "@tiptap/extension-underline";
import { useEffect } from "react";
import {
  Bold,
  Italic,
  UnderlineIcon,
  Strikethrough,
  Code,
  List,
  ListOrdered,
  Quote,
  Heading1,
  Heading2,
  Heading3,
  Link as LinkIcon,
  Image as ImageIcon,
  Undo,
  Redo,
  Eraser,
  Minus,
} from "lucide-react";
import { cn } from "@/lib/utils";

export interface TiptapEditorProps {
  /** ProseMirror JSON document. */
  value: any;
  /** Called on every doc change with the new JSON. */
  onChange: (json: any) => void;
  placeholder?: string;
  className?: string;
  /** Triggered when user clicks the image toolbar button. Should return a Cloudinary publicId (or absolute URL) and alt. */
  onPickImage?: () => Promise<{ publicId: string; alt?: string } | null>;
}

export function TiptapEditor({ value, onChange, className, onPickImage }: TiptapEditorProps) {
  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({
        heading: { levels: [1, 2, 3, 4] },
      }),
      Underline,
      Link.configure({
        openOnClick: false,
        HTMLAttributes: { rel: "noopener noreferrer", target: "_blank" },
        validate: (href) => !/^javascript:/i.test(href),
      }),
      Image.configure({
        HTMLAttributes: { class: "rounded-lg max-w-full h-auto" },
      }),
    ],
    content: value ?? { type: "doc", content: [] },
    editorProps: {
      attributes: {
        class:
          "prose prose-slate dark:prose-invert max-w-none min-h-[280px] p-4 focus:outline-none",
      },
    },
    onUpdate: ({ editor }) => onChange(editor.getJSON()),
  });

  // Sync external value changes
  useEffect(() => {
    if (!editor) return;
    const current = JSON.stringify(editor.getJSON());
    const incoming = JSON.stringify(value ?? { type: "doc", content: [] });
    if (current !== incoming) {
      editor.commands.setContent(value ?? { type: "doc", content: [] }, { emitUpdate: false } as any);
    }
  }, [value, editor]);

  if (!editor) return <div className="h-72 rounded-md border bg-muted/30 animate-pulse" />;

  const setLink = () => {
    const prev = editor.getAttributes("link").href;
    const href = window.prompt("URL", prev || "https://");
    if (href === null) return;
    if (href === "") {
      editor.chain().focus().unsetLink().run();
      return;
    }
    editor.chain().focus().extendMarkRange("link").setLink({ href }).run();
  };

  const insertImage = async () => {
    if (!onPickImage) {
      const url = window.prompt("Image URL");
      if (!url) return;
      editor.chain().focus().setImage({ src: url, alt: "" }).run();
      return;
    }
    const picked = await onPickImage();
    if (!picked) return;
    const cloud = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || "";
    const src = picked.publicId.startsWith("http")
      ? picked.publicId
      : `https://res.cloudinary.com/${cloud}/image/upload/q_auto,f_auto,c_limit,w_1200/${picked.publicId}`;
    editor.chain().focus().setImage({ src, alt: picked.alt ?? "" }).run();
  };

  return (
    <div className={cn("rounded-md border bg-card", className)}>
      <Toolbar>
        <Btn onClick={() => editor.chain().focus().undo().run()} title="Undo">
          <Undo className="size-4" />
        </Btn>
        <Btn onClick={() => editor.chain().focus().redo().run()} title="Redo">
          <Redo className="size-4" />
        </Btn>
        <Sep />
        <Btn active={editor.isActive("heading", { level: 1 })} onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()} title="Heading 1">
          <Heading1 className="size-4" />
        </Btn>
        <Btn active={editor.isActive("heading", { level: 2 })} onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} title="Heading 2">
          <Heading2 className="size-4" />
        </Btn>
        <Btn active={editor.isActive("heading", { level: 3 })} onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()} title="Heading 3">
          <Heading3 className="size-4" />
        </Btn>
        <Sep />
        <Btn active={editor.isActive("bold")} onClick={() => editor.chain().focus().toggleBold().run()} title="Bold">
          <Bold className="size-4" />
        </Btn>
        <Btn active={editor.isActive("italic")} onClick={() => editor.chain().focus().toggleItalic().run()} title="Italic">
          <Italic className="size-4" />
        </Btn>
        <Btn active={editor.isActive("underline")} onClick={() => editor.chain().focus().toggleUnderline().run()} title="Underline">
          <UnderlineIcon className="size-4" />
        </Btn>
        <Btn active={editor.isActive("strike")} onClick={() => editor.chain().focus().toggleStrike().run()} title="Strike">
          <Strikethrough className="size-4" />
        </Btn>
        <Btn active={editor.isActive("code")} onClick={() => editor.chain().focus().toggleCode().run()} title="Inline code">
          <Code className="size-4" />
        </Btn>
        <Sep />
        <Btn active={editor.isActive("bulletList")} onClick={() => editor.chain().focus().toggleBulletList().run()} title="Bulleted list">
          <List className="size-4" />
        </Btn>
        <Btn active={editor.isActive("orderedList")} onClick={() => editor.chain().focus().toggleOrderedList().run()} title="Numbered list">
          <ListOrdered className="size-4" />
        </Btn>
        <Btn active={editor.isActive("blockquote")} onClick={() => editor.chain().focus().toggleBlockquote().run()} title="Quote">
          <Quote className="size-4" />
        </Btn>
        <Sep />
        <Btn active={editor.isActive("link")} onClick={setLink} title="Link">
          <LinkIcon className="size-4" />
        </Btn>
        <Btn onClick={insertImage} title="Image">
          <ImageIcon className="size-4" />
        </Btn>
        <Btn onClick={() => editor.chain().focus().setHorizontalRule().run()} title="Horizontal rule">
          <Minus className="size-4" />
        </Btn>
        <Sep />
        <Btn onClick={() => editor.chain().focus().unsetAllMarks().clearNodes().run()} title="Clear formatting">
          <Eraser className="size-4" />
        </Btn>
      </Toolbar>
      <EditorContent editor={editor} />
    </div>
  );
}

function Toolbar({ children }: { children: React.ReactNode }) {
  return <div className="flex flex-wrap items-center gap-0.5 border-b px-2 py-1.5 bg-muted/30">{children}</div>;
}

function Sep() {
  return <span className="mx-1 h-5 w-px bg-border" />;
}

function Btn({
  active,
  onClick,
  title,
  children,
}: {
  active?: boolean;
  onClick: () => void;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      aria-label={title}
      className={cn(
        "size-8 rounded-md grid place-items-center transition-colors",
        active ? "bg-primary text-primary-foreground" : "text-foreground/70 hover:bg-muted hover:text-foreground",
      )}
    >
      {children}
    </button>
  );
}
