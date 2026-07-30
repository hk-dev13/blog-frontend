'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAppStore } from '@/store/useAppStore';
import { Loader2 } from 'lucide-react';
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/app-sidebar';
import { SiteHeader } from '@/components/site-header';
import AdminCommandPalette from '@/components/admin/AdminCommandPalette';
import AdminToastViewport from '@/components/admin/AdminToastViewport';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { token, user } = useAppStore();
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
    if (!token && pathname !== '/admin/login' && pathname !== '/admin/reset-password') {
      router.push('/admin/login');
    }
  }, [authHydrated, token, pathname, router]);

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

  return (
    <SidebarProvider
      style={
        {
          '--sidebar-width': 'calc(var(--spacing) * 64)',
          '--header-height': 'calc(var(--spacing) * 12)',
        } as React.CSSProperties
      }
    >
      <AppSidebar variant="inset" />
      <SidebarInset>
        <SiteHeader />
        <div className="flex flex-1 flex-col p-4 md:p-6 space-y-6 overflow-y-auto">
          {children}
        </div>
      </SidebarInset>
      <AdminCommandPalette userRole={user?.role} />
      <AdminToastViewport />
    </SidebarProvider>
  );
}
