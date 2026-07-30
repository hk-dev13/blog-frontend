'use client';

import React, { useEffect, useState, useRef, useCallback } from 'react';
import { Editor } from '@tiptap/core';
import { GripVertical } from 'lucide-react';

interface BlockDragHandleProps {
  editor: Editor | null;
}

export default function BlockDragHandle({ editor }: BlockDragHandleProps) {
  const [handleStyle, setHandleStyle] = useState<{ top: number; left: number; visible: boolean }>({ top: 0, left: 6, visible: false });
  const activeNodeElementRef = useRef<HTMLElement | null>(null);
  const activePosRef = useRef<number | null>(null);
  const draggingPosRef = useRef<number | null>(null);
  const handleRef = useRef<HTMLDivElement | null>(null);

  const updateHandlePosition = useCallback(() => {
    if (!editor || editor.isDestroyed || !activeNodeElementRef.current) return;

    const editorDom = editor.view.dom;
    const editorRect = editorDom.getBoundingClientRect();
    const nodeRect = activeNodeElementRef.current.getBoundingClientRect();

    const top = nodeRect.top - editorRect.top + 2;
    // Position handle 28px left of block content, clamped to minimum 6px inside container boundary
    const left = Math.max(6, nodeRect.left - editorRect.left - 28);

    setHandleStyle({ top, left, visible: true });
  }, [editor]);

  useEffect(() => {
    if (!editor || editor.isDestroyed) return;

    const editorDom = editor.view.dom;
    const container = (editorDom.closest('.relative') as HTMLElement | null) || editorDom.parentElement;

    const handleMouseMove = (e: MouseEvent) => {
      const target = e.target as HTMLElement | null;
      if (!target) return;

      // Keep handle active when hovering over handle itself
      if (handleRef.current && handleRef.current.contains(target)) {
        return;
      }

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

    const handleMouseLeave = (e: MouseEvent) => {
      const relatedTarget = e.relatedTarget as HTMLElement | null;
      if (handleRef.current && relatedTarget && handleRef.current.contains(relatedTarget)) {
        return;
      }
      setHandleStyle((prev) => ({ ...prev, visible: false }));
    };

    const handleEditorDragOver = (e: DragEvent) => {
      if (draggingPosRef.current === null) return;
      e.preventDefault();
      if (e.dataTransfer) {
        e.dataTransfer.dropEffect = 'move';
      }
    };

    const handleEditorDrop = (e: DragEvent) => {
      if (!editor || draggingPosRef.current === null) return;
      e.preventDefault();

      const fromPos = draggingPosRef.current;
      draggingPosRef.current = null;

      try {
        const target = e.target as HTMLElement | null;
        const topBlock = target?.closest('.prose > *') as HTMLElement | null;
        if (!topBlock) return;

        const targetPos = editor.view.posAtDOM(topBlock, 0);

        const $from = editor.state.doc.resolve(fromPos);
        const fromNode = $from.nodeAfter;

        if (!fromNode) return;

        const nodeSize = fromNode.nodeSize;
        const tr = editor.state.tr;

        // Resolve drop block position at top-level (depth 1)
        const $target = editor.state.doc.resolve(targetPos);
        const targetBlockPos = $target.before(1);

        if (fromPos === targetBlockPos) return;

        if (fromPos < targetBlockPos) {
          // Dragging downwards
          const targetNodeSize = $target.node(1).nodeSize;
          tr.insert(targetBlockPos + targetNodeSize, fromNode);
          tr.delete(fromPos, fromPos + nodeSize);
        } else {
          // Dragging upwards
          tr.delete(fromPos, fromPos + nodeSize);
          tr.insert(targetBlockPos, fromNode);
        }

        editor.view.dispatch(tr);
        setHandleStyle((prev) => ({ ...prev, visible: false }));
      } catch (err) {
        console.error('Failed to move block node:', err);
      }
    };

    const targetContainer = container || editorDom;
    targetContainer.addEventListener('mousemove', handleMouseMove);
    targetContainer.addEventListener('mouseleave', handleMouseLeave);

    editorDom.addEventListener('dragover', handleEditorDragOver);
    editorDom.addEventListener('drop', handleEditorDrop);

    window.addEventListener('scroll', updateHandlePosition, true);
    window.addEventListener('resize', updateHandlePosition);

    return () => {
      targetContainer.removeEventListener('mousemove', handleMouseMove);
      targetContainer.removeEventListener('mouseleave', handleMouseLeave);
      editorDom.removeEventListener('dragover', handleEditorDragOver);
      editorDom.removeEventListener('drop', handleEditorDrop);
      window.removeEventListener('scroll', updateHandlePosition, true);
      window.removeEventListener('resize', updateHandlePosition);
    };
  }, [editor, updateHandlePosition]);

  const handleDragStart = (e: React.DragEvent) => {
    if (!editor || activePosRef.current === null) return;

    draggingPosRef.current = activePosRef.current;
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', 'block-reorder'); // Required for HTML5 drag

    if (activeNodeElementRef.current) {
      e.dataTransfer.setDragImage(activeNodeElementRef.current, 0, 0);
    }
  };

  if (!editor || !handleStyle.visible) return null;

  return (
    <div
      ref={handleRef}
      draggable
      onDragStart={handleDragStart}
      style={{ top: `${handleStyle.top}px`, left: `${handleStyle.left}px` }}
      className="absolute z-20 flex items-center justify-center p-1 rounded-md text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-200/80 dark:hover:bg-slate-800/80 cursor-grab active:cursor-grabbing transition-all duration-150 group/handle"
      title="Click & drag to reorder block"
      aria-label="Drag block to reorder"
    >
      <GripVertical className="w-4 h-4" />
    </div>
  );
}
