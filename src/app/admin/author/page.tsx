'use client';

import { useState } from 'react';
import Image from 'next/image';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { fetchApi } from '@/lib/api';
import { generateSlug } from '@/lib/editorUtils';
import { useAppStore } from '@/store/useAppStore';
import { User } from '@/types';
import { BookOpen, Code2, Globe, Image as ImageIcon, Link2, Loader2, Lock, MessageSquare, RotateCcw, Save, Upload, Unlock, UserRound } from 'lucide-react';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://api.envoyou.com/api';

type AuthorForm = {
  name: string;
  slug: string;
  short_bio: string;
  full_bio: string;
  avatar_url: string;
  social_links: Record<string, string>;
};

const socialFields = [
  { key: 'website', label: 'Website', icon: Globe, placeholder: 'https://envoyou.com' },
  { key: 'github', label: 'GitHub', icon: Code2, placeholder: 'https://github.com/username' },
  { key: 'linkedin', label: 'LinkedIn', icon: Link2, placeholder: 'https://linkedin.com/in/username' },
  { key: 'x', label: 'X / Twitter', icon: MessageSquare, placeholder: 'https://x.com/username' },
  { key: 'instagram', label: 'Instagram', icon: ImageIcon, placeholder: 'https://instagram.com/username' },
] as const;

export default function AdminAuthorPage() {
  const { data: author, isLoading, error } = useQuery({
    queryKey: ['current-user'],
    queryFn: () => fetchApi<User>('/users/me'),
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-primary-500" />
      </div>
    );
  }

  if (error || !author) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-sm text-red-700 dark:border-red-900/40 dark:bg-red-900/20 dark:text-red-300">
        Failed to load author profile.
      </div>
    );
  }

  return <AuthorProfileForm key={author.id} author={author} />;
}

