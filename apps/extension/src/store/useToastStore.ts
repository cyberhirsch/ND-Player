import { create } from 'zustand';

export type ToastKind = 'info' | 'success' | 'error';

export interface Toast {
    id: number;
    message: string;
    kind: ToastKind;
}

interface ToastState {
    toasts: Toast[];
    push: (message: string, kind?: ToastKind) => void;
    dismiss: (id: number) => void;
}

let nextId = 1;
const AUTO_DISMISS_MS = 4500;

export const useToastStore = create<ToastState>()((set, get) => ({
    toasts: [],
    push: (message, kind = 'info') => {
        const id = nextId++;
        // Keep the stack short; drop the oldest beyond four.
        set({ toasts: [...get().toasts.slice(-3), { id, message, kind }] });
        window.setTimeout(() => get().dismiss(id), AUTO_DISMISS_MS);
    },
    dismiss: (id) => set({ toasts: get().toasts.filter(t => t.id !== id) }),
}));

/** Fire-and-forget notifications usable outside React. */
export const toast = {
    info: (message: string) => useToastStore.getState().push(message, 'info'),
    success: (message: string) => useToastStore.getState().push(message, 'success'),
    error: (message: string) => useToastStore.getState().push(message, 'error'),
};
