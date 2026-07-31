'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fetchApi, fetchPaginatedApi } from '@/lib/api';
import { Category, Tag } from '@/types';
import { Loader2, Image as ImageIcon, Upload, ChevronDown, ChevronUp, CalendarClock, Globe, Save, Search, Trash2, Plus, X, Lock, Unlock, Clock, AlignLeft, Star, AlertCircle, PanelRightClose, PanelRightOpen } from 'lucide-react';
import { useAppStore } from '@/store/useAppStore';
import { 
  useAutosave, 
  getLocalDateTimeMin, 
  AutosaveRestoreCandidate,
  generateSlug,
  getContentStats,
  type AutosaveData
} from '@/lib/editorUtils';
import { AutosaveRestorePrompt } from '@/components/admin/AutosaveRestorePrompt';
import { useToastStore } from '@/store/useToastStore';
import { API_URL } from '@/lib/env';
import RichTextEditor from '@/components/admin/RichTextEditor';
import SEOAnalyzer from '@/components/admin/SEOAnalyzer';
import AdminSessionExpired from '@/components/admin/AdminSessionExpired';
import AdminLoadError from '@/components/admin/AdminLoadError';
import { PostEditorHeaderHero } from '@/components/admin/PostEditorHeaderHero';

const numberFormatter = new Intl.NumberFormat('en-US');

