'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAppStore } from '@/store/useAppStore';
import Link from 'next/link';
import { FileText, LogOut, LayoutDashboard, Plus, Loader2, MessageSquare, ExternalLink } from 'lucide-react';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { token, user, logout } = useAppStore();
  const router = useRouter();
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    if (!token && pathname !== '/admin/login') {
      router.push('/admin/login');
    }
  }, [token, pathname, router]);

  // Don't render until client state is ready to prevent hydration mismatch
  if (!mounted) {
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
    { name: 'Posts', href: '/admin/posts', icon: FileText },
    { name: 'Comments', href: '/admin/comments', icon: MessageSquare },
  ];

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex">
      {/* Sidebar */}
      <aside className="w-64 bg-white dark:bg-slate-800 border-r border-slate-200 dark:border-slate-700 hidden md:flex flex-col">
        <div className="p-6 border-b border-slate-200 dark:border-slate-700">
          <Link href="/admin" className="text-2xl font-bold font-serif text-primary-600 dark:text-primary-400">
            Envoyou.
          </Link>
          <p className="text-xs text-slate-500 mt-1">Admin Panel</p>
        </div>

        <div className="flex-1 overflow-y-auto py-6 px-4">
          <Link 
            href="/admin/posts/create"
            className="flex items-center gap-2 w-full px-4 py-2.5 bg-primary-600 hover:bg-primary-700 text-white rounded-lg mb-8 transition-colors font-medium justify-center"
          >
            <Plus className="w-5 h-5" />
            New Post
          </Link>

          <nav className="space-y-1">
            {navItems.map((item) => {
              const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors font-medium ${
                    isActive 
                      ? 'bg-primary-50 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400' 
                      : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700/50'
                  }`}
                >
                  <item.icon className="w-5 h-5" />
                  {item.name}
                </Link>
              );
            })}
          </nav>
        </div>

        <div className="p-4 border-t border-slate-200 dark:border-slate-700">
          <div className="flex items-center gap-3 px-4 py-3 mb-2">
            <div className="w-8 h-8 rounded-full bg-primary-100 dark:bg-primary-900/50 flex items-center justify-center text-primary-700 dark:text-primary-400 font-bold">
              {user?.email?.charAt(0).toUpperCase() || 'A'}
            </div>
            <div className="flex-1 overflow-hidden">
              <p className="text-sm font-medium text-slate-900 dark:text-white truncate">{user?.email}</p>
              <p className="text-xs text-slate-500 capitalize">{user?.role}</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 w-full px-4 py-2.5 text-slate-600 dark:text-slate-400 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-900/20 dark:hover:text-red-400 rounded-lg transition-colors font-medium text-left"
          >
            <LogOut className="w-5 h-5" />
            Logout
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Global Utility Header */}
        <header className="bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 px-4 md:px-8 py-3.5 flex items-center justify-between">
          <div className="flex items-center">
            {/* Can add breadcrumbs or search bar here in the future */}
          </div>
          <div className="flex items-center gap-4">
            <Link 
              href="/" 
              target="_blank" 
              className="flex items-center gap-1.5 text-sm font-medium text-slate-600 hover:text-primary-600 dark:text-slate-400 dark:hover:text-primary-400 transition-colors bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 px-3 py-1.5 rounded-full"
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
    </div>
  );
}
