'use client';

import { FormEvent, Suspense, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Eye, EyeOff, Loader2, LockKeyhole } from 'lucide-react';
import { fetchApi } from '@/lib/api';

function PasswordField({
  id,
  label,
  value,
  onChange,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  const [visible, setVisible] = useState(false);

  return (
    <div>
      <label htmlFor={id} className="block text-sm font-semibold text-slate-800 dark:text-slate-200">
        {label}
      </label>
      <div className="relative mt-2">
        <input
          id={id}
          type={visible ? 'text' : 'password'}
          minLength={8}
          autoComplete="new-password"
          value={value}
          onChange={(event) => onChange(event.target.value)}
          className="w-full rounded-xl border border-slate-200/70 bg-white/70 px-4 py-3 pr-12 text-sm text-slate-950 shadow-sm outline-none focus:ring-2 focus:ring-primary-500 dark:border-slate-800/70 dark:bg-slate-950/40 dark:text-white"
          required
        />
        <button
          type="button"
          onClick={() => setVisible(value => !value)}
          className="absolute right-2 top-1/2 grid h-9 w-9 -translate-y-1/2 place-items-center rounded-lg text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-white"
          aria-label={visible ? `Hide ${label.toLowerCase()}` : `Show ${label.toLowerCase()}`}
          title={visible ? `Hide ${label.toLowerCase()}` : `Show ${label.toLowerCase()}`}
        >
          {visible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
        </button>
      </div>
    </div>
  );
}

function ResetPasswordContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get('token') || '';
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [status, setStatus] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setStatus(null);

    if (!token) {
      setStatus({ type: 'error', message: 'Reset token is missing.' });
      return;
    }

    if (newPassword !== confirmPassword) {
      setStatus({ type: 'error', message: 'Passwords do not match.' });
      return;
    }

    setIsSubmitting(true);
    try {
      await fetchApi('/auth/password-reset/complete', {
        method: 'POST',
        body: JSON.stringify({ token, new_password: newPassword }),
      });
      setNewPassword('');
      setConfirmPassword('');
      setStatus({ type: 'success', message: 'Password updated. You can sign in with your new password.' });
    } catch (err) {
      setStatus({
        type: 'error',
        message: err instanceof Error ? err.message : 'Could not reset password.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 px-4 py-12 dark:bg-slate-950">
      <div className="pointer-events-none fixed inset-0 -z-10 bg-[radial-gradient(circle_at_20%_0%,rgba(13,135,207,0.14),transparent_45%),radial-gradient(circle_at_80%_10%,rgba(99,102,241,0.10),transparent_38%)] dark:bg-[radial-gradient(circle_at_20%_0%,rgba(13,135,207,0.22),transparent_45%),radial-gradient(circle_at_80%_10%,rgba(99,102,241,0.16),transparent_38%)]" />
      <form onSubmit={handleSubmit} className="mx-auto mt-12 w-full max-w-md rounded-2xl border border-slate-200/70 bg-white/80 p-8 shadow-2xl backdrop-blur dark:border-slate-800/70 dark:bg-slate-900/60">
        <div className="mb-6">
          <div className="mb-4 grid h-12 w-12 place-items-center rounded-2xl border border-primary-100 bg-primary-50 text-primary-600 dark:border-primary-900/50 dark:bg-primary-950/40 dark:text-primary-300">
            <LockKeyhole className="h-5 w-5" />
          </div>
          <h1 className="text-2xl font-bold text-slate-950 dark:text-white">Set new password</h1>
          <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-400">
            Use the one-time reset link from your administrator.
          </p>
        </div>

        {status && (
          <div className={`mb-5 rounded-xl p-3 text-sm ${status.type === 'success'
            ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300'
            : 'bg-red-50 text-red-700 dark:bg-red-950/40 dark:text-red-300'
          }`}>
            {status.message}
          </div>
        )}

        <div className="space-y-4">
          <PasswordField id="reset-new-password" label="New password" value={newPassword} onChange={setNewPassword} />
          <PasswordField id="reset-confirm-password" label="Confirm new password" value={confirmPassword} onChange={setConfirmPassword} />
        </div>

        <button
          type="submit"
          disabled={isSubmitting || status?.type === 'success'}
          className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-primary-600 px-4 py-3 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-primary-700 disabled:cursor-not-allowed disabled:opacity-70"
        >
          {isSubmitting ? <Loader2 className="h-5 w-5 animate-spin" /> : 'Update password'}
        </button>

        <Link href="/admin/login" className="mt-5 block text-center text-sm font-semibold text-primary-600 hover:underline dark:text-primary-400">
          Back to sign in
        </Link>
      </form>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={null}>
      <ResetPasswordContent />
    </Suspense>
  );
}
