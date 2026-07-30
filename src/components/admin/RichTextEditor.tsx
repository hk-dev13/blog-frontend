'use client';

import Link from '@tiptap/extension-link';
import { useEditor, EditorContent } from '@tiptap/react';
import { Editor, Extension, Mark, Node, mergeAttributes, type MarkdownToken } from '@tiptap/core';
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
  Type, FileCode2, Search, Replace, ChevronLeft, ChevronRight, X,
  Image as ImageIcon, Video as VideoIcon, Upload, Loader2,
  Plus, Table as TableIcon, Workflow, Trash2
} from 'lucide-react';

import { useAppStore } from '@/store/useAppStore';
import { useToastStore } from '@/store/useToastStore';
import { API_URL } from '@/lib/env';
import InternalLinkPopover from '@/components/admin/InternalLinkPopover';
import BlockDragHandle from '@/components/admin/BlockDragHandle';
import { SearchHighlightExtension } from '@/lib/tiptap/searchHighlightExtension';

export function extractYoutubeVideoId(input: string): string | null {
  if (!input) return null;
  const trimmed = input.trim();

  if (/^[a-zA-Z0-9_-]{11}$/.test(trimmed)) {
    return trimmed;
  }

  try {
    const urlStr = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
    const parsed = new URL(urlStr);
    const host = parsed.hostname.toLowerCase();
    const validHosts = [
      'youtube.com',
      'www.youtube.com',
      'm.youtube.com',
      'youtu.be',
      'www.youtu.be',
      'youtube-nocookie.com',
      'www.youtube-nocookie.com',
    ];

    if (!validHosts.includes(host)) {
      return null;
    }

    if (host.includes('youtu.be')) {
      const id = parsed.pathname.slice(1);
      return /^[a-zA-Z0-9_-]{11}$/.test(id) ? id : null;
    }

    if (parsed.pathname.startsWith('/embed/')) {
      const id = parsed.pathname.split('/')[2];
      return /^[a-zA-Z0-9_-]{11}$/.test(id) ? id : null;
    }

    if (parsed.pathname.startsWith('/v/')) {
      const id = parsed.pathname.split('/')[2];
      return /^[a-zA-Z0-9_-]{11}$/.test(id) ? id : null;
    }

    const vParam = parsed.searchParams.get('v');
    if (vParam && /^[a-zA-Z0-9_-]{11}$/.test(vParam)) {
      return vParam;
    }
  } catch {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]{11}).*/;
    const match = trimmed.match(regExp);
    if (match && match[2] && /^[a-zA-Z0-9_-]{11}$/.test(match[2])) {
      return match[2];
    }
  }

  return null;
}

