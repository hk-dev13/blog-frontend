'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAppStore } from '@/store/useAppStore';
import { fetchApi, isApiError } from '@/lib/api';
import { Loader2 } from 'lucide-react';
import LogoMark from '@/components/shared/LogoMark';

export default function AdminLoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [cooldownUntil, setCooldownUntil] = useState<number | null>(null);
  const router = useRouter();
  const setAuth = useAppStore(state => state.setAuth);
  const token = useAppStore(state => state.token);

  useEffect(() => {
    if (token) {
      router.replace('/admin/posts');
    }
  }, [token, router]);

  const cooldownRemainingSeconds = useMemo(() => {
    if (!cooldownUntil) return 0;
    return Math.max(0, Math.ceil((cooldownUntil - Date.now()) / 1000));
  }, [cooldownUntil]);

  useEffect(() => {
    if (!cooldownUntil) return;
    if (cooldownUntil <= Date.now()) {
      setCooldownUntil(null);
      return;
    }

    const timer = window.setInterval(() => {
      if (cooldownUntil <= Date.now()) setCooldownUntil(null);
    }, 500);

    return () => window.clearInterval(timer);
  }, [cooldownUntil]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const res = await fetchApi<{ token: string; user: any }>('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      });

      setAuth(res.token, res.user);
      router.push('/admin/posts');
    } catch (err: any) {
      if (isApiError(err) && err.status === 429) {
        const retryAfterSeconds = err.retryAfterSeconds ?? 60;
        setCooldownUntil(Date.now() + retryAfterSeconds * 1000);
        setError('Too many attempts. Please try again in a moment.');
      } else {
        setError(err?.message || 'Invalid credentials');
      }
    } finally {
      setIsLoading(false);
    }
  };

return (
  <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950 py-12 px-4 sm:px-6 lg:px-8">
    <div className="pointer-events-none fixed inset-0 -z-10 bg-[radial-gradient(circle_at_20%_0%,rgba(13,135,207,0.14),transparent_45%),radial-gradient(circle_at_80%_10%,rgba(99,102,241,0.10),transparent_38%),linear-gradient(180deg,rgba(255,255,255,0.8),rgba(255,255,255,0))] dark:bg-[radial-gradient(circle_at_20%_0%,rgba(13,135,207,0.22),transparent_45%),radial-gradient(circle_at_80%_10%,rgba(99,102,241,0.16),transparent_38%),linear-gradient(180deg,rgba(2,6,23,0.7),rgba(2,6,23,0))]" />
    <div className="max-w-md w-full space-y-8 bg-white/80 dark:bg-slate-900/60 p-8 rounded-2xl shadow-2xl border border-slate-200/70 dark:border-slate-800/70 backdrop-blur">

      <div className="flex flex-col items-center">
        {/* Logo */}
        <div className="mb-4">
          <LogoMark className="w-12 h-12 text-primary-600 dark:text-primary-400" />
        </div>

        {/* Title */}
        <h2 className="mt-2 text-center text-3xl font-serif font-extrabold text-slate-900 dark:text-white">
          Envoyou Admin
        </h2>

        {/* Subtitle */}
        <p className="mt-2 text-center text-sm text-slate-600 dark:text-slate-400">
          Sign in to manage your content
        </p>
      </div>
        
        <form className="mt-8 space-y-6" onSubmit={handleLogin}>
          {error && (
            <div className="bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-400 p-3 rounded-lg text-sm text-center">
              {error}{cooldownRemainingSeconds > 0 ? ` (${cooldownRemainingSeconds}s)` : ''}
            </div>
          )}
          
          <div className="space-y-4">
            <div>
              <label htmlFor="email" className="sr-only">Email address</label>
              <input
                id="email"
                name="email"
                type="email"
                required
                className="appearance-none relative block w-full px-4 py-3 border border-slate-200/70 dark:border-slate-800/70 placeholder-slate-500 text-slate-900 dark:text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 focus:z-10 sm:text-sm bg-white/70 dark:bg-slate-950/40 shadow-sm"
                placeholder="Email address"
                value={email}
                onChange={e => setEmail(e.target.value)}
              />
            </div>
            <div>
              <label htmlFor="password" className="sr-only">Password</label>
              <input
                id="password"
                name="password"
                type="password"
                required
                className="appearance-none relative block w-full px-4 py-3 border border-slate-200/70 dark:border-slate-800/70 placeholder-slate-500 text-slate-900 dark:text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 focus:z-10 sm:text-sm bg-white/70 dark:bg-slate-950/40 shadow-sm"
                placeholder="Password"
                value={password}
                onChange={e => setPassword(e.target.value)}
              />
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={isLoading || cooldownRemainingSeconds > 0}
              className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-semibold rounded-xl text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 transition-colors shadow-sm"
            >
              {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : cooldownRemainingSeconds > 0 ? `Try again in ${cooldownRemainingSeconds}s` : 'Sign in'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
