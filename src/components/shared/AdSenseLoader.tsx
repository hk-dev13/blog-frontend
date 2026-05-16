'use client';

import { useEffect } from 'react';

interface AdSenseLoaderProps {
  client: string;
}

export default function AdSenseLoader({ client }: AdSenseLoaderProps) {
  useEffect(() => {
    if (!client) return;

    const scriptSrc = `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${client}`;
    const existingScript = document.querySelector<HTMLScriptElement>(
      `script[src="${scriptSrc}"]`,
    );

    if (existingScript) return;

    const script = document.createElement('script');
    script.async = true;
    script.src = scriptSrc;
    script.crossOrigin = 'anonymous';
    document.head.appendChild(script);
  }, [client]);

  return null;
}
