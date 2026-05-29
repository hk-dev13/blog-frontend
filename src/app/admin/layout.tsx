'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAppStore } from '@/store/useAppStore';
import Link from 'next/link';
import { FileText, LogOut, LayoutDashboard, Plus, Loader2, MessageSquare, ExternalLink, Search, UserRound, History, Tag, BarChart3 } from 'lucide-react';
import AdminCommandPalette from '@/components/admin/AdminCommandPalette';
import AdminToastViewport from '@/components/admin/AdminToastViewport';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { token, user, logout } = useAppStore();
  const router = useRouter();
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);
  const [authHydrated, setAuthHydrated] = useState(false);

  useEffect(() => {
    setMounted(true);
    setAuthHydrated(useAppStore.persist.hasHydrated());

    const unsub = useAppStore.persist.onFinishHydration(() => {
      setAuthHydrated(true);
    });

    return () => unsub();
  }, []);

  useEffect(() => {
    if (!authHydrated) return;
    if (!token && pathname !== '/admin/login') {
      router.push('/admin/login');
    }
  }, [authHydrated, token, pathname, router]);

  // Don't render until client state is ready to prevent hydration mismatch
  if (!mounted || !authHydrated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-900">
        <Loader2 className="w-8 h-8 animate-spin text-primary-500" />
      </div>
    );
  }

  // If it's the login page, render without sidebar
  if (pathname === '/admin/login') {
    return <>{children}</>;
  }

  // If not logged in and not on login page, don't render children while redirecting
  if (!token) {
    return null;
  }

  const handleLogout = () => {
    logout();
    router.push('/admin/login');
  };

  const navItems = [
    { name: 'Dashboard', href: '/admin', icon: LayoutDashboard },
    { name: 'Analytics', href: '/admin/analytics', icon: BarChart3 },
    { name: 'Posts', href: '/admin/posts', icon: FileText },
    { name: 'Author', href: '/admin/author', icon: UserRound },
    { name: 'Comments', href: '/admin/comments', icon: MessageSquare },
    { name: 'Activity', href: '/admin/activity', icon: History },
    { name: 'Tags', href: '/admin/tags', icon: Tag, adminOnly: true },
  ];

  const filteredNavItems = navItems.filter(item => !item.adminOnly || user?.role === 'admin');

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      <div className="pointer-events-none fixed inset-0 -z-10 bg-[radial-gradient(circle_at_20%_0%,rgba(13,135,207,0.14),transparent_45%),radial-gradient(circle_at_80%_10%,rgba(99,102,241,0.10),transparent_38%),linear-gradient(180deg,rgba(255,255,255,0.8),rgba(255,255,255,0))] dark:bg-[radial-gradient(circle_at_20%_0%,rgba(13,135,207,0.22),transparent_45%),radial-gradient(circle_at_80%_10%,rgba(99,102,241,0.16),transparent_38%),linear-gradient(180deg,rgba(2,6,23,0.7),rgba(2,6,23,0))]" />
      <div className="min-h-screen flex">
      {/* Sidebar */}
      <aside className="hidden md:flex w-72 flex-col p-4">
        <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-2xl border border-slate-200/70 bg-white/80 shadow-sm backdrop-blur dark:border-slate-800/70 dark:bg-slate-900/60">
          <div className="relative overflow-hidden border-b border-slate-200/70 px-6 py-6 dark:border-slate-800/70">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_0%,rgba(13,135,207,0.16),transparent_42%),linear-gradient(180deg,rgba(255,255,255,0.55),transparent)] dark:bg-[radial-gradient(circle_at_30%_0%,rgba(13,135,207,0.22),transparent_42%),linear-gradient(180deg,rgba(255,255,255,0.06),transparent)]" />
            <div className="relative">
              <Link href="/admin" className="text-2xl font-bold font-serif text-slate-950 dark:text-white">
                Editor
              </Link>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Admin Panel</p>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto py-6 px-4">
          <Link
            href="/admin/posts/create"
            className="group relative flex items-center justify-center gap-2 w-full px-4 py-2.5 rounded-xl mb-7 font-semibold text-white shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md bg-primary-600 hover:bg-primary-700"
          >
            <Plus className="w-5 h-5" />
            New Post
          </Link>

          <nav className="space-y-1">
            {filteredNavItems.map((item) => {
              const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`group flex items-center gap-3 px-3.5 py-3 rounded-xl transition-all font-semibold ${isActive
                      ? 'bg-slate-950 text-white shadow-sm dark:bg-white dark:text-slate-950'
                      : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100/80 dark:hover:bg-slate-800/70'
                    }`}
                >
                  <span className={`grid h-9 w-9 place-items-center rounded-xl border transition-colors ${isActive
                      ? 'border-white/15 bg-white/10 dark:border-slate-200 dark:bg-slate-100'
                      : 'border-slate-200/70 bg-white/70 dark:border-slate-800/70 dark:bg-slate-900/40'
                    }`}
                  >
                    <item.icon className={`w-5 h-5 ${isActive ? 'text-white dark:text-slate-900' : 'text-slate-500 dark:text-slate-400 group-hover:text-slate-900 dark:group-hover:text-white'}`} />
                  </span>
                  {item.name}
                </Link>
              );
            })}
          </nav>
        </div>

          <div className="p-4 border-t border-slate-200/70 dark:border-slate-800/70">
            <div className="flex items-center gap-3 rounded-2xl border border-slate-200/70 bg-white/70 px-4 py-3 mb-2 shadow-sm dark:border-slate-800/70 dark:bg-slate-900/40">
              <div className="w-9 h-9 rounded-full bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center text-white font-bold shadow-sm ring-4 ring-primary-500/10 dark:ring-primary-400/10">
                {user?.email?.charAt(0).toUpperCase() || 'A'}
              </div>
              <div className="flex-1 overflow-hidden">
                <p className="text-sm font-semibold text-slate-900 dark:text-white truncate">{user?.email}</p>
                <p className="text-xs text-slate-500 dark:text-slate-400 capitalize">{user?.role}</p>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="flex items-center gap-3 w-full px-4 py-2.5 text-slate-700 dark:text-slate-300 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-900/20 dark:hover:text-red-400 rounded-xl transition-colors font-semibold text-left"
            >
              <LogOut className="w-5 h-5" />
              Logout
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Global Utility Header */}
        <header className="sticky top-0 z-20 border-b border-slate-200/70 bg-white/70 backdrop-blur supports-[backdrop-filter]:bg-white/55 dark:border-slate-800/70 dark:bg-slate-950/45 px-4 md:px-8 py-3.5 flex items-center justify-between">
          <div className="flex items-center">
            {/* Can add breadcrumbs or search bar here in the future */}
          </div>
          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={() => window.dispatchEvent(new Event('admin:command-palette'))}
              className="hidden md:flex items-center gap-2 text-sm font-semibold text-slate-700 hover:text-slate-950 dark:text-slate-300 dark:hover:text-white transition-colors bg-white/70 hover:bg-white dark:bg-slate-900/50 dark:hover:bg-slate-900 px-3 py-1.5 rounded-full border border-slate-200/70 dark:border-slate-800/70 shadow-sm"
              title="Search (Ctrl/⌘K)"
            >
              <Search className="w-4 h-4" />
              Search
              <span className="ml-1 text-[11px] font-semibold text-slate-400 dark:text-slate-500">Ctrl/⌘K</span>
            </button>
            <Link
              href="/"
              target="_blank"
              className="flex items-center gap-1.5 text-sm font-semibold text-slate-700 hover:text-primary-600 dark:text-slate-300 dark:hover:text-primary-400 transition-colors bg-white/70 hover:bg-white dark:bg-slate-900/50 dark:hover:bg-slate-900 px-3 py-1.5 rounded-full border border-slate-200/70 dark:border-slate-800/70 shadow-sm"
            >
              View Web <ExternalLink className="w-3.5 h-3.5" />
            </Link>

            {/* Mobile Logout (since sidebar might be hidden) */}
            <button onClick={handleLogout} className="md:hidden p-2 text-slate-600 dark:text-slate-400 hover:text-red-600 dark:hover:text-red-400 transition-colors" title="Logout">
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-4 md:p-8">
          {children}
        </div>
      </main>
      <AdminCommandPalette userRole={user?.role} />
      <AdminToastViewport />
      </div>
    </div>
  );
}
