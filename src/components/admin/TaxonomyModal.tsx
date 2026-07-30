'use client';

import { Loader2, X } from 'lucide-react';
import type { FormEvent } from 'react';

interface TaxonomyModalProps {
  isOpen: boolean;
  type: 'category' | 'tag';
  name: string;
  isPending: boolean;
  onNameChange: (name: string) => void;
  onSubmit: (e: FormEvent) => void;
  onClose: () => void;
}

/**
 * Modal dialog for quickly adding a new Category or Tag directly from
 * the post editor sidebar.
 */
export function TaxonomyModal({
  isOpen,
  type,
  name,
  isPending,
  onNameChange,
  onSubmit,
  onClose,
}: TaxonomyModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
      <div className="admin-modal-panel w-full max-w-sm overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-700">
          <h3 className="font-semibold text-slate-900 dark:text-white capitalize">
            Add New {type}
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-500 dark:hover:text-slate-300"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={onSubmit} className="p-4 space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1 capitalize">
              {type} Name
            </label>
            <input
              type="text"
              autoFocus
              value={name}
              onChange={(e) => onNameChange(e.target.value)}
              placeholder={`e.g. ${type === 'category' ? 'Technology' : 'reactjs'}`}
              className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-primary-500 focus:outline-none dark:bg-slate-900"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isPending || !name.trim()}
              className="px-4 py-2 text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 rounded-lg transition-colors disabled:opacity-50 flex items-center justify-center min-w-[80px]"
            >
              {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Save'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