export function isSafeUrl(url: string): boolean {
  if (!url) return false;
  const trimmed = url.trim();
  if (trimmed.startsWith('/') || trimmed.startsWith('#')) return true;
  if (/^https?:\/\//i.test(trimmed) || /^mailto:/i.test(trimmed)) return true;
  return false;
}

export function sanitizeUrl(url: string): string {
  if (!url) return '';
  const trimmed = url.trim();
  return isSafeUrl(trimmed) ? trimmed : '';
}

export const YoutubeNode = Node.create({
  name: 'youtube',
  group: 'block',
  selectable: true,
  draggable: true,
  atom: true,

  addAttributes() {
    return {
      videoId: {
        default: null,
      },
    };
  },

  parseHTML() {
    return [
      {
        tag: 'div[data-youtube]',
        getAttrs: (el) => {
          const val = (el as HTMLElement).getAttribute('data-youtube');
          return { videoId: extractYoutubeVideoId(val || '') };
        },
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    const videoId = HTMLAttributes.videoId;
    if (!videoId || !/^[a-zA-Z0-9_-]{11}$/.test(videoId)) {
      return ['div', { class: 'hidden' }];
    }

    return [
      'div',
      {
        'data-youtube': videoId,
        class: 'aspect-video w-full max-w-2xl mx-auto rounded-lg overflow-hidden my-4 relative bg-slate-100 dark:bg-slate-800 flex items-center justify-center border border-slate-200 dark:border-slate-700',
      },
      [
        'iframe',
        {
          src: `https://www.youtube-nocookie.com/embed/${videoId}`,
          title: 'YouTube video player',
          loading: 'lazy',
          referrerpolicy: 'strict-origin-when-cross-origin',
          allowfullscreen: 'true',
          class: 'absolute inset-0 w-full h-full border-0 pointer-events-none',
        },
      ],
    ];
  },

  addStorage() {
    return {
      markdown: {
        serialize(state: any, node: any) {
          if (node.attrs.videoId) {
            state.write(`@[youtube](${node.attrs.videoId})`);
          }
          state.closeBlock(node);
        },
        parse: {
          setup(markdownit: any) {
            markdownit.inline.ruler.after('escape', 'youtube', (state: any, silent: boolean) => {
              const str = state.src.slice(state.pos);
              if (!str.startsWith('@[youtube]')) {
                return false;
              }
              const match = /^@\[youtube\]\(([^)]+)\)/.exec(str);
              if (!match) {
                return false;
              }
              const videoId = extractYoutubeVideoId(match[1]);
              if (!silent && videoId) {
                const token = state.push('youtube', 'div', 0);
                token.attrs = [['data-youtube', videoId]];
              }
              state.pos += match[0].length;
              return true;
            });

            markdownit.renderer.rules.youtube = (tokens: any, idx: number) => {
              const token = tokens[idx];
              const videoId = token.attrs ? token.attrs[0][1] : '';
              return `<div data-youtube="${videoId}"></div>`;
            };
          },
        },
      },
    };
  },
});

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
        serialize(state: any, node: any) {
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
    tokenize(
      src: string,
      _tokens: MarkdownToken[],
      lexer: { inlineTokens: (content: string) => MarkdownToken[] }
    ) {
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
  onClick, active = false, isToggle = false, title, ariaLabel, children, disabled = false, buttonRef,
}: {
  onClick: () => void;
  active?: boolean;
  isToggle?: boolean;
  title: string;
  ariaLabel?: string;
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
    aria-label={ariaLabel || title}
    {...(isToggle ? { 'aria-pressed': active } : {})}
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

function isWordCharacter(value: string) {
  return /[\p{L}\p{N}_]/u.test(value);
}

function isWholeWordMatch(text: string, start: number, end: number) {
  const previous = start > 0 ? text[start - 1] : '';
  const next = end < text.length ? text[end] : '';

  return (!previous || !isWordCharacter(previous)) && (!next || !isWordCharacter(next));
}

function getTextMatches(text: string, query: string, caseSensitive: boolean, wholeWord: boolean) {
  if (!query) {
    return [] as { start: number; end: number }[];
  }

  const haystack = caseSensitive ? text : text.toLowerCase();
  const needle = caseSensitive ? query : query.toLowerCase();
  const matches: { start: number; end: number }[] = [];
  let index = haystack.indexOf(needle);

  while (index !== -1) {
    const end = index + query.length;
    if (!wholeWord || isWholeWordMatch(text, index, end)) {
      matches.push({ start: index, end });
    }
    index = haystack.indexOf(needle, index + Math.max(needle.length, 1));
  }

  return matches;
}

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
  const findInputRef = useRef<HTMLInputElement | null>(null);
  const replaceInputRef = useRef<HTMLInputElement | null>(null);
  const markdownTextareaRef = useRef<HTMLTextAreaElement | null>(null);
  const modeRef = useRef(mode);
  const onModeChangeRef = useRef(onModeChange);
  const [isLinkPopoverOpen, setIsLinkPopoverOpen] = useState(false);
  const [activeLinkHref, setActiveLinkHref] = useState<string | null>(null);
  const [linkPrefillQuery, setLinkPrefillQuery] = useState('');
  const [isFindReplaceOpen, setIsFindReplaceOpen] = useState(false);
  const [findQuery, setFindQuery] = useState('');
  const [replaceQuery, setReplaceQuery] = useState('');
  const [caseSensitiveFind, setCaseSensitiveFind] = useState(false);
  const [wholeWordFind, setWholeWordFind] = useState(true);
  const [activeMatchIndex, setActiveMatchIndex] = useState(0);
  const linkSelectionRef = useRef<{ from: number; to: number } | null>(null);

  // Image insertion states
  const [imageModalOpen, setImageModalOpen] = useState(false);
  const [imageUrlInput, setImageUrlInput] = useState('');
  const [imageAltInput, setImageAltInput] = useState('');
  const [imageWidthInput, setImageWidthInput] = useState('');
  const [imageCaptionInput, setImageCaptionInput] = useState('');
  const [uploadingEditorImage, setUploadingEditorImage] = useState(false);

  // YouTube embed states
  const [youtubeModalOpen, setYoutubeModalOpen] = useState(false);
  const [youtubeUrlInput, setYoutubeUrlInput] = useState('');

  // Access token for image uploads
  const token = useAppStore(state => state.token);

  // Handle uploading editor image
  const handleEditorImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    setUploadingEditorImage(true);
    const formData = new FormData();
    formData.append('file', file);
    try {
      const res = await fetch(`${API_URL}/upload`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: formData,
      });
      const data = await res.json();
      if (data.success) {
        setImageUrlInput(data.data.url);
      } else {
        throw new Error(data.error || 'Upload failed');
      }
    } catch (err: unknown) {
      useToastStore.getState().push({ variant: 'error', title: 'Failed to upload image', description: err instanceof Error ? err.message : undefined });
    } finally {
      setUploadingEditorImage(false);
    }
  };

  const insertImage = () => {
    if (!imageUrlInput.trim()) return;
    const safeUrl = sanitizeUrl(imageUrlInput.trim());
    if (!safeUrl) {
      useToastStore.getState().push({ variant: 'error', title: 'Invalid Image URL', description: 'Only http, https, and relative image URLs are allowed.' });
      return;
    }
    const activeEditor = editorRef.current;
    const altText = imageAltInput.trim();
    const widthText = imageWidthInput.trim();
    const captionText = imageCaptionInput.trim();

    const safeAlt = altText.replace(/\|/g, '\\|');
    const safeWidth = widthText.replace(/\|/g, '\\|');
    const safeCaption = captionText.replace(/\|/g, '\\|');

    let combinedAlt = safeAlt;
    if (safeWidth || safeCaption) {
      combinedAlt = `${safeAlt}|${safeWidth}|${safeCaption}`;
    }

    if (activeEditor) {
      activeEditor.chain().focus().setImage({ src: safeUrl, alt: combinedAlt }).run();
    }
    setImageModalOpen(false);
    setImageUrlInput('');
    setImageAltInput('');
    setImageWidthInput('');
    setImageCaptionInput('');
  };

  const insertYoutube = () => {
    if (!youtubeUrlInput.trim()) return;
    const videoId = extractYoutubeVideoId(youtubeUrlInput.trim());
    if (!videoId) {
      useToastStore.getState().push({ variant: 'error', title: 'Invalid YouTube URL', description: 'Please enter a valid YouTube video link or Video ID.' });
      return;
    }
    const activeEditor = editorRef.current;
    if (activeEditor) {
      activeEditor.chain().focus().insertContent({
        type: 'youtube',
        attrs: { videoId }
      }).run();
    }
    setYoutubeModalOpen(false);
    setYoutubeUrlInput('');
  };
  const modeShortcutHint = 'Ctrl/Cmd+Alt+M';
  const richTextShortcutHint = 'Ctrl/Cmd+Alt+R';
  const findReplaceShortcutHint = 'Ctrl/Cmd+F';
  const shortcutHelp = [
    ['Bold', 'Ctrl/Cmd+B'],
    ['Italic', 'Ctrl/Cmd+I'],
    ['Underline', 'Ctrl/Cmd+U'],
    ['Link', 'Ctrl/Cmd+Shift+K'],
    ['Bullet', 'Ctrl/Cmd+Shift+7'],
    ['Table', 'Ctrl/Cmd+Alt+Shift+T'],
    ['Find/Replace source', findReplaceShortcutHint],
    ['Markdown', modeShortcutHint],
    ['Rich Text', richTextShortcutHint],
  ] as const;
  const matches = useMemo(
    () => getTextMatches(value, findQuery, caseSensitiveFind, wholeWordFind),
    [caseSensitiveFind, findQuery, value, wholeWordFind]
  );
  const activeMatch = matches[activeMatchIndex] ?? null;

  useEffect(() => {
    modeRef.current = mode;
    onModeChangeRef.current = onModeChange;
  }, [mode, onModeChange]);

  const openFindReplace = useCallback(() => {
    if (modeRef.current !== 'markdown') {
      onModeChangeRef.current('markdown');
    }

    setIsFindReplaceOpen(true);
    requestAnimationFrame(() => {
      findInputRef.current?.focus();
      findInputRef.current?.select();
    });
  }, []);

  const modeShortcuts = useMemo(() => Extension.create({
    name: 'modeShortcuts',

    addKeyboardShortcuts() {
      return {
        'Mod-f': () => {
          openFindReplace();
          return true;
        },
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
  }), [onModeChange, openFindReplace]);

  const closeFindReplace = useCallback(() => {
    setIsFindReplaceOpen(false);
    setActiveMatchIndex(0);
    if (mode === 'wysiwyg') {
      editorRef.current?.commands.focus();
    } else {
      (contentRef?.current ?? markdownTextareaRef.current)?.focus();
    }
  }, [contentRef, mode]);

  const selectMarkdownRange = useCallback((start: number, end: number) => {
    if (mode !== 'markdown') {
      return;
    }

    requestAnimationFrame(() => {
      const textarea = contentRef?.current ?? markdownTextareaRef.current;
      if (!textarea) {
        return;
      }

      textarea.focus();
      textarea.setSelectionRange(start, end);
      const lineHeight = 20;
      const linesBeforeMatch = value.slice(0, start).split('\n').length - 1;
      textarea.scrollTop = Math.max(0, linesBeforeMatch * lineHeight - textarea.clientHeight / 2);
    });
  }, [contentRef, mode, value]);

  const goToMatch = useCallback((direction: 1 | -1) => {
    if (!matches.length) {
      setActiveMatchIndex(0);
      return;
    }

    const nextIndex = (activeMatchIndex + direction + matches.length) % matches.length;
    setActiveMatchIndex(nextIndex);
    const nextMatch = matches[nextIndex];
    selectMarkdownRange(nextMatch.start, nextMatch.end);
  }, [activeMatchIndex, matches, selectMarkdownRange]);

  const replaceMatch = useCallback(() => {
    const match = matches[activeMatchIndex];

    if (!match) {
      return;
    }

    const nextValue = `${value.slice(0, match.start)}${replaceQuery}${value.slice(match.end)}`;
    onChange(nextValue);

    const nextMatches = getTextMatches(nextValue, findQuery, caseSensitiveFind, wholeWordFind);
    const nextIndex = nextMatches.length ? Math.min(activeMatchIndex, nextMatches.length - 1) : 0;
    setActiveMatchIndex(nextIndex);

    const nextMatch = nextMatches[nextIndex];
    if (nextMatch) {
      selectMarkdownRange(nextMatch.start, nextMatch.end);
    }
  }, [activeMatchIndex, caseSensitiveFind, findQuery, matches, onChange, replaceQuery, selectMarkdownRange, value, wholeWordFind]);

  const replaceAllMatches = useCallback(() => {
    if (!findQuery || !matches.length) {
      return;
    }

    let nextValue = '';
    let cursor = 0;

    matches.forEach(match => {
      nextValue += value.slice(cursor, match.start);
      nextValue += replaceQuery;
      cursor = match.end;
    });

    nextValue += value.slice(cursor);
    onChange(nextValue);
    setActiveMatchIndex(0);
  }, [findQuery, matches, onChange, replaceQuery, value]);

  useEffect(() => {
    setActiveMatchIndex(0);
  }, [caseSensitiveFind, findQuery, wholeWordFind]);

  useEffect(() => {
    if (!matches.length) {
      setActiveMatchIndex(0);
      return;
    }

    if (activeMatchIndex >= matches.length) {
      setActiveMatchIndex(matches.length - 1);
    }
  }, [activeMatchIndex, matches.length]);

  useEffect(() => {
    if (!activeMatch || !isFindReplaceOpen) {
      return;
    }

    selectMarkdownRange(activeMatch.start, activeMatch.end);
  }, [activeMatch, isFindReplaceOpen, selectMarkdownRange]);

  const handleMarkdownModeShortcuts = useCallback((event: React.KeyboardEvent<HTMLTextAreaElement>) => {
    const modifierPressed = event.metaKey || event.ctrlKey;

    if (modifierPressed && !event.altKey && event.key.toLowerCase() === 'f') {
      event.preventDefault();
      openFindReplace();
      return;
    }

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
  }, [onModeChange, openFindReplace]);

  const handleFindInputKeyDown = useCallback((event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter') {
      event.preventDefault();
      goToMatch(event.shiftKey ? -1 : 1);
      return;
    }

    if (event.key === 'Escape') {
      event.preventDefault();
      closeFindReplace();
    }
  }, [closeFindReplace, goToMatch]);

  const handleReplaceInputKeyDown = useCallback((event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter') {
      event.preventDefault();
      replaceMatch();
      return;
    }

    if (event.key === 'Escape') {
      event.preventDefault();
      closeFindReplace();
    }
  }, [closeFindReplace, replaceMatch]);

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

    if (!activeEditor || !href) {
      return;
    }

    const safeHref = sanitizeUrl(href);
    if (!safeHref) {
      useToastStore.getState().push({ variant: 'error', title: 'Invalid URL', description: 'Only http, https, mailto, and relative links are allowed.' });
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

    chain.setLink({ href: safeHref }).run();
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
      YoutubeNode,
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
      SearchHighlightExtension,
      Markdown.configure({ html: false, transformCopiedText: true }),
      ToolbarShortcuts,
      modeShortcuts,
    ],
    content: value,          // initial content — markdown string
    editorProps: {
      attributes: {
        class: 'prose prose-lg prose-slate dark:prose-invert prose-headings:font-serif prose-a:text-primary-600 max-w-4xl mx-auto min-h-[550px] px-6 py-6 focus:outline-none leading-relaxed',
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
  });

  // Sync SearchHighlightExtension decorations when search input changes
  useEffect(() => {
    if (!editor || mode !== 'wysiwyg') return;
    if (!isFindReplaceOpen || !findQuery.trim()) {
      (editor.commands as any).clearSearch();
      return;
    }
    (editor.commands as any).setSearchTerm(findQuery);
    (editor.commands as any).setMatchIndex(activeMatchIndex);
  }, [editor, mode, isFindReplaceOpen, findQuery, activeMatchIndex]);

  useEffect(() => {
    editorRef.current = editor;
  }, [editor]);

  /* ── sync external markdown value → editor, even while Markdown mode is active ── */
  useEffect(() => {
    if (!editor) return;
    const current = (editor.storage as any).markdown.getMarkdown();
    if (current === value) return;
    skipSync.current = true;
    try {
      editor.commands.setContent(value);
    } finally {
      skipSync.current = false;
    }
  }, [value, editor]);

  const ic = 'w-4 h-4';
  const editorShellClass = 'rounded-lg border border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-900';
  const stickyToolbarClass = 'sticky top-0 z-20 flex items-center px-3 py-2 bg-slate-100/95 dark:bg-slate-900/95 backdrop-blur border border-slate-200 dark:border-slate-700 border-b-0 rounded-t-lg shadow-sm';

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

  const renderFindReplacePanel = () => {
    if (!isFindReplaceOpen) {
      return null;
    }

    return (
      <div className="border-x border-b border-slate-200 bg-white px-3 py-3 dark:border-slate-700 dark:bg-slate-900">
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex min-w-[180px] flex-1 items-center gap-2 rounded-md border border-slate-200 bg-slate-50 px-2 py-1.5 dark:border-slate-700 dark:bg-slate-800">
            <Search className="h-4 w-4 text-slate-400" />
            <input
              ref={findInputRef}
              value={findQuery}
              onChange={event => setFindQuery(event.target.value)}
              onKeyDown={handleFindInputKeyDown}
              className="min-w-0 flex-1 bg-transparent text-sm text-slate-900 outline-none placeholder:text-slate-400 dark:text-white"
              placeholder="Find text"
            />
          </div>

          <div className="flex min-w-[180px] flex-1 items-center gap-2 rounded-md border border-slate-200 bg-slate-50 px-2 py-1.5 dark:border-slate-700 dark:bg-slate-800">
            <Replace className="h-4 w-4 text-slate-400" />
            <input
              ref={replaceInputRef}
              value={replaceQuery}
              onChange={event => setReplaceQuery(event.target.value)}
              onKeyDown={handleReplaceInputKeyDown}
              className="min-w-0 flex-1 bg-transparent text-sm text-slate-900 outline-none placeholder:text-slate-400 dark:text-white"
              placeholder="Replace with"
            />
          </div>

          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => goToMatch(-1)}
              disabled={!matches.length}
              title="Previous match (Shift+Enter)"
              className="rounded-md border border-slate-200 p-1.5 text-slate-500 transition-colors hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => goToMatch(1)}
              disabled={!matches.length}
              title="Next match (Enter)"
              className="rounded-md border border-slate-200 p-1.5 text-slate-500 transition-colors hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>

          <button
            type="button"
            onClick={replaceMatch}
            disabled={!activeMatch}
            className="rounded-md border border-slate-200 px-2.5 py-1.5 text-xs font-semibold text-slate-600 transition-colors hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
          >
            Replace
          </button>
          <button
            type="button"
            onClick={replaceAllMatches}
            disabled={!matches.length}
            className="rounded-md bg-primary-600 px-2.5 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-primary-700 disabled:cursor-not-allowed disabled:opacity-40"
          >
            Replace all
          </button>
          <label className="inline-flex items-center gap-1.5 rounded-md border border-slate-200 px-2.5 py-1.5 text-xs font-medium text-slate-500 dark:border-slate-700 dark:text-slate-300">
            <input
              type="checkbox"
              checked={caseSensitiveFind}
              onChange={event => setCaseSensitiveFind(event.target.checked)}
              className="h-3.5 w-3.5 rounded border-slate-300 text-primary-600 focus:ring-primary-500"
            />
            Aa
          </label>
          <label className="inline-flex items-center gap-1.5 rounded-md border border-slate-200 px-2.5 py-1.5 text-xs font-medium text-slate-500 dark:border-slate-700 dark:text-slate-300">
            <input
              type="checkbox"
              checked={wholeWordFind}
              onChange={event => setWholeWordFind(event.target.checked)}
              className="h-3.5 w-3.5 rounded border-slate-300 text-primary-600 focus:ring-primary-500"
            />
            Word
          </label>
          <span className="min-w-[72px] text-xs font-medium text-slate-500 dark:text-slate-400">
            {findQuery ? `${matches.length ? activeMatchIndex + 1 : 0}/${matches.length}` : '0/0'}
          </span>
          <button
            type="button"
            onClick={closeFindReplace}
            title="Close find and replace"
            className="rounded-md p-1.5 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800 dark:hover:text-white"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>
    );
  };

  /* ── WYSIWYG toolbar ── */
  const WysiwygToolbar = () => {
    if (!editor) return null;

    const inTable = editor.isActive('table');

    return (
      <div className={`${stickyToolbarClass} flex-wrap gap-0.5`}>
        {/* Undo/Redo */}
        <TB onClick={() => editor.chain().focus().undo().run()} title="Undo (Ctrl/Cmd+Z)" ariaLabel="Undo" disabled={!editor.can().undo()}>
          <Undo2 className={ic} />
        </TB>
        <TB onClick={() => editor.chain().focus().redo().run()} title="Redo (Ctrl/Cmd+Shift+Z)" ariaLabel="Redo" disabled={!editor.can().redo()}>
          <Redo2 className={ic} />
        </TB>
        <div className="w-px h-5 bg-slate-300 dark:bg-slate-600 mx-1" />

        {/* Headings */}
        <TB onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()} active={editor.isActive('heading', { level: 1 })} isToggle title="Heading 1 (Ctrl/Cmd+Alt+1)" ariaLabel="Heading 1">
          <Heading1 className={ic} />
        </TB>
        <TB onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} active={editor.isActive('heading', { level: 2 })} isToggle title="Heading 2 (Ctrl/Cmd+Alt+2)" ariaLabel="Heading 2">
          <Heading2 className={ic} />
        </TB>
        <TB onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()} active={editor.isActive('heading', { level: 3 })} isToggle title="Heading 3 (Ctrl/Cmd+Alt+3)" ariaLabel="Heading 3">
          <Heading3 className={ic} />
        </TB>
        <div className="w-px h-5 bg-slate-300 dark:bg-slate-600 mx-1" />

        {/* Inline formats */}
        <TB onClick={() => editor.chain().focus().toggleBold().run()} active={editor.isActive('bold')} isToggle title="Bold (Ctrl/Cmd+B)" ariaLabel="Bold">
          <Bold className={ic} />
        </TB>
        <TB onClick={() => editor.chain().focus().toggleItalic().run()} active={editor.isActive('italic')} isToggle title="Italic (Ctrl/Cmd+I)" ariaLabel="Italic">
          <Italic className={ic} />
        </TB>
        <TB onClick={() => editor.chain().focus().toggleUnderline().run()} active={editor.isActive('underline')} isToggle title="Underline (Ctrl/Cmd+U)" ariaLabel="Underline">
          <UnderlineIcon className={ic} />
        </TB>
        <TB onClick={() => editor.chain().focus().toggleStrike().run()} active={editor.isActive('strike')} isToggle title="Strikethrough (Ctrl/Cmd+Shift+S)" ariaLabel="Strikethrough">
          <Strikethrough className={ic} />
        </TB>
        <TB onClick={() => editor.chain().focus().toggleHighlight().run()} active={editor.isActive('highlight')} isToggle title="Highlight (Ctrl/Cmd+Shift+H)" ariaLabel="Highlight">
          <Highlighter className={ic} />
        </TB>
        <TB onClick={() => editor.chain().focus().toggleCode().run()} active={editor.isActive('code')} isToggle title="Inline code (Ctrl/Cmd+E)" ariaLabel="Inline code">
          <Code className={ic} />
        </TB>
        <div className="w-px h-5 bg-slate-300 dark:bg-slate-600 mx-1" />

        {/* Lists */}
        <TB onClick={() => editor.chain().focus().toggleBulletList().run()} active={editor.isActive('bulletList')} isToggle title="Bullet list (Ctrl/Cmd+Shift+7)" ariaLabel="Bullet list">
          <List className={ic} />
        </TB>
        <TB onClick={() => editor.chain().focus().toggleOrderedList().run()} active={editor.isActive('orderedList')} isToggle title="Ordered list (Ctrl/Cmd+Shift+8)" ariaLabel="Ordered list">
          <ListOrdered className={ic} />
        </TB>
        <TB onClick={() => editor.chain().focus().toggleBlockquote().run()} active={editor.isActive('blockquote')} isToggle title="Blockquote (Ctrl/Cmd+Shift+B)" ariaLabel="Blockquote">
          <Quote className={ic} />
        </TB>
        <TB onClick={() => editor.chain().focus().toggleCodeBlock().run()} active={editor.isActive('codeBlock')} isToggle title="Code block (Ctrl/Cmd+Alt+C)" ariaLabel="Code block">
          <FileCode2 className={ic} />
        </TB>
        <TB onClick={() => editor.chain().focus().setHorizontalRule().run()} title="Divider (Ctrl/Cmd+Alt+-)" ariaLabel="Insert divider">
          <Minus className={ic} />
        </TB>
        <div className="w-px h-5 bg-slate-300 dark:bg-slate-600 mx-1" />

        {/* Alignment */}
        <TB onClick={() => editor.chain().focus().setTextAlign('left').run()} active={editor.isActive({ textAlign: 'left' })} isToggle title="Align left (Ctrl/Cmd+Shift+L)" ariaLabel="Align left">
          <AlignLeft className={ic} />
        </TB>
        <TB onClick={() => editor.chain().focus().setTextAlign('center').run()} active={editor.isActive({ textAlign: 'center' })} isToggle title="Align center (Ctrl/Cmd+Shift+E)" ariaLabel="Align center">
          <AlignCenter className={ic} />
        </TB>
        <TB onClick={() => editor.chain().focus().setTextAlign('right').run()} active={editor.isActive({ textAlign: 'right' })} isToggle title="Align right (Ctrl/Cmd+Shift+R)" ariaLabel="Align right">
          <AlignRight className={ic} />
        </TB>
        <div className="w-px h-5 bg-slate-300 dark:bg-slate-600 mx-1" />

        {/* Link */}
        <TB
          buttonRef={linkButtonRef}
          onClick={() => openLinkPopover(editor)}
          active={editor.isActive('link')}
          isToggle
          title="Link (Ctrl/Cmd+Shift+K)"
          ariaLabel="Link"
        >
          <Link2 className={ic} />
        </TB>
        {/* Image */}
        <TB
          onClick={() => setImageModalOpen(true)}
          active={editor.isActive('image')}
          title="Insert Image"
          ariaLabel="Insert Image"
        >
          <ImageIcon className={ic} />
        </TB>
        {/* YouTube */}
        <TB
          onClick={() => setYoutubeModalOpen(true)}
          active={editor.isActive('youtube')}
          title="Embed YouTube Video"
          ariaLabel="Embed YouTube Video"
        >
          <VideoIcon className={ic} />
        </TB>
        <TB
          onClick={openFindReplace}
          active={isFindReplaceOpen}
          title={`Find and replace in Markdown source (${findReplaceShortcutHint})`}
          ariaLabel="Find and replace"
        >
          <Search className={ic} />
        </TB>
        <div className="w-px h-5 bg-slate-300 dark:bg-slate-600 mx-1" />

        {/* Table */}
        <TB onClick={() => editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()} title="Insert Table (Ctrl/Cmd+Alt+Shift+T)" ariaLabel="Insert Table">
          <span className="font-bold text-[10px]">TBL</span>
        </TB>

        <ModeToggle />
      </div>
    );
  };

