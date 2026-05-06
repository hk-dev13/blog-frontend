'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery, useMutation } from '@tanstack/react-query';
import { fetchApi, fetchPaginatedApi } from '@/lib/api';
import { Category, Tag } from '@/types';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Loader2, Image as ImageIcon, Upload } from 'lucide-react';
import { useAppStore } from '@/store/useAppStore';

export default function CreatePostPage() {
  const router = useRouter();
  const token = useAppStore(state => state.token);
  
  // Form state
  const [title, setTitle] = useState('');
  const [excerpt, setExcerpt] = useState('');
  const [content, setContent] = useState('');
  const [coverImageUrl, setCoverImageUrl] = useState('');
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [isPreview, setIsPreview] = useState(false);

  // Fetch categories and tags
  const { data: categoriesData } = useQuery({
    queryKey: ['categories'],
    queryFn: () => fetchPaginatedApi<Category>('/categories?limit=50'),
  });

  const { data: tagsData } = useQuery({
    queryKey: ['tags'],
    queryFn: () => fetchPaginatedApi<Tag>('/tags?limit=50'),
  });

  // Create Post Mutation
  const createMutation = useMutation({
    mutationFn: (data: any) => fetchApi('/posts', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
    onSuccess: () => {
      router.push('/admin/posts');
    },
    onError: (err: any) => {
      alert(err.message || 'Failed to create post');
    }
  });

  // Handle Image Upload
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingImage(true);
    const formData = new FormData();
    formData.append('file', file);

    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api';
      const res = await fetch(`${API_URL}/upload`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData,
      });

      const data = await res.json();
      if (data.success) {
        setCoverImageUrl(data.data.url);
      } else {
        throw new Error(data.error || 'Upload failed');
      }
    } catch (err: any) {
      alert(err.message || 'Failed to upload image');
    } finally {
      setUploadingImage(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !content) {
      alert('Title and content are required');
      return;
    }

    createMutation.mutate({
      title,
      excerpt,
      content,
      cover_image: coverImageUrl,
      category_ids: selectedCategories,
      tag_ids: selectedTags,
    });
  };

  const categories = categoriesData?.data || [];
  const tags = tagsData?.data || [];

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-serif font-bold text-slate-900 dark:text-white">Create New Post</h1>
        <button
          onClick={handleSubmit}
          disabled={createMutation.isPending}
          className="bg-primary-600 hover:bg-primary-700 text-white px-6 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50 flex items-center gap-2"
        >
          {createMutation.isPending && <Loader2 className="w-4 h-4 animate-spin" />}
          Save as Draft
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Editor Area */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white dark:bg-slate-800 p-6 rounded-xl border border-slate-200 dark:border-slate-700 space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Title</label>
              <input
                type="text"
                value={title}
                onChange={e => setTitle(e.target.value)}
                className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-primary-500 focus:outline-none"
                placeholder="Enter post title..."
                required
              />
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
            </div>

            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Content (Markdown)</label>
                <div className="flex bg-slate-100 dark:bg-slate-900 rounded-lg p-1">
                  <button
                    type="button"
                    onClick={() => setIsPreview(false)}
                    className={`px-3 py-1 text-sm rounded-md transition-colors ${!isPreview ? 'bg-white dark:bg-slate-800 shadow text-primary-600 dark:text-primary-400' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
                  >
                    Write
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsPreview(true)}
                    className={`px-3 py-1 text-sm rounded-md transition-colors ${isPreview ? 'bg-white dark:bg-slate-800 shadow text-primary-600 dark:text-primary-400' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
                  >
                    Preview
                  </button>
                </div>
              </div>

              {isPreview ? (
                <div className="w-full min-h-[400px] p-6 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg prose prose-slate dark:prose-invert max-w-none">
                  {content ? (
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>{content}</ReactMarkdown>
                  ) : (
                    <p className="text-slate-400 italic">Nothing to preview...</p>
                  )}
                </div>
              ) : (
                <textarea
                  value={content}
                  onChange={e => setContent(e.target.value)}
                  rows={20}
                  className="w-full px-4 py-4 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-primary-500 focus:outline-none font-mono text-sm"
                  placeholder="Write your content in Markdown..."
                  required
                />
              )}
            </div>
          </div>
        </div>

        {/* Sidebar Options */}
        <div className="space-y-6">
          {/* Cover Image Upload */}
          <div className="bg-white dark:bg-slate-800 p-6 rounded-xl border border-slate-200 dark:border-slate-700 space-y-4">
            <h3 className="text-sm font-medium text-slate-700 dark:text-slate-300">Cover Image</h3>
            
            {coverImageUrl ? (
              <div className="relative aspect-video rounded-lg overflow-hidden group">
                <img src={coverImageUrl} alt="Cover" className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <button onClick={() => setCoverImageUrl('')} className="text-white text-sm font-medium bg-red-500/80 px-3 py-1.5 rounded-lg">
                    Remove
                  </button>
                </div>
              </div>
            ) : (
              <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-slate-300 border-dashed rounded-lg cursor-pointer bg-slate-50 dark:hover:bg-bray-800 dark:bg-slate-900 hover:bg-slate-100 dark:border-slate-600 dark:hover:border-slate-500 dark:hover:bg-slate-800 transition-colors">
                <div className="flex flex-col items-center justify-center pt-5 pb-6">
                  {uploadingImage ? (
                    <Loader2 className="w-6 h-6 text-slate-500 animate-spin mb-2" />
                  ) : (
                    <Upload className="w-6 h-6 text-slate-500 mb-2" />
                  )}
                  <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">Click to upload image</p>
                </div>
                <input type="file" className="hidden" accept="image/*" onChange={handleImageUpload} disabled={uploadingImage} />
              </label>
            )}
            
            <input
              type="text"
              value={coverImageUrl}
              onChange={e => setCoverImageUrl(e.target.value)}
              className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-primary-500 focus:outline-none mt-2"
              placeholder="Or paste external URL..."
            />
          </div>

          {/* Categories */}
          <div className="bg-white dark:bg-slate-800 p-6 rounded-xl border border-slate-200 dark:border-slate-700 space-y-4">
            <h3 className="text-sm font-medium text-slate-700 dark:text-slate-300">Categories</h3>
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
          <div className="bg-white dark:bg-slate-800 p-6 rounded-xl border border-slate-200 dark:border-slate-700 space-y-4">
            <h3 className="text-sm font-medium text-slate-700 dark:text-slate-300">Tags</h3>
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
        </div>
      </div>
    </div>
  );
}
