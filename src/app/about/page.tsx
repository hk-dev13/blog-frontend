import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import {
  Code2, Cloud, Globe, Layers, Mail, ArrowRight,
  Cpu, BookOpen, Film, TrendingUp,
} from 'lucide-react';

export const metadata: Metadata = {
  title: 'Tentang Saya',
  description:
    'Husni Kusuma — builder, developer, dan eksplorator teknologi. Pelajari kisah di balik Envoyou dan bagaimana platform ini lahir.',
  openGraph: {
    title: 'Tentang Saya | Envoyou Blog',
    description:
      'Husni Kusuma — builder, developer, dan eksplorator teknologi.',
    images: ['https://cdn.envoyou.com/admin/husniKusuma.jpeg'],
  },
};

/* ─── Reusable section heading ─── */
function SectionHeading({ icon: Icon, title }: { icon: React.ElementType; title: string }) {
  return (
    <div className="flex items-center gap-3 mb-5">
      <span className="flex items-center justify-center w-9 h-9 rounded-xl bg-primary-100 dark:bg-primary-900/40 text-primary-600 dark:text-primary-400 shrink-0">
        <Icon className="w-4 h-4" />
      </span>
      <h2 className="text-xl font-bold font-serif text-slate-800 dark:text-slate-100">
        {title}
      </h2>
    </div>
  );
}

/* ─── Skill pill ─── */
function Pill({ label }: { label: string }) {
  return (
    <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-primary-50 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300 border border-primary-200 dark:border-primary-800">
      {label}
    </span>
  );
}

