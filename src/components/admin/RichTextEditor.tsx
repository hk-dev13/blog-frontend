'use client';

import Link from '@tiptap/extension-link';
import { useEditor, EditorContent } from '@tiptap/react';
import { Editor, Extension, Mark, mergeAttributes } from '@tiptap/core';
import StarterKit from '@tiptap/starter-kit';
import Image from '@tiptap/extension-image';
import TextAlign from '@tiptap/extension-text-align';
import Highlight from '@tiptap/extension-highlight';
import Placeholder from '@tiptap/extension-placeholder';
import { Table } from '@tiptap/extension-table';
import { TableRow } from '@tiptap/extension-table-row';
import { TableHeader } from '@tiptap/extension-table-header';
import { TableCell } from '@tiptap/extension-table-cell';
import { Markdown } from 'tiptap-markdown';
import { useEffect, useCallback, useMemo, useRef, useState } from 'react';
import {
  Bold, Italic, Underline as UnderlineIcon, Strikethrough,
  Heading1, Heading2, Heading3,
  List, ListOrdered, Quote, Code, Minus,
  AlignLeft, AlignCenter, AlignRight,
  Link2, Highlighter, Undo2, Redo2,
  Type, FileCode2,
} from 'lucide-react';

import InternalLinkPopover from '@/components/admin/InternalLinkPopover';

/* ─────────────────────────────────────────────── types */
interface RichTextEditorProps {
  value: string;              // always markdown string
  onChange: (val: string) => void;
  mode: 'wysiwyg' | 'markdown';
  onModeChange: (mode: 'wysiwyg' | 'markdown') => void;
  placeholder?: string;
  currentPostId?: string;
  contentRef?: React.RefObject<HTMLTextAreaElement | null>;
  onInsertMarkdown?: (fn: (before: string, after?: string, placeholder?: string) => void) => void;
}

const ToolbarShortcuts = Extension.create({
  name: 'toolbarShortcuts',

  addKeyboardShortcuts() {
    return {
      'Mod-Shift-7': () => this.editor.commands.toggleBulletList(),
      'Mod-Shift-8': () => this.editor.commands.toggleOrderedList(),
      'Mod-Alt--': () => this.editor.commands.setHorizontalRule(),
      'Mod-Alt-Shift-t': () => this.editor.commands.insertTable({ rows: 3, cols: 3, withHeaderRow: true }),
    };
  },
});

function collapseTableWhitespace(value: string) {
  return value.replace(/\s+/g, ' ').trim();
}

function escapeTableCellMarkdown(value: string) {
  return collapseTableWhitespace(value).replace(/\|/g, '\\|');
}

function getTableAlignmentMarker(align: unknown, width: number) {
  const dashCount = Math.max(3, width);

  if (align === 'left') {
    return `:${'-'.repeat(dashCount)}`;
  }

  if (align === 'right') {
    return `${'-'.repeat(dashCount)}:`;
  }

  if (align === 'center') {
    return `:${'-'.repeat(dashCount)}:`;
  }

  return '-'.repeat(dashCount);
}

const MarkdownTable = Table.extend({
  addStorage() {
    return {
      markdown: {
        serialize(state, node) {
          const rows: { text: string; isHeader: boolean; align: unknown }[][] = [];

          node.forEach((row: any) => {
            const cells: { text: string; isHeader: boolean; align: unknown }[] = [];

            row.forEach((cell: any) => {
              cells.push({
                text: escapeTableCellMarkdown(cell.textContent || ''),
                isHeader: cell.type.name === 'tableHeader',
                align: cell.attrs?.align ?? null,
              });
            });

            rows.push(cells);
          });

          const columnCount = rows.reduce((max, row) => Math.max(max, row.length), 0);

          if (!columnCount) {
            state.closeBlock(node);
            return;
          }

          const columnWidths = Array.from({ length: columnCount }, (_, index) => (
            Math.max(
              3,
              ...rows.map(row => row[index]?.text.length ?? 0),
            )
          ));
          const pad = (value: string, width: number) => value + ' '.repeat(Math.max(0, width - value.length));
          const firstRow = rows[0] ?? [];
          const hasHeaderRow = firstRow.some(cell => cell?.isHeader);
          const headerCells = Array.from({ length: columnCount }, (_, index) => (
            hasHeaderRow ? firstRow[index]?.text ?? '' : ''
          ));
          const alignments = Array.from({ length: columnCount }, (_, index) => (
            rows.find(row => row[index]?.align)?.[index]?.align ?? null
          ));
          const bodyRows = hasHeaderRow ? rows.slice(1) : rows;

          state.write(`| ${headerCells.map((cell, index) => pad(cell, columnWidths[index])).join(' | ')} |`);
          state.ensureNewLine();
          state.write(`| ${alignments.map((align, index) => getTableAlignmentMarker(align, columnWidths[index])).join(' | ')} |`);
          state.ensureNewLine();

          bodyRows.forEach((row: { text: string }[]) => {
            const line = Array.from({ length: columnCount }, (_, index) => pad(row[index]?.text ?? '', columnWidths[index]));
            state.write(`| ${line.join(' | ')} |`);
            state.ensureNewLine();
          });

          state.closeBlock(node);
        },
      },
    };
  },
});

