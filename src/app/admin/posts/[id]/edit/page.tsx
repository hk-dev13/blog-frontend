'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fetchApi, fetchPaginatedApi } from '@/lib/api';
import { Category, Tag, Post, PostRevision } from '@/types';
import { Loader2, Image as ImageIcon, Upload, ChevronDown, ChevronUp, CalendarClock, Globe, Save, Search, Trash2, Plus, X, Lock, Unlock, Clock, AlignLeft, Star, History, RotateCcw, AlertCircle, PanelRightClose, PanelRightOpen, Eye } from 'lucide-react';
import { useAppStore } from '@/store/useAppStore';
import { generateSlug, getContentStats, getLocalDateTimeMin, useAutosave, type AutosaveData, type RestoreState, type AutosaveEnvelope } from '@/lib/editorUtils';
import { useToastStore } from '@/store/useToastStore';
import { API_URL } from '@/lib/env';
import RichTextEditor from '@/components/admin/RichTextEditor';
import SEOAnalyzer from '@/components/admin/SEOAnalyzer';
import AdminSessionExpired from '@/components/admin/AdminSessionExpired';
import AdminLoadError from '@/components/admin/AdminLoadError';
import { RevisionDiffPanel } from '@/components/admin/RevisionDiffPanel';

const numberFormatter = new Intl.NumberFormat('en-US');
const revisionDateFormatter = new Intl.DateTimeFormat('id-ID', {
  dateStyle: 'medium',
  timeStyle: 'short',
  timeZone: 'UTC',
});

