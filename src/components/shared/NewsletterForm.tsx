'use client';

import { useState } from 'react';
import { Loader2, Mail, CheckCircle } from 'lucide-react';

const SUPABASE_URL = 'https://qixolxkcgyvapopvsgzs.supabase.co';

export default function NewsletterForm() {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;

    setStatus('loading');
    try {
      const res = await fetch(`${SUPABASE_URL}/functions/v1/newsletter-subscribe`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim() }),
      });

      const data = await res.json();

      if (res.ok) {
        setStatus('success');
        setMessage(data.message || 'Successfully subscribed!');
        setEmail('');
      } else {
        setStatus('error');
        setMessage(data.error || 'Something went wrong.');
      }
    } catch {
      setStatus('error');
      setMessage('Network error. Please try again.');
    }

    // Reset status after 5 seconds
    setTimeout(() => {
      setStatus('idle');
      setMessage('');
    }, 5000);
  };

  return (
    <div className="w-full max-w-md mx-auto">
      <div className="flex items-center justify-center gap-2 mb-3">
        <Mail className="w-4 h-4 text-primary-500" />
        <p className="text-sm font-medium text-slate-600 dark:text-slate-300">
          Stay updated — subscribe to our newsletter
        </p>
      </div>

      {status === 'success' ? (
        <div className="flex items-center justify-center gap-2 text-green-600 dark:text-green-400 text-sm font-medium py-2">
          <CheckCircle className="w-4 h-4" />
          {message}
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="flex gap-2">
          <input
            type="email"
            placeholder="your@email.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="flex-1 px-4 py-2.5 rounded-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition-all"
          />
          <button
            type="submit"
            disabled={status === 'loading'}
            className="px-5 py-2.5 rounded-full bg-primary-600 hover:bg-primary-700 text-white text-sm font-medium transition-colors flex items-center gap-2 whitespace-nowrap disabled:opacity-50"
          >
            {status === 'loading' ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              'Subscribe'
            )}
          </button>
        </form>
      )}

      {status === 'error' && (
        <p className="text-center text-xs text-red-500 dark:text-red-400 mt-2">{message}</p>
      )}
    </div>
  );
}
