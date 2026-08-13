import type { StateStorage } from 'zustand/middleware';

export const chromeStorage: StateStorage = {
    getItem: async (name: string): Promise<string | null> => {
        if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.sync) {
            const result = await chrome.storage.sync.get([name]);
            return (result[name] as string | undefined) || null;
        }
        return localStorage.getItem(name);
    },
    setItem: async (name: string, value: string): Promise<void> => {
        if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.sync) {
            await chrome.storage.sync.set({ [name]: value });
        } else {
            localStorage.setItem(name, value);
        }
    },
    removeItem: async (name: string): Promise<void> => {
        if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.sync) {
            await chrome.storage.sync.remove([name]);
        } else {
            localStorage.removeItem(name);
        }
    },
};
