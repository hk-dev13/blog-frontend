<div align="center">
  <img src="https://cdn.envoyou.com/brand/logoEnvoyou.png" alt="Envoyou Logo" width="100" height="100" />

  # Envoyou Blog Frontend

  **Frontend publik dan admin untuk ekosistem blog Envoyou**
</div>

---

## Tentang

`frontend/` adalah aplikasi Next.js untuk blog `blog.envoyou.com`. Aplikasi ini menangani pengalaman pembaca di sisi publik sekaligus panel admin editorial yang terhubung ke backend API Envoyou.

Dokumentasi terkait:

* [Monorepo index](../README.md)
* [Backend API README](../backend/README.md)
* [Backend VPS runbook](../backend/PRODUCTION-VPS.md)

## Fitur Utama

* Halaman publik blog dengan homepage, detail artikel, kategori, author, about, dan search.
* SEO lengkap: metadata dinamis, JSON-LD, canonical handling, dynamic Open Graph image, `robots.txt`, sitemap, dan RSS feed.
* ISR dan server fetching untuk konten publik.
* Admin dashboard untuk statistik post, views, dan workflow editorial.
* Rich text editor berbasis Tiptap dengan mode editor, autosave draft, preview draft, scheduler, SEO fields, image upload, internal link suggestions, dan revision history.
* Sistem taxonomy untuk category dan tag.
* Comment section publik dan moderation flow via backend.
* Fitur engagement seperti like button, share buttons, reading progress, table of contents, dan newsletter signup.
* Integrasi analytics dan monetization: Google Analytics, Microsoft Clarity, dan Google AdSense.

## Arsitektur Integrasi

Frontend ini tidak berdiri sendiri. Ia memakai dua jalur integrasi:

* **Backend API Envoyou** untuk post, auth admin, comments, categories, tags, search, upload, preview, dan revision history.
* **Supabase** untuk fitur tambahan tertentu seperti reactions, newsletter subscribe, dan chart analytics harian.

## Tech Stack

* **Core:** Next.js 16 App Router, React 19
* **Language:** TypeScript
* **Styling:** Tailwind CSS 4
* **State/Data:** TanStack Query, Zustand
* **Editor:** Tiptap
* **Content Rendering:** React Markdown, `remark-gfm`, `rehype-highlight`, `rehype-slug`
* **Theme:** `next-themes`
* **Analytics:** Google Analytics, Microsoft Clarity

## Struktur Singkat

```text
src/
├── app/                 # App Router pages, SEO routes, admin, preview
├── components/
│   ├── admin/           # Editor, SEO analyzer, views chart, internal links
│   ├── home/            # Homepage composition
│   ├── layout/          # Navbar, footer
│   └── shared/          # Article renderer, cards, comments, ads, likes, TOC
├── hooks/               # Query hooks and editor helpers
├── lib/                 # API clients, env helpers, editor utilities
├── store/               # Zustand auth/session state
└── types/               # Shared app types
```

## Environment Variables

Variabel yang dipakai di kode saat ini:

```env
NEXT_PUBLIC_API_URL=https://api.envoyou.com/api
NEXT_PUBLIC_SITE_URL=https://blog.envoyou.com
NEXT_PUBLIC_GA_ID=G-XXXXXXXXXX
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=your_publishable_key
```

Catatan:

* `NEXT_PUBLIC_SUPABASE_ANON_KEY` masih didukung sebagai fallback jika `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` belum dipakai.
* `NEXT_PUBLIC_API_URL` dipakai untuk koneksi ke backend Envoyou.
* `NEXT_PUBLIC_SITE_URL` dipakai untuk canonical URL, metadata, sitemap, RSS, dan Open Graph.

## Menjalankan Secara Lokal

```bash
cd frontend
npm install
npm run dev
```

App berjalan di:

```text
http://localhost:3001
```

Untuk development yang realistis, backend juga sebaiknya berjalan agar fitur admin, post, search, dan comments bisa dipakai penuh.

## Fitur Publik

* Homepage dengan featured article, trending posts, tag filter, dan category blocks.
* Detail artikel dengan article schema, breadcrumb schema, related posts, reading progress, dan article renderer.
* Search page untuk pencarian artikel.
* Category pages dan author pages.
* RSS feed di `/feed.xml`.
* Dynamic sitemap dan `robots.txt`.

## Fitur Admin

* Login admin.
* Dashboard statistik post dan views.
* Create/edit post.
* Save draft, publish now, dan schedule publish.
* Draft preview page.
* Cover image upload.
* SEO metadata fields dan canonical URL.
* Featured article toggle.
* Category/tag assignment dan quick-create taxonomy.
* Revision history dan restore flow.
* Internal link suggestions di editor.

## Deployment

Frontend ini cocok untuk deploy di Vercel.

Checklist minimum:

1. Set environment variables produksi.
2. Pastikan `NEXT_PUBLIC_API_URL` mengarah ke `https://api.envoyou.com/api`.
3. Pastikan `NEXT_PUBLIC_SITE_URL` sesuai domain publik frontend.
4. Pastikan kredensial Supabase publik tersedia bila fitur reactions/newsletter/views chart dipakai.

## Catatan Integrasi dengan Landing

Frontend ini berbeda dari `landing/`.

* `landing/` adalah halaman hub utama di `envoyou.com`
* `frontend/` adalah blog utama di `blog.envoyou.com`

Saat ini mekanisme `REVALIDATE_SECRET` yang baru kita sambungkan berlaku untuk `landing`, bukan untuk `frontend`.

## License

Proyek ini berada di bawah lisensi MIT.
