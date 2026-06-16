import type { Metadata } from "next";
import { Inter } from "next/font/google";
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
  name: 'E-Blog',
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
  name: 'E-Blog',
  url: SITE_URL,
  description: 'Technology insights, artificial intelligence, business strategy, and digital investment from Envoyou.',
  publisher: {
    '@id': `${SITE_URL}/#organization`,
  },
};

const navigationSchema = {
  '@context': 'https://schema.org',
  '@type': 'ItemList',
  '@id': `${SITE_URL}/#site-navigation`,
  name: 'E-Blog Navigation',
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
import ThirdPartyScripts from "@/components/shared/ThirdPartyScripts";

const inter = Inter({
  variable: "--font-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  applicationName: 'E-Blog',
  title: {
    default: "E-Blog - Insights on Technology, AI, and Modern Business",
    template: "%s | E-Blog",
  },
  description: "Actionable insights and future perspectives. Deep exploration of artificial intelligence, sales strategy, and digital investment by Envoyou.",
  alternates: {
    canonical: SITE_URL,
    types: {
      'application/rss+xml': `${SITE_URL}/feed.xml`,
    },
  },
  openGraph: {
    type: 'website',
    siteName: 'E-Blog',
    title: 'E-Blog - Insights on Technology, AI, and Modern Business',
    description: 'Actionable insights and future perspectives on AI, technology, business strategy, and digital investment.',
    url: SITE_URL,
  },
  twitter: {
    card: 'summary_large_image',
    title: 'E-Blog - Insights on Technology, AI, and Modern Business',
    description: 'Technology insights, AI, business strategy, and digital investment from Envoyou.',
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
    <html lang="en" className={inter.variable} suppressHydrationWarning>
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

        <ThirdPartyScripts
          gaId={process.env.NEXT_PUBLIC_GA_ID}
          clarityId="wn8pjbjmp3"
          adsenseClient={ADSENSE_CLIENT}
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