export default function AboutPage() {
  return (
    <main className="container mx-auto px-4 py-16 max-w-4xl">

      {/* ── Hero ─────────────────────────────────── */}
      <section className="flex flex-col md:flex-row gap-10 items-center md:items-start mb-20">
        {/* Avatar */}
        <div className="relative shrink-0 group">
          <div className="absolute -inset-1 rounded-full bg-gradient-to-br from-primary-400 to-primary-700 opacity-70 blur-md group-hover:opacity-90 transition-opacity duration-500" />
          <Image
            src="https://cdn.envoyou.com/admin/husniKusumaEnvoyou.webp"
            alt="Foto Husni Kusuma"
            width={160}
            height={160}
            className="relative w-36 h-36 md:w-40 md:h-40 rounded-full object-cover border-4 border-white dark:border-slate-900 shadow-xl"
            priority
          />
        </div>

        {/* Identity */}
        <div className="text-center md:text-left">
          <p className="text-sm font-semibold uppercase tracking-widest text-primary-600 dark:text-primary-400 mb-2">
            Tentang Saya
          </p>
          <h1 className="text-4xl md:text-5xl font-bold font-serif text-slate-900 dark:text-white leading-tight mb-4">
            Husni Kusuma
          </h1>
          <p className="text-lg text-slate-500 dark:text-slate-400 mb-5">
            Builder · Developer · Eksplorator Teknologi
          </p>
          <div className="flex flex-wrap gap-2 justify-center md:justify-start">
            <Pill label="Backend Engineering" />
            <Pill label="Google Cloud & AWS" />
            <Pill label="Python / FastAPI" />
            <Pill label="TypeScript / Node.js" />
            <Pill label="Web3 & DeFi" />
            <Pill label="Distributed Systems" />
          </div>
        </div>
      </section>

      {/* Divider */}
      <div className="h-px w-full bg-gradient-to-r from-transparent via-slate-300 dark:via-slate-700 to-transparent mb-20" />

      {/* ── Main content grid ─────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-10">

        {/* Left column (2/3) */}
        <div className="md:col-span-2 space-y-14">

          {/* Filosofi Belajar */}
          <section>
            <SectionHeading icon={BookOpen} title="Cara Saya Belajar" />
            <div className="prose prose-slate dark:prose-invert max-w-none text-slate-600 dark:text-slate-400 leading-relaxed">
              <p>
                Saya bukan tipe orang yang menghabiskan waktu terlalu lama pada teori
                sebelum memulai. Prinsip belajar saya sederhana:{' '}
                <strong className="text-slate-800 dark:text-slate-200">
                  langsung bangun, langsung pecahkan masalah.
                </strong>{' '}
                Dari titik itulah pemahaman mendalam biasanya mengalir.
              </p>
            </div>
          </section>

          {/* Bagaimana Envoyou Lahir */}
          <section>
            <SectionHeading icon={Globe} title="Bagaimana Envoyou Lahir" />
            <div className="prose prose-slate dark:prose-invert max-w-none text-slate-600 dark:text-slate-400 leading-relaxed space-y-4">
              <p>
                Envoyou bukan sekadar blog. Ia lahir dari kebiasaan saya mendokumentasikan
                apa yang sedang saya pelajari — mulai dari AI, teknologi, investasi,
                hingga dinamika bisnis di era digital.
              </p>
              <p>
                Semakin saya mendalami bidang ini, saya menyadari bahwa banyak insight
                berharga yang tersebar di internet, namun jarang dikurasi secara mendalam
                dan relevan untuk audiens Indonesia. Maka, saya memutuskan untuk membangun
                platform ini sendiri.
              </p>
            </div>
          </section>

          {/* Apa yang Saya Kerjakan */}
          <section>
            <SectionHeading icon={Code2} title="Apa yang Saya Kerjakan" />
            <div className="prose prose-slate dark:prose-invert max-w-none text-slate-600 dark:text-slate-400 leading-relaxed space-y-4">
              <p>
                Sehari-hari, saya bergerak di bidang backend engineering. Dalam perjalanan
                membangun berbagai proyek, saya telah mengeksplorasi ekosistem Google Cloud
                dan AWS, serta terbiasa bekerja dengan stack seperti{' '}
                <strong className="text-slate-800 dark:text-slate-200">Python (FastAPI)</strong>{' '}
                dan{' '}
                <strong className="text-slate-800 dark:text-slate-200">TypeScript (Node.js)</strong>.
              </p>
              <p>
                Saat ini, saya sedang fokus mendalami arsitektur sistem yang terdistribusi
                dan eksplorasi aktif ke dunia{' '}
                <strong className="text-slate-800 dark:text-slate-200">Web3 serta DeFi</strong>.
                Workflow saya cukup modern: saya bertindak sebagai Tech Lead — menentukan
                arah strategis, memecah sistem menjadi tugas yang terukur, lalu berkolaborasi
                dengan AI agents untuk mempercepat eksekusi tanpa mengurangi kualitas hasil.
              </p>
            </div>
          </section>

          {/* Cara Berpikir */}
          <section>
            <SectionHeading icon={Layers} title="Cara Saya Berpikir" />
            <div className="prose prose-slate dark:prose-invert max-w-none text-slate-600 dark:text-slate-400 leading-relaxed space-y-4">
              <p>
                Saya percaya bahwa builder terbaik adalah mereka yang bisa berpikir seperti{' '}
                <strong className="text-slate-800 dark:text-slate-200">founder sekaligus engineer</strong>.
                Tahu kenapa sesuatu harus dibangun, sekaligus tahu bagaimana membangunnya
                dengan benar dan efisien.
              </p>
              <p>
                Di luar urusan kode, saya gemar menyusun naskah storytelling dan konten
                sinematik — khususnya tentang anatomi bisnis, psikologi pasar, dan kesalahan
                strategis perusahaan besar. Dari kegagalan raksasa seperti Nokia atau Intel,
                selalu ada pelajaran berharga yang tersembunyi di balik berita yang terlihat biasa.
              </p>
            </div>
          </section>

        </div>

        {/* Right column (1/3) — sidebar cards */}
        <aside className="space-y-6">

          {/* Kenapa Baca Envoyou */}
          <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-6 shadow-sm">
            <div className="flex items-center gap-2 mb-3">
              <TrendingUp className="w-4 h-4 text-primary-600 dark:text-primary-400" />
              <h3 className="font-bold text-slate-800 dark:text-slate-100 text-sm">
                Kenapa Baca Envoyou?
              </h3>
            </div>
            <p className="text-slate-500 dark:text-slate-400 text-sm leading-relaxed">
              Konten di sini ditulis oleh seseorang yang ikut{' '}
              <span className="font-semibold text-slate-700 dark:text-slate-300">
                mengalami apa yang ditulisnya
              </span>{' '}
              — bukan sekadar merangkum dari permukaan. Setiap artikel adalah kombinasi
              riset, eksperimen teknis, dan perspektif seorang praktisi yang aktif membangun.
            </p>
          </div>

          {/* Tech Focus */}
          <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-6 shadow-sm">
            <div className="flex items-center gap-2 mb-4">
              <Cpu className="w-4 h-4 text-primary-600 dark:text-primary-400" />
              <h3 className="font-bold text-slate-800 dark:text-slate-100 text-sm">
                Tech Focus
              </h3>
            </div>
            <div className="space-y-2">
              {[
                { label: 'Distributed Systems', icon: Cloud },
                { label: 'AI & Automation', icon: Cpu },
                { label: 'Web3 & DeFi', icon: Globe },
                { label: 'Sinematik & Storytelling', icon: Film },
              ].map(({ label, icon: Icon }) => (
                <div key={label} className="flex items-center gap-2.5">
                  <Icon className="w-3.5 h-3.5 text-primary-500 dark:text-primary-400 shrink-0" />
                  <span className="text-sm text-slate-600 dark:text-slate-400">{label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* CTA Kontak */}
          <div className="rounded-2xl bg-gradient-to-br from-primary-600 to-primary-800 p-6 text-white shadow-lg">
            <Mail className="w-5 h-5 mb-3 opacity-80" />
            <h3 className="font-bold text-base mb-2">Mari Berkolaborasi</h3>
            <p className="text-primary-100 text-sm leading-relaxed mb-4">
              Ingin berdiskusi, berkolaborasi, atau sekadar menyapa? Pintu saya selalu terbuka.
            </p>
            <a
              href="mailto:husnikusuma@envoyou.com"
              className="inline-flex items-center gap-2 bg-white text-primary-700 font-semibold text-sm px-4 py-2 rounded-full hover:bg-primary-50 transition-colors"
            >
              Kirim Email
              <ArrowRight className="w-3.5 h-3.5" />
            </a>
          </div>

        </aside>
      </div>

      {/* ── Bottom CTA ───────────────────────────── */}
      <div className="mt-20 text-center">
        <div className="h-px w-full bg-gradient-to-r from-transparent via-slate-300 dark:via-slate-700 to-transparent mb-12" />
        <p className="text-slate-500 dark:text-slate-400 text-sm mb-4">
          Tertarik dengan konten dari Envoyou?
        </p>
        <Link
          href="/"
          className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-primary-600 hover:bg-primary-700 text-white font-semibold text-sm transition-colors shadow-md hover:shadow-lg"
        >
          Jelajahi Artikel
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>

    </main>
  );
}
