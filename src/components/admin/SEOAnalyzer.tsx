'use client';

import { useState, useMemo } from 'react';
import { ChevronDown, ChevronUp, CheckCircle2, XCircle, AlertCircle, Target } from 'lucide-react';

/* ─────────────────────────────────── types */
interface SEOAnalyzerProps {
  title: string;
  metaTitle: string;
  metaDescription: string;
  content: string;
  excerpt: string;
  slug: string;
  coverImage: string;
}

interface SEOCheck {
  id: string;
  label: string;
  status: 'pass' | 'fail' | 'warn';
  detail?: string;
}

/* ─────────────────────────────────── helpers */
const normalize = (s: string) => s.toLowerCase().replace(/[^a-z0-9\s]/g, '').trim();

const stripMarkdown = (md: string) =>
  md
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/`[^`]+`/g, ' ')
    .replace(/!\[.*?\]\(.*?\)/g, ' ')
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    .replace(/#{1,6}\s/g, ' ')
    .replace(/[*_~>]+/g, ' ')
    .replace(/\n+/g, ' ')
    .trim();

const wordCount = (text: string) =>
  text.trim() === '' ? 0 : text.trim().split(/\s+/).length;

const countKeyword = (text: string, kw: string): number => {
  if (!kw) return 0;
  const escaped = kw.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return (normalize(text).match(new RegExp(`\\b${escaped}\\b`, 'g')) || []).length;
};

/* ─────────────────────────────────── main */
export default function SEOAnalyzer({
  title, metaTitle, metaDescription, content, excerpt, slug, coverImage,
}: SEOAnalyzerProps) {
  const [open, setOpen] = useState(false);
  const [focusKeyword, setFocusKeyword] = useState('');

  const kw = normalize(focusKeyword);
  const plainContent = stripMarkdown(content);
  const words = wordCount(plainContent);
  const metaTitleLen = (metaTitle || title).length;
  const metaDescLen = metaDescription.length;

  const checks: SEOCheck[] = useMemo(() => {
    const list: SEOCheck[] = [];

    /* ── Focus keyword checks (only if kw provided) ── */
    if (kw) {
      list.push({
        id: 'kw-title',
        label: 'Focus keyword in title',
        status: normalize(title).includes(kw) ? 'pass' : 'fail',
        detail: normalize(title).includes(kw) ? undefined : 'Add the keyword to your post title.',
      });
      list.push({
        id: 'kw-slug',
        label: 'Focus keyword in slug',
        status: slug.includes(kw.replace(/\s+/g, '-')) ? 'pass' : 'warn',
        detail: 'Including the keyword in the URL helps search engines.',
      });
      list.push({
        id: 'kw-meta-desc',
        label: 'Focus keyword in meta description',
        status: normalize(metaDescription).includes(kw) ? 'pass' : 'fail',
        detail: 'Add the keyword to your meta description.',
      });
      const kwCount = countKeyword(plainContent, kw);
      const density = words > 0 ? (kwCount / words) * 100 : 0;
      list.push({
        id: 'kw-density',
        label: `Keyword density (${density.toFixed(1)}%)`,
        status: density === 0 ? 'fail' : density > 4 ? 'warn' : 'pass',
        detail:
          density === 0
            ? 'Use the focus keyword in your content.'
            : density > 4
            ? 'Keyword density too high — may look like spam.'
            : `Found ${kwCount}× — good balance.`,
      });
      list.push({
        id: 'kw-first-para',
        label: 'Keyword in first paragraph',
        status: (() => {
          const first = plainContent.split(/\n\n/)[0] || plainContent.slice(0, 200);
          return normalize(first).includes(kw) ? 'pass' : 'warn';
        })(),
        detail: 'Mention the keyword early for stronger relevance signals.',
      });
    }

    /* ── General SEO checks ── */
    list.push({
      id: 'meta-title-len',
      label: `Meta title length (${metaTitleLen} chars)`,
      status: metaTitleLen >= 30 && metaTitleLen <= 70 ? 'pass' : metaTitleLen < 30 ? 'fail' : 'warn',
      detail:
        metaTitleLen < 30
          ? 'Meta title is too short. Aim for 30–70 characters.'
          : metaTitleLen > 70
          ? 'Meta title is too long and may be truncated in search results.'
          : undefined,
    });

    list.push({
      id: 'meta-desc-len',
      label: `Meta description length (${metaDescLen} chars)`,
      status:
        metaDescLen === 0
          ? 'fail'
          : metaDescLen >= 110 && metaDescLen <= 160
          ? 'pass'
          : 'warn',
      detail:
        metaDescLen === 0
          ? 'Add a meta description.'
          : metaDescLen < 110
          ? 'Too short — aim for 110–160 characters.'
          : metaDescLen > 160
          ? 'Too long — may be truncated in search results.'
          : undefined,
    });

    list.push({
      id: 'content-length',
      label: `Content length (${words} words)`,
      status: words >= 600 ? 'pass' : words >= 300 ? 'warn' : 'fail',
      detail:
        words < 300
          ? 'Content is too short. Aim for at least 300 words.'
          : words < 600
          ? 'Good start. 600+ words tends to rank better.'
          : undefined,
    });

    list.push({
      id: 'cover-image',
      label: 'Cover image set',
      status: coverImage ? 'pass' : 'warn',
      detail: 'A cover image improves click-through rate and social sharing.',
    });

    list.push({
      id: 'excerpt',
      label: 'Excerpt / summary set',
      status: excerpt.trim().length >= 50 ? 'pass' : excerpt.trim().length > 0 ? 'warn' : 'fail',
      detail: excerpt.trim().length < 50 ? 'Write a short summary of at least 50 characters.' : undefined,
    });

    list.push({
      id: 'slug-length',
      label: `Slug length (${slug.split('-').filter(Boolean).length} words)`,
      status: slug.split('-').filter(Boolean).length <= 6 ? 'pass' : 'warn',
      detail: 'Keep slugs short and descriptive (≤ 6 words is ideal).',
    });

    return list;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [kw, title, metaTitle, metaDescription, content, excerpt, slug, coverImage]);

  const passed = checks.filter(c => c.status === 'pass').length;
  const score = checks.length > 0 ? Math.round((passed / checks.length) * 100) : 0;

  const scoreColor =
    score >= 75 ? 'text-emerald-500' :
    score >= 45 ? 'text-amber-500' :
    'text-red-500';

  const barColor =
    score >= 75 ? 'bg-emerald-500' :
    score >= 45 ? 'bg-amber-500' :
    'bg-red-500';

  const scoreLabel =
    score >= 75 ? 'Good' :
    score >= 45 ? 'Needs Work' :
    'Poor';

  const StatusIcon = ({ status }: { status: SEOCheck['status'] }) => {
    if (status === 'pass') return <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0 mt-0.5" />;
    if (status === 'warn') return <AlertCircle className="w-3.5 h-3.5 text-amber-400 flex-shrink-0 mt-0.5" />;
    return <XCircle className="w-3.5 h-3.5 text-red-400 flex-shrink-0 mt-0.5" />;
  };

  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
      {/* Header */}
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex items-center justify-between w-full p-4 text-left"
      >
        <div className="flex items-center gap-2">
          <Target className="w-4 h-4 text-primary-500" />
          <h3 className="text-sm font-medium text-slate-700 dark:text-slate-300">SEO Analysis</h3>
        </div>
        <div className="flex items-center gap-2">
          {/* Mini score badge */}
          <span className={`text-xs font-bold ${scoreColor}`}>{score}/100</span>
          {open ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
        </div>
      </button>

      {open && (
        <div className="border-t border-slate-100 dark:border-slate-700 p-4 space-y-4">
          {/* Score meter */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-500">SEO Score</span>
              <span className={`font-bold ${scoreColor}`}>{score}% — {scoreLabel}</span>
            </div>
            <div className="h-2 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
              <div
                className={`h-full ${barColor} rounded-full transition-all duration-500`}
                style={{ width: `${score}%` }}
              />
            </div>
            <p className="text-xs text-slate-400">{passed}/{checks.length} checks passed</p>
          </div>

          {/* Focus keyword input */}
          <div>
            <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">
              Focus Keyword
            </label>
            <input
              type="text"
              value={focusKeyword}
              onChange={e => setFocusKeyword(e.target.value)}
              placeholder="e.g. react hooks tutorial"
              className="w-full px-3 py-1.5 text-sm bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-primary-500 focus:outline-none"
            />
            {!focusKeyword && (
              <p className="text-xs text-slate-400 mt-1">Enter a keyword to unlock 5 more checks</p>
            )}
          </div>

          {/* Checklist */}
          <div className="space-y-2">
            {checks.map(check => (
              <div key={check.id} className="flex items-start gap-2">
                <StatusIcon status={check.status} />
                <div className="min-w-0">
                  <p className="text-xs text-slate-700 dark:text-slate-300">{check.label}</p>
                  {check.detail && (
                    <p className="text-xs text-slate-400 mt-0.5">{check.detail}</p>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Legend */}
          <div className="flex items-center gap-4 pt-1 border-t border-slate-100 dark:border-slate-700">
            <span className="flex items-center gap-1 text-xs text-slate-400">
              <CheckCircle2 className="w-3 h-3 text-emerald-500" /> Pass
            </span>
            <span className="flex items-center gap-1 text-xs text-slate-400">
              <AlertCircle className="w-3 h-3 text-amber-400" /> Improve
            </span>
            <span className="flex items-center gap-1 text-xs text-slate-400">
              <XCircle className="w-3 h-3 text-red-400" /> Fix
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
