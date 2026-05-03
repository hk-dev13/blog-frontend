'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fetchApi } from '@/lib/api';
import { Comment } from '@/types';
import { format } from 'date-fns';
import { Loader2 } from 'lucide-react';

export default function CommentSection({ postId }: { postId: string }) {
  const queryClient = useQueryClient();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [content, setContent] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  // We should ideally have an endpoint for GET /posts/:id/comments, assuming it exists
  // For now, let's assume it returns { data: Comment[] }
  // Since our backend endpoint might require auth to see all, or only returns approved, let's try
  const { data: comments = [], isLoading } = useQuery({
    queryKey: ['comments', postId],
    queryFn: () => fetchApi<Comment[]>(`/posts/${postId}/comments`).catch(() => []), // Fallback to empty if not implemented
  });

  const mutation = useMutation({
    mutationFn: (newComment: { name: string; email: string; content: string }) => {
      return fetchApi<{ id: string }>(`/posts/${postId}/comments`, {
        method: 'POST',
        body: JSON.stringify(newComment),
      });
    },
    onSuccess: () => {
      setSuccessMsg('Your comment has been submitted and is awaiting moderation.');
      setName('');
      setEmail('');
      setContent('');
      setErrorMsg('');
      queryClient.invalidateQueries({ queryKey: ['comments', postId] });
    },
    onError: (error: any) => {
      setErrorMsg(error.message || 'Failed to submit comment.');
      setSuccessMsg('');
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email || !content) {
      setErrorMsg('All fields are required.');
      return;
    }
    mutation.mutate({ name, email, content });
  };

  return (
    <div className="mt-16 pt-16 border-t border-slate-200 dark:border-slate-800">
      <h3 className="text-2xl font-serif font-bold text-slate-900 dark:text-white mb-8">Comments</h3>
      
      {/* Comment Form */}
      <div className="bg-slate-50 dark:bg-slate-800/50 rounded-2xl p-6 md:p-8 mb-12">
        <h4 className="text-lg font-semibold mb-4 text-slate-900 dark:text-white">Leave a reply</h4>
        
        {successMsg && (
          <div className="mb-6 p-4 bg-green-50 text-green-700 dark:bg-green-900/30 dark:text-green-400 rounded-lg text-sm">
            {successMsg}
          </div>
        )}
        
        {errorMsg && (
          <div className="mb-6 p-4 bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-400 rounded-lg text-sm">
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Name</label>
              <input 
                id="name"
                type="text" 
                value={name}
                onChange={e => setName(e.target.value)}
                className="w-full px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 focus:ring-2 focus:ring-primary-500 outline-none"
              />
            </div>
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Email</label>
              <input 
                id="email"
                type="email" 
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="w-full px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 focus:ring-2 focus:ring-primary-500 outline-none"
              />
            </div>
          </div>
          <div>
            <label htmlFor="content" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Comment</label>
            <textarea 
              id="content"
              rows={4}
              value={content}
              onChange={e => setContent(e.target.value)}
              className="w-full px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 focus:ring-2 focus:ring-primary-500 outline-none resize-y"
            ></textarea>
          </div>
          <button 
            type="submit" 
            disabled={mutation.isPending}
            className="px-6 py-2.5 bg-primary-600 hover:bg-primary-700 text-white font-medium rounded-lg transition-colors flex items-center justify-center min-w-[120px]"
          >
            {mutation.isPending ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Post Comment'}
          </button>
        </form>
      </div>

      {/* Comment List */}
      <div className="space-y-6">
        {isLoading ? (
          <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 animate-spin text-slate-400" /></div>
        ) : comments.length > 0 ? (
          comments.map(comment => (
            <div key={comment.id} className="border-b border-slate-100 dark:border-slate-800 pb-6 last:border-0">
              <div className="flex items-center justify-between mb-2">
                <h5 className="font-semibold text-slate-900 dark:text-white">{comment.name}</h5>
                <span className="text-xs text-slate-500">{format(new Date(comment.created_at), 'MMM d, yyyy')}</span>
              </div>
              <p className="text-slate-700 dark:text-slate-300 text-sm whitespace-pre-wrap">{comment.content}</p>
            </div>
          ))
        ) : (
          <p className="text-slate-500 text-center py-8">No comments yet. Be the first to share your thoughts!</p>
        )}
      </div>
    </div>
  );
}