function AuthorProfileForm({ author }: { author: User }) {
  const token = useAppStore(state => state.token);
  const updateUser = useAppStore(state => state.updateUser);
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState<AuthorForm>({
    name: author.name || '',
    slug: author.slug || '',
    short_bio: author.short_bio || author.bio || '',
    full_bio: author.full_bio || '',
    avatar_url: author.avatar_url || '',
    social_links: author.social_links || {},
  });
  const [slugLocked, setSlugLocked] = useState(Boolean(author.slug));
  const [isUploading, setIsUploading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  const updateMutation = useMutation({
    mutationFn: (payload: AuthorForm) => fetchApi<User>('/users/me', {
      method: 'PUT',
      body: JSON.stringify({
        name: payload.name,
        slug: payload.slug,
        bio: payload.short_bio.trim() ? payload.short_bio : null,
        short_bio: payload.short_bio.trim() ? payload.short_bio : null,
        full_bio: payload.full_bio.trim() ? payload.full_bio : null,
        social_links: cleanSocialLinks(payload.social_links),
        avatar_url: payload.avatar_url.trim() ? payload.avatar_url : null,
      }),
    }),
    onSuccess: (updated) => {
      queryClient.setQueryData(['current-user'], updated);
      queryClient.invalidateQueries({ queryKey: ['current-user'] });
      updateUser({
        name: updated.name,
        slug: updated.slug,
        avatar_url: updated.avatar_url,
      });
      setSuccessMessage('Author profile saved');
      window.setTimeout(() => setSuccessMessage(''), 2500);
    },
  });

  const setField = (field: keyof AuthorForm, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const setSocialLink = (key: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      social_links: {
        ...prev.social_links,
        [key]: value,
      },
    }));
  };

  const handleNameChange = (value: string) => {
    setFormData(prev => ({
      ...prev,
      name: value,
      slug: slugLocked ? prev.slug : generateSlug(value),
    }));
  };

  const handleSlugToggle = () => {
    if (slugLocked) {
      setFormData(prev => ({ ...prev, slug: generateSlug(prev.name) }));
      setSlugLocked(false);
    } else {
      setSlugLocked(true);
    }
  };

  const uploadFile = async (file: File) => {
    setIsUploading(true);
    const uploadData = new FormData();
    uploadData.append('file', file);

    try {
      const res = await fetch(`${API_URL}/upload`, {
        method: 'POST',
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
        body: uploadData,
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || data.message || 'Upload failed');
      }
      setField('avatar_url', data.data.url);
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Failed to upload avatar');
    } finally {
      setIsUploading(false);
    }
  };

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    await uploadFile(file);
    event.target.value = '';
  };

  const handleDrop = async (event: React.DragEvent<HTMLLabelElement>) => {
    event.preventDefault();
    setIsDragging(false);
    const file = event.dataTransfer.files?.[0];
    if (!file || !file.type.startsWith('image/')) return;
    await uploadFile(file);
  };

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    updateMutation.mutate({
      ...formData,
      slug: generateSlug(formData.slug),
      avatar_url: formData.avatar_url.trim(),
      social_links: cleanSocialLinks(formData.social_links),
    });
  };

  const previewName = formData.name.trim() || author?.name || 'Author';
  const avatarUrl = formData.avatar_url.trim();
  const previewShortBio = formData.short_bio.trim() || 'A short author summary will appear here.';
  const previewFullBio = formData.full_bio.trim();
  const activeSocialLinks = socialFields.filter(field => formData.social_links[field.key]?.trim());

  return (
    <form onSubmit={handleSubmit} className="max-w-5xl mx-auto space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-serif font-bold text-slate-900 dark:text-white">Author Profile</h1>
          <p className="text-sm text-slate-500 mt-1">Manage your public author identity.</p>
        </div>
        <button
          type="submit"
          disabled={updateMutation.isPending}
          className="flex items-center justify-center gap-2 px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg transition-colors font-medium disabled:opacity-50"
        >
          {updateMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          Save Profile
        </button>
      </div>

      {successMessage && (
        <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700 dark:border-emerald-900/40 dark:bg-emerald-900/20 dark:text-emerald-300">
          {successMessage}
        </div>
      )}

      {updateMutation.error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900/40 dark:bg-red-900/20 dark:text-red-300">
          {(updateMutation.error as Error).message}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6 space-y-5">
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Display Name</label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={event => handleNameChange(event.target.value)}
              className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-primary-500 focus:outline-none"
              placeholder="Your public author name"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Author Slug</label>
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-400 whitespace-nowrap">author/</span>
              <input
                type="text"
                required
                value={formData.slug}
                onChange={event => {
                  setField('slug', generateSlug(event.target.value));
                  setSlugLocked(true);
                }}
                className="w-full px-3 py-1.5 text-sm bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-primary-500 focus:outline-none font-mono"
                placeholder="author-slug"
              />
              <button
                type="button"
                onClick={handleSlugToggle}
                title={slugLocked ? 'Click to auto-generate again' : 'Lock slug to custom value'}
                className="p-1.5 rounded-lg text-slate-400 hover:text-primary-500 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
              >
                {slugLocked ? <Lock className="w-4 h-4 text-amber-500" /> : <Unlock className="w-4 h-4" />}
              </button>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              {slugLocked ? 'Slug is locked. Editing your name will not change it.' : 'Slug follows your display name.'}
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Short Bio</label>
            <textarea
              rows={3}
              maxLength={280}
              value={formData.short_bio}
              onChange={event => setField('short_bio', event.target.value)}
              className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-primary-500 focus:outline-none"
              placeholder="A compact one or two line summary for author cards and page headers..."
            />
            <p className="text-xs text-slate-400 mt-1 text-right">{formData.short_bio.length}/280</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Full Bio</label>
            <textarea
              rows={8}
              maxLength={5000}
              value={formData.full_bio}
              onChange={event => setField('full_bio', event.target.value)}
              className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-primary-500 focus:outline-none"
              placeholder="A richer author story for the public author page..."
            />
            <p className="text-xs text-slate-400 mt-1 text-right">{formData.full_bio.length}/5000</p>
          </div>

          <div>
            <h2 className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-3">Social Links</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {socialFields.map((field) => {
                const Icon = field.icon;
                return (
                  <div key={field.key}>
                    <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">{field.label}</label>
                    <div className="relative">
                      <Icon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <input
                        type="url"
                        value={formData.social_links[field.key] || ''}
                        onChange={event => setSocialLink(field.key, event.target.value)}
                        className="w-full pl-10 pr-3 py-2 text-sm bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-primary-500 focus:outline-none"
                        placeholder={field.placeholder}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6 space-y-4">
            <h2 className="text-sm font-medium text-slate-700 dark:text-slate-300">Avatar</h2>

            <div className="flex justify-center">
              {avatarUrl ? (
                <Image
                  src={avatarUrl}
                  alt={previewName}
                  width={128}
                  height={128}
                  unoptimized
                  className="w-32 h-32 rounded-full object-cover ring-4 ring-white dark:ring-slate-700 shadow-lg"
                />
              ) : (
                <div className="w-32 h-32 rounded-full bg-primary-100 dark:bg-primary-900/40 flex items-center justify-center text-primary-700 dark:text-primary-300 shadow-lg">
                  {previewName ? (
                    <span className="text-4xl font-bold">{previewName.charAt(0).toUpperCase()}</span>
                  ) : (
                    <UserRound className="w-12 h-12" />
                  )}
                </div>
              )}
            </div>

            <label
              className={`flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer transition-colors ${
                isDragging
                  ? 'border-primary-400 bg-primary-50 dark:bg-primary-900/20'
                  : 'border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 hover:bg-slate-100 dark:hover:border-slate-500 dark:hover:bg-slate-800'
              }`}
              onDragOver={event => {
                event.preventDefault();
                setIsDragging(true);
              }}
              onDragEnter={event => {
                event.preventDefault();
                setIsDragging(true);
              }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={handleDrop}
            >
              {isUploading ? (
                <Loader2 className="w-7 h-7 text-primary-500 animate-spin mb-2" />
              ) : (
                <Upload className="w-6 h-6 text-primary-500 mb-2" />
              )}
              <span className="text-sm text-slate-600 dark:text-slate-400 font-medium">
                {isUploading ? 'Uploading...' : isDragging ? 'Drop avatar here' : 'Click or drag image here'}
              </span>
              <span className="text-xs text-slate-400 mt-1">PNG, JPG, WEBP up to 5MB</span>
              <input type="file" className="hidden" accept="image/*" onChange={handleImageUpload} disabled={isUploading} />
            </label>

            <div className="relative">
              <input
                type="url"
                value={formData.avatar_url}
                onChange={event => setField('avatar_url', event.target.value)}
                className="w-full pl-3 pr-9 py-2 text-sm bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-primary-500 focus:outline-none"
                placeholder="Or paste avatar URL..."
              />
              <ImageIcon className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            </div>

            <button
              type="button"
              onClick={() => setField('avatar_url', '')}
              className="flex items-center justify-center gap-2 w-full px-4 py-2 text-sm font-medium text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 rounded-lg transition-colors"
            >
              <RotateCcw className="w-4 h-4" />
              Reset avatar to default
            </button>
          </div>

          <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
            <div className="h-20 bg-slate-900 dark:bg-slate-950 relative">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(20,184,166,0.45),transparent_35%),radial-gradient(circle_at_80%_10%,rgba(59,130,246,0.35),transparent_32%)]" />
            </div>
            <div className="px-6 pb-6 -mt-10 relative">
              <div className="mb-4">
                {avatarUrl ? (
                  <Image
                    src={avatarUrl}
                    alt={previewName}
                    width={80}
                    height={80}
                    unoptimized
                    className="w-20 h-20 rounded-full object-cover ring-4 ring-white dark:ring-slate-800 shadow-lg"
                  />
                ) : (
                  <div className="w-20 h-20 rounded-full bg-primary-100 dark:bg-primary-900 flex items-center justify-center text-primary-700 dark:text-primary-300 ring-4 ring-white dark:ring-slate-800 shadow-lg">
                    <span className="text-2xl font-bold">{previewName.charAt(0).toUpperCase()}</span>
                  </div>
                )}
              </div>
              <div className="space-y-3">
                <div>
                  <h2 className="text-xl font-serif font-bold text-slate-900 dark:text-white">{previewName}</h2>
                  <p className="text-xs font-mono text-primary-600 dark:text-primary-400">/author/{formData.slug || 'author-slug'}</p>
                </div>
                <p className="text-sm text-slate-600 dark:text-slate-300">{previewShortBio}</p>
                {previewFullBio && (
                  <p className="text-xs leading-5 text-slate-500 dark:text-slate-400 line-clamp-5">{previewFullBio}</p>
                )}
                <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 dark:bg-slate-700 px-2.5 py-1">
                    <BookOpen className="w-3.5 h-3.5" />
                    Author page
                  </span>
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 dark:bg-slate-700 px-2.5 py-1">
                    {activeSocialLinks.length} links
                  </span>
                </div>
                {activeSocialLinks.length > 0 && (
                  <div className="flex flex-wrap gap-2 pt-1">
                    {activeSocialLinks.map((field) => {
                      const Icon = field.icon;
                      return (
                        <span key={field.key} className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 dark:border-slate-700 px-2.5 py-1 text-xs font-medium text-slate-600 dark:text-slate-300">
                          <Icon className="w-3.5 h-3.5" />
                          {field.label}
                        </span>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </form>
  );
}

function cleanSocialLinks(links: Record<string, string>) {
  const allowedKeys = new Set(socialFields.map(field => field.key));
  return Object.fromEntries(
    Object.entries(links)
      .filter(([key]) => allowedKeys.has(key as (typeof socialFields)[number]['key']))
      .map(([key, value]) => [key, value.trim()])
      .filter(([, value]) => value)
  );
}
