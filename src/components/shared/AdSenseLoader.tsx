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
      const requestIdleCallback =
        typeof globalThis.requestIdleCallback === 'function'
          ? globalThis.requestIdleCallback.bind(globalThis)
          : null;
      const cancelIdleCallback =
        typeof globalThis.cancelIdleCallback === 'function'
          ? globalThis.cancelIdleCallback.bind(globalThis)
          : null;

      if (requestIdleCallback && cancelIdleCallback) {
        const idleId = requestIdleCallback(() => {
          injectScript();
        });

        return () => cancelIdleCallback(idleId);
      }

      const timeoutId = globalThis.setTimeout(injectScript, minDelayMs);
      return () => globalThis.clearTimeout(timeoutId);
    };

    let cleanup = () => {};

    const scheduleLoad = () => {
      const timeoutId = globalThis.setTimeout(() => {
        cleanup = loadWhenIdle();
      }, minDelayMs);

      cleanup = () => globalThis.clearTimeout(timeoutId);
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
