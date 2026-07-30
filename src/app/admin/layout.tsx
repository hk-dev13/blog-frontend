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
  Sun,
  Moon,
} from 'lucide-react';
import { useTheme } from '@/components/ThemeProvider';
import AdminCommandPalette from '@/components/admin/AdminCommandPalette';
import AdminToastViewport from '@/components/admin/AdminToastViewport';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { token, user, logout } = useAppStore();
  const router = useRouter();
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);
  const [authHydrated, setAuthHydrated] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { theme, setTheme, systemTheme } = useTheme();

  const toggleTheme = () => {
    const currentTheme = theme === 'system' ? systemTheme : theme;
    setTheme(currentTheme === 'dark' ? 'light' : 'dark');
  };

  const isDarkMode = mounted && (theme === 'dark' || (theme === 'system' && systemTheme === 'dark'));

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
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
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
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
      <div className={`relative overflow-hidden border-b border-border py-4 flex items-center ${collapsed ? 'flex-col justify-center gap-2.5 px-2' : 'justify-between px-4'}`}>
        <div className="relative overflow-hidden text-center">
          <Link href="/admin" className="text-xl font-bold font-serif text-foreground block truncate">
            {collapsed ? 'E' : 'Editor'}
          </Link>
          {!collapsed && <p className="text-xs text-muted-foreground">Admin Panel</p>}
        </div>
        {!isMobile ? (
          <button
            type="button"
            onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
            className={`relative z-10 text-muted-foreground hover:text-foreground hover:bg-accent transition-colors ${
              collapsed ? 'w-9 h-9 rounded-full flex items-center justify-center' : 'p-1.5 rounded-lg'
            }`}
            aria-label={collapsed ? 'Perluas sidebar' : 'Ciutkan sidebar'}
          >
            {collapsed ? <PanelLeftOpen className="w-4 h-4" /> : <PanelLeftClose className="w-4 h-4" />}
          </button>
        ) : (
          <button
            type="button"
            onClick={() => setMobileMenuOpen(false)}
            className="relative z-10 p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
            aria-label="Tutup menu"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      <div className="flex-1 overflow-y-auto py-6 px-2">
        <Link
          href="/admin/posts/create"
          className={`group relative font-semibold transition-all hover:scale-102 bg-primary text-primary-foreground hover:bg-primary/90 mb-6 shadow-sm ${
            collapsed
              ? 'w-10 h-10 rounded-full flex items-center justify-center mx-auto'
              : 'flex items-center justify-center gap-2 w-full px-3 py-2 rounded-xl'
          }`}
          title="New Post"
        >
          <Plus className="w-4 h-4" />
          {!collapsed && <span>New Post</span>}
        </Link>

        <nav className="space-y-1">
          {filteredNavItems.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
            if (collapsed) {
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  title={item.name}
                  className={`group flex items-center justify-center w-10 h-10 mx-auto rounded-xl transition-all ${
                    isActive
                      ? 'bg-primary text-primary-foreground shadow-sm'
                      : 'text-muted-foreground hover:bg-accent hover:text-foreground'
                  }`}
                >
                  <item.icon className="w-4 h-4" />
                </Link>
              );
            }

            return (
              <Link
                key={item.name}
                href={item.href}
                className={`group flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all font-medium text-sm ${
                  isActive
                    ? 'bg-accent text-accent-foreground font-semibold shadow-sm'
                    : 'text-muted-foreground hover:bg-accent/60 hover:text-foreground'
                }`}
              >
                <item.icon className={`w-4 h-4 ${isActive ? 'text-primary' : 'text-muted-foreground group-hover:text-foreground'}`} />
                <span>{item.name}</span>
              </Link>
            );
          })}
        </nav>
      </div>

      <div className="p-3 border-t border-border">
        {collapsed ? (
          <div className="flex flex-col items-center gap-3 py-1">
            <Avatar className="w-9 h-9 border border-border">
              <AvatarFallback className="bg-primary text-primary-foreground font-bold text-xs">
                {user?.email?.charAt(0).toUpperCase() || 'A'}
              </AvatarFallback>
            </Avatar>
            <button
              type="button"
              onClick={toggleTheme}
              className="w-9 h-9 rounded-xl flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
              title={isDarkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            >
              {isDarkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4" />}
            </button>
            <button
              onClick={handleLogout}
              title="Logout"
              className="w-9 h-9 rounded-xl flex items-center justify-center text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-all"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <div className="flex items-center justify-between gap-2 p-1.5 rounded-xl border border-border bg-background">
            <div className="flex items-center gap-2 min-w-0">
              <Avatar className="w-8 h-8 border border-border">
                <AvatarFallback className="bg-primary text-primary-foreground font-bold text-xs">
                  {user?.email?.charAt(0).toUpperCase() || 'A'}
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-semibold text-foreground truncate">{user?.email}</p>
                <p className="text-[10px] text-muted-foreground capitalize">{user?.role || 'user'}</p>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="p-1.5 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-lg transition-colors"
              title="Logout"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="min-h-screen flex">
        {/* Desktop Sidebar */}
        <aside className={`hidden md:flex flex-col p-4 transition-all duration-300 ${isSidebarCollapsed ? 'w-20' : 'w-64'}`}>
          {renderNavContent(isSidebarCollapsed)}
        </aside>

        {/* Mobile Slide-Over Sidebar Drawer */}
        {mobileMenuOpen && (
          <>
            <div
              className="fixed inset-0 z-40 bg-slate-950/60 backdrop-blur-sm md:hidden animate-in fade-in duration-200"
              onClick={() => setMobileMenuOpen(false)}
            />
            <aside className="fixed inset-y-0 left-0 z-50 w-64 p-3 md:hidden shadow-2xl animate-in slide-in-from-left duration-300">
              {renderNavContent(false, true)}
            </aside>
          </>
        )}

        {/* Main Content Area */}
        <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
          {/* Dashboard-01 Topbar Header */}
          <header className="sticky top-0 z-20 border-b border-border bg-card/80 backdrop-blur supports-[backdrop-filter]:bg-card/60 px-4 md:px-8 py-3 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              {/* Mobile Hamburger Toggle */}
              <button
                type="button"
                onClick={() => setMobileMenuOpen(true)}
                className="md:hidden p-2 rounded-lg text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
                aria-label="Buka menu navigasi"
              >
                <Menu className="w-5 h-5" />
              </button>

              {/* Command Palette Trigger Input */}
              <button
                type="button"
                onClick={() => window.dispatchEvent(new Event('admin:command-palette'))}
                className="hidden sm:flex items-center gap-2 text-xs text-muted-foreground bg-muted/60 hover:bg-accent transition-colors px-3 py-2 rounded-xl border border-border shadow-xs w-64 justify-between"
              >
                <span className="flex items-center gap-2 truncate">
                  <Search className="w-3.5 h-3.5" />
                  <span>Search posts, tags...</span>
                </span>
                <kbd className="pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border border-border bg-background px-1.5 font-mono text-[10px] font-medium text-muted-foreground opacity-100">
                  <span className="text-xs">⌘</span>K
                </kbd>
              </button>
            </div>

            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                size="sm"
                className="hidden sm:inline-flex items-center gap-1.5 text-xs rounded-xl"
                asChild
              >
                <Link href="/" target="_blank">
                  View Web <ExternalLink className="w-3.5 h-3.5" />
                </Link>
              </Button>

              {/* User Profile Dropdown Menu */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative h-9 w-9 rounded-full p-0">
                    <Avatar className="h-9 w-9 border border-border">
                      <AvatarFallback className="bg-primary text-primary-foreground font-semibold text-xs">
                        {user?.email?.charAt(0).toUpperCase() || 'A'}
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56" align="end" forceMount>
                  <DropdownMenuLabel className="font-normal">
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-semibold leading-none truncate">{user?.email}</p>
                      <p className="text-xs leading-none text-muted-foreground capitalize">{user?.role || 'user'}</p>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={toggleTheme} className="cursor-pointer">
                    {isDarkMode ? <Sun className="mr-2 h-4 w-4 text-amber-400" /> : <Moon className="mr-2 h-4 w-4 text-muted-foreground" />}
                    <span>{isDarkMode ? 'Light Mode' : 'Dark Mode'}</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => router.push('/admin/settings')} className="cursor-pointer">
                    <Settings className="mr-2 h-4 w-4 text-muted-foreground" />
                    <span>Settings</span>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleLogout} className="cursor-pointer text-destructive focus:text-destructive">
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Logout</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
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
