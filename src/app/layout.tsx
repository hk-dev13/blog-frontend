import type { Metadata } from "next";
import { Inter, Lora } from "next/font/google";
import { GoogleAnalytics } from "@next/third-parties/google";
import Script from "next/script";
import { SITE_URL } from "@/lib/env";
import "./globals.css";

const ADSENSE_CLIENT = 'ca-pub-7820531537340985';

const organizationSchema = {
  '@context': 'https://schema.org',
  '@type': 'Organization',
  '@id': `${SITE_URL}/#organization`,
  name: 'Envoyou',
  url: 'https://envoyou.com',
  logo: `${SITE_URL}/icon.svg`,
  sameAs: [
    'https://github.com/hk-dev13',
  ],
};

const websiteSchema = {
  '@context': 'https://schema.org',
  '@type': 'WebSite',
  '@id': `${SITE_URL}/#website`,
  name: 'Envoyou Blog',
  url: SITE_URL,
  publisher: {
    '@id': `${SITE_URL}/#organization`,
  },
  potentialAction: {
    '@type': 'SearchAction',
    target: {
      '@type': 'EntryPoint',
      urlTemplate: `${SITE_URL}/search?q={search_term_string}`,
    },
    'query-input': 'required name=search_term_string',
  },
};

const blogSchema = {
  '@context': 'https://schema.org',
  '@type': 'Blog',
  '@id': `${SITE_URL}/#blog`,
  name: 'Envoyou Blog',
  url: SITE_URL,
  description: 'Wawasan teknologi, kecerdasan buatan, strategi bisnis, dan investasi digital dari Envoyou.',
  publisher: {
    '@id': `${SITE_URL}/#organization`,
  },
};

const navigationSchema = {
  '@context': 'https://schema.org',
  '@type': 'ItemList',
  '@id': `${SITE_URL}/#site-navigation`,
  name: 'Envoyou Blog Navigation',
  itemListElement: [
    { '@type': 'SiteNavigationElement', position: 1, name: 'Home', url: SITE_URL },
    { '@type': 'SiteNavigationElement', position: 2, name: 'About', url: `${SITE_URL}/about` },
    { '@type': 'SiteNavigationElement', position: 3, name: 'Categories', url: `${SITE_URL}/categories` },
    { '@type': 'SiteNavigationElement', position: 4, name: 'Search', url: `${SITE_URL}/search` },
    { '@type': 'SiteNavigationElement', position: 5, name: 'RSS Feed', url: `${SITE_URL}/feed.xml` },
  ],
};
import Providers from "./providers";
import { ThemeProvider } from "@/components/ThemeProvider";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import AdSenseLoader from "@/components/shared/AdSenseLoader";

const inter = Inter({
  variable: "--font-sans",
  subsets: ["latin"],
});

const lora = Lora({
  variable: "--font-serif",
  subsets: ["latin"],
  preload: false,
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  applicationName: 'Envoyou Blog',
  title: {
    default: "Envoyou Blog - Wawasan Teknologi, AI, dan Bisnis Modern",
    template: "%s | Envoyou Blog",
  },
  description: "Actionable insights and future perspectives. Eksplorasi mendalam seputar kecerdasan buatan, strategi sales, dan investasi digital oleh Envoyou.",
  alternates: {
    canonical: SITE_URL,
    types: {
      'application/rss+xml': `${SITE_URL}/feed.xml`,
    },
  },
  openGraph: {
    type: 'website',
    siteName: 'Envoyou Blog',
    title: 'Envoyou Blog - Wawasan Teknologi, AI, dan Bisnis Modern',
    description: 'Actionable insights and future perspectives seputar AI, teknologi, strategi bisnis, dan investasi digital.',
    url: SITE_URL,
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Envoyou Blog - Wawasan Teknologi, AI, dan Bisnis Modern',
    description: 'Wawasan teknologi, AI, strategi bisnis, dan investasi digital dari Envoyou.',
  },
  robots: {
    index: true,
    follow: true,
  },
  other: {
    'google-adsense-account': ADSENSE_CLIENT,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id" className={`${inter.variable} ${lora.variable}`} suppressHydrationWarning>
      {/* 1. Tambahkan suppressHydrationWarning di body */}
      <body
        className="antialiased min-h-screen flex flex-col bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-slate-50 transition-colors duration-300"
        suppressHydrationWarning
      >
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          <Providers>
            <Navbar />
            <main className="flex-1">
              {children}
            </main>
            <Footer />
          </Providers>
        </ThemeProvider>

        {process.env.NEXT_PUBLIC_GA_ID && <GoogleAnalytics gaId={process.env.NEXT_PUBLIC_GA_ID} />}
        <AdSenseLoader client={ADSENSE_CLIENT} />

        <Script
          id="microsoft-clarity"
          strategy="lazyOnload"
          dangerouslySetInnerHTML={{
            __html: `
              (function(c,l,a,r,i,t,y){
                  c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};
                  t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;
                  y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);
              })(window, document, "clarity", "script", "wn8pjbjmp3");
            `
          }}
        />

        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify([
              organizationSchema,
              websiteSchema,
              blogSchema,
              navigationSchema,
            ]),
          }}
        />
      </body>
    </html>
  );
}
