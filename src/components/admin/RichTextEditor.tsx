'use client';

import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';
import Link from '@tiptap/extension-link';
import Image from '@tiptap/extension-image';
import TextAlign from '@tiptap/extension-text-align';
import Highlight from '@tiptap/extension-highlight';
import Placeholder from '@tiptap/extension-placeholder';
import { Markdown } from 'tiptap-markdown';
import { useEffect, useCallback, useRef } from 'react';
import {
  Bold, Italic, Underline as UnderlineIcon, Strikethrough,
  Heading1, Heading2, Heading3,
  List, ListOrdered, Quote, Code, Minus,
  AlignLeft, AlignCenter, AlignRight,
  Link2, Highlighter, Undo2, Redo2,
  Type, FileCode2,
} from 'lucide-react';

/* ─────────────────────────────────────────────── types */
interface RichTextEditorProps {
  value: string;              // always markdown string
  onChange: (val: string) => void;
  mode: 'wysiwyg' | 'markdown';
  onModeChange: (mode: 'wysiwyg' | 'markdown') => void;
  placeholder?: string;
  contentRef?: React.RefObject<HTMLTextAreaElement | null>;
  onInsertMarkdown?: (fn: (before: string, after?: string, placeholder?: string) => void) => void;
}

/* ─────────────────────────────────────────────── toolbar button */
const TB = ({
  onClick, active = false, title, children, disabled = false,
}: {
  onClick: () => void;
  active?: boolean;
  title: string;
  children: React.ReactNode;
  disabled?: boolean;
}) => (
  <button
    type="button"
    onClick={onClick}
    disabled={disabled}
    title={title}
    className={`p-1.5 rounded-md transition-colors ${
      active
        ? 'bg-primary-100 dark:bg-primary-900/40 text-primary-600 dark:text-primary-400'
        : 'text-slate-500 hover:text-slate-800 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-slate-700'
    } disabled:opacity-40 disabled:cursor-not-allowed`}
  >
    {children}
  </button>
);

