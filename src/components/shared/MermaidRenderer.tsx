'use client';

import { useEffect, useRef, useState } from 'react';
import mermaid from 'mermaid';
import { useTheme } from 'next-themes';
import { Maximize2 } from 'lucide-react';

mermaid.initialize({
  startOnLoad: false,
  securityLevel: 'loose',
});

interface MermaidRendererProps {
  chart: string;
  onExpand?: (svgContent: string) => void;
}

export default function MermaidRenderer({ chart, onExpand }: MermaidRendererProps) {
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

  const handleExpand = () => {
    if (onExpand && svg) {
      onExpand(svg);
    }
  };

  return (
    <div className="group relative flex flex-col items-center justify-center my-8 w-full">
      <div 
        ref={containerRef} 
        onClick={handleExpand}
        className={`mermaid-svg w-full overflow-x-auto flex justify-center transition-all duration-200 rounded-xl p-2 ${
          onExpand && svg ? 'cursor-zoom-in hover:bg-slate-50 dark:hover:bg-slate-800/50' : ''
        }`}
        dangerouslySetInnerHTML={{ 
          __html: svg || '<div class="animate-pulse h-28 bg-slate-100 dark:bg-slate-800 rounded-2xl w-full flex items-center justify-center text-slate-400 text-sm">Rendering diagram...</div>' 
        }}
      />
      {onExpand && svg && (
        <button
          type="button"
          onClick={handleExpand}
          className="mt-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center gap-1.5 px-3 py-1 text-xs font-medium text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 rounded-full border border-slate-200 dark:border-slate-700 hover:text-primary-600 dark:hover:text-primary-400"
          title="Click to zoom diagram"
        >
          <Maximize2 className="w-3.5 h-3.5" />
          <span>Click to zoom</span>
        </button>
      )}
    </div>
  );
}
