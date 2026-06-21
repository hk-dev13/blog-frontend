import type { ElementType } from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import {
  ArrowRight,
  BookOpen,
  CheckCircle2,
  Compass,
  Globe2,
  Layers,
  PenLine,
  ShieldCheck,
  UserRound,
} from 'lucide-react';
import CategoryIcon from '@/components/shared/CategoryIcon';
import type { Category } from '@/types';

export const metadata: Metadata = {
  title: 'About E-Blog',
  description:
    'E-Blog is a publication platform covering Artificial Intelligence, technology, data, and digital strategy.',
  openGraph: {
    title: 'About E-Blog',
    description:
      'Publication platform for research, analysis, and practical guides on AI, technology, data, and digital strategy.',
  },
};

function SectionHeading({ icon: Icon, title }: { icon: ElementType; title: string }) {
  return (
    <div className="mb-5 flex items-center gap-3">
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-slate-200 text-slate-500 dark:border-slate-700 dark:text-slate-400">
        <Icon className="h-5 w-5" />
      </span>
      <h2 className="font-serif text-2xl font-bold text-slate-900 dark:text-white">
        {title}
      </h2>
    </div>
  );
}

function TopicCard({
  category,
  title,
  body,
}: {
  category: Pick<Category, 'name' | 'slug'>;
  title: string;
  body: string;
}) {
  return (
    <div className="group rounded-2xl border border-slate-100 bg-white p-6 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:bg-slate-100 dark:hover:bg-slate-800/50 dark:border-slate-800 dark:bg-slate-900 dark:hover:border-primary-500/60">
      <div className="mb-4 inline-flex h-11 w-11 items-center justify-center rounded-xl border border-slate-200 text-slate-500 transition-colors duration-300 group-hover:border-primary-500 group-hover:text-primary-600 dark:border-slate-700 dark:text-slate-400 dark:group-hover:border-slate-50 dark:group-hover:text-primary-50">
        <CategoryIcon category={category} className="h-6 w-6" />
      </div>
      <h3 className="mb-2 text-base font-bold text-slate-900 transition-colors group-hover:text-primary-600 dark:text-white dark:group-hover:text-primary-400">
        {title}
      </h3>
      <p className="text-sm leading-relaxed text-slate-500 dark:text-slate-400">
        {body}
      </p>
    </div>
  );
}

const topics = [
  {
    title: 'Technology & AI',
    body: 'Research, products, workflows, and developments in AI-based technology.',
    category: { name: 'Technology & AI', slug: 'teknologi-ai' },
  },
  {
    title: 'Data & Insight',
    body: 'Data-driven insights, market patterns, and reading signals from information.',
    category: { name: 'Data & Insight', slug: 'data-insight' },
  },
  {
    title: 'Finance & Investment',
    body: 'Financial analysis, digital investment, business, and risk-based decision making.',
    category: { name: 'Finance & Investment', slug: 'keuangan-investasi' },
  },
  {
    title: 'Digital Creator',
    body: 'Content strategy, distribution, creator economy, and digital transformation.',
    category: { name: 'Digital Creator', slug: 'creator-digital' },
  },
];

const editorialPrinciples = [
  'Prioritizing context, not just news summaries.',
  'Writing in clear, practical, and actionable language.',
  'Distinguishing between opinion, analysis, and facts so readers know where they stand.',
  'Choosing topics relevant to modern technological and business changes.',
];