export default function CreatePostPage() {
  const router = useRouter();
  const token = useAppStore(state => state.token);
  const queryClient = useQueryClient();
  const pushToast = useToastStore(state => state.push);

  // Form state
  const [title, setTitle] = useState('');
  const [slug, setSlug] = useState('');
  const [slugLocked, setSlugLocked] = useState(false);
  const [excerpt, setExcerpt] = useState('');
  const [content, setContent] = useState('');
  const [coverImageUrl, setCoverImageUrl] = useState('');
  const [coverImageAlt, setCoverImageAlt] = useState('');
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [showPublishMenu, setShowPublishMenu] = useState(false);
  const [showScheduler, setShowScheduler] = useState(false);
  const [scheduleDate, setScheduleDate] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [metaTitle, setMetaTitle] = useState('');
  const [metaDescription, setMetaDescription] = useState('');
  const [seoOpen, setSeoOpen] = useState(false);
  const [isFeatured, setIsFeatured] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [canonicalUrl, setCanonicalUrl] = useState('');
  const [focusKeyword, setFocusKeyword] = useState('');
  const [editorMode, setEditorMode] = useState<'wysiwyg' | 'markdown'>('wysiwyg');
  const [showOptionsSidebar, setShowOptionsSidebar] = useState(true);
  const [modalState, setModalState] = useState<{ isOpen: boolean; type: 'category' | 'tag'; name: string }>({ isOpen: false, type: 'category', name: '' });
  const [autosaveRestoreState, setAutosaveRestoreState] = useState<AutosaveRestoreCandidate | null>(null);

  const handleRestoreAvailable = useCallback((candidate: AutosaveRestoreCandidate) => {
    setAutosaveRestoreState(candidate);
  }, []);

  const handleAutosaveRestore = () => {
    const candidate = autosaveRestoreState;
    if (!candidate) return;
    const p = candidate.envelope.payload;
    setTitle(p.title);
    setExcerpt(p.excerpt);
    setContent(p.content);
    setMetaTitle(p.metaTitle);
    setMetaDescription(p.metaDescription);
    setCanonicalUrl(p.canonicalUrl);
    setCoverImageUrl(p.coverImageUrl);
    setCoverImageAlt(p.coverImageAlt);
    setIsFeatured(p.isFeatured);
    setSelectedCategories(p.selectedCategories);
    setSelectedTags(p.selectedTags);
    setScheduleDate(p.scheduleDate);
    setFocusKeyword(p.focusKeyword);
    if (p.slug) { setSlug(p.slug); setSlugLocked(true); }
    
    candidate.accept(p);
    setAutosaveRestoreState(null);
  };

  const contentRef = useRef<HTMLTextAreaElement>(null);
  const coverImageInputRef = useRef<HTMLInputElement>(null);
  const isSavingRef = useRef(false);

  // Live stats
  const contentStats = getContentStats(content);

  // Autosave (local localStorage only — not server-dirty)
  const autosaveData: AutosaveData = {
    title, slug, excerpt, content,
    metaTitle, metaDescription, canonicalUrl,
    coverImageUrl, coverImageAlt,
    isFeatured, selectedCategories, selectedTags,
    scheduleDate, focusKeyword,
  };
  const { clearSave, status: autosaveStatus, lastSavedAt } = useAutosave(
    'new',
    autosaveData,
    true,
    handleRestoreAvailable,
    null, // create mode — no server updated_at
  );

  const autosaveLabel = autosaveStatus === 'saving'
    ? 'Saving draft...'
    : autosaveStatus === 'saved'
      ? `Autosaved${lastSavedAt ? ` at ${new Date(lastSavedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}` : ''}`
      : autosaveStatus === 'dirty'
        ? 'Unsaved changes'
        : autosaveStatus === 'error'
          ? 'Autosave failed'
          : '';

  // Fetch categories and tags
  const { data: categoriesData, error: categoriesError, refetch: refetchCategories } = useQuery({
    queryKey: ['categories'],
    queryFn: () => fetchPaginatedApi<Category>('/categories?limit=50'),
  });

  const { data: tagsData, error: tagsError, refetch: refetchTags } = useQuery({
    queryKey: ['tags'],
    queryFn: () => fetchPaginatedApi<Tag>('/tags?limit=50'),
  });

  // Build the post payload
  const buildPayload = useCallback(() => ({
    title,
    slug: slugLocked && slug ? slug : undefined,
    excerpt,
    content,
    cover_image: coverImageUrl || undefined,
    cover_image_alt: coverImageAlt || undefined,
    meta_title: metaTitle || undefined,
    meta_description: metaDescription || undefined,
    canonical_url: canonicalUrl || undefined,
    is_featured: isFeatured,
    category_ids: selectedCategories,
    tag_ids: selectedTags,
  }), [
    title, slugLocked, slug, excerpt, content,
    coverImageUrl, coverImageAlt, metaTitle, metaDescription,
    canonicalUrl, isFeatured, selectedCategories, selectedTags,
  ]);

  // Save as Draft — returns the created post so Ctrl+S can redirect
  const handleSaveDraft = useCallback(async (): Promise<{ id: string } | null> => {
    if (!title.trim() || !content.trim()) {
      pushToast({ variant: 'error', title: 'Title and content are required before saving.' });
      return null;
    }
    setIsSaving(true);
    try {
      const created = await fetchApi<{ id: string }>('/posts', { method: 'POST', body: JSON.stringify(buildPayload()) });
      clearSave();
      router.push('/admin/posts');
      return created;
    } catch (err: unknown) {
      pushToast({ variant: 'error', title: 'Failed to save draft', description: err instanceof Error ? err.message : undefined });
      return null;
    } finally {
      setIsSaving(false);
    }
  }, [title, content, buildPayload, clearSave, router, pushToast]);

  const handlePreview = async () => {
    if (!title.trim() || !content.trim()) {
      pushToast({ variant: 'error', title: 'Title and content are required to preview.' });
      return;
    }
    setIsSaving(true);
    try {
      const created = await fetchApi<{ id: string }>('/posts', { method: 'POST', body: JSON.stringify(buildPayload()) });
      clearSave();
      window.open(`/preview/posts/${created.id}`, '_blank', 'noopener,noreferrer');
      router.replace(`/admin/posts/${created.id}/edit`);
    } catch (err: unknown) {
      pushToast({ variant: 'error', title: 'Failed to open preview', description: err instanceof Error ? err.message : undefined });
    } finally {
      setIsSaving(false);
    }
  };

  // Publish Now
  const handlePublishNow = async () => {
    if (!title.trim() || !content.trim()) {
      pushToast({ variant: 'error', title: 'Title and content are required to publish.' });
      return;
    }
    setIsSaving(true);
    try {
      await fetchApi('/posts/publish', { method: 'POST', body: JSON.stringify(buildPayload()) });
      clearSave();
      router.push('/admin/posts');
    } catch (err: unknown) {
      pushToast({ variant: 'error', title: 'Failed to publish post', description: err instanceof Error ? err.message : undefined });
    } finally {
      setIsSaving(false);
    }
  };

  // Schedule
  const handleSchedule = async () => {
    if (!title.trim() || !content.trim()) {
      pushToast({ variant: 'error', title: 'Title and content are required to schedule.' });
      return;
    }
    if (!scheduleDate) {
      pushToast({ variant: 'error', title: 'Please select a date and time for scheduling.' });
      return;
    }
    setIsSaving(true);
    try {
      await fetchApi('/posts/publish', {
        method: 'POST',
        body: JSON.stringify({ ...buildPayload(), published_at: new Date(scheduleDate).toISOString() }),
      });
      clearSave();
      router.push('/admin/posts');
    } catch (err: unknown) {
      pushToast({ variant: 'error', title: 'Failed to schedule post', description: err instanceof Error ? err.message : undefined });
    } finally {
      setIsSaving(false);
      setShowScheduler(false);
    }
  };

  // Ctrl+S / ⌘S — save draft with concurrency guard
  useEffect(() => {
    const handleSaveDraftRef = { current: handleSaveDraft };
    handleSaveDraftRef.current = handleSaveDraft;

    const handler = async (e: KeyboardEvent) => {
      if (!(e.ctrlKey || e.metaKey) || e.key !== 's') return;
      e.preventDefault();
      if (isSavingRef.current) return;           // guard: already saving
      if (modalState.isOpen) return;             // guard: modal open
      if (showScheduler || showPublishMenu) return; // guard: overlay open
      if (!title.trim()) {
        pushToast({ variant: 'error', title: 'Add a title before saving.' });
        return;
      }
      isSavingRef.current = true;
      try {
        const created = await handleSaveDraftRef.current();
        if (created) {
          // Use replace so Back does not return to create page and create a duplicate
          router.replace(`/admin/posts/${created.id}/edit`);
        }
      } finally {
        isSavingRef.current = false;
      }
    };

    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [modalState.isOpen, showScheduler, showPublishMenu, title, router, pushToast, handleSaveDraft]);

  // Taxonomy Mutations
  const createCategoryMutation = useMutation({
    mutationFn: (name: string) => fetchApi<Category>('/categories', { method: 'POST', body: JSON.stringify({ name }) }),
    onSuccess: (newCat) => {
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      setSelectedCategories(prev => [...prev, newCat.id]);
      setModalState({ ...modalState, isOpen: false, name: '' });
    }
  });

  const createTagMutation = useMutation({
    mutationFn: (name: string) => fetchApi<Tag>('/tags', { method: 'POST', body: JSON.stringify({ name }) }),
    onSuccess: (newTag) => {
      queryClient.invalidateQueries({ queryKey: ['tags'] });
      setSelectedTags(prev => [...prev, newTag.id]);
      setModalState({ ...modalState, isOpen: false, name: '' });
    }
  });

  const handleCreateTaxonomy = (e: React.FormEvent) => {
    e.preventDefault();
    if (!modalState.name.trim()) return;
    if (modalState.type === 'category') {
      createCategoryMutation.mutate(modalState.name);
    } else {
      createTagMutation.mutate(modalState.name);
    }
  };

  // Handle Image Upload (shared by click + drag)
  const uploadFile = async (file: File) => {
    setUploadingImage(true);
    const formData = new FormData();
    formData.append('file', file);
    try {
      const res = await fetch(`${API_URL}/upload`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: formData,
      });
      const data = await res.json();
      if (data.success) setCoverImageUrl(data.data.url);
      else throw new Error(data.error || 'Upload failed');
    } catch (err: unknown) {
      pushToast({ variant: 'error', title: 'Failed to upload image', description: err instanceof Error ? err.message : undefined });
    } finally {
      setUploadingImage(false);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    await uploadFile(file);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (!file || !file.type.startsWith('image/')) return;
    await uploadFile(file);
  };




  const categories = categoriesData?.data || [];
  const tags = tagsData?.data || [];
  const setupError = categoriesError ?? tagsError;

  if (setupError instanceof Error && /401|403|Authentication required|Unauthorized|Forbidden/i.test(setupError.message)) {
    return <AdminSessionExpired />;
  }

  if (setupError instanceof Error) {
    return (
      <AdminLoadError
        title="We couldn't load the editor setup right now."
        description="Categories or tags could not be loaded. Please try again."
        onRetry={() => {
          void refetchCategories();
          void refetchTags();
        }}
      />
    );
  }

  return (
    <div className="w-full space-y-6">
      <PostEditorHeaderHero
        mode="create"
        titleText="Create New Post"
        descriptionText="Write, preview, publish, or schedule your next post."
        isSaving={isSaving}
        autosaveStatus={autosaveStatus}
        autosaveLabel={autosaveLabel}
        showSidebar={showOptionsSidebar}
        onToggleSidebar={() => setShowOptionsSidebar(!showOptionsSidebar)}
        onPreview={handlePreview}
        onSaveDraft={handleSaveDraft}
        onPublishNow={handlePublishNow}
        onSchedule={(date) => {
          setScheduleDate(date);
          handleSchedule();
        }}
        scheduleDate={scheduleDate}
        onScheduleDateChange={setScheduleDate}
      />

      {/* Top Banner for Autosave Restore */}
      {autosaveRestoreState && (
        <AutosaveRestorePrompt
          state={autosaveRestoreState.state}
          envelope={autosaveRestoreState.envelope}
          onRestore={handleAutosaveRestore}
          onDiscard={() => {
            autosaveRestoreState.discard();
            setAutosaveRestoreState(null);
          }}
        />
      )}

      <div className={`grid grid-cols-1 gap-6 ${showOptionsSidebar ? 'lg:grid-cols-[minmax(0,1fr)_clamp(18rem,22vw,22rem)]' : ''}`}>
        {/* Main Editor Area */}
        <div className="space-y-6">
          <div className="admin-surface-padded space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Title</label>
              <input
                type="text"
                value={title}
                onChange={e => {
                  setTitle(e.target.value);
                  if (!slugLocked) setSlug(generateSlug(e.target.value));
                }}
                className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-primary-500 focus:outline-none text-lg font-semibold"
                placeholder="Enter post title..."
                required
              />
            </div>

            {/* Slug editor */}
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">URL Slug</label>
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-400 whitespace-nowrap">posts/</span>
                <div className="relative flex-1">
                  <input
                    type="text"
                    value={slug}
                    onChange={e => { setSlug(generateSlug(e.target.value)); setSlugLocked(true); }}
                    disabled={false}
                    className="w-full px-3 py-1.5 text-sm bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-primary-500 focus:outline-none font-mono"
                    placeholder="auto-generated-from-title"
                  />
                </div>
                <button
                  type="button"
                  onClick={() => {
                    if (slugLocked) {
                      setSlug(generateSlug(title));
                      setSlugLocked(false);
                    } else {
                      setSlugLocked(true);
                    }
                  }}
                  title={slugLocked ? 'Click to auto-generate again' : 'Lock slug to custom value'}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-primary-500 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                >
                  {slugLocked ? <Lock className="w-4 h-4 text-amber-500" /> : <Unlock className="w-4 h-4" />}
                </button>
              </div>
              {slugLocked && (
                <p className="text-xs text-amber-500 mt-1 flex items-center gap-1">
                  <Lock className="w-3 h-3" /> Slug is locked — editing title won't change it
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Excerpt (Optional)</label>
              <textarea
                value={excerpt}
                onChange={e => setExcerpt(e.target.value)}
                rows={2}
                className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-primary-500 focus:outline-none"
                placeholder="Short summary of the post..."
              />
              {/* Excerpt length guidance (P1.7) */}
              <div className="flex items-center justify-between text-xs text-slate-400 mt-1">
                <span>Ideal: 150–300 characters for search preview</span>
                <span className={excerpt.length > 300 ? 'text-amber-500 font-medium' : ''}>
                  {excerpt.length} chars
                </span>
              </div>
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Content</label>

              <RichTextEditor
                value={content}
                onChange={setContent}
                mode={editorMode}
                onModeChange={setEditorMode}
                placeholder="Write your content..."
                contentRef={contentRef}
              />

              {/* Word count & reading time bar */}
              <div className="flex items-center gap-4 px-1 py-1 text-xs text-slate-400">
                <span className="flex items-center gap-1">
                  <AlignLeft className="w-3.5 h-3.5" />
                  {numberFormatter.format(contentStats.words)} words
                </span>
                <span className="text-slate-300 dark:text-slate-600">·</span>
                <span>{numberFormatter.format(contentStats.chars)} characters</span>
                <span className="text-slate-300 dark:text-slate-600">·</span>
                <span className="flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5" />
                  ~{contentStats.readingTime} min read
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Sidebar Options */}
        {showOptionsSidebar && (
          <div className="space-y-6 animate-in fade-in duration-200">
          {/* Cover Image Upload */}
          <div className="admin-surface-padded space-y-4">
            <h3 className="text-sm font-medium text-slate-700 dark:text-slate-300">Cover Image</h3>

            {coverImageUrl ? (
              <div className="space-y-3">
                <div className="relative aspect-video rounded-lg overflow-hidden border border-slate-200 dark:border-slate-700 group">
                  <img src={coverImageUrl} alt="Cover preview" className="w-full h-full object-cover" />

                  {/* Persistent trash button — top-right corner */}
                  <button
                    onClick={() => setCoverImageUrl('')}
                    className="absolute top-2 right-2 p-1.5 bg-red-500 hover:bg-red-600 text-white rounded-lg shadow-lg transition-colors z-10"
                    title="Remove image"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>

                  {/* Hover overlay to re-upload */}
                  <label className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center cursor-pointer">
                    <Upload className="w-6 h-6 text-white mb-1" />
                    <span className="text-white text-xs font-medium">Change image</span>
                    <input type="file" className="hidden" accept="image/*" onChange={handleImageUpload} disabled={uploadingImage} />
                  </label>
                </div>

                {/* File name hint */}
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
                      {uploadingImage ? <Loader2 className="w-3 h-3 animate-spin" /> : <Upload className="w-3 h-3" />}
                      Change image
                    </button>
                    <input
                      ref={coverImageInputRef}
                      type="file"
                      className="hidden"
                      accept="image/*"
                      onChange={handleImageUpload}
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
                onDragOver={e => { e.preventDefault(); setIsDragging(true); }}
                onDragEnter={e => { e.preventDefault(); setIsDragging(true); }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={handleDrop}
              >
                <div className="flex flex-col items-center justify-center py-6 pointer-events-none">
                  {uploadingImage ? (
                    <Loader2 className="w-8 h-8 text-primary-500 animate-spin mb-2" />
                  ) : (
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center mb-3 transition-colors ${
                      isDragging ? 'bg-primary-100 dark:bg-primary-800/40' : 'bg-primary-50 dark:bg-primary-900/30'
                    }`}>
                      <Upload className="w-5 h-5 text-primary-500" />
                    </div>
                  )}
                  <p className="text-sm text-slate-600 dark:text-slate-400 font-medium">
                    {uploadingImage ? 'Uploading...' : isDragging ? 'Drop image here' : 'Click or drag image here'}
                  </p>
                  <p className="text-xs text-slate-400 mt-1">PNG, JPG, WEBP up to 5MB</p>
                </div>
                <input type="file" className="hidden" accept="image/*" onChange={handleImageUpload} disabled={uploadingImage} />
              </label>
            )}

            <div className="relative">
              <input
                type="text"
                value={coverImageUrl}
                onChange={e => setCoverImageUrl(e.target.value)}
                className="w-full pl-3 pr-8 py-2 text-sm bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-primary-500 focus:outline-none"
                placeholder="Or paste external URL..."
              />
              <ImageIcon className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            </div>
          </div>

          {/* Categories */}
          <div className="admin-surface-padded space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-medium text-slate-700 dark:text-slate-300">Categories</h3>
              <button 
                onClick={() => setModalState({ isOpen: true, type: 'category', name: '' })}
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
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedCategories([...selectedCategories, category.id]);
                      } else {
                        setSelectedCategories(selectedCategories.filter(id => id !== category.id));
                      }
                    }}
                  />
                  <span className="text-sm text-slate-600 dark:text-slate-400">{category.name}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Tags */}
          <div className="admin-surface-padded space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-medium text-slate-700 dark:text-slate-300">Tags</h3>
              <button 
                onClick={() => setModalState({ isOpen: true, type: 'tag', name: '' })}
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
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedTags([...selectedTags, tag.id]);
                      } else {
                        setSelectedTags(selectedTags.filter(id => id !== tag.id));
                      }
                    }}
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
                <Star className={`w-4 h-4 ${isFeatured ? 'text-amber-400 fill-amber-400' : 'text-slate-400'}`} />
                <div>
                  <p className="text-sm font-medium text-slate-700 dark:text-slate-300">Featured Article</p>
                  <p className="text-xs text-slate-400">Pin to homepage spotlight</p>
                </div>
              </div>
              <div
                onClick={() => setIsFeatured(!isFeatured)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  isFeatured ? 'bg-amber-400' : 'bg-slate-200 dark:bg-slate-700'
                }`}
              >
                <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow-sm transition-transform ${
                  isFeatured ? 'translate-x-6' : 'translate-x-1'
                }`} />
              </div>
            </label>
          </div>

          {/* SEO Settings (Collapsible) */}
          <div className="admin-surface overflow-hidden">
            <button
              type="button"
              onClick={() => setSeoOpen(!seoOpen)}
              className="flex items-center justify-between w-full p-6 text-left"
            >
              <div className="flex items-center gap-2">
                <Search className="w-4 h-4 text-primary-500" />
                <h3 className="text-sm font-medium text-slate-700 dark:text-slate-300">SEO Settings</h3>
              </div>
              {seoOpen ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
            </button>
            {seoOpen && (
              <div className="px-6 pb-6 space-y-4 border-t border-slate-100 dark:border-slate-700 pt-4">
                <div>
                  <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">Meta Title</label>
                  <input
                    type="text"
                    value={metaTitle}
                    onChange={e => setMetaTitle(e.target.value)}
                    className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-primary-500 focus:outline-none"
                    placeholder={title || 'Custom title for search engines...'}
                    maxLength={70}
                  />
                  <p className="text-xs text-slate-400 mt-1 text-right">{metaTitle.length}/70</p>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">Meta Description</label>
                  <textarea
                    value={metaDescription}
                    onChange={e => setMetaDescription(e.target.value)}
                    rows={3}
                    className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-primary-500 focus:outline-none"
                    placeholder={excerpt || 'Compelling description for search results...'}
                    maxLength={160}
                  />
                  <p className="text-xs text-slate-400 mt-1 text-right">{metaDescription.length}/160</p>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">Cover Image Alt Text</label>
                  <input
                    type="text"
                    value={coverImageAlt}
                    onChange={e => setCoverImageAlt(e.target.value)}
                    className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-primary-500 focus:outline-none"
                    placeholder="Describe the cover image for accessibility..."
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">Canonical URL</label>
                  <input
                    type="url"
                    value={canonicalUrl}
                    onChange={e => setCanonicalUrl(e.target.value)}
                    className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-primary-500 focus:outline-none"
                    placeholder="https://example.com/original-article"
                  />
                  <p className="text-xs text-slate-400 mt-1">Leave empty to use this page's URL as canonical</p>
                </div>
              </div>
            )}
          </div>

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
      )}
      </div>

      {/* Taxonomy Modal */}
      {modalState.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="admin-modal-panel w-full max-w-sm overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-700">
              <h3 className="font-semibold text-slate-900 dark:text-white capitalize">Add New {modalState.type}</h3>
              <button 
                onClick={() => setModalState({ ...modalState, isOpen: false })}
                className="text-slate-400 hover:text-slate-500 dark:hover:text-slate-300"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleCreateTaxonomy} className="p-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1 capitalize">{modalState.type} Name</label>
                <input
                  type="text"
                  autoFocus
                  value={modalState.name}
                  onChange={e => setModalState({ ...modalState, name: e.target.value })}
                  placeholder={`e.g. ${modalState.type === 'category' ? 'Technology' : 'reactjs'}`}
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-primary-500 focus:outline-none dark:bg-slate-900"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setModalState({ ...modalState, isOpen: false })}
                  className="px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createCategoryMutation.isPending || createTagMutation.isPending || !modalState.name.trim()}
                  className="px-4 py-2 text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 rounded-lg transition-colors disabled:opacity-50 flex items-center justify-center min-w-[80px]"
                >
                  {(createCategoryMutation.isPending || createTagMutation.isPending) ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Save'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
