'use client';

import * as React from 'react';
import { usePathname, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  LayoutDashboard,
  BarChart3,
  FileText,
  UserRound,
  MessageSquare,
  History,
  Tag,
  Users,
  Settings,
  Plus,
  LogOut,
  Sun,
  Moon,
} from 'lucide-react';
import { useAppStore } from '@/store/useAppStore';
import { useTheme } from '@/components/ThemeProvider';
import LogoMark from '@/components/shared/LogoMark';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
} from '@/components/ui/sidebar';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAppStore();
  const { theme, setTheme, systemTheme } = useTheme();

  const isDarkMode = theme === 'dark' || (theme === 'system' && systemTheme === 'dark');

  const toggleTheme = () => {
    const currentTheme = theme === 'system' ? systemTheme : theme;
    setTheme(currentTheme === 'dark' ? 'light' : 'dark');
  };

  const handleLogout = () => {
    logout();
    router.push('/admin/login');
  };

  const navItems = [
    { title: 'Dashboard', url: '/admin', icon: LayoutDashboard },
    { title: 'Analytics', url: '/admin/analytics', icon: BarChart3 },
    { title: 'Posts', url: '/admin/posts', icon: FileText },
    { title: 'Author', url: '/admin/author', icon: UserRound },
    { title: 'Comments', url: '/admin/comments', icon: MessageSquare },
    { title: 'Activity', url: '/admin/activity', icon: History },
    { title: 'Tags', url: '/admin/tags', icon: Tag, adminOnly: true },
    { title: 'Users', url: '/admin/users', icon: Users, adminOnly: true },
    { title: 'Settings', url: '/admin/settings', icon: Settings },
  ];

  const filteredNavItems = navItems.filter(item => !item.adminOnly || user?.role === 'admin');

  return (
    <Sidebar collapsible="icon" variant="inset" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild className="data-[state=open]:bg-sidebar-accent">
              <Link href="/admin">
                <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                  <LogoMark className="size-5" />
                </div>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-semibold font-serif">Editor Admin</span>
                  <span className="truncate text-xs text-muted-foreground">Blog Platform</span>
                </div>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent>
        {/* Quick Create Action */}
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton
                  asChild
                  tooltip="Create Post"
                  className="bg-primary text-primary-foreground hover:bg-primary/90 hover:text-primary-foreground font-semibold"
                >
                  <Link href="/admin/posts/create">
                    <Plus className="size-4" />
                    <span>New Post</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Navigation Group */}
        <SidebarGroup>
          <SidebarGroupLabel>Menu</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {filteredNavItems.map((item) => {
                const isActive = pathname === item.url || (item.url !== '/admin' && pathname.startsWith(item.url));
                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton
                      asChild
                      isActive={isActive}
                      tooltip={item.title}
                      className={isActive ? 'font-semibold' : ''}
                    >
                      <Link href={item.url}>
                        <item.icon className="size-4" />
                        <span>{item.title}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <SidebarMenuButton
                  size="lg"
                  className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
                >
                  <Avatar className="h-8 w-8 rounded-lg border border-border">
                    <AvatarFallback className="rounded-lg bg-primary text-primary-foreground font-bold text-xs">
                      {user?.email?.charAt(0).toUpperCase() || 'A'}
                    </AvatarFallback>
                  </Avatar>
                  <div className="grid flex-1 text-left text-sm leading-tight">
                    <span className="truncate font-semibold">{user?.email || 'Admin User'}</span>
                    <span className="truncate text-xs text-muted-foreground capitalize">{user?.role || 'user'}</span>
                  </div>
                </SidebarMenuButton>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                className="w-[--radix-dropdown-menu-trigger-width] min-w-56 rounded-xl"
                side="top"
                align="end"
                sideOffset={8}
              >
                <DropdownMenuLabel className="font-normal p-2">
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
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