const MarkdownUnderline = Mark.create({
  name: 'underline',

  addOptions() {
    return {
      HTMLAttributes: {},
    };
  },

  parseHTML() {
    return [
      { tag: 'u' },
      {
        style: 'text-decoration',
        consuming: false,
        getAttrs: style => ((style as string).includes('underline') ? {} : false),
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    return ['u', mergeAttributes(this.options.HTMLAttributes, HTMLAttributes), 0];
  },

  parseMarkdown(token, helpers) {
    return helpers.applyMark(this.name || 'underline', helpers.parseInline(token.tokens || []));
  },

  renderMarkdown(node, helpers) {
    return `++${helpers.renderChildren(node)}++`;
  },

  markdownTokenizer: {
    name: 'underline',
    level: 'inline',
    start(src: string) {
      return src.indexOf('++');
    },
    tokenize(src: string, _tokens: unknown, lexer: { inlineTokens: (content: string) => unknown[] }) {
      const rule = /^(\+\+)([\s\S]+?)(\+\+)/;
      const match = rule.exec(src);

      if (!match) {
        return undefined;
      }

      const innerContent = match[2].trim();

      return {
        type: 'underline',
        raw: match[0],
        text: innerContent,
        tokens: lexer.inlineTokens(innerContent),
      };
    },
  },

  addStorage() {
    return {
      markdown: {
        serialize: {
          open: '++',
          close: '++',
          expelEnclosingWhitespace: true,
        },
        parse: {
          // handled by the underline extension tokenizer
        },
      },
    };
  },

  addCommands() {
    return {
      setUnderline: () => ({ commands }) => commands.setMark(this.name),
      toggleUnderline: () => ({ commands }) => commands.toggleMark(this.name),
      unsetUnderline: () => ({ commands }) => commands.unsetMark(this.name),
    };
  },

  addKeyboardShortcuts() {
    return {
      'Mod-u': () => this.editor.commands.toggleUnderline(),
      'Mod-U': () => this.editor.commands.toggleUnderline(),
    };
  },
});

/* ─────────────────────────────────────────────── toolbar button */
const TB = ({
  onClick, active = false, title, children, disabled = false, buttonRef,
}: {
  onClick: () => void;
  active?: boolean;
  title: string;
  children: React.ReactNode;
  disabled?: boolean;
  buttonRef?: React.Ref<HTMLButtonElement>;
}) => (
  <button
    ref={buttonRef}
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

const ShortcutChip = ({ children }: { children: React.ReactNode }) => (
  <span className="inline-flex items-center rounded-full border border-slate-200 bg-white/80 px-2 py-0.5 text-[11px] font-medium text-slate-600 dark:border-slate-700 dark:bg-slate-800/80 dark:text-slate-300">
    {children}
  </span>
);

const TableAction = ({
  onClick, title, label, disabled = false, active = false,
}: {
  onClick: () => void;
  title: string;
  label: string;
  disabled?: boolean;
  active?: boolean;
}) => (
  <button
    type="button"
    onClick={onClick}
    disabled={disabled}
    title={title}
    className={`rounded-md border px-2 py-1 text-[11px] font-semibold transition-colors ${
      active
        ? 'border-primary-200 bg-primary-100 text-primary-700 dark:border-primary-800 dark:bg-primary-900/30 dark:text-primary-300'
        : 'border-slate-200 bg-white/90 text-slate-600 hover:border-slate-300 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800/90 dark:text-slate-300 dark:hover:border-slate-600 dark:hover:bg-slate-700'
    } disabled:cursor-not-allowed disabled:opacity-40`}
  >
    {label}
  </button>
);

/* ─────────────────────────────────────────────── main */
export default function RichTextEditor({
  value,
  onChange,
  mode,
  onModeChange,
  placeholder = 'Write your content...',
  currentPostId,
  contentRef,
  onInsertMarkdown,
}: RichTextEditorProps) {

  const skipSync = useRef(false);
  const editorRef = useRef<Editor | null>(null);
  const linkButtonRef = useRef<HTMLButtonElement | null>(null);
  const [isLinkPopoverOpen, setIsLinkPopoverOpen] = useState(false);
  const [activeLinkHref, setActiveLinkHref] = useState<string | null>(null);
  const [linkPrefillQuery, setLinkPrefillQuery] = useState('');
  const linkSelectionRef = useRef<{ from: number; to: number } | null>(null);
  const modeShortcutHint = 'Ctrl/Cmd+Alt+M';
  const richTextShortcutHint = 'Ctrl/Cmd+Alt+R';
  const shortcutHelp = [
    ['Bold', 'Ctrl/Cmd+B'],
    ['Italic', 'Ctrl/Cmd+I'],
    ['Underline', 'Ctrl/Cmd+U'],
    ['Link', 'Ctrl/Cmd+Shift+K'],
    ['Bullet', 'Ctrl/Cmd+Shift+7'],
    ['Table', 'Ctrl/Cmd+Alt+Shift+T'],
    ['Markdown', modeShortcutHint],
    ['Rich Text', richTextShortcutHint],
  ] as const;

  const modeShortcuts = useMemo(() => Extension.create({
    name: 'modeShortcuts',

    addKeyboardShortcuts() {
      return {
        'Mod-Alt-m': () => {
          onModeChange('markdown');
          return true;
        },
        'Mod-Alt-r': () => {
          onModeChange('wysiwyg');
          return true;
        },
      };
    },
  }), [onModeChange]);

  const handleMarkdownModeShortcuts = useCallback((event: React.KeyboardEvent<HTMLTextAreaElement>) => {
    const modifierPressed = event.metaKey || event.ctrlKey;

    if (!modifierPressed || !event.altKey) {
      return;
    }

    const key = event.key.toLowerCase();

    if (key === 'm') {
      event.preventDefault();
      onModeChange('markdown');
      return;
    }

    if (key === 'r') {
      event.preventDefault();
      onModeChange('wysiwyg');
    }
  }, [onModeChange]);

  const openLinkPopover = useCallback((editorInstance?: Editor | null) => {
    const activeEditor = editorInstance ?? editorRef.current;

    if (!activeEditor) {
      return;
    }

    const { from, to, empty } = activeEditor.state.selection;

    if (empty && !activeEditor.isActive('link')) {
      return;
    }

    const selectedText = empty
      ? ''
      : activeEditor.state.doc.textBetween(from, to, ' ').replace(/\s+/g, ' ').trim();

    linkSelectionRef.current = { from, to };
    setActiveLinkHref(activeEditor.getAttributes('link').href || null);
    setLinkPrefillQuery(selectedText);
    setIsLinkPopoverOpen(true);
  }, []);

  const closeLinkPopover = useCallback(() => {
    setIsLinkPopoverOpen(false);
    setLinkPrefillQuery('');
  }, []);

  const applyLink = useCallback((href: string) => {
    const activeEditor = editorRef.current;

    if (!activeEditor) {
      return;
    }

    const selection = linkSelectionRef.current;
    let chain = activeEditor.chain().focus();

    if (selection) {
      chain = chain.setTextSelection(selection);

      if (selection.from === selection.to || activeEditor.isActive('link')) {
        chain = chain.extendMarkRange('link');
      }
    } else if (activeEditor.isActive('link')) {
      chain = chain.extendMarkRange('link');
    }

    chain.setLink({ href }).run();
    setIsLinkPopoverOpen(false);
    setLinkPrefillQuery('');
  }, []);

  const removeLink = useCallback(() => {
    const activeEditor = editorRef.current;

    if (!activeEditor) {
      return;
    }

    const selection = linkSelectionRef.current;
    let chain = activeEditor.chain().focus();

    if (selection) {
      chain = chain.setTextSelection(selection);
    }

    chain.extendMarkRange('link').unsetLink().run();
    setIsLinkPopoverOpen(false);
    setLinkPrefillQuery('');
  }, []);

  /* ── Tiptap editor ── */
  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({
        heading: { levels: [1, 2, 3] },
        underline: false,
        link: false,
        code: { HTMLAttributes: { class: 'font-mono bg-slate-100 dark:bg-slate-800 px-1 rounded text-sm' } },
        codeBlock: { HTMLAttributes: { class: 'font-mono bg-slate-900 text-slate-100 p-4 rounded-lg text-sm overflow-x-auto' } },
        blockquote: { HTMLAttributes: { class: '' } },
      }),
      Image,
      Link.configure({
        openOnClick: false,
        HTMLAttributes: { class: 'no-underline' },
      }),
      TextAlign.configure({ types: ['heading', 'paragraph'] }),
      Highlight.configure({ multicolor: false }),
      MarkdownUnderline,
      Placeholder.configure({ placeholder }),
      MarkdownTable.configure({ resizable: true }),
      TableRow,
      TableHeader,
      TableCell,
      Markdown.configure({ html: false, transformCopiedText: true }),
      ToolbarShortcuts,
      modeShortcuts,
    ],
    content: value,          // initial content — markdown string
    editorProps: {
      attributes: {
        class: 'prose prose-lg prose-slate dark:prose-invert prose-headings:font-serif prose-a:text-primary-600 max-w-none min-h-[400px] px-4 py-6 focus:outline-none leading-relaxed',
      },
      handleKeyDown: (_view, event) => {
        const modifierPressed = event.metaKey || event.ctrlKey;

        if (modifierPressed && event.shiftKey && event.key.toLowerCase() === 'k') {
          event.preventDefault();
          openLinkPopover(editor ?? undefined);
          return true;
        }

        return false;
      },
    },
    onUpdate: ({ editor }) => {
      if (skipSync.current) return;
      // tiptap-markdown serialises back to markdown
      const md = (editor.storage as any).markdown.getMarkdown();
      onChange(md);
    },
  }, []);  // empty deps — editor created once

  useEffect(() => {
    editorRef.current = editor;
  }, [editor]);

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

  const ic = 'w-4 h-4';
  const editorShellClass = 'max-h-[75vh] overflow-y-auto overscroll-contain rounded-lg border border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-900';
  const stickyToolbarClass = 'sticky top-0 z-20 flex items-center px-3 py-2 bg-slate-100/95 dark:bg-slate-900/95 backdrop-blur border border-slate-200 dark:border-slate-700 border-b-0 rounded-t-lg shadow-sm';
  const shortcutBar = (
    <div className="border-t border-slate-200 bg-slate-50/80 px-3 py-2 text-[11px] text-slate-500 dark:border-slate-700 dark:bg-slate-900/60 dark:text-slate-400">
      <div className="flex items-center gap-2 overflow-x-auto whitespace-nowrap hide-scrollbar">
        <span className="font-semibold uppercase tracking-[0.14em] text-slate-400 dark:text-slate-500">Shortcuts</span>
        {shortcutHelp.map(([label, combo]) => (
          <ShortcutChip key={label}>
            {label}: {combo}
          </ShortcutChip>
        ))}
      </div>
    </div>
  );

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
        title={`Switch to Rich Text (${richTextShortcutHint})`}
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
        title={`Switch to Markdown (${modeShortcutHint})`}
      >
        <FileCode2 className="w-3 h-3" /> Markdown
      </button>
    </div>
  );

  /* ── WYSIWYG toolbar ── */
  const WysiwygToolbar = () => {
    if (!editor) return null;

    const inTable = editor.isActive('table');

    return (
      <div className={`${stickyToolbarClass} flex-wrap gap-0.5`}>
        {/* Undo/Redo */}
        <TB onClick={() => editor.chain().focus().undo().run()} title="Undo (Ctrl/Cmd+Z)" disabled={!editor.can().undo()}>
          <Undo2 className={ic} />
        </TB>
        <TB onClick={() => editor.chain().focus().redo().run()} title="Redo (Ctrl/Cmd+Shift+Z)" disabled={!editor.can().redo()}>
          <Redo2 className={ic} />
        </TB>
        <div className="w-px h-5 bg-slate-300 dark:bg-slate-600 mx-1" />

        {/* Headings */}
        <TB onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()} active={editor.isActive('heading', { level: 1 })} title="Heading 1 (Ctrl/Cmd+Alt+1)">
          <Heading1 className={ic} />
        </TB>
        <TB onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} active={editor.isActive('heading', { level: 2 })} title="Heading 2 (Ctrl/Cmd+Alt+2)">
          <Heading2 className={ic} />
        </TB>
        <TB onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()} active={editor.isActive('heading', { level: 3 })} title="Heading 3 (Ctrl/Cmd+Alt+3)">
          <Heading3 className={ic} />
        </TB>
        <div className="w-px h-5 bg-slate-300 dark:bg-slate-600 mx-1" />

        {/* Inline formats */}
        <TB onClick={() => editor.chain().focus().toggleBold().run()} active={editor.isActive('bold')} title="Bold (Ctrl/Cmd+B)">
          <Bold className={ic} />
        </TB>
        <TB onClick={() => editor.chain().focus().toggleItalic().run()} active={editor.isActive('italic')} title="Italic (Ctrl/Cmd+I)">
          <Italic className={ic} />
        </TB>
        <TB onClick={() => editor.chain().focus().toggleUnderline().run()} active={editor.isActive('underline')} title="Underline (Ctrl/Cmd+U)">
          <UnderlineIcon className={ic} />
        </TB>
        <TB onClick={() => editor.chain().focus().toggleStrike().run()} active={editor.isActive('strike')} title="Strikethrough (Ctrl/Cmd+Shift+S)">
          <Strikethrough className={ic} />
        </TB>
        <TB onClick={() => editor.chain().focus().toggleHighlight().run()} active={editor.isActive('highlight')} title="Highlight (Ctrl/Cmd+Shift+H)">
          <Highlighter className={ic} />
        </TB>
        <TB onClick={() => editor.chain().focus().toggleCode().run()} active={editor.isActive('code')} title="Inline code (Ctrl/Cmd+E)">
          <Code className={ic} />
        </TB>
        <div className="w-px h-5 bg-slate-300 dark:bg-slate-600 mx-1" />

        {/* Lists */}
        <TB onClick={() => editor.chain().focus().toggleBulletList().run()} active={editor.isActive('bulletList')} title="Bullet list (Ctrl/Cmd+Shift+7)">
          <List className={ic} />
        </TB>
        <TB onClick={() => editor.chain().focus().toggleOrderedList().run()} active={editor.isActive('orderedList')} title="Ordered list (Ctrl/Cmd+Shift+8)">
          <ListOrdered className={ic} />
        </TB>
        <TB onClick={() => editor.chain().focus().toggleBlockquote().run()} active={editor.isActive('blockquote')} title="Blockquote (Ctrl/Cmd+Shift+B)">
          <Quote className={ic} />
        </TB>
        <TB onClick={() => editor.chain().focus().toggleCodeBlock().run()} active={editor.isActive('codeBlock')} title="Code block (Ctrl/Cmd+Alt+C)">
          <FileCode2 className={ic} />
        </TB>
        <TB onClick={() => editor.chain().focus().setHorizontalRule().run()} title="Divider (Ctrl/Cmd+Alt+-)">
          <Minus className={ic} />
        </TB>
        <div className="w-px h-5 bg-slate-300 dark:bg-slate-600 mx-1" />

        {/* Alignment */}
        <TB onClick={() => editor.chain().focus().setTextAlign('left').run()} active={editor.isActive({ textAlign: 'left' })} title="Align left (Ctrl/Cmd+Shift+L)">
          <AlignLeft className={ic} />
        </TB>
        <TB onClick={() => editor.chain().focus().setTextAlign('center').run()} active={editor.isActive({ textAlign: 'center' })} title="Align center (Ctrl/Cmd+Shift+E)">
          <AlignCenter className={ic} />
        </TB>
        <TB onClick={() => editor.chain().focus().setTextAlign('right').run()} active={editor.isActive({ textAlign: 'right' })} title="Align right (Ctrl/Cmd+Shift+R)">
          <AlignRight className={ic} />
        </TB>
        <div className="w-px h-5 bg-slate-300 dark:bg-slate-600 mx-1" />

        {/* Link */}
        <TB
          buttonRef={linkButtonRef}
          onClick={() => openLinkPopover(editor)}
          active={editor.isActive('link')}
          title="Link (Ctrl/Cmd+Shift+K)"
        >
          <Link2 className={ic} />
        </TB>
        <div className="w-px h-5 bg-slate-300 dark:bg-slate-600 mx-1" />

        {/* Table */}
        <TB onClick={() => editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()} title="Insert Table (Ctrl/Cmd+Alt+Shift+T)">
          <span className="font-bold text-[10px]">TBL</span>
        </TB>

        <ModeToggle />

        {inTable ? (
          <div className="flex w-full items-center gap-1 overflow-x-auto border-t border-slate-200 pt-2 text-[11px] dark:border-slate-700">
            <span className="pr-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-400 dark:text-slate-500">
              Table
            </span>
            <TableAction
              onClick={() => editor.chain().focus().addColumnBefore().run()}
              title="Add column before"
              label="Col + Left"
              disabled={!editor.can().addColumnBefore()}
            />
            <TableAction
              onClick={() => editor.chain().focus().addColumnAfter().run()}
              title="Add column after"
              label="Col + Right"
              disabled={!editor.can().addColumnAfter()}
            />
            <TableAction
              onClick={() => editor.chain().focus().deleteColumn().run()}
              title="Delete current column"
              label="Col -"
              disabled={!editor.can().deleteColumn()}
            />
            <TableAction
              onClick={() => editor.chain().focus().addRowBefore().run()}
              title="Add row above"
              label="Row + Top"
              disabled={!editor.can().addRowBefore()}
            />
            <TableAction
              onClick={() => editor.chain().focus().addRowAfter().run()}
              title="Add row below"
              label="Row + Bottom"
              disabled={!editor.can().addRowAfter()}
            />
            <TableAction
              onClick={() => editor.chain().focus().deleteRow().run()}
              title="Delete current row"
              label="Row -"
              disabled={!editor.can().deleteRow()}
            />
            <TableAction
              onClick={() => editor.chain().focus().toggleHeaderRow().run()}
              title="Toggle header row"
              label="Head Row"
              active={editor.isActive('tableHeader')}
              disabled={!editor.can().toggleHeaderRow()}
            />
            <TableAction
              onClick={() => editor.chain().focus().toggleHeaderColumn().run()}
              title="Toggle header column"
              label="Head Col"
              disabled={!editor.can().toggleHeaderColumn()}
            />
            <TableAction
              onClick={() => editor.chain().focus().deleteTable().run()}
              title="Delete table"
              label="Delete Tbl"
              disabled={!editor.can().deleteTable()}
            />
            <span className="pl-2 text-[10px] font-medium text-slate-400 dark:text-slate-500">
              Merge/split cell is unavailable because posts are saved as Markdown tables.
            </span>
          </div>
        ) : null}
      </div>
    );
  };

  /* ─────────────── render ─────────────── */
  if (mode === 'markdown') {
    return (
        <div className={editorShellClass}>
        {/* Markdown toolbar header */}
        <div className={stickyToolbarClass}>
          <span className="text-xs text-slate-500 font-medium">Markdown Mode</span>
          <ModeToggle />
        </div>
        <textarea
          ref={contentRef as React.RefObject<HTMLTextAreaElement>}
          value={value}
          onChange={e => onChange(e.target.value)}
          onKeyDown={handleMarkdownModeShortcuts}
          rows={20}
          className="min-h-[400px] w-full resize-y px-4 py-4 bg-slate-50 dark:bg-slate-900 border-0 rounded-b-lg focus:ring-2 focus:ring-primary-500 focus:outline-none font-mono text-sm"
          placeholder={placeholder}
        />
        {shortcutBar}
      </div>
    );
  }

  /* WYSIWYG mode */
  return (
    <>
      <div className={editorShellClass}>
        <WysiwygToolbar />
        <div className="rounded-b-lg">
          <EditorContent editor={editor} />
        </div>
        {shortcutBar}
      </div>
      <InternalLinkPopover
        open={isLinkPopoverOpen}
        anchorEl={linkButtonRef.current}
        excludePostId={currentPostId}
        activeHref={activeLinkHref}
        initialQuery={linkPrefillQuery}
        onClose={closeLinkPopover}
        onSelect={applyLink}
        onRemove={removeLink}
      />
    </>
  );
}
