import Link from 'next/link';
import { Globe, Mail } from 'lucide-react';
import LogoMark from '@/components/shared/LogoMark';

const GithubIcon = () => (
  <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
    <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12z" />
  </svg>
);
import NewsletterForm from '@/components/shared/NewsletterForm';

const NAV_LINKS = [
  { label: 'Home', href: '/' },
  { label: 'Categories', href: '/categories' },
  { label: 'About', href: '/about' },
  { label: 'Search', href: '/search' },
  { label: 'RSS Feed', href: '/feed.xml' },
];

const TOPIC_LINKS = [
  { label: 'Technology & AI', href: '/categories/teknologi-ai' },
  { label: 'Finance & Investment', href: '/categories/keuangan-investasi' },
  { label: 'Digital Creator', href: '/categories/creator-digital' },
  { label: 'Data & Insight', href: '/categories/data-insight' },
];

export default function Footer() {
  const currentYear = new Date().getUTCFullYear();

  return (
    <footer className="border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 mt-auto">

      {/* ── Newsletter strip ───────────────────────────── */}
      <div className="border-b border-slate-100 dark:border-slate-800 py-12">
        <div className="container mx-auto px-4 flex justify-center">
          <NewsletterForm />
        </div>
      </div>

      {/* ── Main footer grid ───────────────────────────── */}
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 gap-10 sm:grid-cols-2 lg:grid-cols-4">

          {/* Col 1 — Brand */}
          <div className="flex flex-col gap-4">
            <Link href="/" className="flex items-center gap-2.5 w-fit group">
              <LogoMark className="h-6 w-6 text-primary-600 dark:text-primary-400 transition-transform group-hover:scale-110" />
              <span className="text-2xl leading-none font-bold font-serif text-primary-600 dark:text-primary-400">
                Envoyou
              </span>
            </Link>
            <p className="text-sm text-slate-500 dark:text-slate-300 leading-relaxed max-w-[220px]">
              Wawasan teknologi, AI, strategi digital, dan sistem masa depan.
            </p>
          </div>

          {/* Col 2 — Explore */}
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-widest text-slate-500 dark:text-slate-300 mb-4">
              Explore
            </h3>
            <ul className="space-y-2.5">
              {NAV_LINKS.map(({ label, href }) => (
                <li key={href}>
                  <Link
                    href={href}
                    className="text-sm text-slate-600 dark:text-slate-300 hover:text-primary-600 dark:hover:text-primary-400 transition-colors hover:underline hover:underline-offset-4"
                  >
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Col 3 — Topics */}
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-widest text-slate-500 dark:text-slate-300 mb-4">
              Topics
            </h3>
            <ul className="space-y-2.5">
              {TOPIC_LINKS.map(({ label, href }) => (
                <li key={href}>
                  <Link
                    href={href}
                    className="text-sm text-slate-600 dark:text-slate-300 hover:text-primary-600 dark:hover:text-primary-400 transition-colors hover:underline hover:underline-offset-4"
                  >
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Col 4 — Connect */}
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-widest text-slate-500 dark:text-slate-300 mb-4">
              Connect
            </h3>
            <ul className="space-y-3">
              <li>
                <a
                  href="mailto:info@envoyou.com"
                  className="inline-flex items-center gap-2.5 text-sm text-slate-600 dark:text-slate-300 hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
                >
                  <Mail className="w-4 h-4 shrink-0" />
                  Email
                </a>
              </li>
              <li>
                <a
                  href="https://github.com/hk-dev13"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2.5 text-sm text-slate-600 dark:text-slate-300 hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
                >
                  <GithubIcon />
                  Github
                </a>
              </li>
              <li>
                <a
                  href="https://envoyou.com"
                  className="inline-flex items-center gap-2.5 text-sm text-slate-600 dark:text-slate-300 hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
                >
                  <Globe className="w-4 h-4 shrink-0" />
                  Envoyou Main Site
                </a>
              </li>
            </ul>
          </div>

        </div>
      </div>

      {/* ── Bottom bar ─────────────────────────────────── */}
      <div className="border-t border-slate-100 dark:border-slate-800 py-5">
        <div className="container mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-slate-500 dark:text-slate-400">
          <span>© {currentYear} Envoyou. All rights reserved.</span>
          <span>
            Made with ❤️ by{' '}
            <Link href="/about" className="text-slate-600 underline underline-offset-4 transition-colors hover:text-primary-500 dark:text-slate-300 dark:hover:text-primary-400">
              Husni Kusuma
            </Link>
          </span>
        </div>
      </div>

    </footer>
  );
}
