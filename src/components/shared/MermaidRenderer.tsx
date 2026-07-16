'use client';

import { useEffect, useRef, useState } from 'react';
import mermaid from 'mermaid';
import { useTheme } from 'next-themes';

mermaid.initialize({
  startOnLoad: false,
  securityLevel: 'loose',
});

interface MermaidRendererProps {
  chart: string;
}

export default function MermaidRenderer({ chart }: MermaidRendererProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [svg, setSvg] = useState<string>('');
  const [error, setError] = useState<boolean>(false);
  const { resolvedTheme } = useTheme();

  useEffect(() => {
    if (!containerRef.current) return;

    let isMounted = true;
    const uniqueId = `mermaid-${Math.random().toString(36).substring(2, 9)}`;

    // Re-initialize mermaid with theme on theme change
    mermaid.initialize({
      startOnLoad: false,
      theme: resolvedTheme === 'dark' ? 'dark' : 'default',
      securityLevel: 'loose',
    });

    const renderChart = async () => {
      try {
        setError(false);
        const { svg: renderedSvg } = await mermaid.render(uniqueId, chart);
        
        if (isMounted) {
          setSvg(renderedSvg);
        }
      } catch (err) {
        console.error('Mermaid rendering failed:', err);
        if (isMounted) {
          setError(true);
        }
      }
    };

    renderChart();

    return () => {
      isMounted = false;
    };
  }, [chart, resolvedTheme]);

  if (error) {
    return (
      <pre className="p-4 rounded-xl bg-red-50 text-red-700 dark:bg-red-950/30 dark:text-red-400 text-xs overflow-x-auto my-4 border border-red-200/50 dark:border-red-900/30">
        <code>{chart}</code>
      </pre>
    );
  }

  return (
    <div className="flex justify-center my-8 w-full overflow-x-auto">
      <div 
        ref={containerRef} 
        className="mermaid-svg"
        dangerouslySetInnerHTML={{ 
          __html: svg || '<div class="animate-pulse h-28 bg-slate-100 dark:bg-slate-800 rounded-2xl w-full flex items-center justify-center text-slate-400 text-sm">Rendering diagram...</div>' 
        }}
      />
    </div>
  );
}