function CustomBubbleMenu({ editor, openLinkPopover }: { editor: Editor; openLinkPopover: (ed?: Editor) => void }) {
  const [menuPos, setMenuPos] = useState<{ top: number; left: number; visible: boolean }>({ top: 0, left: 0, visible: false });

  const updatePosition = useCallback(() => {
    if (!editor || editor.isDestroyed) return;

    const { from, to, empty } = editor.state.selection;
    const isTable = editor.isActive('table');

    if (empty && !isTable) {
      setMenuPos((prev) => (prev.visible ? { ...prev, visible: false } : prev));
      return;
    }

    try {
      const editorDom = editor.view.dom;
      const editorRect = editorDom.getBoundingClientRect();
      const startCoords = editor.view.coordsAtPos(from);
      const endCoords = editor.view.coordsAtPos(to);

      const estimatedMenuWidth = 280;
      const estimatedMenuHeight = 44;

      let top = startCoords.top - editorRect.top - estimatedMenuHeight - 4;
      if (top < 0) {
        top = endCoords.bottom - editorRect.top + 8;
      }

      const midLeft = (startCoords.left + endCoords.left) / 2 - editorRect.left - estimatedMenuWidth / 2;
      const maxLeft = Math.max(10, editorRect.width - estimatedMenuWidth - 10);
      const left = Math.min(Math.max(10, midLeft), maxLeft);

      setMenuPos({ top, left, visible: true });
    } catch {
      setMenuPos((prev) => (prev.visible ? { ...prev, visible: false } : prev));
    }
  }, [editor]);

  useEffect(() => {
    if (!editor || editor.isDestroyed) return;

    editor.on('selectionUpdate', updatePosition);
    editor.on('transaction', updatePosition);
    window.addEventListener('scroll', updatePosition, true);
    window.addEventListener('resize', updatePosition);

    return () => {
      editor.off('selectionUpdate', updatePosition);
      editor.off('transaction', updatePosition);
      window.removeEventListener('scroll', updatePosition, true);
      window.removeEventListener('resize', updatePosition);
    };
  }, [editor, updatePosition]);

  if (!editor || !menuPos.visible) return null;

  return (
    <div
      role="toolbar"
      aria-label="Contextual formatting menu"
      style={{ top: `${menuPos.top}px`, left: `${menuPos.left}px` }}
      className="absolute z-40 flex flex-wrap items-center gap-1 p-1.5 rounded-xl bg-slate-900/95 text-white dark:bg-slate-900/95 dark:text-slate-100 shadow-2xl border border-slate-700/80 backdrop-blur-md transition-all duration-100"
    >
      <TB onClick={() => editor.chain().focus().toggleBold().run()} active={editor.isActive('bold')} isToggle title="Bold" ariaLabel="Bold">
        <Bold className="w-3.5 h-3.5" />
      </TB>
      <TB onClick={() => editor.chain().focus().toggleItalic().run()} active={editor.isActive('italic')} isToggle title="Italic" ariaLabel="Italic">
        <Italic className="w-3.5 h-3.5" />
      </TB>
      <TB onClick={() => editor.chain().focus().toggleUnderline().run()} active={editor.isActive('underline')} isToggle title="Underline" ariaLabel="Underline">
        <UnderlineIcon className="w-3.5 h-3.5" />
      </TB>
      <TB onClick={() => editor.chain().focus().toggleStrike().run()} active={editor.isActive('strike')} isToggle title="Strikethrough" ariaLabel="Strikethrough">
        <Strikethrough className="w-3.5 h-3.5" />
      </TB>
      <TB onClick={() => editor.chain().focus().toggleHighlight().run()} active={editor.isActive('highlight')} isToggle title="Highlight" ariaLabel="Highlight">
        <Highlighter className="w-3.5 h-3.5" />
      </TB>
      <div className="w-px h-4 bg-slate-700 mx-0.5" />
      <TB onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()} active={editor.isActive('heading', { level: 1 })} isToggle title="Heading 1" ariaLabel="Heading 1">
        <Heading1 className="w-3.5 h-3.5" />
      </TB>
      <TB onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} active={editor.isActive('heading', { level: 2 })} isToggle title="Heading 2" ariaLabel="Heading 2">
        <Heading2 className="w-3.5 h-3.5" />
      </TB>
      <TB onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()} active={editor.isActive('heading', { level: 3 })} isToggle title="Heading 3" ariaLabel="Heading 3">
        <Heading3 className="w-3.5 h-3.5" />
      </TB>
      <div className="w-px h-4 bg-slate-700 mx-0.5" />
      <TB onClick={() => openLinkPopover(editor)} active={editor.isActive('link')} isToggle title="Insert Link" ariaLabel="Insert Link">
        <Link2 className="w-3.5 h-3.5" />
      </TB>
      {editor.isActive('table') && (
        <>
          <div className="w-px h-4 bg-slate-700 mx-0.5" />
          <TableAction onClick={() => editor.chain().focus().addRowAfter().run()} title="Add Row Below" label="+ Row" />
          <TableAction onClick={() => editor.chain().focus().addColumnAfter().run()} title="Add Column Right" label="+ Col" />
          <TableAction onClick={() => editor.chain().focus().deleteTable().run()} title="Delete Table" label="Del Tbl" />
        </>
      )}
    </div>
  );
}

