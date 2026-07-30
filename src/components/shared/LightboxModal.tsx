'use client';

import React, { useEffect, useState, useRef, useCallback } from 'react';
import { X, ZoomIn, ZoomOut, RotateCcw, Move } from 'lucide-react';

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
  const [scale, setScale] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const dragStartRef = useRef({ x: 0, y: 0 });
  const initialPosRef = useRef({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement>(null);

  // Reset zoom & position whenever media changes or opens
  useEffect(() => {
    setScale(1);
    setPosition({ x: 0, y: 0 });
    setIsDragging(false);
  }, [media]);

  // Handle ESC key and scroll lock
  useEffect(() => {
    if (!media) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [media, onClose]);

  // Handle wheel zoom around cursor position
  const handleWheel = useCallback((e: React.WheelEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();

    if (!containerRef.current) return;

    const rect = containerRef.current.getBoundingClientRect();
    const zoomFactor = e.deltaY < 0 ? 1.15 : 0.85;

    setScale((prevScale) => {
      const nextScale = Math.min(Math.max(1, prevScale * zoomFactor), 5);
      if (nextScale === 1) {
        setPosition({ x: 0, y: 0 });
        return 1;
      }

      // Cursor position relative to center of container
      const mouseX = e.clientX - rect.left - rect.width / 2;
      const mouseY = e.clientY - rect.top - rect.height / 2;

      // Adjust position so point under cursor stays stationary
      const ratio = (nextScale - prevScale) / prevScale;
      setPosition((prevPos) => ({
        x: prevPos.x - (mouseX - prevPos.x) * ratio,
        y: prevPos.y - (mouseY - prevPos.y) * ratio,
      }));

      return nextScale;
    });
  }, []);

  // Handle Drag / Pan
  const handleMouseDown = (e: React.MouseEvent) => {
    if (scale <= 1) return;
    setIsDragging(true);
    dragStartRef.current = { x: e.clientX, y: e.clientY };
    initialPosRef.current = { ...position };
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    const dx = e.clientX - dragStartRef.current.x;
    const dy = e.clientY - dragStartRef.current.y;
    setPosition({
      x: initialPosRef.current.x + dx,
      y: initialPosRef.current.y + dy,
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  // Double click to toggle 1x / 2.5x zoom at clicked point
  const handleDoubleClick = (e: React.MouseEvent) => {
    if (!containerRef.current) return;

    if (scale > 1.2) {
      setScale(1);
      setPosition({ x: 0, y: 0 });
    } else {
      const rect = containerRef.current.getBoundingClientRect();
      const mouseX = e.clientX - rect.left - rect.width / 2;
      const mouseY = e.clientY - rect.top - rect.height / 2;
      const targetScale = 2.5;

      const ratio = targetScale - 1;
      setPosition({
        x: -mouseX * ratio,
        y: -mouseY * ratio,
      });
      setScale(targetScale);
    }
  };

  const zoomIn = () => {
    setScale((prev) => Math.min(5, prev * 1.25));
  };

  const zoomOut = () => {
    setScale((prev) => {
      const next = Math.max(1, prev / 1.25);
      if (next === 1) setPosition({ x: 0, y: 0 });
      return next;
    });
  };

  const resetZoom = () => {
    setScale(1);
    setPosition({ x: 0, y: 0 });
  };

  if (!media) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col items-center justify-between bg-black/85 backdrop-blur-md p-4 transition-opacity duration-300 animate-in fade-in select-none"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="Enlarged media view"
    >
      {/* Top Header Controls */}
      <div className="w-full flex items-center justify-between z-50 px-2 py-1">
        <div className="flex items-center gap-2 text-xs text-slate-300 bg-slate-900/80 px-3.5 py-1.5 rounded-full border border-slate-700/50">
          <Move className="w-3.5 h-3.5 text-primary-400" />
          <span>Scroll wheel to zoom at cursor &bull; Drag to pan &bull; Double-click to toggle</span>
        </div>

        <button
          type="button"
          onClick={onClose}
          className="p-2 rounded-full bg-slate-900/80 text-slate-200 hover:text-white hover:bg-slate-800 transition-colors border border-slate-700/50 focus:outline-none focus:ring-2 focus:ring-primary-500"
          aria-label="Close modal"
          title="Close (ESC)"
        >
          <X className="w-6 h-6" />
        </button>
      </div>

      {/* Media Viewport */}
      <div
        ref={containerRef}
        onWheel={handleWheel}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onDoubleClick={handleDoubleClick}
        onClick={(e) => e.stopPropagation()}
        className={`relative flex-1 w-full h-full flex items-center justify-center overflow-hidden my-2 ${
          scale > 1 ? (isDragging ? 'cursor-grabbing' : 'cursor-grab') : 'cursor-zoom-in'
        }`}
      >
        <div
          style={{
            transform: `translate(${position.x}px, ${position.y}px) scale(${scale})`,
            transformOrigin: 'center center',
            transition: isDragging ? 'none' : 'transform 0.15s ease-out',
          }}
          className="flex flex-col items-center justify-center max-w-full max-h-full"
        >
          {media.type === 'image' && media.src && (
            <div className="flex flex-col items-center">
              {/* eslint-disable-next-html-element-suppression */}
              <img
                src={media.src}
                alt={media.alt || 'Enlarged image'}
                draggable={false}
                className="max-h-[82vh] max-w-[92vw] w-auto h-auto object-contain rounded-xl shadow-2xl border border-slate-700/30 select-none pointer-events-auto"
              />
              {media.caption && scale === 1 && (
                <p className="mt-3 text-sm text-slate-300 text-center font-sans italic max-w-2xl px-4 bg-slate-900/60 py-1.5 px-4 rounded-full border border-slate-800 pointer-events-none">
                  {media.caption}
                </p>
              )}
            </div>
          )}

          {media.type === 'mermaid' && media.svgContent && (
            <div className="w-full flex flex-col items-center justify-center">
              <div className="w-full max-w-[92vw] max-h-[82vh] bg-slate-900/90 dark:bg-slate-950 p-6 md:p-10 rounded-2xl border border-slate-800 shadow-2xl flex justify-center items-center [&_svg]:w-full [&_svg]:max-w-[85vw] [&_svg]:h-auto [&_svg]:max-h-[78vh] [&_svg]:object-contain select-none pointer-events-auto">
                <div
                  dangerouslySetInnerHTML={{ __html: media.svgContent }}
                  className="w-full flex justify-center items-center"
                />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Bottom Toolbar Controls */}
      <div
        className="z-50 flex items-center gap-2 bg-slate-900/90 text-slate-200 px-4 py-2 rounded-full border border-slate-700/60 shadow-xl backdrop-blur-md"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={zoomOut}
          disabled={scale <= 1}
          className="p-1.5 rounded-full hover:bg-slate-800 text-slate-300 disabled:opacity-40 disabled:hover:bg-transparent transition-colors"
          title="Zoom out (-)"
        >
          <ZoomOut className="w-4 h-4" />
        </button>

        <span className="text-xs font-mono font-medium px-2 min-w-[3.5rem] text-center text-slate-300">
          {Math.round(scale * 100)}%
        </span>

        <button
          type="button"
          onClick={zoomIn}
          disabled={scale >= 5}
          className="p-1.5 rounded-full hover:bg-slate-800 text-slate-300 disabled:opacity-40 disabled:hover:bg-transparent transition-colors"
          title="Zoom in (+)"
        >
          <ZoomIn className="w-4 h-4" />
        </button>

        <div className="w-px h-4 bg-slate-700 mx-1" />

        <button
          type="button"
          onClick={resetZoom}
          disabled={scale === 1 && position.x === 0 && position.y === 0}
          className="p-1.5 rounded-full hover:bg-slate-800 text-slate-300 disabled:opacity-40 disabled:hover:bg-transparent transition-colors"
          title="Reset zoom"
        >
          <RotateCcw className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
