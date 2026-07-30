'use client';

import { FormEvent, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useMutation } from '@tanstack/react-query';
import { Eye, EyeOff, Loader2, Mail, Save, Settings, ShieldCheck } from 'lucide-react';
import { fetchApi } from '@/lib/api';
import { useAppStore } from '@/store/useAppStore';
import { useToastStore } from '@/store/useToastStore';
import type { User } from '@/types';

type PasswordForm = {
  current_password: string;
  new_password: string;
  confirm_password: string;
};

type PasswordInputProps = {
  id: string;
  label: string;
  value: string;
  autoComplete: string;
  minLength?: number;
  onChange: (value: string) => void;
};

function PasswordInput({
  id,
  label,
  value,
  autoComplete,
  minLength,
  onChange,
}: PasswordInputProps) {
  const [visible, setVisible] = useState(false);

  return (
    <div>
      <label htmlFor={id} className="block text-sm font-medium text-foreground">
        {label}
      </label>
      <div className="relative mt-2">
        <input
          id={id}
          type={visible ? 'text' : 'password'}
          autoComplete={autoComplete}
          minLength={minLength}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          className="w-full rounded-xl border border-input bg-background px-4 py-2.5 pr-12 text-sm text-foreground outline-none transition-colors focus:ring-1 focus:ring-ring"
          required
        />
        <button
          type="button"
          onClick={() => setVisible(value => !value)}
          className="absolute right-2 top-1/2 grid h-8 w-8 -translate-y-1/2 place-items-center rounded-lg text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
          aria-label={visible ? `Hide ${label.toLowerCase()}` : `Show ${label.toLowerCase()}`}
          title={visible ? `Hide ${label.toLowerCase()}` : `Show ${label.toLowerCase()}`}
        >
          {visible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
        </button>
      </div>
    </div>
  );
}

export default function AdminSettingsPage() {
  const router = useRouter();
  const user = useAppStore(state => state.user);
  const updateUser = useAppStore(state => state.updateUser);
  const logout = useAppStore(state => state.logout);
  const pushToast = useToastStore(state => state.push);

  const [emailForm, setEmailForm] = useState({
    email: user?.email || '',
    current_password: '',
  });
  const [passwordForm, setPasswordForm] = useState<PasswordForm>({
    current_password: '',
    new_password: '',
    confirm_password: '',
  });

  const emailMutation = useMutation({
    mutationFn: (payload: typeof emailForm) => fetchApi<User>('/users/me/email', {
      method: 'PATCH',
      body: JSON.stringify(payload),
    }),
    onSuccess: (updatedUser) => {
      updateUser({ email: updatedUser.email });
      setEmailForm({
        email: updatedUser.email || '',
        current_password: '',
      });
      pushToast({
        title: 'Email updated',
        description: 'Your login email has been changed.',
        variant: 'success',
      });
    },
    onError: (error) => {
      pushToast({
        title: 'Could not update email',
        description: error instanceof Error ? error.message : 'Please try again.',
        variant: 'error',
      });
    },
  });

  const passwordMutation = useMutation({
    mutationFn: (payload: Pick<PasswordForm, 'current_password' | 'new_password'>) => fetchApi<{ updated: boolean }>('/users/me/password', {
      method: 'PATCH',
      body: JSON.stringify(payload),
    }),
    onSuccess: () => {
      setPasswordForm({
        current_password: '',
        new_password: '',
        confirm_password: '',
      });
      pushToast({
        title: 'Password updated',
        description: 'Please sign in again with your new password.',
        variant: 'success',
      });
      logout();
      router.push('/admin/login');
    },
    onError: (error) => {
      pushToast({
        title: 'Could not update password',
        description: error instanceof Error ? error.message : 'Please try again.',
        variant: 'error',
      });
    },
  });

  const handleEmailSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    emailMutation.mutate({
      email: emailForm.email.trim(),
      current_password: emailForm.current_password,
    });
  };

  const handlePasswordSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (passwordForm.new_password !== passwordForm.confirm_password) {
      pushToast({
        title: 'Passwords do not match',
        description: 'Confirm your new password before saving.',
        variant: 'error',
      });
      return;
    }

    passwordMutation.mutate({
      current_password: passwordForm.current_password,
      new_password: passwordForm.new_password,
    });
  };

  return (
    <div className="mx-auto max-w-5xl space-y-8">
      <header className="admin-page-hero overflow-hidden">
        <div className="admin-page-hero-bg" />
        <div className="relative z-10 max-w-2xl">
          <div className="admin-page-hero-icon">
            <Settings className="h-5 w-5" />
          </div>
          <h1 className="admin-page-title">Settings</h1>
          <p className="admin-page-description">
            Manage your private login email and password. Your public author profile stays separate.
          </p>
        </div>
      </header>

      <div className="grid gap-6 lg:grid-cols-2">
        <form
          onSubmit={handleEmailSubmit}
          className="admin-surface-padded"
        >
          <div className="flex items-start gap-3">
            <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-muted text-foreground shadow-xs border border-border">
              <Mail className="h-5 w-5" />
            </span>
            <div>
              <h2 className="text-lg font-bold text-foreground">Login email</h2>
              <p className="mt-1 text-sm leading-6 text-muted-foreground">
                This email is used to sign in to the admin panel.
              </p>
            </div>
          </div>

          <div className="mt-6 space-y-4">
            <div>
              <label htmlFor="settings-email" className="block text-sm font-medium text-foreground">
                Your email
              </label>
              <input
                id="settings-email"
                type="email"
                autoComplete="email"
                value={emailForm.email}
                onChange={(event) => setEmailForm(prev => ({ ...prev, email: event.target.value }))}
                className="mt-2 w-full rounded-xl border border-input bg-background px-4 py-2.5 text-sm text-foreground outline-none transition-colors focus:ring-1 focus:ring-ring"
                required
              />
            </div>

            <PasswordInput
              id="settings-email-password"
              label="Current password"
              autoComplete="current-password"
              value={emailForm.current_password}
              onChange={(value) => setEmailForm(prev => ({ ...prev, current_password: value }))}
            />
          </div>

          <button
            type="submit"
            disabled={emailMutation.isPending}
            className="mt-6 inline-flex items-center justify-center gap-2 rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground shadow-sm transition-colors hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-70"
          >
            {emailMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            Save email
          </button>
        </form>

        <form
          onSubmit={handlePasswordSubmit}
          className="admin-surface-padded"
        >
          <div className="flex items-start gap-3">
            <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-muted text-foreground shadow-xs border border-border">
              <ShieldCheck className="h-5 w-5" />
            </span>
            <div>
              <h2 className="text-lg font-bold text-foreground">Password</h2>
              <p className="mt-1 text-sm leading-6 text-muted-foreground">
                Choose a new password after confirming your current one.
              </p>
            </div>
          </div>

          <div className="mt-6 space-y-4">
            <PasswordInput
              id="settings-current-password"
              label="Current password"
              autoComplete="current-password"
              value={passwordForm.current_password}
              onChange={(value) => setPasswordForm(prev => ({ ...prev, current_password: value }))}
            />

            <PasswordInput
              id="settings-new-password"
              label="New password"
              autoComplete="new-password"
              minLength={8}
              value={passwordForm.new_password}
              onChange={(value) => setPasswordForm(prev => ({ ...prev, new_password: value }))}
            />

            <PasswordInput
              id="settings-confirm-password"
              label="Confirm new password"
              autoComplete="new-password"
              minLength={8}
              value={passwordForm.confirm_password}
              onChange={(value) => setPasswordForm(prev => ({ ...prev, confirm_password: value }))}
            />
          </div>

          <button
            type="submit"
            disabled={passwordMutation.isPending}
            className="mt-6 inline-flex items-center justify-center gap-2 rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground shadow-sm transition-colors hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-70"
          >
            {passwordMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            Save password
          </button>
        </form>
      </div>
    </div>
  );
}