function CustomFloatingMenu({
  editor,
  onOpenImageModal,
  onOpenYoutubeModal,
}: {
  editor: Editor;
  onOpenImageModal: () => void;
  onOpenYoutubeModal: () => void;
}) {
  const [menuPos, setMenuPos] = useState<{ top: number; left: number; visible: boolean }>({ top: 0, left: 0, visible: false });

  const updatePosition = useCallback(() => {
    if (!editor || editor.isDestroyed) return;

    const { $anchor, empty } = editor.state.selection;
    const isCurrentBlockEmpty = $anchor.parent.content.size === 0;

    if (!empty || !isCurrentBlockEmpty) {
      setMenuPos((prev) => (prev.visible ? { ...prev, visible: false } : prev));
      return;
    }

    try {
      const editorDom = editor.view.dom;
      const editorRect = editorDom.getBoundingClientRect();
      const coords = editor.view.coordsAtPos($anchor.pos);

      const estimatedWidth = 320;
      let top = Math.max(0, coords.top - editorRect.top - 6);
      const maxLeft = Math.max(0, editorRect.width - estimatedWidth - 8);
      let left = Math.min(Math.max(0, coords.left - editorRect.left + 8), maxLeft);

      setMenuPos({ top, left, visible: true });
    } catch {
      setMenuPos((prev) => (prev.visible ? { ...prev, visible: false } : prev));
    }
  }, [editor]);

  useEffect(() => {
    if (!editor || editor.isDestroyed) return;

    editor.on('selectionUpdate', updatePosition);
    editor.on('transaction', updatePosition);
    window.addEventListener('scroll', updatePosition, true);
    window.addEventListener('resize', updatePosition);

    return () => {
      editor.off('selectionUpdate', updatePosition);
      editor.off('transaction', updatePosition);
      window.removeEventListener('scroll', updatePosition, true);
      window.removeEventListener('resize', updatePosition);
    };
  }, [editor, updatePosition]);

  if (!editor || !menuPos.visible) return null;

  return (
    <div
      style={{ top: `${menuPos.top}px`, left: `${menuPos.left}px` }}
      className="absolute z-30 flex items-center gap-1 p-1 rounded-xl bg-slate-900/95 text-slate-100 border border-slate-700/80 shadow-2xl backdrop-blur-md transition-all duration-100"
    >
      <span className="text-[10px] font-bold text-primary-400 px-2 uppercase tracking-wider select-none flex items-center gap-1">
        <Plus className="w-3 h-3" /> Insert
      </span>
      <button
        type="button"
        onClick={() => editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()}
        className="flex items-center gap-1 px-2 py-1 rounded-md text-xs bg-slate-800 hover:bg-slate-700 text-slate-200 transition-colors border border-slate-700"
        title="Insert 3x3 Table"
      >
        <TableIcon className="w-3.5 h-3.5 text-blue-400" />
        <span>Table</span>
      </button>
      <button
        type="button"
        onClick={onOpenImageModal}
        className="flex items-center gap-1 px-2 py-1 rounded-md text-xs bg-slate-800 hover:bg-slate-700 text-slate-200 transition-colors border border-slate-700"
        title="Insert Image"
      >
        <ImageIcon className="w-3.5 h-3.5 text-emerald-400" />
        <span>Image</span>
      </button>
      <button
        type="button"
        onClick={onOpenYoutubeModal}
        className="flex items-center gap-1 px-2 py-1 rounded-md text-xs bg-slate-800 hover:bg-slate-700 text-slate-200 transition-colors border border-slate-700"
        title="Insert YouTube Video"
      >
        <VideoIcon className="w-3.5 h-3.5 text-red-400" />
        <span>Video</span>
      </button>
      <button
        type="button"
        onClick={() => editor.chain().focus().insertContent('```mermaid\ngraph TD\n    A[Start] --> B[End]\n```').run()}
        className="flex items-center gap-1 px-2 py-1 rounded-md text-xs bg-slate-800 hover:bg-slate-700 text-slate-200 transition-colors border border-slate-700"
        title="Insert Mermaid Diagram"
      >
        <Workflow className="w-3.5 h-3.5 text-purple-400" />
        <span>Mermaid</span>
      </button>
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
        className="flex items-center gap-1 px-2 py-1 rounded-md text-xs bg-slate-800 hover:bg-slate-700 text-slate-200 transition-colors border border-slate-700"
        title="Insert Heading"
      >
        <Heading2 className="w-3.5 h-3.5 text-amber-400" />
        <span>Heading</span>
      </button>
    </div>
  );
}

  /* ─────────────── render ─────────────── */
  if (mode === 'markdown') {
    return (
        <div className={editorShellClass}>
        {/* Markdown toolbar header */}
        <div className={stickyToolbarClass}>
          <span className="text-xs text-slate-500 font-medium">Markdown Mode</span>
          <TB
            onClick={openFindReplace}
            active={isFindReplaceOpen}
            title={`Find and replace in Markdown source (${findReplaceShortcutHint})`}
          >
            <Search className={ic} />
          </TB>
          <ModeToggle />
        </div>
        {renderFindReplacePanel()}
        <textarea
          ref={contentRef ?? markdownTextareaRef}
          value={value}
          onChange={e => onChange(e.target.value)}
          onKeyDown={handleMarkdownModeShortcuts}
          rows={20}
          className="min-h-[400px] w-full resize-y px-4 py-4 bg-slate-50 dark:bg-slate-900 border-0 rounded-b-lg focus:ring-2 focus:ring-primary-500 focus:outline-none font-mono text-sm"
          placeholder={placeholder}
        />
      </div>
    );
  }

  /* WYSIWYG mode */
  return (
    <>
      <div className={editorShellClass}>
        <WysiwygToolbar />
        {renderFindReplacePanel()}
        <div className="relative rounded-b-lg pl-8 md:pl-10">
          <BlockDragHandle editor={editor} />
          <EditorContent editor={editor} />
          {editor && <CustomBubbleMenu editor={editor} openLinkPopover={openLinkPopover} />}
          {editor && (
            <CustomFloatingMenu
              editor={editor}
              onOpenImageModal={() => setImageModalOpen(true)}
              onOpenYoutubeModal={() => setYoutubeModalOpen(true)}
            />
          )}
        </div>
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

      {/* Image Upload/Insertion Modal */}
      {imageModalOpen && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <ImageIcon className="w-5 h-5 text-primary-500" />
                Insert Image
              </h3>
              <button
                type="button"
                onClick={() => {
                  setImageModalOpen(false);
                  setImageUrlInput('');
                  setImageAltInput('');
                  setImageWidthInput('');
                  setImageCaptionInput('');
                }}
                className="text-slate-400 hover:text-slate-500 dark:hover:text-slate-300"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              {/* File Upload Option */}
              <div className="space-y-2">
                <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  Upload Image
                </label>
                <label className="flex flex-col items-center justify-center w-full h-28 border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-xl cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                  <div className="flex flex-col items-center justify-center py-4 text-center">
                    {uploadingEditorImage ? (
                      <Loader2 className="w-8 h-8 text-primary-500 animate-spin mb-2" />
                    ) : (
                      <Upload className="w-6 h-6 text-slate-400 mb-2" />
                    )}
                    <p className="text-xs text-slate-600 dark:text-slate-400 font-medium">
                      {uploadingEditorImage ? 'Uploading image...' : 'Click to upload local file'}
                    </p>
                  </div>
                  <input
                    type="file"
                    className="hidden"
                    accept="image/*"
                    onChange={handleEditorImageUpload}
                    disabled={uploadingEditorImage}
                  />
                </label>
              </div>

              <div className="relative flex py-1 items-center">
                <div className="flex-grow border-t border-slate-100 dark:border-slate-800"></div>
                <span className="flex-shrink mx-3 text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase">Or</span>
                <div className="flex-grow border-t border-slate-100 dark:border-slate-800"></div>
              </div>

              {/* URL input option */}
              <div className="space-y-1">
                <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  Image URL
                </label>
                <input
                  type="text"
                  value={imageUrlInput}
                  onChange={(e) => setImageUrlInput(e.target.value)}
                  placeholder="https://example.com/image.png"
                  className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-primary-500 focus:outline-none dark:text-white"
                />
              </div>

              {/* Alt Text Input */}
              <div className="space-y-1">
                <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  Alternative Text (Alt)
                </label>
                <input
                  type="text"
                  value={imageAltInput}
                  onChange={(e) => setImageAltInput(e.target.value)}
                  placeholder="Describe the image..."
                  className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-primary-500 focus:outline-none dark:text-white"
                />
              </div>

              {/* Width Input */}
              <div className="space-y-1">
                <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  Width (Optional)
                </label>
                <input
                  type="text"
                  value={imageWidthInput}
                  onChange={(e) => setImageWidthInput(e.target.value)}
                  placeholder="e.g., 100%, 400px, 600"
                  className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-primary-500 focus:outline-none dark:text-white"
                />
              </div>

              {/* Caption Input */}
              <div className="space-y-1">
                <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  Caption (Optional)
                </label>
                <input
                  type="text"
                  value={imageCaptionInput}
                  onChange={(e) => setImageCaptionInput(e.target.value)}
                  placeholder="Small text below the image..."
                  className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-primary-500 focus:outline-none dark:text-white"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 border-t border-slate-100 dark:border-slate-800 pt-4">
              <button
                type="button"
                onClick={() => {
                  setImageModalOpen(false);
                  setImageUrlInput('');
                  setImageAltInput('');
                  setImageWidthInput('');
                  setImageCaptionInput('');
                }}
                className="px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={insertImage}
                disabled={!imageUrlInput.trim() || uploadingEditorImage}
                className="px-4 py-2 text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 disabled:opacity-50 rounded-lg transition-colors"
              >
                Insert Image
              </button>
            </div>
          </div>
        </div>
      )}

      {/* YouTube Video Embed Modal */}
      {youtubeModalOpen && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <VideoIcon className="w-5 h-5 text-red-500" />
                Embed YouTube Video
              </h3>
              <button
                type="button"
                onClick={() => {
                  setYoutubeModalOpen(false);
                  setYoutubeUrlInput('');
                }}
                className="text-slate-400 hover:text-slate-500 dark:hover:text-slate-300"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-2">
              <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                YouTube URL / Link
              </label>
              <input
                type="text"
                value={youtubeUrlInput}
                onChange={(e) => setYoutubeUrlInput(e.target.value)}
                placeholder="https://www.youtube.com/watch?v=..."
                className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-primary-500 focus:outline-none dark:text-white"
              />
              <p className="text-[11px] text-slate-400 dark:text-slate-500 leading-normal">
                Paste any standard watch link (e.g., watch?v=) or short link (youtu.be/). It will automatically embed responsively.
              </p>
            </div>

            <div className="flex justify-end gap-2 border-t border-slate-100 dark:border-slate-800 pt-4">
              <button
                type="button"
                onClick={() => {
                  setYoutubeModalOpen(false);
                  setYoutubeUrlInput('');
                }}
                className="px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={insertYoutube}
                disabled={!youtubeUrlInput.trim()}
                className="px-4 py-2 text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 disabled:opacity-50 rounded-lg transition-colors"
              >
                Embed Video
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