/* ─────────────────────────────────────────────── main */
export default function RichTextEditor({
  value,
  onChange,
  mode,
  onModeChange,
  placeholder = 'Write your content...',
  contentRef,
  onInsertMarkdown,
}: RichTextEditorProps) {

  const skipSync = useRef(false);

  /* ── Tiptap editor ── */
  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({
        heading: { levels: [1, 2, 3] },
        code: { HTMLAttributes: { class: 'font-mono bg-slate-100 dark:bg-slate-800 px-1 rounded text-sm' } },
        codeBlock: { HTMLAttributes: { class: 'font-mono bg-slate-900 text-slate-100 p-4 rounded-lg text-sm overflow-x-auto' } },
        blockquote: { HTMLAttributes: { class: 'border-l-4 border-primary-400 pl-4 italic text-slate-600 dark:text-slate-400' } },
      }),
      Underline,
      Link.configure({ openOnClick: false, HTMLAttributes: { class: 'text-primary-600 underline' } }),
      Image,
      TextAlign.configure({ types: ['heading', 'paragraph'] }),
      Highlight.configure({ multicolor: false }),
      Placeholder.configure({ placeholder }),
      Markdown.configure({ html: false, transformCopiedText: true }),
    ],
    content: value,          // initial content — markdown string
    editorProps: {
      attributes: {
        class: 'prose prose-slate dark:prose-invert max-w-none min-h-[400px] px-4 py-4 focus:outline-none text-sm leading-relaxed',
      },
    },
    onUpdate: ({ editor }) => {
      if (skipSync.current) return;
      // tiptap-markdown serialises back to markdown
      const md = (editor.storage as any).markdown.getMarkdown();
      onChange(md);
    },
  }, []);  // empty deps — editor created once

  /* ── sync external value → editor (e.g. autosave restore) ── */
  useEffect(() => {
    if (!editor || mode !== 'wysiwyg') return;
    const current = (editor.storage as any).markdown.getMarkdown();
    if (current === value) return;
    skipSync.current = true;
    editor.commands.setContent(value);
    skipSync.current = false;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value, editor]);

  /* ── toolbar actions ── */
  const setLink = useCallback(() => {
    if (!editor) return;
    const prev = editor.getAttributes('link').href;
    const url = window.prompt('URL', prev);
    if (url === null) return;
    if (url === '') { editor.chain().focus().unsetLink().run(); return; }
    editor.chain().focus().setLink({ href: url }).run();
  }, [editor]);

  const ic = 'w-4 h-4';

  /* ── mode toggle ── */
  const ModeToggle = () => (
    <div className="flex items-center gap-1 ml-auto border border-slate-200 dark:border-slate-700 rounded-lg overflow-hidden">
      <button
        type="button"
        onClick={() => onModeChange('wysiwyg')}
        className={`flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium transition-colors ${
          mode === 'wysiwyg'
            ? 'bg-primary-600 text-white'
            : 'text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-700'
        }`}
      >
        <Type className="w-3 h-3" /> Rich Text
      </button>
      <button
        type="button"
        onClick={() => onModeChange('markdown')}
        className={`flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium transition-colors ${
          mode === 'markdown'
            ? 'bg-primary-600 text-white'
            : 'text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-700'
        }`}
      >
        <FileCode2 className="w-3 h-3" /> Markdown
      </button>
    </div>
  );

  /* ── WYSIWYG toolbar ── */
  const WysiwygToolbar = () => {
    if (!editor) return null;
    return (
      <div className="flex flex-wrap items-center gap-0.5 px-3 py-2 bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 border-b-0 rounded-t-lg">
        {/* Undo/Redo */}
        <TB onClick={() => editor.chain().focus().undo().run()} title="Undo" disabled={!editor.can().undo()}>
          <Undo2 className={ic} />
        </TB>
        <TB onClick={() => editor.chain().focus().redo().run()} title="Redo" disabled={!editor.can().redo()}>
          <Redo2 className={ic} />
        </TB>
        <div className="w-px h-5 bg-slate-300 dark:bg-slate-600 mx-1" />

        {/* Headings */}
        <TB onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()} active={editor.isActive('heading', { level: 1 })} title="Heading 1">
          <Heading1 className={ic} />
        </TB>
        <TB onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} active={editor.isActive('heading', { level: 2 })} title="Heading 2">
          <Heading2 className={ic} />
        </TB>
        <TB onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()} active={editor.isActive('heading', { level: 3 })} title="Heading 3">
          <Heading3 className={ic} />
        </TB>
        <div className="w-px h-5 bg-slate-300 dark:bg-slate-600 mx-1" />

        {/* Inline formats */}
        <TB onClick={() => editor.chain().focus().toggleBold().run()} active={editor.isActive('bold')} title="Bold">
          <Bold className={ic} />
        </TB>
        <TB onClick={() => editor.chain().focus().toggleItalic().run()} active={editor.isActive('italic')} title="Italic">
          <Italic className={ic} />
        </TB>
        <TB onClick={() => editor.chain().focus().toggleUnderline().run()} active={editor.isActive('underline')} title="Underline">
          <UnderlineIcon className={ic} />
        </TB>
        <TB onClick={() => editor.chain().focus().toggleStrike().run()} active={editor.isActive('strike')} title="Strikethrough">
          <Strikethrough className={ic} />
        </TB>
        <TB onClick={() => editor.chain().focus().toggleHighlight().run()} active={editor.isActive('highlight')} title="Highlight">
          <Highlighter className={ic} />
        </TB>
        <TB onClick={() => editor.chain().focus().toggleCode().run()} active={editor.isActive('code')} title="Inline code">
          <Code className={ic} />
        </TB>
        <div className="w-px h-5 bg-slate-300 dark:bg-slate-600 mx-1" />

        {/* Lists */}
        <TB onClick={() => editor.chain().focus().toggleBulletList().run()} active={editor.isActive('bulletList')} title="Bullet list">
          <List className={ic} />
        </TB>
        <TB onClick={() => editor.chain().focus().toggleOrderedList().run()} active={editor.isActive('orderedList')} title="Ordered list">
          <ListOrdered className={ic} />
        </TB>
        <TB onClick={() => editor.chain().focus().toggleBlockquote().run()} active={editor.isActive('blockquote')} title="Blockquote">
          <Quote className={ic} />
        </TB>
        <TB onClick={() => editor.chain().focus().toggleCodeBlock().run()} active={editor.isActive('codeBlock')} title="Code block">
          <FileCode2 className={ic} />
        </TB>
        <TB onClick={() => editor.chain().focus().setHorizontalRule().run()} title="Divider">
          <Minus className={ic} />
        </TB>
        <div className="w-px h-5 bg-slate-300 dark:bg-slate-600 mx-1" />

        {/* Alignment */}
        <TB onClick={() => editor.chain().focus().setTextAlign('left').run()} active={editor.isActive({ textAlign: 'left' })} title="Align left">
          <AlignLeft className={ic} />
        </TB>
        <TB onClick={() => editor.chain().focus().setTextAlign('center').run()} active={editor.isActive({ textAlign: 'center' })} title="Align center">
          <AlignCenter className={ic} />
        </TB>
        <TB onClick={() => editor.chain().focus().setTextAlign('right').run()} active={editor.isActive({ textAlign: 'right' })} title="Align right">
          <AlignRight className={ic} />
        </TB>
        <div className="w-px h-5 bg-slate-300 dark:bg-slate-600 mx-1" />

        {/* Link */}
        <TB onClick={setLink} active={editor.isActive('link')} title="Link">
          <Link2 className={ic} />
        </TB>

        <ModeToggle />
      </div>
    );
  };

  /* ─────────────── render ─────────────── */
  if (mode === 'markdown') {
    return (
      <div>
        {/* Markdown toolbar header */}
        <div className="flex items-center px-3 py-2 bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 border-b-0 rounded-t-lg">
          <span className="text-xs text-slate-500 font-medium">Markdown Mode</span>
          <ModeToggle />
        </div>
        <textarea
          ref={contentRef as React.RefObject<HTMLTextAreaElement>}
          value={value}
          onChange={e => onChange(e.target.value)}
          rows={20}
          className="w-full px-4 py-4 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-b-lg focus:ring-2 focus:ring-primary-500 focus:outline-none font-mono text-sm"
          placeholder={placeholder}
        />
      </div>
    );
  }

  /* WYSIWYG mode */
  return (
    <div>
      <WysiwygToolbar />
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-b-lg overflow-hidden">
        <EditorContent editor={editor} />
      </div>
    </div>
  );
}
