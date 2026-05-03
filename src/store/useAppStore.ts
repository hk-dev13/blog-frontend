import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface AppState {
  theme: 'light' | 'dark' | 'system';
  setTheme: (theme: 'light' | 'dark' | 'system') => void;
  isSearchOpen: boolean;
  setSearchOpen: (isOpen: boolean) => void;
}

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      theme: 'system',
      setTheme: (theme) => set({ theme }),
      isSearchOpen: false,
      setSearchOpen: (isSearchOpen) => set({ isSearchOpen }),
    }),
    {
      name: 'blog-envoyou-storage',
      partialize: (state) => ({ theme: state.theme }), // Only persist theme
    }
  )
);
