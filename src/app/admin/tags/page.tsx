'use client';

import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fetchApi, fetchPaginatedApi } from '@/lib/api';
import { Tag } from '@/types';
import { 
  Search, 
  Plus, 
  Edit2, 
  Trash2, 
  Hash, 
  Loader2, 
  AlertCircle,
  X,
  Check,
  History
} from 'lucide-react';
import { useAppStore } from '@/store/useAppStore';
import { useRouter } from 'next/navigation';
import { generateSlug } from '@/lib/editorUtils';
import AdminSessionExpired from '@/components/admin/AdminSessionExpired';
import AdminLoadError from '@/components/admin/AdminLoadError';
import { useToastStore } from '@/store/useToastStore';

export default function TagManagerPage() {
  const { user } = useAppStore();
  const router = useRouter();
  const queryClient = useQueryClient();
  const pushToast = useToastStore(state => state.push);
  const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isMergeModalOpen, setIsMergeModalOpen] = useState(false);
  const [editingTag, setEditingTag] = useState<Tag | null>(null);
  const [formData, setFormData] = useState({ name: '', slug: '' });
  const [slugLocked, setSlugLocked] = useState(false);

  // Merge state
  const [sourceTag, setSourceTag] = useState<Tag | null>(null);
  const [targetTagId, setTargetTagId] = useState('');

  // Fetch tags
  const { data: tagsData, isLoading, error, refetch } = useQuery({
    queryKey: ['tags'],
    queryFn: () => fetchPaginatedApi<Tag>('/tags?limit=200'),
  });

  const tags = useMemo(() => tagsData?.data || [], [tagsData?.data]);

  // Filter tags
  const filteredTags = useMemo(() => {
    return tags.filter(tag => 
      tag.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tag.slug.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [tags, searchQuery]);

  // Mutations
  const createMutation = useMutation({
    mutationFn: (data: { name: string; slug: string }) => 
      fetchApi('/tags', { method: 'POST', body: JSON.stringify(data) }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tags'] });
      setIsModalOpen(false);
      resetForm();
      pushToast({ variant: 'success', title: 'Tag created' });
    }
  });

  const updateMutation = useMutation({
    mutationFn: (data: { id: string; name: string; slug: string }) => 
      fetchApi(`/tags/${data.id}`, { method: 'PUT', body: JSON.stringify({ name: data.name, slug: data.slug }) }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tags'] });
      setIsModalOpen(false);
      resetForm();
      pushToast({ variant: 'success', title: 'Tag updated' });
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => fetchApi(`/tags/${id}`, { method: 'DELETE' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tags'] });
      pushToast({ variant: 'success', title: 'Tag deleted' });
    }
  });

  const mergeMutation = useMutation({
    mutationFn: (data: { sourceId: string; targetId: string }) => 
      fetchApi('/tags/merge', { method: 'POST', body: JSON.stringify(data) }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tags'] });
      setIsMergeModalOpen(false);
      setSourceTag(null);
      setTargetTagId('');
      pushToast({ variant: 'success', title: 'Tags merged' });
    },
    onError: (err: any) => {
      pushToast({ variant: 'error', title: 'Merge failed', description: err?.message || 'Failed to merge tags' });
    }
  });

  const resetForm = () => {
    setFormData({ name: '', slug: '' });
    setEditingTag(null);
    setSlugLocked(false);
  };

  const handleOpenCreate = () => {
    resetForm();
    setIsModalOpen(true);
  };

  const handleOpenEdit = (tag: Tag) => {
    setEditingTag(tag);
    setFormData({ name: tag.name, slug: tag.slug });
    setSlugLocked(true);
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingTag) {
      updateMutation.mutate({ id: editingTag.id, ...formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const handleDelete = (tag: Tag) => {
    if (tag.post_count && tag.post_count > 0) {
      alert(`Cannot delete tag "${tag.name}" because it is used in ${tag.post_count} articles. Use "Merge Tags" instead if you want to clean it up.`);
      return;
    }
    if (confirm(`Are you sure you want to delete the tag "${tag.name}"?`)) {
      deleteMutation.mutate(tag.id);
    }
  };

  const handleOpenMerge = (tag: Tag) => {
    setSourceTag(tag);
    setTargetTagId('');
    setIsMergeModalOpen(true);
  };

  if (error instanceof Error && /401|403|Authentication required|Unauthorized|Forbidden/i.test(error.message)) {
    return <AdminSessionExpired />;
  }

  if (error instanceof Error) {
    return <AdminLoadError onRetry={() => void refetch()} />;
  }

  // Access control
  if (user && user.role !== 'admin') {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
        <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mb-4">
          <AlertCircle className="w-8 h-8 text-red-600" />
        </div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Access Denied</h1>
        <p className="text-slate-500 mt-2">Only administrators can access the Tag Manager.</p>
        <button 
          onClick={() => router.push('/admin')}
          className="mt-6 px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
        >
          Back to Dashboard
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <header className="relative overflow-hidden rounded-2xl bg-slate-950 px-6 py-10 shadow-2xl shadow-slate-950/10 md:px-10 md:py-12">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_40%_0%,rgba(13,135,207,0.22),transparent_40%),radial-gradient(circle_at_80%_20%,rgba(99,102,241,0.14),transparent_35%),linear-gradient(180deg,rgba(255,255,255,0.06),transparent)]" />
        <div className="relative z-10 flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
          <div className="max-w-2xl">
            <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-2xl border border-white/20 bg-white/[0.06] text-white shadow-lg shadow-white/5">
              <Hash className="h-5 w-5" />
            </div>
            <h1 className="text-3xl font-serif font-bold text-white md:text-4xl">Tag Manager</h1>
            <p className="mt-2 text-sm leading-6 text-slate-300 md:text-base">
              Organize, edit, merge, or remove tags safely.
            </p>
          </div>
          <button
            onClick={handleOpenCreate}
            className="inline-flex items-center justify-center gap-2 rounded-full border border-white/15 bg-white/[0.06] px-4 py-2 text-sm font-semibold text-white transition-colors hover:border-primary-400 hover:bg-primary-500/10"
          >
            <Plus className="w-4 h-4" />
            Create Tag
          </button>
        </div>
      </header>

      <div className="bg-white/80 dark:bg-slate-900/50 rounded-2xl border border-slate-200/70 dark:border-slate-800/70 overflow-hidden shadow-sm">
        {/* Toolbar */}
        <div className="p-4 border-b border-slate-200/70 dark:border-slate-800/70 bg-slate-50/60 dark:bg-slate-950/40 flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input 
              type="text" 
              placeholder="Search tags by name or slug..." 
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-white/70 dark:bg-slate-950/40 border border-slate-200/70 dark:border-slate-800/70 rounded-xl focus:ring-2 focus:ring-primary-500 focus:outline-none text-sm shadow-sm"
            />
          </div>
          <div className="flex items-center gap-2 text-xs text-slate-500 font-medium px-2">
            <Hash className="w-3.5 h-3.5" />
            {filteredTags.length} Total Tags
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/60 dark:bg-slate-950/40 border-b border-slate-200/70 dark:border-slate-800/70">
                <th className="px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Tag Name</th>
                <th className="px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Slug</th>
                <th className="px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider text-center">Usage</th>
                <th className="px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
              {isLoading ? (
                <tr>
                  <td colSpan={4} className="px-6 py-12 text-center">
                    <Loader2 className="w-8 h-8 animate-spin text-primary-500 mx-auto mb-2" />
                    <p className="text-sm text-slate-500">Loading tags...</p>
                  </td>
                </tr>
              ) : filteredTags.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-12 text-center text-slate-500">
                    No tags found matching your search.
                  </td>
                </tr>
              ) : (
                filteredTags.map((tag) => (
                  <tr key={tag.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors group">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-primary-50 dark:bg-primary-900/30 flex items-center justify-center text-primary-600 dark:text-primary-400">
                          <Hash className="w-4 h-4" />
                        </div>
                        <span className="font-medium text-slate-900 dark:text-white capitalize">{tag.name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <code className="text-xs bg-slate-100 dark:bg-slate-900 px-2 py-1 rounded text-slate-600 dark:text-slate-400 font-mono">
                        {tag.slug}
                      </code>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        tag.post_count === 0 
                          ? 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400' 
                          : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
                      }`}>
                        {tag.post_count || 0} articles
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button 
                          onClick={() => handleOpenMerge(tag)}
                          title="Merge into another tag"
                          className="p-2 text-slate-400 hover:text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-900/20 rounded-lg transition-colors"
                        >
                          <History className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={() => handleOpenEdit(tag)}
                          className="p-2 text-slate-400 hover:text-primary-600 hover:bg-primary-50 dark:hover:bg-primary-900/20 rounded-lg transition-colors"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={() => handleDelete(tag)}
                          className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create/Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white/90 dark:bg-slate-950/70 rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200 border border-slate-200/70 dark:border-slate-800/70 backdrop-blur">
            <div className="flex items-center justify-between p-6 border-b border-slate-200 dark:border-slate-700">
              <h3 className="text-xl font-bold text-slate-900 dark:text-white">
                {editingTag ? 'Edit Tag' : 'Create New Tag'}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-500">
                <X className="w-6 h-6" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Name</label>
                <input 
                  type="text" 
                  autoFocus
                  required
                  value={formData.name}
                  onChange={e => {
                    setFormData({ ...formData, name: e.target.value });
                    if (!slugLocked) setFormData(prev => ({ ...prev, slug: generateSlug(e.target.value) }));
                  }}
                  className="w-full px-4 py-2 border border-slate-300 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-primary-500 focus:outline-none dark:bg-slate-900"
                  placeholder="e.g. Artificial Intelligence"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Slug</label>
                <div className="flex items-center gap-2">
                  <input 
                    type="text" 
                    required
                    value={formData.slug}
                    onChange={e => {
                      setFormData({ ...formData, slug: generateSlug(e.target.value) });
                      setSlugLocked(true);
                    }}
                    className="w-full px-4 py-2 border border-slate-300 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-primary-500 focus:outline-none dark:bg-slate-900 font-mono text-sm"
                    placeholder="ai-tag"
                  />
                  <button 
                    type="button"
                    onClick={() => {
                      setSlugLocked(false);
                      setFormData(prev => ({ ...prev, slug: generateSlug(prev.name) }));
                    }}
                    className="p-2 text-slate-400 hover:text-primary-500"
                    title="Auto-generate slug"
                  >
                    <History className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <button 
                  type="button" 
                  onClick={() => setIsModalOpen(false)}
                  className="px-6 py-2 text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  disabled={createMutation.isPending || updateMutation.isPending}
                  className="flex items-center gap-2 px-6 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg transition-colors font-medium disabled:opacity-50"
                >
                  {(createMutation.isPending || updateMutation.isPending) && <Loader2 className="w-4 h-4 animate-spin" />}
                  {editingTag ? 'Save Changes' : 'Create Tag'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Merge Modal */}
      {isMergeModalOpen && sourceTag && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white/90 dark:bg-slate-950/70 rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200 border border-slate-200/70 dark:border-slate-800/70 backdrop-blur">
            <div className="flex items-center justify-between p-6 border-b border-slate-200 dark:border-slate-700">
              <h3 className="text-xl font-bold text-slate-900 dark:text-white">Merge Tag</h3>
              <button onClick={() => setIsMergeModalOpen(false)} className="text-slate-400 hover:text-slate-500">
                <X className="w-6 h-6" />
              </button>
            </div>
            <div className="p-6 space-y-6">
              <div className="p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg">
                <p className="text-sm text-amber-800 dark:text-amber-400">
                  <strong>Warning:</strong> You are about to merge <span className="font-bold underline">{sourceTag.name}</span> into another tag. 
                  All articles tagged with "{sourceTag.name}" will be moved, and "{sourceTag.name}" will be <strong>deleted</strong>.
                </p>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1 text-center">Merge From</label>
                  <div className="w-full px-4 py-3 bg-slate-100 dark:bg-slate-900 rounded-lg text-center font-bold text-slate-900 dark:text-white border border-dashed border-slate-300 dark:border-slate-700">
                    {sourceTag.name}
                  </div>
                </div>

                <div className="flex justify-center">
                  <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-900 flex items-center justify-center">
                    <History className="w-4 h-4 text-slate-400 rotate-180" />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Merge Into (Target Tag)</label>
                  <select 
                    value={targetTagId}
                    onChange={e => setTargetTagId(e.target.value)}
                    className="w-full px-4 py-2 border border-slate-300 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-primary-500 focus:outline-none dark:bg-slate-900"
                  >
                    <option value="">Select target tag...</option>
                    {tags
                      .filter(t => t.id !== sourceTag.id)
                      .map(t => (
                        <option key={t.id} value={t.id}>{t.name} ({t.post_count || 0} posts)</option>
                      ))
                    }
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <button 
                  type="button" 
                  onClick={() => setIsMergeModalOpen(false)}
                  className="px-6 py-2 text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button 
                  onClick={() => mergeMutation.mutate({ sourceId: sourceTag.id, targetId: targetTagId })}
                  disabled={mergeMutation.isPending || !targetTagId}
                  className="flex items-center gap-2 px-6 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-lg transition-colors font-medium disabled:opacity-50"
                >
                  {mergeMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                  Confirm Merge
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
