'use client';

import { useEffect, useState } from 'react';
import { List } from 'lucide-react';

interface TocItem {
  id: string;
  text: string;
  level: number;
}

export default function TableOfContents({ content }: { content: string }) {
  const [headings, setHeadings] = useState<TocItem[]>([]);
  const [activeId, setActiveId] = useState('');
  const [isOpen, setIsOpen] = useState(false);

  // Read headings from the actual rendered DOM (after rehype-slug adds IDs)
  useEffect(() => {
    // Small delay to let ReactMarkdown + rehype-slug render
    const timer = setTimeout(() => {
      const proseEl = document.querySelector('.prose');
      if (!proseEl) return;

      const elements = proseEl.querySelectorAll('h2, h3, h4');
      const items: TocItem[] = [];

      elements.forEach((el) => {
        const id = el.id;
        if (!id) return;
        const level = parseInt(el.tagName[1]); // h2=2, h3=3, h4=4
        const text = el.textContent?.trim() || '';
        items.push({ id, text, level });
      });

      setHeadings(items);
    }, 100);

    return () => clearTimeout(timer);
  }, [content]);

  // Track active heading via IntersectionObserver
  useEffect(() => {
    if (headings.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setActiveId(entry.target.id);
          }
        }
      },
      { rootMargin: '-80px 0px -60% 0px', threshold: 0 },
    );

    headings.forEach(({ id }) => {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    });

    return () => observer.disconnect();
  }, [headings]);

  const handleClick = (e: React.MouseEvent<HTMLAnchorElement>, id: string) => {
    e.preventDefault();
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      setActiveId(id);
      // Update URL hash without jump
      window.history.replaceState(null, '', `#${id}`);
    }
  };

  if (headings.length < 3) return null;

  return (
    <nav className="mb-10 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 overflow-hidden">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between px-5 py-4 text-left hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
      >
        <span className="flex items-center gap-2 text-sm font-semibold text-slate-700 dark:text-slate-200">
          <List className="w-4 h-4" />
          Table of Contents
        </span>
        <span className="text-xs text-slate-400">{isOpen ? '▲' : '▼'}</span>
      </button>

      {isOpen && (
        <ul className="px-5 pb-4 space-y-1.5">
          {headings.map((heading) => (
            <li
              key={heading.id}
              style={{ paddingLeft: `${(heading.level - 2) * 16}px` }}
            >
              <a
                href={`#${heading.id}`}
                onClick={(e) => handleClick(e, heading.id)}
                className={`block text-sm py-1 border-l-2 pl-3 transition-colors duration-200 ${
                  activeId === heading.id
                    ? 'border-primary-500 text-primary-600 dark:text-primary-400 font-medium'
                    : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:border-slate-300'
                }`}
              >
                {heading.text}
              </a>
            </li>
          ))}
        </ul>
      )}
    </nav>
  );
}
