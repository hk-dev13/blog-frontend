'use client';

import { useEffect } from 'react';

type QueuedFunction = ((...args: unknown[]) => void) & { q?: unknown[][] };

declare global {
  interface Window {
    dataLayer?: unknown[][];
    gtag?: (...args: unknown[]) => void;
    clarity?: QueuedFunction;
  }
}

interface ThirdPartyScriptsProps {
  gaId?: string;
  clarityId?: string;
  adsenseClient?: string;
}

function appendScript(src: string, attrs: Record<string, string> = {}) {
  if (document.querySelector(`script[src="${src}"]`)) return;

  const script = document.createElement('script');
  script.async = true;
  script.src = src;

  for (const [key, value] of Object.entries(attrs)) {
    script.setAttribute(key, value);
  }

  document.head.appendChild(script);
}

function runWhenIdle(callback: () => void) {
  if (typeof window.requestIdleCallback === 'function') {
    const idleId = window.requestIdleCallback(callback, { timeout: 3000 });
    return () => window.cancelIdleCallback(idleId);
  }

  const timeoutId = globalThis.setTimeout(callback, 1);
  return () => globalThis.clearTimeout(timeoutId);
}

export default function ThirdPartyScripts({
  gaId,
  clarityId,
  adsenseClient,
}: ThirdPartyScriptsProps) {
  useEffect(() => {
    if (process.env.NODE_ENV !== 'production') return;

    let cleanupIdle = () => {};
    cleanupIdle = runWhenIdle(() => {
      if (gaId) {
        window.dataLayer = window.dataLayer || [];
        window.gtag = window.gtag || function gtag(...args: unknown[]) {
          window.dataLayer?.push(args);
        };
        window.gtag('js', new Date());
        window.gtag('config', gaId);

        appendScript(`https://www.googletagmanager.com/gtag/js?id=${gaId}`);
      }

      if (clarityId) {
        window.clarity = window.clarity || function clarity(...args: unknown[]) {
          if (!window.clarity) return;
          window.clarity.q = window.clarity.q || [];
          window.clarity.q.push(args);
        };

        appendScript(`https://www.clarity.ms/tag/${clarityId}`);
      }

      if (adsenseClient) {
        appendScript(
          `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${adsenseClient}`,
          { crossorigin: 'anonymous' },
        );
      }
    });

    return () => {
      cleanupIdle();
    };
  }, [adsenseClient, clarityId, gaId]);

  return null;
}
