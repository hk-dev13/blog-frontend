'use client';

import type { ReactNode } from 'react';

interface PostEditorLayoutProps {
  children: ReactNode;
  sidebar?: ReactNode;
  showSidebar: boolean;
}

/**
 * Grid layout for post editor with explicit sidebar width clamping.
 * Prevents main content compression on smaller screens while guaranteeing
 * exact fixed width (18rem to 22rem) on wide desktops.
 */
export function PostEditorLayout({
  children,
  sidebar,
  showSidebar,
}: PostEditorLayoutProps) {
  return (
    <div
      className={`grid grid-cols-1 gap-6 ${
        showSidebar
          ? 'lg:grid-cols-[minmax(0,1fr)_clamp(18rem,22vw,22rem)]'
          : ''
      }`}
    >
      {/* Main Editor Column */}
      <div className="space-y-6 min-w-0">{children}</div>

      {/* Settings Sidebar Column */}
      {showSidebar && sidebar && (
        <div className="space-y-6 animate-in fade-in duration-200 min-w-0">
          {sidebar}
        </div>
      )}
    </div>
  );
}
