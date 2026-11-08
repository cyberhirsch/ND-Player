import { useSyncExternalStore } from 'react';
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { chromeStorage } from './chromeStorage';
import type { Credentials } from '../api/navidrome';

interface SettingsState extends Credentials {
    actions: {
        /** Store a complete, already-tested connection in one step. */
        setConnection: (creds: Credentials) => void;
        disconnect: () => void;
    };
}

export const useSettingsStore = create<SettingsState>()(
    persist(
        (set) => ({
            serverUrl: '',
            username: '',
            salt: '',
            token: '',
            actions: {
                setConnection: ({ serverUrl, username, salt, token }) => set({ serverUrl, username, salt, token }),
                disconnect: () => set({ serverUrl: '', username: '', salt: '', token: '' }),
            },
        }),
        {
            name: 'navidrome-settings',
            storage: createJSONStorage(() => chromeStorage),
            partialize: ({ serverUrl, username, salt, token }) => ({ serverUrl, username, salt, token }),
        }
    )
);

export const useSettingsActions = () => useSettingsStore((state) => state.actions);

const subscribeHydration = (onChange: () => void) => useSettingsStore.persist.onFinishHydration(onChange);
const getHydrated = () => useSettingsStore.persist.hasHydrated();

/** chrome.storage is async: until this is true, an empty store means "not loaded yet", not "logged out". */
export const useSettingsHydrated = () => useSyncExternalStore(subscribeHydration, getHydrated);