export default function AboutPage() {
  return (
    <main className="container mx-auto max-w-5xl px-4 py-10 md:py-16">
      <header className="relative mb-12 overflow-hidden rounded-2xl bg-slate-950 px-6 py-12 text-center shadow-2xl shadow-slate-950/10 md:px-10 md:py-16">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(13,135,207,0.28),transparent_34%),linear-gradient(180deg,rgba(255,255,255,0.06),transparent)]" />
        <div className="relative z-10 mx-auto max-w-2xl">
          <div className="mx-auto mb-6 inline-flex h-14 w-14 items-center justify-center rounded-2xl border border-white/25 bg-white/[0.06] text-white shadow-lg shadow-white/5">
            <BookOpen className="h-6 w-6" />
          </div>
          <p className="mb-3 text-sm font-semibold uppercase tracking-widest text-primary-300">
            About
          </p>
          <h1 className="mb-4 font-serif text-4xl font-bold text-white md:text-5xl">
            About E-Blog
          </h1>
          <p className="mx-auto max-w-xl text-base leading-7 text-slate-300 md:text-lg">
            A publication platform to understand Artificial Intelligence, technology, data, and
            digital strategy with a clean and practical perspective.
          </p>
        </div>
      </header>

      <div className="grid grid-cols-1 gap-10 md:grid-cols-3">
        <div className="space-y-14 md:col-span-2">
          <section>
            <SectionHeading icon={Globe2} title="What is E-Blog" />
            <div className="space-y-4 text-base leading-8 text-slate-600 dark:text-slate-400">
              <p>
                E-Blog is a publication platform focusing on Artificial Intelligence,
                technology, data, and digital strategy. Its content is designed to help readers
                see technological changes more clearly.
              </p>
              <p>
                Here, articles do not just chase trending news. E-Blog attempts to
                explain why a trend matters, how it impacts business, and what can be learned
                by readers who are building, working, or making decisions in the digital world.
              </p>
            </div>
          </section>

          <section>
            <SectionHeading icon={Compass} title="E-Blog's Mission" />
            <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900 md:p-8">
              <p className="text-base leading-8 text-slate-600 dark:text-slate-400">
                The mission of E-Blog is to publish research, analysis, and practical guides that help
                readers understand the relationship between technology, business, and human behavior changes
                in the digital era.
              </p>
            </div>
          </section>

          <section>
            <SectionHeading icon={Layers} title="Key Topics" />
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
              {topics.map((topic) => (
                <TopicCard key={topic.title} {...topic} />
              ))}
            </div>
          </section>

          <section>
            <SectionHeading icon={ShieldCheck} title="Editorial Principles" />
            <div className="space-y-3">
              {editorialPrinciples.map((principle) => (
                <div
                  key={principle}
                  className="flex gap-3 rounded-2xl border border-slate-100 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900"
                >
                  <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-primary-600 dark:text-primary-400" />
                  <p className="text-sm leading-6 text-slate-600 dark:text-slate-400">
                    {principle}
                  </p>
                </div>
              ))}
            </div>
          </section>
        </div>

        <aside className="space-y-6">
          <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <div className="mb-4 flex items-center gap-2">
              <PenLine className="h-4 w-4 text-primary-600 dark:text-primary-400" />
              <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100">
                Content Format
              </h3>
            </div>
            <div className="space-y-3 text-sm leading-6 text-slate-500 dark:text-slate-400">
              <p>Concise research to understand context.</p>
              <p>Analysis to evaluate the impact and direction of changes.</p>
              <p>Practical guides to apply insights to real work.</p>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <div className="mb-4 flex items-center gap-2">
              <UserRound className="h-4 w-4 text-primary-600 dark:text-primary-400" />
              <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100">
                Who is behind E-Blog
              </h3>
            </div>
            <p className="mb-5 text-sm leading-7 text-slate-500 dark:text-slate-400">
              E-Blog is built and managed by Envoyou.
            </p>
            <Link
              href="https://www.envoyou.com/about"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 transition-colors hover:border-primary-500 hover:text-slate-950 dark:border-slate-700 dark:text-slate-400 dark:hover:border-primary-400 dark:hover:text-white"
            >
              Read about Envoyou
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </aside>
      </div>

      <div className="mt-20 text-center">
        <div className="mb-12 h-px w-full bg-gradient-to-r from-transparent via-slate-300 to-transparent dark:via-slate-700" />
        <p className="mb-4 text-sm text-slate-500 dark:text-slate-400">
          Start exploring the latest articles from E-Blog.
        </p>
        <Link
          href="/"
          className="inline-flex items-center gap-2 rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 transition-colors hover:border-primary-500 hover:text-slate-950 dark:border-slate-700 dark:text-slate-400 dark:hover:border-primary-400 dark:hover:text-white"
        >
          Explore Articles
          <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    </main>
  );
}
