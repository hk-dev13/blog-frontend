<div align="center">
  <img src="https://cdn.envoyou.com/brand/logoEnvoyou.png" alt="Envoyou Logo" width="100" height="100" />
  
  # Envoyou
  
  **Wawasan Teknologi, AI, dan Bisnis Modern**
  
  [![Next.js](https://img.shields.io/badge/Next.js-15+-black?style=for-the-badge&logo=next.js)](https://nextjs.org/)
  [![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-4.0-38B2AC?style=for-the-badge&logo=tailwind-css)](https://tailwindcss.com/)
  [![TypeScript](https://img.shields.io/badge/TypeScript-5.0-3178C6?style=for-the-badge&logo=typescript)](https://www.typescriptlang.org/)
  [![License](https://img.shields.io/badge/License-MIT-green?style=for-the-badge)](LICENSE)
</div>

---

## 📸 Preview

<div align="center">
  <img src="https://cdn.envoyou.com/brand/WebPreview.jpeg" alt="Envoyou Preview" width="100%" />
  <p><i>Tampilan antarmuka Envoyou Blog yang bersih dan responsif.</i></p>
</div>

---

## 🧐 About

**Envoyou** adalah platform blog modern yang dibangun dengan fokus pada performa tinggi, pengalaman pengguna yang premium, dan optimasi SEO maksimal. Platform ini dirancang untuk menyajikan konten eksklusif dan mendalam seputar Kecerdasan Buatan (AI), strategi bisnis masa depan, dan investasi di era digital.

## 🚀 Fitur Utama

- **⚡ Blazing Fast**: Arsitektur Next.js App Router memastikan navigasi antar halaman instan.
- **🌓 Mode Gelap/Terang**: Antarmuka adaptif dengan transisi halus menggunakan `next-themes`.
- **✍️ Rich Editor**: Menulis konten kaya media dengan editor **Tiptap** yang sudah dipoles.
- **🔍 SEO Master**: Dukungan JSON-LD, Metadata Dinamis, RSS Feed, dan Sitemap otomatis.
- **📱 Mobile First**: Desain responsif sempurna untuk semua ukuran layar.
- **💰 Revenue Ready**: Slot iklan Google AdSense yang terintegrasi secara strategis.

## 🛠️ Tech Stack

- **Core**: Next.js 15+ (App Router), React 19
- **Language**: TypeScript
- **Styling**: Tailwind CSS 4.0
- **Database/Backend**: Supabase (PostgreSQL)
- **State**: Zustand & TanStack Query
- **Editor**: Tiptap Editor
- **Analytics**: Google Analytics & Microsoft Clarity

## 📦 Struktur Proyek

```text
src/
├── app/            # Next.js App Router (Pages, Layouts, API)
├── components/     # Reusable UI Components
│   ├── layout/     # Navbar, Footer
│   ├── shared/     # Buttons, Cards, Forms
│   └── ui/         # Base UI elements
├── hooks/          # Custom React Hooks
├── lib/            # Utility functions & Shared configurations
├── services/       # API services (Supabase Client, etc.)
└── store/          # Zustand State Management
```

## 🛠️ Memulai Pengembangan

### 1. Persiapan
Pastikan Anda sudah menginstal [Node.js](https://nodejs.org/) (versi 20+) dan [npm](https://www.npmjs.com/).

### 2. Instalasi
```bash
# Clone repositori
git clone https://github.com/username/envoyou-blog.git

# Masuk ke direktori
cd envoyou-blog

# Instal dependensi
npm install
```

### 3. Konfigurasi
Buat file `.env.local` dan lengkapi variabel berikut:
```env
NEXT_PUBLIC_SITE_URL=https://yourdomain.com
NEXT_PUBLIC_GA_ID=G-XXXXXXXXXX
# Kredensial Supabase (Opsional tergantung implementasi)
NEXT_PUBLIC_SUPABASE_URL=your_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_key
```

### 4. Jalankan
```bash
npm run dev
```
Aplikasi akan berjalan di `http://localhost:3001`.

## 🚀 Deployment

Platform ini dioptimalkan untuk di-deploy ke [Vercel](https://vercel.com/):

1. Hubungkan repositori ke akun Vercel Anda.
2. Tambahkan Environment Variables.
3. Klik **Deploy**.

## 📄 License

Proyek ini berada di bawah lisensi [MIT](LICENSE).

---

<div align="center">
  Dibuat dengan ❤️ oleh <b>Envoyou Team</b>
</div>