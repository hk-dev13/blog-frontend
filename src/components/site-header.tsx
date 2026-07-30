'use client';

import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from '@/components/ui/breadcrumb';
import { Search, ExternalLink, Sun, Moon } from 'lucide-react';
import { useTheme } from '@/components/ThemeProvider';
import { usePathname } from 'next/navigation';
import Link from 'next/link';

export function SiteHeader() {
  const pathname = usePathname();
  const { theme, setTheme, systemTheme } = useTheme();

  const isDarkMode = theme === 'dark' || (theme === 'system' && systemTheme === 'dark');

  const toggleTheme = () => {
    const currentTheme = theme === 'system' ? systemTheme : theme;
    setTheme(currentTheme === 'dark' ? 'light' : 'dark');
  };

  const getBreadcrumbTitle = () => {
    if (pathname === '/admin') return 'Overview';
    const sub = pathname.replace('/admin/', '');
    return sub.charAt(0).toUpperCase() + sub.slice(1);
  };

  return (
    <header className="sticky top-0 z-20 flex h-(--header-height) shrink-0 items-center gap-2 border-b bg-card/80 backdrop-blur transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-(--header-height)">
      <div className="flex w-full items-center gap-2 px-4 lg:px-6">
        <SidebarTrigger className="-ml-1" />
        <Separator
          orientation="vertical"
          className="mx-1.5 data-[orientation=vertical]:h-4"
        />
        <Breadcrumb className="hidden sm:block">
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink asChild>
                <Link href="/admin">Admin</Link>
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>{getBreadcrumbTitle()}</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>

        <div className="ml-auto flex items-center gap-2">
          {/* Command Palette Trigger Input */}
          <button
            type="button"
            onClick={() => window.dispatchEvent(new Event('admin:command-palette'))}
            className="flex items-center gap-2 text-xs text-muted-foreground bg-muted/60 hover:bg-accent transition-colors px-3 py-1.5 rounded-xl border border-border shadow-xs w-48 sm:w-64 justify-between"
          >
            <span className="flex items-center gap-2 truncate">
              <Search className="w-3.5 h-3.5" />
              <span className="truncate">Search...</span>
            </span>
            <kbd className="pointer-events-none hidden sm:inline-flex h-5 select-none items-center gap-1 rounded border border-border bg-background px-1.5 font-mono text-[10px] font-medium text-muted-foreground opacity-100">
              <span className="text-xs">⌘</span>K
            </kbd>
          </button>

          <Button
            variant="outline"
            size="sm"
            className="hidden sm:inline-flex items-center gap-1.5 text-xs rounded-xl"
            asChild
          >
            <Link href="/" target="_blank">
              Web <ExternalLink className="w-3.5 h-3.5" />
            </Link>
          </Button>

          {/* Theme Toggle Button */}
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleTheme}
            className="h-8 w-8 rounded-xl"
            title={isDarkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
          >
            {isDarkMode ? (
              <Sun className="w-4 h-4 text-amber-400" />
            ) : (
              <Moon className="w-4 h-4 text-muted-foreground" />
            )}
          </Button>
        </div>
      </div>
    </header>
  );
}
