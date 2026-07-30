'use client';

import { useRef } from 'react';
import {
  ChevronDown,
  ChevronUp,
  History,
  Image as ImageIcon,
  Loader2,
  Plus,
  RotateCcw,
  Star,
  Trash2,
  Upload,
} from 'lucide-react';
import SEOAnalyzer from '@/components/admin/SEOAnalyzer';
import type { Category, Tag, PostRevision } from '@/types';

interface PostEditorSidebarProps {
  // Cover Image
  coverImageUrl: string;
  coverImageAlt: string;
  uploadingImage: boolean;
  isDragging: boolean;
  onCoverImageUrlChange: (url: string) => void;
  onCoverImageAltChange: (alt: string) => void;
  onImageFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onDragOver: (e: React.DragEvent) => void;
  onDragLeave: () => void;
  onDrop: (e: React.DragEvent) => void;

  // Categories & Tags
  categories: Category[];
  tags: Tag[];
  selectedCategories: string[];
  selectedTags: string[];
  onCategoryToggle: (id: string) => void;
  onTagToggle: (id: string) => void;
  onOpenTaxonomyModal: (type: 'category' | 'tag') => void;

  // Featured
  isFeatured: boolean;
  onToggleFeatured: () => void;

  // Revisions (Optional — for edit mode)
  revisions?: PostRevision[];
  showRevisions?: boolean;
  isRevisionsFetching?: boolean;
  onToggleRevisions?: () => void;
  onRestoreRevision?: (rev: PostRevision) => void;

  // SEO Analyzer
  title: string;
  metaTitle: string;
  metaDescription: string;
  content: string;
  excerpt: string;
  slug: string;
}

const revisionDateFormatter = new Intl.DateTimeFormat('id-ID', {
  dateStyle: 'medium',
  timeStyle: 'short',
  timeZone: 'UTC',
});

/**
 * Reusable sidebar options component for the post editor.
 */
