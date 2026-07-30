'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAppStore } from '@/store/useAppStore';
import Link from 'next/link';
import {
  FileText,
  LogOut,
  LayoutDashboard,
  Plus,
  Loader2,
  MessageSquare,
  ExternalLink,
  Search,
  UserRound,
  History,
  Tag,
  BarChart3,
  Settings,
  Users,
  PanelLeftClose,
  PanelLeftOpen,
  Menu,
  X,
} from 'lucide-react';
import AdminCommandPalette from '@/components/admin/AdminCommandPalette';
import AdminToastViewport from '@/components/admin/AdminToastViewport';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { token, user, logout } = useAppStore();
  const router = useRouter();
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);
  const [authHydrated, setAuthHydrated] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

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
    if (!token && pathname !== '/admin/login' && pathname !== '/admin/reset-password') {
      router.push('/admin/login');
    }
  }, [authHydrated, token, pathname, router]);

  // Close mobile drawer on route change
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [pathname]);

  // Don't render until client state is ready to prevent hydration mismatch
  if (!mounted || !authHydrated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-900">
        <Loader2 className="w-8 h-8 animate-spin text-primary-500" />
      </div>
    );
  }

  // If it's the login page, render without sidebar
  if (pathname === '/admin/login' || pathname === '/admin/reset-password') {
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
    { name: 'Users', href: '/admin/users', icon: Users, adminOnly: true },
    { name: 'Settings', href: '/admin/settings', icon: Settings },
  ];

  const filteredNavItems = navItems.filter((item) => !item.adminOnly || user?.role === 'admin');

  // Shared nav content component for desktop + mobile
  const renderNavContent = (collapsed: boolean, isMobile = false) => (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-2xl border border-slate-200/70 bg-white/80 shadow-sm backdrop-blur dark:border-slate-800/70 dark:bg-slate-900/60">
      <div className="relative overflow-hidden border-b border-slate-200/70 px-4 py-4 dark:border-slate-800/70 flex items-center justify-between">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_0%,rgba(13,135,207,0.16),transparent_42%),linear-gradient(180deg,rgba(255,255,255,0.55),transparent)] dark:bg-[radial-gradient(circle_at_30%_0%,rgba(13,135,207,0.22),transparent_42%),linear-gradient(180deg,rgba(255,255,255,0.06),transparent)]" />
        <div className="relative overflow-hidden">
          <Link href="/admin" className="text-xl font-bold font-serif text-slate-950 dark:text-white block truncate">
            {collapsed ? 'E' : 'Editor'}
          </Link>
          {!collapsed && <p className="text-xs text-slate-500 dark:text-slate-400">Admin Panel</p>}
        </div>
        {!isMobile ? (
          <button
            type="button"
            onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
            className="relative z-10 p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            aria-label={collapsed ? 'Perluas sidebar' : 'Ciutkan sidebar'}
          >
            {collapsed ? <PanelLeftOpen className="w-4 h-4" /> : <PanelLeftClose className="w-4 h-4" />}
          </button>
        ) : (
          <button
            type="button"
            onClick={() => setMobileMenuOpen(false)}
            className="relative z-10 p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            aria-label="Tutup menu"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      <div className="flex-1 overflow-y-auto py-6 px-1.5">
        <Link
          href="/admin/posts/create"
          className={`group relative flex items-center gap-2 w-full px-3 py-2 rounded-xl mb-6 font-semibold text-slate-500 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md bg-white hover:text-slate-900 hover:bg-slate-100 dark:text-slate-400 dark:bg-slate-900 dark:hover:bg-slate-800 dark:hover:text-white ${
            collapsed ? 'justify-center' : ''
          }`}
          title="New Post"
        >
          <Plus className="w-4 h-4 text-primary-500" />
          {!collapsed && <span>New Post</span>}
        </Link>

        <nav className="space-y-1">
          {filteredNavItems.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
            return (
              <Link
                key={item.name}
                href={item.href}
                title={collapsed ? item.name : undefined}
                className={`group flex items-center gap-2 px-3 py-2 rounded-xl transition-all font-semibold ${
                  collapsed ? 'justify-center' : ''
                } ${
                  isActive
                    ? 'bg-slate-100 text-slate-900 shadow-sm dark:bg-slate-800 dark:text-white'
                    : 'text-slate-500 dark:text-slate-400 hover:bg-slate-100/80 dark:hover:bg-slate-800/70'
                }`}
              >
                <span
                  className={`grid h-7 w-7 place-items-center rounded-xl border transition-colors ${
                    isActive
                      ? 'border-white/15 bg-white/10 dark:border-slate-900/5 dark:bg-slate-800'
                      : 'border-slate-200/70 bg-white/70 dark:border-slate-900/5 dark:bg-slate-900/40'
                  }`}
                >
                  <item.icon
                    className={`w-3.5 h-3.5 ${
                      isActive
                        ? 'text-slate-900 dark:text-slate-100'
                        : 'text-slate-500 dark:text-slate-400 group-hover:text-slate-900 dark:group-hover:text-white'
                    }`}
                  />
                </span>
                {!collapsed && <span>{item.name}</span>}
              </Link>
            );
          })}
        </nav>
      </div>

      <div className="p-3 border-t border-slate-200/70 dark:border-slate-800/70">
        <div
          className={`flex items-center gap-2 rounded-2xl border border-slate-200/70 bg-white/70 px-3 py-2 mb-2 shadow-sm dark:border-slate-800/70 dark:bg-slate-900/40 ${
            collapsed ? 'justify-center' : ''
          }`}
        >
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center text-white font-bold text-xs shadow-sm ring-2 ring-primary-500/10 dark:ring-primary-400/10 shrink-0">
            {user?.email?.charAt(0).toUpperCase() || 'A'}
          </div>
          {!collapsed && (
            <div className="flex-1 overflow-hidden">
              <p className="text-xs font-semibold text-slate-900 dark:text-white truncate">{user?.email}</p>
              <p className="text-[10px] text-slate-500 dark:text-slate-400 capitalize">{user?.role}</p>
            </div>
          )}
        </div>
        <button
          onClick={handleLogout}
          title={collapsed ? 'Logout' : undefined}
          className={`flex items-center gap-2 w-full px-3 py-1.5 text-slate-700 dark:text-slate-500 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-900/20 dark:hover:text-red-400 rounded-xl transition-colors font-semibold text-left text-xs ${
            collapsed ? 'justify-center' : ''
          }`}
        >
          <LogOut className="w-4 h-4" />
          {!collapsed && <span>Logout</span>}
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      <div className="pointer-events-none fixed inset-0 -z-10 bg-[radial-gradient(circle_at_20%_0%,rgba(13,135,207,0.14),transparent_45%),radial-gradient(circle_at_80%_10%,rgba(99,102,241,0.10),transparent_38%),linear-gradient(180deg,rgba(255,255,255,0.8),rgba(255,255,255,0))] dark:bg-[radial-gradient(circle_at_20%_0%,rgba(13,135,207,0.22),transparent_45%),radial-gradient(circle_at_80%_10%,rgba(99,102,241,0.16),transparent_38%),linear-gradient(180deg,rgba(2,6,23,0.7),rgba(2,6,23,0))]" />
      <div className="min-h-screen flex">
        {/* Desktop Sidebar */}
        <aside className={`hidden md:flex flex-col p-4 transition-all duration-300 ${isSidebarCollapsed ? 'w-20' : 'w-72'}`}>
          {renderNavContent(isSidebarCollapsed)}
        </aside>

        {/* Mobile Slide-Over Sidebar Drawer */}
        {mobileMenuOpen && (
          <>
            <div
              className="fixed inset-0 z-40 bg-slate-900/50 backdrop-blur-sm md:hidden animate-in fade-in duration-200"
              onClick={() => setMobileMenuOpen(false)}
            />
            <aside className="fixed inset-y-0 left-0 z-50 w-72 p-3 md:hidden shadow-2xl animate-in slide-in-from-left duration-300">
              {renderNavContent(false, true)}
            </aside>
          </>
        )}

        {/* Main Content Area */}
        <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
          {/* Global Utility Header */}
          <header className="sticky top-0 z-20 border-b border-slate-200/70 bg-white/70 backdrop-blur supports-[backdrop-filter]:bg-white/55 dark:border-slate-800/70 dark:bg-slate-950/45 px-4 md:px-8 py-3.5 flex items-center justify-between">
            <div className="flex items-center gap-3">
              {/* Mobile Hamburger Toggle */}
              <button
                type="button"
                onClick={() => setMobileMenuOpen(true)}
                className="md:hidden p-1.5 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                aria-label="Buka menu navigasi"
              >
                <Menu className="w-5 h-5" />
              </button>
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

              {/* Mobile Logout */}
              <button
                onClick={handleLogout}
                className="md:hidden p-2 text-slate-600 dark:text-slate-400 hover:text-red-600 dark:hover:text-red-400 transition-colors"
                aria-label="Logout"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </header>

          <div className="flex-1 overflow-y-auto p-4 md:p-8">{children}</div>
        </main>
        <AdminCommandPalette userRole={user?.role} />
        <AdminToastViewport />
      </div>
    </div>
  );
}
