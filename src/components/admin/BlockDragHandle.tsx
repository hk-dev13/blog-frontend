'use client';

import React, { useEffect, useState, useRef, useCallback } from 'react';
import { Editor } from '@tiptap/core';
import { GripVertical } from 'lucide-react';

interface BlockDragHandleProps {
  editor: Editor | null;
}

export default function BlockDragHandle({ editor }: BlockDragHandleProps) {
  const [handleStyle, setHandleStyle] = useState<{ top: number; visible: boolean }>({ top: 0, visible: false });
  const activeNodeElementRef = useRef<HTMLElement | null>(null);
  const activePosRef = useRef<number | null>(null);
  const draggingPosRef = useRef<number | null>(null);

  const updateHandlePosition = useCallback(() => {
    if (!editor || editor.isDestroyed || !activeNodeElementRef.current) return;

    const editorDom = editor.view.dom;
    const editorRect = editorDom.getBoundingClientRect();
    const nodeRect = activeNodeElementRef.current.getBoundingClientRect();

    const top = nodeRect.top - editorRect.top + 4; // Align near top of block
    setHandleStyle({ top, visible: true });
  }, [editor]);

  useEffect(() => {
    if (!editor || editor.isDestroyed) return;

    const editorDom = editor.view.dom;

    const handleMouseMove = (e: MouseEvent) => {
      const target = e.target as HTMLElement | null;
      if (!target) return;

      // Find top-level block inside prose editor container
      const topBlock = target.closest('.prose > *') as HTMLElement | null;

      if (topBlock && editorDom.contains(topBlock)) {
        activeNodeElementRef.current = topBlock;
        try {
          const pos = editor.view.posAtDOM(topBlock, 0);
          activePosRef.current = pos;
          updateHandlePosition();
        } catch {
          // Ignore posAtDOM out-of-range edge cases
        }
      }
    };

    const handleMouseLeave = () => {
      setHandleStyle((prev) => ({ ...prev, visible: false }));
    };

    editorDom.addEventListener('mousemove', handleMouseMove);
    editorDom.addEventListener('mouseleave', handleMouseLeave);

    return () => {
      editorDom.removeEventListener('mousemove', handleMouseMove);
      editorDom.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, [editor, updateHandlePosition]);

  const handleDragStart = (e: React.DragEvent) => {
    if (!editor || activePosRef.current === null) return;

    draggingPosRef.current = activePosRef.current;
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', ''); // Required for HTML5 drag

    if (activeNodeElementRef.current) {
      e.dataTransfer.setDragImage(activeNodeElementRef.current, 0, 0);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (!editor || draggingPosRef.current === null) return;

    const target = e.target as HTMLElement | null;
    const topBlock = target?.closest('.prose > *') as HTMLElement | null;
    if (!topBlock) return;

    try {
      const targetPos = editor.view.posAtDOM(topBlock, 0);
      const fromPos = draggingPosRef.current;

      if (fromPos === targetPos) return;

      const $from = editor.state.doc.resolve(fromPos);
      const node = $from.nodeAfter;

      if (!node) return;

      const nodeSize = node.nodeSize;
      const tr = editor.state.tr;

      // Delete node from old position and insert at new position
      tr.delete(fromPos, fromPos + nodeSize);
      const mappedTargetPos = tr.mapping.map(targetPos);
      tr.insert(mappedTargetPos, node);

      editor.view.dispatch(tr);
      setHandleStyle({ top: 0, visible: false });
    } catch (err) {
      console.error('Failed to move block node:', err);
    } finally {
      draggingPosRef.current = null;
    }
  };

  if (!editor || !handleStyle.visible) return null;

  return (
    <div
      draggable
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
      style={{ top: `${handleStyle.top}px` }}
      className="absolute -left-7 z-20 flex items-center justify-center p-1 rounded-md text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-200/80 dark:hover:bg-slate-800/80 cursor-grab active:cursor-grabbing transition-all duration-150 group/handle"
      title="Click & drag to reorder block"
    >
      <GripVertical className="w-4 h-4" />
    </div>
  );
}
