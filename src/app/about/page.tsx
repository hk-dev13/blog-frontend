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
  title: 'Tentang Envoyou Blog',
  description:
    'Envoyou Blog adalah publication platform yang membahas Artificial Intelligence, teknologi, data, dan strategi digital.',
  openGraph: {
    title: 'Tentang Envoyou Blog',
    description:
      'Publication platform untuk riset, analisis, dan panduan praktis tentang AI, teknologi, data, dan strategi digital.',
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
    body: 'Riset, produk, workflow, dan perkembangan teknologi berbasis AI.',
    category: { name: 'Technology & AI', slug: 'teknologi-ai' },
  },
  {
    title: 'Data & Insight',
    body: 'Insight berbasis data, pola pasar, dan cara membaca sinyal dari informasi.',
    category: { name: 'Data & Insight', slug: 'data-insight' },
  },
  {
    title: 'Finance & Investment',
    body: 'Analisis keuangan, investasi digital, bisnis, dan keputusan berbasis risiko.',
    category: { name: 'Finance & Investment', slug: 'keuangan-investasi' },
  },
  {
    title: 'Digital Creator',
    body: 'Strategi konten, distribusi, creator economy, dan transformasi digital.',
    category: { name: 'Digital Creator', slug: 'creator-digital' },
  },
];

const editorialPrinciples = [
  'Mengutamakan konteks, bukan sekadar rangkuman berita.',
  'Menulis dengan bahasa yang jelas, praktis, dan bisa ditindaklanjuti.',
  'Membedakan opini, analisis, dan fakta agar pembaca tahu pijakannya.',
  'Memilih topik yang relevan dengan perubahan teknologi dan bisnis modern.',
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
            Tentang Envoyou Blog
          </h1>
          <p className="mx-auto max-w-xl text-base leading-7 text-slate-300 md:text-lg">
            Publication platform untuk memahami Artificial Intelligence, teknologi, data, dan
            strategi digital dengan perspektif yang rapi dan praktis.
          </p>
        </div>
      </header>

      <div className="grid grid-cols-1 gap-10 md:grid-cols-3">
        <div className="space-y-14 md:col-span-2">
          <section>
            <SectionHeading icon={Globe2} title="Apa itu Envoyou" />
            <div className="space-y-4 text-base leading-8 text-slate-600 dark:text-slate-400">
              <p>
                Envoyou adalah publication platform yang berfokus pada Artificial Intelligence,
                teknologi, data, dan strategi digital. Kontennya dirancang untuk membantu pembaca
                melihat perubahan teknologi dengan lebih jernih.
              </p>
              <p>
                Di sini, artikel tidak hanya mengejar apa yang sedang ramai. Envoyou mencoba
                menjelaskan mengapa sebuah tren penting, bagaimana dampaknya terhadap bisnis, dan
                apa yang bisa dipelajari oleh pembaca yang sedang membangun, bekerja, atau mengambil
                keputusan di dunia digital.
              </p>
            </div>
          </section>

          <section>
            <SectionHeading icon={Compass} title="Misi Envoyou" />
            <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900 md:p-8">
              <p className="text-base leading-8 text-slate-600 dark:text-slate-400">
                Misi Envoyou adalah menerbitkan riset, analisis, dan panduan praktis yang membantu
                pembaca memahami hubungan antara teknologi, bisnis, dan perubahan perilaku manusia
                di era digital.
              </p>
            </div>
          </section>

          <section>
            <SectionHeading icon={Layers} title="Topik Utama" />
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
              {topics.map((topic) => (
                <TopicCard key={topic.title} {...topic} />
              ))}
            </div>
          </section>

          <section>
            <SectionHeading icon={ShieldCheck} title="Prinsip Editorial" />
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
                Format Konten
              </h3>
            </div>
            <div className="space-y-3 text-sm leading-6 text-slate-500 dark:text-slate-400">
              <p>Riset ringkas untuk memahami konteks.</p>
              <p>Analisis untuk membaca dampak dan arah perubahan.</p>
              <p>Panduan praktis untuk menerapkan insight ke pekerjaan nyata.</p>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <div className="mb-4 flex items-center gap-2">
              <UserRound className="h-4 w-4 text-primary-600 dark:text-primary-400" />
              <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100">
                Siapa di balik Envoyou
              </h3>
            </div>
            <p className="mb-5 text-sm leading-7 text-slate-500 dark:text-slate-400">
              Envoyou dibangun dan dikelola oleh Husni Kusuma.
            </p>
            <Link
              href="/author/husni-kusuma"
              className="inline-flex items-center gap-2 rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 transition-colors hover:border-primary-500 hover:text-slate-950 dark:border-slate-700 dark:text-slate-400 dark:hover:border-primary-400 dark:hover:text-white"
            >
              Baca profil penulis
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </aside>
      </div>

      <div className="mt-20 text-center">
        <div className="mb-12 h-px w-full bg-gradient-to-r from-transparent via-slate-300 to-transparent dark:via-slate-700" />
        <p className="mb-4 text-sm text-slate-500 dark:text-slate-400">
          Mulai jelajahi artikel terbaru dari Envoyou.
        </p>
        <Link
          href="/"
          className="inline-flex items-center gap-2 rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 transition-colors hover:border-primary-500 hover:text-slate-950 dark:border-slate-700 dark:text-slate-400 dark:hover:border-primary-400 dark:hover:text-white"
        >
          Jelajahi Artikel
          <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    </main>
  );
}
