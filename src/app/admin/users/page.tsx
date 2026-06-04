'use client';

import { FormEvent, useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { AlertCircle, ArrowRightLeft, Ban, Copy, KeyRound, Loader2, Mail, Search, ShieldAlert, Trash2, UserCheck, UserPlus, Users } from 'lucide-react';
import { fetchApi, fetchPaginatedApi } from '@/lib/api';
import { useAppStore } from '@/store/useAppStore';
import { useToastStore } from '@/store/useToastStore';
import type { User } from '@/types';
import AdminLoadError from '@/components/admin/AdminLoadError';
import AdminSessionExpired from '@/components/admin/AdminSessionExpired';

type RecoveryTarget = User & { email: string; role: string };

type ResetLinkResponse = {
  reset_url: string;
  setup_url?: string;
  expires_at: string;
};

type InviteResponse = {
  user: RecoveryTarget;
  setup_url: string;
  expires_at: string;
};

export default function AdminUsersPage() {
  const currentUser = useAppStore(state => state.user);
  const pushToast = useToastStore(state => state.push);
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [emailTarget, setEmailTarget] = useState<RecoveryTarget | null>(null);
  const [passwordTarget, setPasswordTarget] = useState<RecoveryTarget | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<RecoveryTarget | null>(null);
  const [statusTarget, setStatusTarget] = useState<RecoveryTarget | null>(null);
  const [transferTarget, setTransferTarget] = useState<RecoveryTarget | null>(null);
  const [emailForm, setEmailForm] = useState({ email: '', admin_current_password: '' });
  const [deleteForm, setDeleteForm] = useState({ confirm_email: '', admin_current_password: '' });
  const [statusPassword, setStatusPassword] = useState('');
  const [transferForm, setTransferForm] = useState({ target_user_id: '', admin_current_password: '' });
  const [inviteOpen, setInviteOpen] = useState(false);
  const [inviteForm, setInviteForm] = useState({ name: '', email: '', admin_current_password: '' });
  const [inviteResult, setInviteResult] = useState<InviteResponse | null>(null);
  const [adminPassword, setAdminPassword] = useState('');
  const [resetLink, setResetLink] = useState<ResetLinkResponse | null>(null);

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['admin-users', search],
    queryFn: () => {
      const params = new URLSearchParams({ limit: '100' });
      if (search.trim()) params.set('search', search.trim());
      return fetchPaginatedApi<RecoveryTarget>(`/users/admin/list?${params.toString()}`);
    },
  });

  const users = useMemo(() => data?.data || [], [data?.data]);

  const emailMutation = useMutation({
    mutationFn: (payload: { userId: string; email: string; admin_current_password: string }) =>
      fetchApi<RecoveryTarget>(`/users/admin/${payload.userId}/email`, {
        method: 'PATCH',
        body: JSON.stringify({
          email: payload.email,
          admin_current_password: payload.admin_current_password,
        }),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      setEmailTarget(null);
      setEmailForm({ email: '', admin_current_password: '' });
      pushToast({ title: 'User email updated', variant: 'success' });
    },
    onError: (err) => {
      pushToast({
        title: 'Could not update user email',
        description: err instanceof Error ? err.message : 'Please try again.',
        variant: 'error',
      });
    },
  });

  const passwordResetMutation = useMutation({
    mutationFn: (payload: { userId: string; admin_current_password: string }) =>
      fetchApi<ResetLinkResponse>(`/users/admin/${payload.userId}/password-reset`, {
        method: 'POST',
        body: JSON.stringify({ admin_current_password: payload.admin_current_password }),
      }),
    onSuccess: (result) => {
      setResetLink(result);
      setAdminPassword('');
      pushToast({ title: 'Reset link created', description: 'Copy it now. It is shown only in this dialog.', variant: 'success' });
    },
    onError: (err) => {
      pushToast({
        title: 'Could not create reset link',
        description: err instanceof Error ? err.message : 'Please try again.',
        variant: 'error',
      });
    },
  });

  const inviteMutation = useMutation({
    mutationFn: (payload: typeof inviteForm) =>
      fetchApi<InviteResponse>('/users/admin/invite', {
        method: 'POST',
        body: JSON.stringify({
          name: payload.name,
          email: payload.email,
          role: 'author',
          admin_current_password: payload.admin_current_password,
        }),
      }),
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      setInviteResult(result);
      setInviteForm({ name: '', email: '', admin_current_password: '' });
      pushToast({ title: 'User invited', description: 'Copy the setup link before closing.', variant: 'success' });
    },
    onError: (err) => {
      pushToast({
        title: 'Could not invite user',
        description: err instanceof Error ? err.message : 'Please try again.',
        variant: 'error',
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (payload: { userId: string; confirm_email: string; admin_current_password: string }) =>
      fetchApi<{ deleted: boolean }>(`/users/admin/${payload.userId}`, {
        method: 'DELETE',
        body: JSON.stringify({
          confirm_email: payload.confirm_email,
          admin_current_password: payload.admin_current_password,
        }),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      setDeleteTarget(null);
      setDeleteForm({ confirm_email: '', admin_current_password: '' });
      pushToast({ title: 'User deleted', variant: 'success' });
    },
    onError: (err) => {
      pushToast({
        title: 'Could not delete user',
        description: err instanceof Error ? err.message : 'Please try again.',
        variant: 'error',
      });
    },
  });

  const statusMutation = useMutation({
    mutationFn: (payload: { userId: string; status: 'active' | 'inactive'; admin_current_password: string }) =>
      fetchApi<RecoveryTarget>(`/users/admin/${payload.userId}/status`, {
        method: 'PATCH',
        body: JSON.stringify({
          status: payload.status,
          admin_current_password: payload.admin_current_password,
        }),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      setStatusTarget(null);
      setStatusPassword('');
      pushToast({ title: 'User status updated', variant: 'success' });
    },
    onError: (err) => {
      pushToast({
        title: 'Could not update user status',
        description: err instanceof Error ? err.message : 'Please try again.',
        variant: 'error',
      });
    },
  });

  const transferMutation = useMutation({
    mutationFn: (payload: { userId: string; target_user_id: string; admin_current_password: string }) =>
      fetchApi<{ transferred: number }>(`/users/admin/${payload.userId}/transfer-posts`, {
        method: 'POST',
        body: JSON.stringify({
          target_user_id: payload.target_user_id,
          admin_current_password: payload.admin_current_password,
        }),
      }),
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      setTransferTarget(null);
      setTransferForm({ target_user_id: '', admin_current_password: '' });
      pushToast({ title: 'Posts transferred', description: `${result.transferred} article(s) moved.`, variant: 'success' });
    },
    onError: (err) => {
      pushToast({
        title: 'Could not transfer posts',
        description: err instanceof Error ? err.message : 'Please try again.',
        variant: 'error',
      });
    },
  });

  const openEmailModal = (user: RecoveryTarget) => {
    setEmailTarget(user);
    setEmailForm({ email: user.email || '', admin_current_password: '' });
  };

  const openPasswordModal = (user: RecoveryTarget) => {
    setPasswordTarget(user);
    setAdminPassword('');
    setResetLink(null);
  };

  const openDeleteModal = (user: RecoveryTarget) => {
    setDeleteTarget(user);
    setDeleteForm({ confirm_email: '', admin_current_password: '' });
  };

  const openStatusModal = (user: RecoveryTarget) => {
    setStatusTarget(user);
    setStatusPassword('');
  };

  const openTransferModal = (user: RecoveryTarget) => {
    setTransferTarget(user);
    const firstTarget = users.find(candidate => candidate.id !== user.id && candidate.status !== 'inactive');
    setTransferForm({ target_user_id: firstTarget?.id || '', admin_current_password: '' });
  };

  const handleEmailSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!emailTarget) return;
    emailMutation.mutate({
      userId: emailTarget.id,
      email: emailForm.email.trim(),
      admin_current_password: emailForm.admin_current_password,
    });
  };

  const handlePasswordResetSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!passwordTarget) return;
    passwordResetMutation.mutate({
      userId: passwordTarget.id,
      admin_current_password: adminPassword,
    });
  };

  const handleInviteSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    inviteMutation.mutate({
      name: inviteForm.name.trim(),
      email: inviteForm.email.trim(),
      admin_current_password: inviteForm.admin_current_password,
    });
  };

  const handleDeleteSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!deleteTarget) return;
    deleteMutation.mutate({
      userId: deleteTarget.id,
      confirm_email: deleteForm.confirm_email.trim(),
      admin_current_password: deleteForm.admin_current_password,
    });
  };

  const handleStatusSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!statusTarget) return;
    statusMutation.mutate({
      userId: statusTarget.id,
      status: statusTarget.status === 'inactive' ? 'active' : 'inactive',
      admin_current_password: statusPassword,
    });
  };

  const handleTransferSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!transferTarget) return;
    transferMutation.mutate({
      userId: transferTarget.id,
      target_user_id: transferForm.target_user_id,
      admin_current_password: transferForm.admin_current_password,
    });
  };

  const copyLink = async (url: string, label = 'Link') => {
    await navigator.clipboard.writeText(url);
    pushToast({ title: `${label} copied`, variant: 'success' });
  };

  if (currentUser && currentUser.role !== 'admin') {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center text-center">
        <AlertCircle className="mb-4 h-10 w-10 text-red-500" />
        <h1 className="text-2xl font-bold text-slate-950 dark:text-white">Access Denied</h1>
        <p className="mt-2 text-slate-500">Only administrators can manage user recovery.</p>
      </div>
    );
  }

  if (error instanceof Error && /401|403|Authentication required|Unauthorized|Forbidden/i.test(error.message)) {
    return <AdminSessionExpired />;
  }

  if (error instanceof Error) {
    return <AdminLoadError title="We couldn't load users right now." onRetry={() => void refetch()} />;
  }

  return (
    <div className="space-y-8">
      <header className="admin-page-hero overflow-hidden">
        <div className="admin-page-hero-bg" />
        <div className="admin-page-hero-content">
          <div>
            <div className="admin-page-hero-icon">
              <Users className="h-5 w-5" />
            </div>
            <h1 className="admin-page-title">User Recovery</h1>
            <p className="admin-page-description max-w-2xl">
              Invite authors and help them regain access without directly setting their password.
            </p>
          </div>
          <button
            type="button"
            onClick={() => {
              setInviteOpen(true);
              setInviteResult(null);
              setInviteForm({ name: '', email: '', admin_current_password: '' });
            }}
            className="admin-hero-button"
          >
            <UserPlus className="h-4 w-4" />
            Invite Author
          </button>
        </div>
      </header>

      <section className="admin-surface overflow-hidden">
        <div className="border-b border-slate-200/70 bg-slate-50/60 p-4 dark:border-slate-800/70 dark:bg-slate-950/40">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search by name, email, or slug..."
              className="w-full rounded-xl border border-slate-200/70 bg-white/70 py-2 pl-10 pr-4 text-sm outline-none focus:ring-2 focus:ring-primary-500 dark:border-slate-800/70 dark:bg-slate-950/40"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-50 text-xs uppercase tracking-wider text-slate-500 dark:bg-slate-950/60 dark:text-slate-400">
              <tr>
                <th className="px-5 py-3 font-semibold">User</th>
                <th className="px-5 py-3 font-semibold">Role</th>
                <th className="px-5 py-3 font-semibold">Status</th>
                <th className="px-5 py-3 font-semibold">Articles</th>
                <th className="px-5 py-3 font-semibold">Author URL</th>
                <th className="px-5 py-3 text-right font-semibold">Recovery</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200/70 dark:divide-slate-800/70">
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="px-5 py-10 text-center text-slate-500">
                    <Loader2 className="mx-auto h-6 w-6 animate-spin text-primary-500" />
                  </td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-5 py-10 text-center text-sm text-slate-500">No users found.</td>
                </tr>
              ) : users.map(user => {
                const isProtected = user.role === 'admin';
                return (
                  <tr key={user.id} className="text-sm hover:bg-slate-50 dark:hover:bg-slate-800/50">
                    <td className="px-5 py-4">
                      <div className="font-semibold text-slate-950 dark:text-white">{user.name}</div>
                      <div className="text-slate-500">{user.email}</div>
                    </td>
                    <td className="px-5 py-4">
                      <span className="rounded-full border border-slate-200 px-2.5 py-1 text-xs font-semibold capitalize text-slate-600 dark:border-slate-700 dark:text-slate-300">
                        {user.role}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <span className={`rounded-full border px-2.5 py-1 text-xs font-semibold capitalize ${
                        user.status === 'inactive'
                          ? 'border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-900/50 dark:bg-amber-950/30 dark:text-amber-300'
                          : 'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900/50 dark:bg-emerald-950/30 dark:text-emerald-300'
                      }`}>
                        {user.status || 'active'}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-slate-600 dark:text-slate-300">{user.post_count || 0}</td>
                    <td className="px-5 py-4 font-mono text-xs text-primary-600 dark:text-primary-400">/author/{user.slug}</td>
                    <td className="px-5 py-4">
                      <div className="flex justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => openEmailModal(user)}
                          disabled={isProtected}
                          className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-2 font-semibold text-slate-700 transition-colors hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40 dark:border-slate-800 dark:text-slate-300 dark:hover:bg-slate-800"
                        >
                          <Mail className="h-4 w-4" />
                          Email
                        </button>
                        <button
                          type="button"
                          onClick={() => openPasswordModal(user)}
                          disabled={isProtected}
                          className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-2 font-semibold text-slate-700 transition-colors hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40 dark:border-slate-800 dark:text-slate-300 dark:hover:bg-slate-800"
                        >
                          <KeyRound className="h-4 w-4" />
                          Reset
                        </button>
                        <button
                          type="button"
                          onClick={() => openStatusModal(user)}
                          disabled={isProtected}
                          className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-2 font-semibold text-slate-700 transition-colors hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40 dark:border-slate-800 dark:text-slate-300 dark:hover:bg-slate-800"
                        >
                          {user.status === 'inactive' ? <UserCheck className="h-4 w-4" /> : <Ban className="h-4 w-4" />}
                          {user.status === 'inactive' ? 'Reactivate' : 'Deactivate'}
                        </button>
                        <button
                          type="button"
                          onClick={() => openTransferModal(user)}
                          disabled={isProtected || !(user.post_count && user.post_count > 0)}
                          className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-2 font-semibold text-slate-700 transition-colors hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40 dark:border-slate-800 dark:text-slate-300 dark:hover:bg-slate-800"
                        >
                          <ArrowRightLeft className="h-4 w-4" />
                          Transfer
                        </button>
                        <button
                          type="button"
                          onClick={() => openDeleteModal(user)}
                          disabled={isProtected || Boolean(user.post_count && user.post_count > 0)}
                          title={user.post_count && user.post_count > 0 ? 'Transfer articles before deleting this user' : 'Delete user'}
                          className="inline-flex items-center gap-1.5 rounded-lg border border-red-200 px-3 py-2 font-semibold text-red-600 transition-colors hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-40 dark:border-red-900/50 dark:text-red-400 dark:hover:bg-red-950/30"
                        >
                          <Trash2 className="h-4 w-4" />
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      {inviteOpen && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/50 p-4 backdrop-blur-sm">
          <form onSubmit={handleInviteSubmit} className="w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-slate-800 dark:bg-slate-900">
            <div className="flex items-start gap-3">
              <UserPlus className="mt-1 h-5 w-5 text-primary-500" />
              <div>
                <h2 className="text-xl font-bold text-slate-950 dark:text-white">Invite author</h2>
                <p className="mt-1 text-sm text-slate-500">
                  A new author account will be created with a one-time setup link.
                </p>
              </div>
            </div>

            {inviteResult ? (
              <div className="mt-5 space-y-4">
                <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900 dark:border-amber-900/50 dark:bg-amber-950/30 dark:text-amber-100">
                  Copy this setup link now. It will not be shown again after closing.
                </div>
                <textarea
                  readOnly
                  value={inviteResult.setup_url}
                  className="h-24 w-full rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs text-slate-700 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-300"
                />
                <button type="button" onClick={() => copyLink(inviteResult.setup_url, 'Setup link')} className="inline-flex items-center gap-2 rounded-xl bg-slate-950 px-4 py-2 text-sm font-semibold text-white dark:bg-white dark:text-slate-950">
                  <Copy className="h-4 w-4" />
                  Copy setup link
                </button>
              </div>
            ) : (
              <div className="mt-5 space-y-4">
                <input
                  type="text"
                  value={inviteForm.name}
                  onChange={(event) => setInviteForm(prev => ({ ...prev, name: event.target.value }))}
                  placeholder="Author name"
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary-500 dark:border-slate-800 dark:bg-slate-950"
                  required
                />
                <input
                  type="email"
                  value={inviteForm.email}
                  onChange={(event) => setInviteForm(prev => ({ ...prev, email: event.target.value }))}
                  placeholder="Author email"
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary-500 dark:border-slate-800 dark:bg-slate-950"
                  required
                />
                <input
                  type="password"
                  value={inviteForm.admin_current_password}
                  onChange={(event) => setInviteForm(prev => ({ ...prev, admin_current_password: event.target.value }))}
                  placeholder="Your admin password"
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary-500 dark:border-slate-800 dark:bg-slate-950"
                  required
                />
              </div>
            )}

            <div className="mt-6 flex justify-end gap-2">
              <button type="button" onClick={() => setInviteOpen(false)} className="rounded-xl px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800">Close</button>
              {!inviteResult && (
                <button type="submit" disabled={inviteMutation.isPending} className="inline-flex items-center gap-2 rounded-xl bg-slate-950 px-4 py-2 text-sm font-semibold text-white disabled:opacity-60 dark:bg-white dark:text-slate-950">
                  {inviteMutation.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
                  Create invite
                </button>
              )}
            </div>
          </form>
        </div>
      )}

      {emailTarget && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/50 p-4 backdrop-blur-sm">
          <form onSubmit={handleEmailSubmit} className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-slate-800 dark:bg-slate-900">
            <h2 className="text-xl font-bold text-slate-950 dark:text-white">Reset user email</h2>
            <p className="mt-1 text-sm text-slate-500">{emailTarget.name}</p>
            <div className="mt-5 space-y-4">
              <input
                type="email"
                value={emailForm.email}
                onChange={(event) => setEmailForm(prev => ({ ...prev, email: event.target.value }))}
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary-500 dark:border-slate-800 dark:bg-slate-950"
                required
              />
              <input
                type="password"
                value={emailForm.admin_current_password}
                onChange={(event) => setEmailForm(prev => ({ ...prev, admin_current_password: event.target.value }))}
                placeholder="Your admin password"
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary-500 dark:border-slate-800 dark:bg-slate-950"
                required
              />
            </div>
            <div className="mt-6 flex justify-end gap-2">
              <button type="button" onClick={() => setEmailTarget(null)} className="rounded-xl px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800">Cancel</button>
              <button type="submit" disabled={emailMutation.isPending} className="inline-flex items-center gap-2 rounded-xl bg-slate-950 px-4 py-2 text-sm font-semibold text-white disabled:opacity-60 dark:bg-white dark:text-slate-950">
                {emailMutation.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
                Save
              </button>
            </div>
          </form>
        </div>
      )}

      {passwordTarget && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/50 p-4 backdrop-blur-sm">
          <form onSubmit={handlePasswordResetSubmit} className="w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-slate-800 dark:bg-slate-900">
            <div className="flex items-start gap-3">
              <ShieldAlert className="mt-1 h-5 w-5 text-amber-500" />
              <div>
                <h2 className="text-xl font-bold text-slate-950 dark:text-white">Create password reset link</h2>
                <p className="mt-1 text-sm text-slate-500">For {passwordTarget.name}. The link expires in 30 minutes and can be used once.</p>
              </div>
            </div>

            {resetLink ? (
              <div className="mt-5 space-y-4">
                <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900 dark:border-amber-900/50 dark:bg-amber-950/30 dark:text-amber-100">
                  Copy this link now. It will not be shown again after closing.
                </div>
                <textarea
                  readOnly
                  value={resetLink.reset_url}
                  className="h-24 w-full rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs text-slate-700 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-300"
                />
                <button type="button" onClick={() => copyLink(resetLink.reset_url, 'Reset link')} className="inline-flex items-center gap-2 rounded-xl bg-slate-950 px-4 py-2 text-sm font-semibold text-white dark:bg-white dark:text-slate-950">
                  <Copy className="h-4 w-4" />
                  Copy link
                </button>
              </div>
            ) : (
              <div className="mt-5">
                <input
                  type="password"
                  value={adminPassword}
                  onChange={(event) => setAdminPassword(event.target.value)}
                  placeholder="Your admin password"
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary-500 dark:border-slate-800 dark:bg-slate-950"
                  required
                />
              </div>
            )}

            <div className="mt-6 flex justify-end gap-2">
              <button type="button" onClick={() => setPasswordTarget(null)} className="rounded-xl px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800">Close</button>
              {!resetLink && (
                <button type="submit" disabled={passwordResetMutation.isPending} className="inline-flex items-center gap-2 rounded-xl bg-slate-950 px-4 py-2 text-sm font-semibold text-white disabled:opacity-60 dark:bg-white dark:text-slate-950">
                  {passwordResetMutation.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
                  Create link
                </button>
              )}
            </div>
          </form>
        </div>
      )}

      {statusTarget && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/50 p-4 backdrop-blur-sm">
          <form onSubmit={handleStatusSubmit} className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-slate-800 dark:bg-slate-900">
            <div className="flex items-start gap-3">
              {statusTarget.status === 'inactive' ? <UserCheck className="mt-1 h-5 w-5 text-emerald-500" /> : <Ban className="mt-1 h-5 w-5 text-amber-500" />}
              <div>
                <h2 className="text-xl font-bold text-slate-950 dark:text-white">
                  {statusTarget.status === 'inactive' ? 'Reactivate user' : 'Deactivate user'}
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  {statusTarget.status === 'inactive'
                    ? `${statusTarget.name} will be able to sign in again.`
                    : `${statusTarget.name} will no longer be able to sign in, but their articles keep the author attribution.`}
                </p>
              </div>
            </div>
            <input
              type="password"
              value={statusPassword}
              onChange={(event) => setStatusPassword(event.target.value)}
              placeholder="Your admin password"
              className="mt-5 w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary-500 dark:border-slate-800 dark:bg-slate-950"
              required
            />
            <div className="mt-6 flex justify-end gap-2">
              <button type="button" onClick={() => setStatusTarget(null)} className="rounded-xl px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800">Cancel</button>
              <button type="submit" disabled={statusMutation.isPending} className="inline-flex items-center gap-2 rounded-xl bg-slate-950 px-4 py-2 text-sm font-semibold text-white disabled:opacity-60 dark:bg-white dark:text-slate-950">
                {statusMutation.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
                {statusTarget.status === 'inactive' ? 'Reactivate' : 'Deactivate'}
              </button>
            </div>
          </form>
        </div>
      )}

      {transferTarget && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/50 p-4 backdrop-blur-sm">
          <form onSubmit={handleTransferSubmit} className="w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-slate-800 dark:bg-slate-900">
            <div className="flex items-start gap-3">
              <ArrowRightLeft className="mt-1 h-5 w-5 text-primary-500" />
              <div>
                <h2 className="text-xl font-bold text-slate-950 dark:text-white">Transfer articles</h2>
                <p className="mt-1 text-sm text-slate-500">
                  Move {transferTarget.post_count || 0} article(s) from {transferTarget.name} to another active user.
                </p>
              </div>
            </div>
            <div className="mt-5 space-y-4">
              <select
                value={transferForm.target_user_id}
                onChange={(event) => setTransferForm(prev => ({ ...prev, target_user_id: event.target.value }))}
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary-500 dark:border-slate-800 dark:bg-slate-950"
                required
              >
                <option value="">Select target user</option>
                {users
                  .filter(user => user.id !== transferTarget.id && user.status !== 'inactive')
                  .map(user => (
                    <option key={user.id} value={user.id}>
                      {user.name} ({user.email})
                    </option>
                  ))}
              </select>
              <input
                type="password"
                value={transferForm.admin_current_password}
                onChange={(event) => setTransferForm(prev => ({ ...prev, admin_current_password: event.target.value }))}
                placeholder="Your admin password"
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary-500 dark:border-slate-800 dark:bg-slate-950"
                required
              />
            </div>
            <div className="mt-6 flex justify-end gap-2">
              <button type="button" onClick={() => setTransferTarget(null)} className="rounded-xl px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800">Cancel</button>
              <button type="submit" disabled={transferMutation.isPending || !transferForm.target_user_id} className="inline-flex items-center gap-2 rounded-xl bg-slate-950 px-4 py-2 text-sm font-semibold text-white disabled:opacity-60 dark:bg-white dark:text-slate-950">
                {transferMutation.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
                Transfer articles
              </button>
            </div>
          </form>
        </div>
      )}

      {deleteTarget && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/50 p-4 backdrop-blur-sm">
          <form onSubmit={handleDeleteSubmit} className="w-full max-w-lg rounded-2xl border border-red-200 bg-white p-6 shadow-2xl dark:border-red-900/50 dark:bg-slate-900">
            <div className="flex items-start gap-3">
              <Trash2 className="mt-1 h-5 w-5 text-red-500" />
              <div>
                <h2 className="text-xl font-bold text-slate-950 dark:text-white">Delete user</h2>
                <p className="mt-1 text-sm text-slate-500">
                  This will remove {deleteTarget.name} from the users table. Existing posts will remain, but their author reference will be cleared.
                </p>
              </div>
            </div>

            <div className="mt-5 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-800 dark:border-red-900/50 dark:bg-red-950/30 dark:text-red-200">
              Type <span className="font-mono font-semibold">{deleteTarget.email}</span> and confirm with your admin password.
            </div>

            <div className="mt-5 space-y-4">
              <input
                type="email"
                value={deleteForm.confirm_email}
                onChange={(event) => setDeleteForm(prev => ({ ...prev, confirm_email: event.target.value }))}
                placeholder="Confirm user email"
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-red-500 dark:border-slate-800 dark:bg-slate-950"
                required
              />
              <input
                type="password"
                value={deleteForm.admin_current_password}
                onChange={(event) => setDeleteForm(prev => ({ ...prev, admin_current_password: event.target.value }))}
                placeholder="Your admin password"
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-red-500 dark:border-slate-800 dark:bg-slate-950"
                required
              />
            </div>

            <div className="mt-6 flex justify-end gap-2">
              <button type="button" onClick={() => setDeleteTarget(null)} className="rounded-xl px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800">Cancel</button>
              <button type="submit" disabled={deleteMutation.isPending} className="inline-flex items-center gap-2 rounded-xl bg-red-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-60 hover:bg-red-700">
                {deleteMutation.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
                Delete user
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
