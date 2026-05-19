import { ImageResponse } from 'next/og';

// ── Route config ───────────────────────────────────────────────
export const alt = 'Blog post open graph image';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

// ── Types ──────────────────────────────────────────────────────
type Props = {
  params: Promise<{ slug: string }>;
};

import { API_URL } from '@/lib/env';

// ── Brand colors ───────────────────────────────────────────────
const BRAND_BLUE = '#0B79C2';
const BRAND_DARK = '#071929';
const BRAND_MID = '#0a2540';

export default async function Image({ params }: Props) {
  const { slug } = await params;

  // ── Fetch post data ──────────────────────────────────────────
  interface PostData {
    title: string;
    excerpt?: string;
    author?: { name?: string; avatar_url?: string };
    categories?: { name: string; slug: string }[];
    published_at?: string;
  }

  let post: PostData = {
    title: 'Envoyou',
    excerpt: 'Teknologi, Keuangan & Dunia Digital',
    author: { name: 'Husni Kusuma', avatar_url: '' },
    categories: [{ name: 'Blog', slug: 'blog' }],
    published_at: new Date().toISOString(),
  };

  try {
    const res = await fetch(`${API_URL}/posts/${slug}`, {
      next: { revalidate: 3600 },
    });
    if (res.ok) {
      const json = await res.json();
      post = json.data ?? post;
    }
  } catch {
    // Fallback to defaults above
  }

  const authorName = post.author?.name || 'Husni Kusuma';
  const avatarUrl = post.author?.avatar_url || '';
  const categoryName = post.categories?.[0]?.name || 'Blog';
  const publishDate = post.published_at
    ? new Date(post.published_at).toLocaleDateString('id-ID', {
      day: 'numeric', month: 'long', year: 'numeric',
    })
    : '';

  // ── Truncate title for display ──────────────────────────────
  const title = post.title.length > 72
    ? post.title.slice(0, 72).trimEnd() + '…'
    : post.title;

  const excerpt = post.excerpt
    ? (post.excerpt.length > 100 ? post.excerpt.slice(0, 100).trimEnd() + '…' : post.excerpt)
    : '';

  // ── Load Inter font (WOFF — Satori does NOT support WOFF2) ──
  let interBold: ArrayBuffer | undefined;
  let interRegular: ArrayBuffer | undefined;
  try {
    const [boldRes, regularRes] = await Promise.all([
      fetch('https://cdn.jsdelivr.net/fontsource/fonts/inter@latest/latin-700-normal.woff'),
      fetch('https://cdn.jsdelivr.net/fontsource/fonts/inter@latest/latin-400-normal.woff'),
    ]);
    interBold = await boldRes.arrayBuffer();
    interRegular = await regularRes.arrayBuffer();
  } catch {
    // If font fetch fails, fall back to system sans-serif
  }

  return new ImageResponse(
    (
      <div
        style={{
          display: 'flex',
          width: '1200px',
          height: '630px',
          background: BRAND_DARK,
          position: 'relative',
          fontFamily: 'Inter, system-ui, sans-serif',
          overflow: 'hidden',
        }}
      >
        {/* ── Background gradient blobs ── */}
        <div
          style={{
            position: 'absolute',
            top: '-120px',
            right: '-120px',
            width: '500px',
            height: '500px',
            borderRadius: '50%',
            background: `radial-gradient(circle, ${BRAND_BLUE}55 0%, transparent 70%)`,
            display: 'flex',
          }}
        />
        <div
          style={{
            position: 'absolute',
            bottom: '-80px',
            left: '-80px',
            width: '350px',
            height: '350px',
            borderRadius: '50%',
            background: `radial-gradient(circle, ${BRAND_BLUE}33 0%, transparent 70%)`,
            display: 'flex',
          }}
        />

        {/* ── Noise grid overlay ── */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            backgroundImage: `
              linear-gradient(${BRAND_MID}22 1px, transparent 1px),
              linear-gradient(90deg, ${BRAND_MID}22 1px, transparent 1px)
            `,
            backgroundSize: '48px 48px',
            display: 'flex',
          }}
        />

        {/* ── Left accent bar ── */}
        <div
          style={{
            position: 'absolute',
            left: 0,
            top: 0,
            bottom: 0,
            width: '6px',
            background: `linear-gradient(180deg, ${BRAND_BLUE} 0%, #0d4a8a 100%)`,
            display: 'flex',
          }}
        />

        {/* ── Main content ── */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            padding: '52px 64px 52px 70px',
            width: '100%',
            height: '100%',
            position: 'relative',
          }}
        >
          {/* ── Top: Brand ── */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div
              style={{
                display: 'flex',
                background: BRAND_BLUE,
                borderRadius: '10px',
                width: '40px',
                height: '40px',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <div style={{ color: 'white', fontSize: '20px', fontWeight: 700, display: 'flex' }}>E</div>
            </div>
            <span style={{ color: '#94b8d4', fontSize: '20px', fontWeight: 600, letterSpacing: '0.04em', display: 'flex' }}>
              Envoyou
            </span>

            {/* Category pill — top right */}
            <div style={{ marginLeft: 'auto', display: 'flex' }}>
              <div
                style={{
                  background: `${BRAND_BLUE}33`,
                  border: `1px solid ${BRAND_BLUE}66`,
                  borderRadius: '999px',
                  padding: '6px 18px',
                  color: '#60b3f5',
                  fontSize: '15px',
                  fontWeight: 600,
                  display: 'flex',
                }}
              >
                {categoryName}
              </div>
            </div>
          </div>

          {/* ── Center: Title + Excerpt ── */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', flex: 1, justifyContent: 'center' }}>
            <div
              style={{
                color: 'white',
                fontSize: title.length > 50 ? '44px' : '52px',
                fontWeight: 700,
                lineHeight: 1.2,
                display: 'flex',
                maxWidth: '900px',
              }}
            >
              {title}
            </div>
            {excerpt && (
              <div
                style={{
                  color: '#8fafc8',
                  fontSize: '22px',
                  lineHeight: 1.5,
                  display: 'flex',
                  maxWidth: '820px',
                }}
              >
                {excerpt}
              </div>
            )}
          </div>

          {/* ── Bottom: Author + Date ── */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '16px',
              paddingTop: '24px',
              borderTop: '1px solid #1e3a5a',
            }}
          >
            {/* Avatar */}
            {avatarUrl ? (
              <img
                src={avatarUrl}
                width={48}
                height={48}
                style={{ borderRadius: '50%', objectFit: 'cover', border: `2px solid ${BRAND_BLUE}` }}
                alt={authorName}
              />
            ) : (
              <div
                style={{
                  width: '48px',
                  height: '48px',
                  borderRadius: '50%',
                  background: BRAND_BLUE,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'white',
                  fontSize: '20px',
                  fontWeight: 700,
                }}
              >
                {authorName[0]}
              </div>
            )}

            <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
              <span style={{ color: 'white', fontSize: '17px', fontWeight: 600, display: 'flex' }}>{authorName}</span>
              <span style={{ color: '#6b94b3', fontSize: '14px', display: 'flex' }}>Founder, Envoyou</span>
            </div>

            {publishDate && (
              <div
                style={{
                  marginLeft: 'auto',
                  color: '#6b94b3',
                  fontSize: '16px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                }}
              >
                <span style={{ display: 'flex' }}>📅</span>
                <span style={{ display: 'flex' }}>{publishDate}</span>
              </div>
            )}
          </div>
        </div>
      </div>
    ),
    {
      ...size,
      fonts: [
        ...(interBold
          ? [{ name: 'Inter', data: interBold, style: 'normal' as const, weight: 700 as const }]
          : []),
        ...(interRegular
          ? [{ name: 'Inter', data: interRegular, style: 'normal' as const, weight: 400 as const }]
          : []),
      ],
    }
  );
}