export default function EditPostPage() {
  const router = useRouter();
  const params = useParams();
  const postId = params.id as string;
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
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [showPublishMenu, setShowPublishMenu] = useState(false);
  const [showScheduler, setShowScheduler] = useState(false);
  const [scheduleDate, setScheduleDate] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [metaTitle, setMetaTitle] = useState('');
  const [metaDescription, setMetaDescription] = useState('');
  const [coverImageAlt, setCoverImageAlt] = useState('');
  const [seoOpen, setSeoOpen] = useState(false);
  const [isFeatured, setIsFeatured] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [showRevisions, setShowRevisions] = useState(false);
  const [canonicalUrl, setCanonicalUrl] = useState('');
  const [focusKeyword, setFocusKeyword] = useState('');
  const [editorMode, setEditorMode] = useState<'wysiwyg' | 'markdown'>('wysiwyg');
  const [showOptionsSidebar, setShowOptionsSidebar] = useState(true);
  const [modalState, setModalState] = useState<{ isOpen: boolean; type: 'category' | 'tag'; name: string }>({ isOpen: false, type: 'category', name: '' });
  const [revisionToRestore, setRevisionToRestore] = useState<PostRevision | null>(null);
  const [revisionToDiff, setRevisionToDiff] = useState<PostRevision | null>(null);
  const [autosaveRestoreState, setAutosaveRestoreState] = useState<{ state: RestoreState; envelope: AutosaveEnvelope } | null>(null);
  const contentRef = useRef<HTMLTextAreaElement>(null);
  const coverImageInputRef = useRef<HTMLInputElement>(null);
  const isSavingRef = useRef(false);
  // Hydration guard: only set server snapshot ONCE after initial data load
  const hasInitializedRef = useRef(false);

  // Live stats
  const contentStats = getContentStats(content);

  // Fetch post data
  const { data: postData, isLoading: isPostLoading, error: postError, refetch: refetchPost } = useQuery({
    queryKey: ['admin-post', postId],
    queryFn: () => fetchApi<Post>(`/posts/admin/${postId}`),
    enabled: !!postId,
  });

  const post = postData;

  // Autosave (local localStorage — keyed per post, not server-dirty)
  const autosaveData: AutosaveData = {
    title, slug, excerpt, content,
    metaTitle, metaDescription, canonicalUrl,
    coverImageUrl, coverImageAlt,
    isFeatured, selectedCategories, selectedTags,
    scheduleDate, focusKeyword,
  };
  const { clearSave, status: autosaveStatus, lastSavedAt } = useAutosave(
    postId,
    autosaveData,
    !!postId,
    (state, envelope) => setAutosaveRestoreState({ state, envelope }),
    post?.updated_at ?? null,
  );

  const handleAutosaveRestore = useCallback(() => {
    if (!autosaveRestoreState) return;
    const p = autosaveRestoreState.envelope.payload;
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
    setAutosaveRestoreState(null);
  }, [autosaveRestoreState]);

  const autosaveLabel = autosaveStatus === 'saving'
    ? 'Saving draft...'
    : autosaveStatus === 'saved'
      ? `Autosaved${lastSavedAt ? ` at ${new Date(lastSavedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}` : ''}`
      : autosaveStatus === 'dirty'
        ? 'Unsaved changes'
        : autosaveStatus === 'error'
          ? 'Autosave failed'
          : '';

  // Populate form when data arrives
  useEffect(() => {
    if (post) {
      setTitle(post.title || '');
      setSlug(post.slug || '');
      setSlugLocked(true);
      setExcerpt(post.excerpt || '');
      setContent(post.content || '');
      setCoverImageUrl(post.cover_image || '');
      setMetaTitle(post.meta_title || '');
      setMetaDescription(post.meta_description || '');
      setCoverImageAlt(post.cover_image_alt || '');
      setIsFeatured((post as any).is_featured || false);
      setCanonicalUrl((post as any).canonical_url || '');
      
      if ((post as any).categories) {
        setSelectedCategories((post as any).categories.map((c: any) => c.id));
      }
      if ((post as any).tags) {
        setSelectedTags((post as any).tags.map((t: any) => t.id));
      }

      if (post.status === 'scheduled' && post.published_at) {
        const d = new Date(post.published_at);
        const tzOffset = d.getTimezoneOffset() * 60000;
        const localISOTime = (new Date(d.getTime() - tzOffset)).toISOString().slice(0, 16);
        setScheduleDate(localISOTime);
      }
    }
  }, [post]);

  // Fetch revisions on demand
  const { data: revisionsData, isFetching: isRevisionsFetching, error: revisionsError } = useQuery({
    queryKey: ['post-revisions', postId],
    queryFn: () => fetchApi<PostRevision[]>(`/posts/${postId}/revisions`),
    enabled: showRevisions && !!postId,
    staleTime: 30_000,
  });

  const revisions = Array.isArray(revisionsData) ? revisionsData : [];


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
  const buildPayload = () => ({
    title,
    slug: slug || undefined,
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
  });

  const updateMutation = useMutation({
    mutationFn: (data: any) => fetchApi(`/posts/${postId}`, { method: 'PUT', body: JSON.stringify(data) }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-posts'] });
      queryClient.invalidateQueries({ queryKey: ['admin-post', postId] });
    }
  });

  const publishMutation = useMutation({
    mutationFn: (data: any) => fetchApi(`/posts/${postId}/publish`, { method: 'POST', body: JSON.stringify(data) }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-posts'] });
      queryClient.invalidateQueries({ queryKey: ['admin-post', postId] });
    }
  });

  // Update without changing status
  const handleUpdate = useCallback(async (): Promise<void> => {
    if (!title.trim() || !content.trim()) {
      pushToast({ variant: 'error', title: 'Title and content are required.' });
      return;
    }
    setIsSaving(true);
    try {
      await updateMutation.mutateAsync(buildPayload());
      clearSave();
      router.push('/admin/posts');
    } catch (err: unknown) {
      pushToast({ variant: 'error', title: 'Failed to update post', description: err instanceof Error ? err.message : undefined });
    } finally {
      setIsSaving(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [title, content, buildPayload, clearSave, router, pushToast, updateMutation]);

  const handlePreview = async () => {
    if (!title.trim() || !content.trim()) {
      pushToast({ variant: 'error', title: 'Title and content are required to preview.' });
      return;
    }
    setIsSaving(true);
    try {
      await updateMutation.mutateAsync(buildPayload());
      clearSave();
      window.open(`/preview/posts/${postId}`, '_blank', 'noopener,noreferrer');
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
      await updateMutation.mutateAsync(buildPayload());
      await publishMutation.mutateAsync({});
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
      await updateMutation.mutateAsync(buildPayload());
      await publishMutation.mutateAsync({ published_at: new Date(scheduleDate).toISOString() });
      clearSave();
      router.push('/admin/posts');
    } catch (err: unknown) {
      pushToast({ variant: 'error', title: 'Failed to schedule post', description: err instanceof Error ? err.message : undefined });
    } finally {
      setIsSaving(false);
      setShowScheduler(false);
    }
  };

  // Ctrl+S / ⌘S — update with concurrency guard
  useEffect(() => {
    const handleUpdateRef = { current: handleUpdate };
    handleUpdateRef.current = handleUpdate;

    const handler = (e: KeyboardEvent) => {
      if (!(e.ctrlKey || e.metaKey) || e.key !== 's') return;
      e.preventDefault();
      if (isSavingRef.current) return;
      if (modalState.isOpen) return;
      if (showScheduler || showPublishMenu) return;
      if (!title.trim()) {
        pushToast({ variant: 'error', title: 'Add a title before saving.' });
        return;
      }
      isSavingRef.current = true;
      void handleUpdateRef.current().finally(() => { isSavingRef.current = false; });
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [modalState.isOpen, showScheduler, showPublishMenu, title, pushToast, handleUpdate]);

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
  const pageError = postError ?? categoriesError ?? tagsError ?? revisionsError;

  if (isPostLoading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-primary-500" />
      </div>
    );
  }

  if (pageError instanceof Error && /401|403|Authentication required|Unauthorized|Forbidden/i.test(pageError.message)) {
    return <AdminSessionExpired />;
  }

  if (pageError instanceof Error) {
    return (
      <AdminLoadError
        title="We couldn't load this post right now."
        description="Please try again in a moment."
        onRetry={() => {
          void refetchPost();
          void refetchCategories();
          void refetchTags();
        }}
      />
    );
  }

  if (!post) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-bold text-slate-800 dark:text-white">Post not found</h2>
        <button onClick={() => router.push('/admin/posts')} className="mt-4 text-primary-600 hover:underline">
          Return to posts
        </button>
      </div>
    );
  }

  return (
    <div className="w-full space-y-6">
      <header className="admin-page-hero">
        <div className="admin-page-hero-bg" />
        <div className="admin-page-hero-content">
          <div className="max-w-2xl">
            <div className="admin-page-hero-icon">
              <AlignLeft className="h-5 w-5" />
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="admin-page-title">Edit Post</h1>
            {post.source === 'eai' && (
              <span className="inline-flex items-center rounded-full bg-sky-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-sky-700 dark:bg-sky-900/30 dark:text-sky-300">
                Source: EAI
              </span>
            )}
          </div>
          <p className="admin-page-description">
            Update, preview, publish, or schedule this post.
          </p>
          {post.source_ref && (
            <p className="mt-2 text-xs text-slate-400">
              Source Ref: <span className="font-mono">{post.source_ref}</span>
            </p>
          )}
          {autosaveStatus !== 'idle' && (
            <p className={`text-xs mt-3 flex items-center gap-1 ${
              autosaveStatus === 'saved'
                ? 'text-emerald-500'
                : autosaveStatus === 'error'
                  ? 'text-red-500'
                  : 'text-amber-500'
            }`}>
              {autosaveStatus === 'saving' && <Loader2 className="w-3 h-3 animate-spin" />}
              {autosaveStatus === 'saved' && <Save className="w-3 h-3" />}
              {autosaveStatus === 'dirty' && <Clock className="w-3 h-3" />}
              {autosaveStatus === 'error' && <AlertCircle className="w-3 h-3" />}
              {autosaveLabel}
            </p>
          )}
        </div>
        <div className="admin-hero-actions">
          <button
            type="button"
            onClick={() => setShowOptionsSidebar(!showOptionsSidebar)}
            className="admin-hero-button border-primary-500/40 text-primary-400 hover:bg-primary-500/20"
            title={showOptionsSidebar ? 'Collapse settings panel for Focus Mode (Full Width)' : 'Show settings panel'}
          >
            {showOptionsSidebar ? <PanelRightClose className="w-4 h-4" /> : <PanelRightOpen className="w-4 h-4 text-primary-400" />}
            <span>{showOptionsSidebar ? 'Focus Mode' : 'Settings'}</span>
          </button>
          <button
            onClick={handlePreview}
            disabled={isSaving}
            className="admin-hero-button"
          >
            {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Globe className="w-4 h-4" />}
            Preview
          </button>
          
          {/* Main Action Button varies based on status */}
          {post.status === 'published' ? (
            <button
              onClick={handleUpdate}
              disabled={isSaving}
              className="admin-hero-button-primary"
            >
              {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              Update Changes
            </button>
          ) : (
            <>
              {/* Save Draft (Only if it's draft or scheduled) */}
              <button
                onClick={handleUpdate}
                disabled={isSaving}
                className="admin-hero-button"
              >
                {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                {post.status === 'scheduled' ? 'Update Schedule' : 'Draft'}
              </button>

              {/* Publish / Schedule Split Button */}
              <div className="admin-split-action">
                <div className="admin-split-action-group">
                  <button
                    onClick={handlePublishNow}
                    disabled={isSaving}
                    className="admin-split-action-main"
                  >
                    {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Globe className="w-4 h-4" />}
                    Publish
                  </button>
                  <button
                    onClick={() => { setShowPublishMenu(!showPublishMenu); setShowScheduler(false); }}
                    disabled={isSaving}
                    className="admin-split-action-trigger"
                  >
                    <ChevronDown className="w-4 h-4" />
                  </button>
                </div>

                {/* Dropdown Menu */}
                {showPublishMenu && (
                  <div className="admin-floating-panel w-64 overflow-hidden">
                    <button
                      onClick={() => { setShowPublishMenu(false); setShowScheduler(true); }}
                      className="admin-menu-item"
                    >
                      <CalendarClock className="w-4 h-4 text-amber-500" />
                      <div>
                        <p className="font-medium">Schedule</p>
                        <p className="text-xs text-slate-500">Set a future publish date</p>
                      </div>
                    </button>
                  </div>
                )}

                {/* Schedule Modal */}
                {showScheduler && (
                  <div className="admin-floating-panel w-80 p-4 space-y-4">
                    <div className="flex items-center gap-2 text-sm font-medium text-slate-700 dark:text-slate-300">
                      <CalendarClock className="w-4 h-4 text-amber-500" />
                      Schedule Publication
                    </div>
                    <input
                      type="datetime-local"
                      value={scheduleDate}
                      onChange={e => setScheduleDate(e.target.value)}
                      min={getLocalDateTimeMin()}
                      className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-amber-500 focus:outline-none"
                    />
                    <div className="flex gap-2">
                      <button
                        onClick={() => setShowScheduler(false)}
                        className="flex-1 px-3 py-2 text-sm font-medium text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-700 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={handleSchedule}
                        disabled={isSaving || !scheduleDate}
                        className="flex-1 px-3 py-2 text-sm font-medium text-white bg-amber-500 hover:bg-amber-600 rounded-lg transition-colors disabled:opacity-50 flex items-center justify-center gap-1"
                      >
                        {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <CalendarClock className="w-4 h-4" />}
                        Schedule
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>
      </header>

      {/* Autosave restore prompt (replaces browser confirm()) */}
      {autosaveRestoreState && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 dark:border-amber-900/40 dark:bg-amber-900/10">
          <p className="text-sm font-semibold text-amber-800 dark:text-amber-300">
            {autosaveRestoreState.state === 'conflict'
              ? '⚠️ A local draft exists, but the server has a newer version.'
              : '📝 An autosaved draft was found.'}
          </p>
          <p className="mt-1 text-xs text-amber-700 dark:text-amber-400">
            Saved {Math.round((Date.now() - autosaveRestoreState.envelope.savedAt) / 60000)} minutes ago
          </p>
          <div className="mt-3 flex gap-2">
            <button
              type="button"
              onClick={handleAutosaveRestore}
              className="rounded-lg bg-amber-500 px-3 py-1.5 text-xs font-semibold text-white hover:bg-amber-600 transition-colors"
            >
              Restore draft
            </button>
            <button
              type="button"
              onClick={() => { clearSave(); setAutosaveRestoreState(null); }}
              className="rounded-lg border border-amber-200 px-3 py-1.5 text-xs font-medium text-amber-700 hover:bg-amber-100 dark:border-amber-800 dark:text-amber-400 dark:hover:bg-amber-900/20 transition-colors"
            >
              Discard
            </button>
          </div>
        </div>
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
                    className="w-full px-3 py-1.5 text-sm bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-primary-500 focus:outline-none font-mono"
                    placeholder="url-slug"
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
                  title={slugLocked ? 'Click to re-generate from title' : 'Lock to custom slug'}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-primary-500 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                >
                  {slugLocked ? <Lock className="w-4 h-4 text-amber-500" /> : <Unlock className="w-4 h-4" />}
                </button>
              </div>
              {!slugLocked && (
                <p className="text-xs text-slate-400 mt-1">⚠️ Changing slug will break existing links to this post</p>
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
                currentPostId={postId}
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

          {/* Revision History */}
          <div className="admin-surface overflow-hidden">
            <button
              type="button"
              onClick={() => setShowRevisions(!showRevisions)}
              className="flex items-center justify-between w-full p-4 text-left"
            >
              <div className="flex items-center gap-2">
                <History className="w-4 h-4 text-slate-400" />
                <h3 className="text-sm font-medium text-slate-700 dark:text-slate-300">Revision History</h3>
              </div>
              {isRevisionsFetching
                ? <Loader2 className="w-4 h-4 animate-spin text-slate-400" />
                : showRevisions ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />
              }
            </button>

            {showRevisions && (
              <div className="border-t border-slate-100 dark:border-slate-700">
                {revisions.length === 0 && !isRevisionsFetching ? (
                  <p className="text-xs text-slate-400 p-4 text-center">No revisions yet</p>
                ) : (
                  <div className="max-h-72 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-700">
                    {revisions.map((rev) => (
                      <div key={rev.id} className="p-3 flex items-start gap-3 hover:bg-slate-50 dark:hover:bg-slate-900/50 transition-colors">
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
                            {rev.source_ref && <span className="font-mono">{rev.source_ref}</span>}
                          </div>
                        </div>
                        <div className="flex items-center gap-1 shrink-0">
                          <button
                            type="button"
                            onClick={() => setRevisionToDiff(rev)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-primary-600 hover:bg-primary-50 dark:hover:bg-primary-900/20 transition-colors"
                            title="Preview diff with current draft"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => setRevisionToRestore(rev)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-900/20 transition-colors"
                            title="Restore this revision"
                          >
                            <RotateCcw className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
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
      {/* Revision Restore Modal (replaces browser confirm()) */}
      {revisionToRestore && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="admin-modal-panel w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200 p-6 space-y-4">
            <h3 className="font-semibold text-slate-900 dark:text-white text-lg">
              Restore Revision v{revisionToRestore.revision_number}?
            </h3>
            <p className="text-sm text-slate-600 dark:text-slate-400">
              This will update your current editor content with version from{' '}
              <span className="font-medium text-slate-800 dark:text-slate-200">
                {revisionDateFormatter.format(new Date(revisionToRestore.created_at))}
              </span>.
              The post will become unsaved until you click Update.
            </p>
            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setRevisionToRestore(null)}
                className="px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  setTitle(revisionToRestore.title || title);
                  setContent(revisionToRestore.content || '');
                  if (revisionToRestore.excerpt) setExcerpt(revisionToRestore.excerpt);
                  setRevisionToRestore(null);
                }}
                className="px-4 py-2 text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 rounded-lg transition-colors"
              >
                Restore revision
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Revision Diff Panel Drawer (P3.3) */}
      <RevisionDiffPanel
        revision={revisionToDiff}
        currentContent={content}
        currentTitle={title}
        onClose={() => setRevisionToDiff(null)}
        onRestore={(rev) => setRevisionToRestore(rev)}
      />
    </div>
  );
}
