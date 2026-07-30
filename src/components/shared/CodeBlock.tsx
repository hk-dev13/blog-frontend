'use client';

import React, { useState } from 'react';
import { Copy, Check } from 'lucide-react';

interface CodeBlockProps {
  language?: string;
  codeString: string;
  children: React.ReactNode;
}

export default function CodeBlock({ language, codeString, children }: CodeBlockProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(codeString);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy code:', err);
    }
  };

  const displayLanguage = language ? language.toUpperCase() : 'CODE';

  return (
    <div className="relative my-6 rounded-2xl overflow-hidden border border-slate-800 bg-slate-950 text-slate-100 shadow-xl group">
      {/* Header bar */}
      <div className="flex items-center justify-between px-4 py-2.5 bg-slate-900/90 dark:bg-slate-900/70 border-b border-slate-800 text-xs text-slate-400 font-mono select-none">
        <span className="font-semibold text-slate-300 tracking-wider">{displayLanguage}</span>
        <button
          type="button"
          onClick={handleCopy}
          className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white transition-all text-xs border border-slate-700/60 active:scale-95 focus:outline-none"
          title="Copy code to clipboard"
        >
          {copied ? (
            <>
              <Check className="w-3.5 h-3.5 text-emerald-400" />
              <span className="text-emerald-400 font-medium">Copied!</span>
            </>
          ) : (
            <>
              <Copy className="w-3.5 h-3.5" />
              <span>Copy</span>
            </>
          )}
        </button>
      </div>

      {/* Code content */}
      <div className="p-4 md:p-5 overflow-x-auto text-sm md:text-[15px] font-mono leading-relaxed [&_pre]:!m-0 [&_pre]:!p-0 [&_pre]:!bg-transparent [&_pre]:!text-sm md:[&_pre]:!text-[15px] [&_code]:!bg-transparent [&_code]:!p-0 [&_code]:!border-0 [&_code]:!text-sm md:[&_code]:!text-[15px] [&_code]:!font-mono [&::-webkit-scrollbar]:h-2 [&::-webkit-scrollbar-track]:bg-slate-900/50 [&::-webkit-scrollbar-thumb]:bg-slate-700 [&::-webkit-scrollbar-thumb:hover]:bg-slate-600 [&::-webkit-scrollbar-thumb]:rounded-full">
        {children}
      </div>
    </div>
  );
}
