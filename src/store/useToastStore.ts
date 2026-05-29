import { create } from 'zustand';

export type ToastVariant = 'success' | 'error' | 'info';

export type Toast = {
  id: string;
  title: string;
  description?: string;
  variant: ToastVariant;
  createdAt: number;
};

type ToastState = {
  toasts: Toast[];
  push: (toast: Omit<Toast, 'id' | 'createdAt'> & { id?: string; durationMs?: number }) => void;
  dismiss: (id: string) => void;
  clear: () => void;
};

export const useToastStore = create<ToastState>((set, get) => ({
  toasts: [],
  push: ({ id, durationMs = 3200, ...rest }) => {
    const toastId = id || `${Date.now()}-${Math.random().toString(16).slice(2)}`;
    const toast: Toast = { id: toastId, createdAt: Date.now(), ...rest };
    set((state) => ({ toasts: [toast, ...state.toasts].slice(0, 5) }));
    window.setTimeout(() => {
      const exists = get().toasts.some(t => t.id === toastId);
      if (exists) get().dismiss(toastId);
    }, durationMs);
  },
  dismiss: (id) => set((state) => ({ toasts: state.toasts.filter((t) => t.id !== id) })),
  clear: () => set({ toasts: [] }),
}));

