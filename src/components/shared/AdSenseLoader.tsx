'use client';

import { useEffect } from 'react';

interface AdSenseLoaderProps {
  client: string;
  minDelayMs?: number;
}

export default function AdSenseLoader({
  client,
  minDelayMs = 3500,
}: AdSenseLoaderProps) {
  useEffect(() => {
    if (!client || process.env.NODE_ENV !== 'production') return;

    const scriptSrc = `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${client}`;

    const injectScript = () => {
      const existingScript = document.querySelector<HTMLScriptElement>(
        `script[src="${scriptSrc}"]`,
      );

      if (existingScript) return;

      const script = document.createElement('script');
      script.async = true;
      script.src = scriptSrc;
      script.crossOrigin = 'anonymous';
      document.head.appendChild(script);
    };

    const loadWhenIdle = () => {
      if ('requestIdleCallback' in window) {
        const idleId = window.requestIdleCallback(() => {
          injectScript();
        });

        return () => window.cancelIdleCallback(idleId);
      }

      const timeoutId = window.setTimeout(injectScript, minDelayMs);
      return () => window.clearTimeout(timeoutId);
    };

    let cleanup = () => {};

    const scheduleLoad = () => {
      const timeoutId = window.setTimeout(() => {
        cleanup = loadWhenIdle();
      }, minDelayMs);

      cleanup = () => window.clearTimeout(timeoutId);
    };

    if (document.readyState === 'complete') {
      scheduleLoad();
    } else {
      const handleLoad = () => {
        window.removeEventListener('load', handleLoad);
        scheduleLoad();
      };

      window.addEventListener('load', handleLoad, { once: true });
      cleanup = () => window.removeEventListener('load', handleLoad);
    }

    return () => cleanup();
  }, [client, minDelayMs]);

  return null;
}
