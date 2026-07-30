'use client';

import React, { useEffect } from 'react';
import { X, ZoomIn } from 'lucide-react';

export interface LightboxMedia {
  type: 'image' | 'mermaid';
  src?: string;
  alt?: string;
  caption?: string;
  svgContent?: string;
}

interface LightboxModalProps {
  media: LightboxMedia | null;
  onClose: () => void;
}

export default function LightboxModal({ media, onClose }: LightboxModalProps) {
  useEffect(() => {
    if (!media) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    // Prevent body scroll when modal is open
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [media, onClose]);

  if (!media) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 md:p-8 transition-opacity duration-300 animate-in fade-in"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="Enlarged media view"
    >
      {/* Close button */}
      <button
        type="button"
        onClick={onClose}
        className="absolute top-4 right-4 z-50 p-2.5 rounded-full bg-slate-900/80 text-slate-200 hover:text-white hover:bg-slate-800 transition-colors border border-slate-700/50 focus:outline-none focus:ring-2 focus:ring-primary-500"
        aria-label="Close modal"
      >
        <X className="w-6 h-6" />
      </button>

      {/* Content Container */}
      <div
        className="relative max-w-5xl max-h-[90vh] w-full flex flex-col items-center justify-center overflow-auto p-2"
        onClick={(e) => e.stopPropagation()}
      >
        {media.type === 'image' && media.src && (
          <div className="flex flex-col items-center max-w-full">
            {/* eslint-disable-next-html-element-suppression */}
            <img
              src={media.src}
              alt={media.alt || 'Enlarged image'}
              className="max-h-[80vh] max-w-full object-contain rounded-xl shadow-2xl border border-slate-700/30"
            />
            {media.caption && (
              <p className="mt-3 text-sm text-slate-300 text-center font-sans italic max-w-2xl px-4 bg-slate-900/60 py-1.5 px-4 rounded-full border border-slate-800">
                {media.caption}
              </p>
            )}
          </div>
        )}

        {media.type === 'mermaid' && media.svgContent && (
          <div className="w-full flex flex-col items-center">
            <div className="w-full max-h-[80vh] overflow-auto bg-slate-900/90 dark:bg-slate-950 p-6 md:p-10 rounded-2xl border border-slate-800 shadow-2xl flex justify-center items-center [&_svg]:max-w-full [&_svg]:h-auto">
              <div
                dangerouslySetInnerHTML={{ __html: media.svgContent }}
                className="w-full flex justify-center"
              />
            </div>
            <div className="mt-3 flex items-center gap-1.5 text-xs text-slate-400 bg-slate-900/70 px-3 py-1 rounded-full border border-slate-800">
              <ZoomIn className="w-3.5 h-3.5" />
              <span>Full diagram view</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
