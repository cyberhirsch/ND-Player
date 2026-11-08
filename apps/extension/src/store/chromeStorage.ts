import type { StateStorage } from 'zustand/middleware';

const hasChromeStorage = () => typeof chrome !== 'undefined' && !!chrome.storage?.local;

/**
 * Zustand storage backed by chrome.storage.local (localStorage outside the extension, e.g. the Vite dev server).
 *
 * Versions up to 1.0.2 kept settings in chrome.storage.sync, which copied the auth token to every Chrome
 * profile on the Google account. On first read the value is moved to local storage and removed from sync.
 */
export const chromeStorage: StateStorage = {
    getItem: async (name: string): Promise<string | null> => {
        if (!hasChromeStorage()) return localStorage.getItem(name);

        const local = await chrome.storage.local.get(name);
        if (typeof local[name] === 'string') return local[name] as string;

        if (chrome.storage.sync) {
            const synced = await chrome.storage.sync.get(name);
            const value = synced[name];
            if (typeof value === 'string') {
                await chrome.storage.local.set({ [name]: value });
                await chrome.storage.sync.remove(name);
                return value;
            }
        }
        return null;
    },
    setItem: async (name: string, value: string): Promise<void> => {
        if (hasChromeStorage()) {
            await chrome.storage.local.set({ [name]: value });
        } else {
            localStorage.setItem(name, value);
        }
    },
    removeItem: async (name: string): Promise<void> => {
        if (hasChromeStorage()) {
            await chrome.storage.local.remove(name);
        } else {
            localStorage.removeItem(name);
        }
    },
};

/**
 * localStorage that batches writes. The player store changes several times a second during playback;
 * writing the whole queue on every tick is wasteful, so writes are coalesced and flushed when the page hides.
 */
export const createDebouncedLocalStorage = (delayMs = 1000): StateStorage => {
    const pending = new Map<string, string>();
    let timer: number | undefined;

    const flush = () => {
        if (timer !== undefined) {
            window.clearTimeout(timer);
            timer = undefined;
        }
        pending.forEach((value, key) => {
            try {
                localStorage.setItem(key, value);
            } catch (error) {
                console.error('Failed to persist player state:', error);
            }
        });
        pending.clear();
    };

    window.addEventListener('pagehide', flush);

    return {
        getItem: (name) => pending.get(name) ?? localStorage.getItem(name),
        setItem: (name, value) => {
            pending.set(name, value);
            if (timer === undefined) timer = window.setTimeout(flush, delayMs);
        },
        removeItem: (name) => {
            pending.delete(name);
            localStorage.removeItem(name);
        },
    };
};