export function PostEditorSidebar({
  coverImageUrl,
  coverImageAlt,
  uploadingImage,
  isDragging,
  onCoverImageUrlChange,
  onCoverImageAltChange,
  onImageFileChange,
  onDragOver,
  onDragLeave,
  onDrop,
  categories,
  tags,
  selectedCategories,
  selectedTags,
  onCategoryToggle,
  onTagToggle,
  onOpenTaxonomyModal,
  isFeatured,
  onToggleFeatured,
  revisions,
  showRevisions,
  isRevisionsFetching,
  onToggleRevisions,
  onRestoreRevision,
  title,
  metaTitle,
  metaDescription,
  content,
  excerpt,
  slug,
}: PostEditorSidebarProps) {
  const coverImageInputRef = useRef<HTMLInputElement>(null);

  return (
    <div className="space-y-6">
      {/* Cover Image Upload */}
      <div className="admin-surface-padded space-y-4">
        <h3 className="text-sm font-medium text-slate-700 dark:text-slate-300">
          Cover Image
        </h3>

        {coverImageUrl ? (
          <div className="space-y-3">
            <div className="relative aspect-video rounded-lg overflow-hidden border border-slate-200 dark:border-slate-700 group">
              <img
                src={coverImageUrl}
                alt="Cover preview"
                className="w-full h-full object-cover"
              />

              {/* Trash button */}
              <button
                type="button"
                onClick={() => onCoverImageUrlChange('')}
                className="absolute top-2 right-2 p-1.5 bg-red-500 hover:bg-red-600 text-white rounded-lg shadow-lg transition-colors z-10"
                title="Remove image"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>

              {/* Hover overlay to re-upload */}
              <label className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center cursor-pointer">
                <Upload className="w-6 h-6 text-white mb-1" />
                <span className="text-white text-xs font-medium">Change image</span>
                <input
                  type="file"
                  className="hidden"
                  accept="image/*"
                  onChange={onImageFileChange}
                  disabled={uploadingImage}
                />
              </label>
            </div>

            {/* File name hint & change button */}
            <div className="flex items-center justify-between gap-3">
              <p className="text-xs text-slate-400 truncate" title={coverImageUrl}>
                {coverImageUrl.split('/').pop()}
              </p>
              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => coverImageInputRef.current?.click()}
                  disabled={uploadingImage}
                  className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-2.5 py-1 text-xs font-medium text-slate-600 transition-colors hover:bg-slate-100 disabled:opacity-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-700"
                >
                  {uploadingImage ? (
                    <Loader2 className="w-3 h-3 animate-spin" />
                  ) : (
                    <Upload className="w-3 h-3" />
                  )}
                  Change image
                </button>
                <input
                  ref={coverImageInputRef}
                  type="file"
                  className="hidden"
                  accept="image/*"
                  onChange={onImageFileChange}
                  disabled={uploadingImage}
                />
              </div>
            </div>
          </div>
        ) : (
          <label
            className={`flex flex-col items-center justify-center w-full h-36 border-2 border-dashed rounded-lg cursor-pointer transition-colors ${
              isDragging
                ? 'border-primary-400 bg-primary-50 dark:bg-primary-900/20'
                : 'border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 hover:bg-slate-100 dark:hover:border-slate-500 dark:hover:bg-slate-800'
            }`}
            onDragOver={onDragOver}
            onDragEnter={onDragOver}
            onDragLeave={onDragLeave}
            onDrop={onDrop}
          >
            <div className="flex flex-col items-center justify-center py-6 pointer-events-none">
              {uploadingImage ? (
                <Loader2 className="w-8 h-8 text-primary-500 animate-spin mb-2" />
              ) : (
                <div
                  className={`w-12 h-12 rounded-full flex items-center justify-center mb-3 transition-colors ${
                    isDragging
                      ? 'bg-primary-100 dark:bg-primary-800/40'
                      : 'bg-primary-50 dark:bg-primary-900/30'
                  }`}
                >
                  <Upload className="w-5 h-5 text-primary-500" />
                </div>
              )}
              <p className="text-sm text-slate-600 dark:text-slate-400 font-medium">
                {uploadingImage
                  ? 'Uploading...'
                  : isDragging
                    ? 'Drop image here'
                    : 'Click or drag image here'}
              </p>
              <p className="text-xs text-slate-400 mt-1">PNG, JPG, WEBP up to 5MB</p>
            </div>
            <input
              type="file"
              className="hidden"
              accept="image/*"
              onChange={onImageFileChange}
              disabled={uploadingImage}
            />
          </label>
        )}

        <div className="relative">
          <input
            type="text"
            value={coverImageUrl}
            onChange={(e) => onCoverImageUrlChange(e.target.value)}
            className="w-full pl-3 pr-8 py-2 text-sm bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-primary-500 focus:outline-none"
            placeholder="Or paste external URL..."
          />
          <ImageIcon className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        </div>
      </div>

      {/* Categories */}
      <div className="admin-surface-padded space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-medium text-slate-700 dark:text-slate-300">
            Categories
          </h3>
          <button
            type="button"
            onClick={() => onOpenTaxonomyModal('category')}
            className="text-xs flex items-center gap-1 text-primary-600 hover:text-primary-700 dark:text-primary-400 font-medium"
          >
            <Plus className="w-3.5 h-3.5" /> Add New
          </button>
        </div>
        <div className="space-y-2 max-h-48 overflow-y-auto pr-2">
          {categories.map((category) => (
            <label key={category.id} className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                className="rounded border-slate-300 text-primary-600 focus:ring-primary-500"
                checked={selectedCategories.includes(category.id)}
                onChange={() => onCategoryToggle(category.id)}
              />
              <span className="text-sm text-slate-600 dark:text-slate-400">
                {category.name}
              </span>
            </label>
          ))}
        </div>
      </div>

      {/* Tags */}
      <div className="admin-surface-padded space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-medium text-slate-700 dark:text-slate-300">
            Tags
          </h3>
          <button
            type="button"
            onClick={() => onOpenTaxonomyModal('tag')}
            className="text-xs flex items-center gap-1 text-primary-600 hover:text-primary-700 dark:text-primary-400 font-medium"
          >
            <Plus className="w-3.5 h-3.5" /> Add New
          </button>
        </div>
        <div className="space-y-2 max-h-48 overflow-y-auto pr-2">
          {tags.map((tag) => (
            <label key={tag.id} className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                className="rounded border-slate-300 text-primary-600 focus:ring-primary-500"
                checked={selectedTags.includes(tag.id)}
                onChange={() => onTagToggle(tag.id)}
              />
              <span className="text-sm text-slate-600 dark:text-slate-400">{tag.name}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Featured Article Toggle */}
      <div className="admin-surface p-4">
        <label className="flex items-center justify-between cursor-pointer">
          <div className="flex items-center gap-2">
            <Star
              className={`w-4 h-4 ${
                isFeatured ? 'text-amber-400 fill-amber-400' : 'text-slate-400'
              }`}
            />
            <div>
              <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
                Featured Article
              </p>
              <p className="text-xs text-slate-400">Pin to homepage spotlight</p>
            </div>
          </div>
          <div
            onClick={onToggleFeatured}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
              isFeatured ? 'bg-amber-400' : 'bg-slate-200 dark:bg-slate-700'
            }`}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white shadow-sm transition-transform ${
                isFeatured ? 'translate-x-6' : 'translate-x-1'
              }`}
            />
          </div>
        </label>
      </div>

      {/* Revision History (if provided) */}
      {revisions && onToggleRevisions && (
        <div className="admin-surface overflow-hidden">
          <button
            type="button"
            onClick={onToggleRevisions}
            className="flex items-center justify-between w-full p-4 text-left"
          >
            <div className="flex items-center gap-2">
              <History className="w-4 h-4 text-slate-400" />
              <h3 className="text-sm font-medium text-slate-700 dark:text-slate-300">
                Revision History
              </h3>
            </div>
            {isRevisionsFetching ? (
              <Loader2 className="w-4 h-4 animate-spin text-slate-400" />
            ) : showRevisions ? (
              <ChevronUp className="w-4 h-4 text-slate-400" />
            ) : (
              <ChevronDown className="w-4 h-4 text-slate-400" />
            )}
          </button>

          {showRevisions && (
            <div className="border-t border-slate-100 dark:border-slate-700">
              {revisions.length === 0 && !isRevisionsFetching ? (
                <p className="text-xs text-slate-400 p-4 text-center">No revisions yet</p>
              ) : (
                <div className="max-h-72 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-700">
                  {revisions.map((rev) => (
                    <div
                      key={rev.id}
                      className="p-3 flex items-start gap-3 hover:bg-slate-50 dark:hover:bg-slate-900/50 transition-colors"
                    >
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium text-slate-700 dark:text-slate-300 truncate">
                          v{rev.revision_number} — {rev.title}
                        </p>
                        <p className="text-xs text-slate-400 mt-0.5">
                          {revisionDateFormatter.format(new Date(rev.created_at))}
                        </p>
                        <div className="mt-1 flex items-center gap-2 text-[11px] text-slate-400">
                          <span className="rounded-full bg-slate-100 px-2 py-0.5 uppercase tracking-wide dark:bg-slate-700/60">
                            {rev.source || 'manual_edit'}
                          </span>
                          {rev.source_ref && (
                            <span className="font-mono">{rev.source_ref}</span>
                          )}
                        </div>
                      </div>
                      {onRestoreRevision && (
                        <button
                          type="button"
                          onClick={() => onRestoreRevision(rev)}
                          className="flex-shrink-0 p-1.5 rounded-lg text-slate-400 hover:text-primary-500 hover:bg-primary-50 dark:hover:bg-primary-900/20 transition-colors"
                          title="Restore this revision"
                        >
                          <RotateCcw className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* SEO Analyzer */}
      <SEOAnalyzer
        title={title}
        metaTitle={metaTitle}
        metaDescription={metaDescription}
        content={content}
        excerpt={excerpt}
        slug={slug}
        coverImage={coverImageUrl}
      />
    </div>
  );
}
