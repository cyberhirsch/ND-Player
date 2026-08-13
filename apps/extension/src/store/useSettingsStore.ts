import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { chromeStorage } from './chromeStorage';

interface SettingsState {
    serverUrl: string;
    username: string;
    salt: string;
    token: string;
    actions: {
        setServerUrl: (url: string) => void;
        setCredentials: (username: string, salt: string, token: string) => void;
    }
}

export const useSettingsStore = create<SettingsState>()(
    persist(
        (set) => ({
            serverUrl: '',
            username: '',
            salt: '',
            token: '',
            actions: {
                setServerUrl: (url) => set({ serverUrl: url }),
                setCredentials: (username, salt, token) => set({ username, salt, token }),
            },
        }),
        {
            name: 'navidrome-settings',
            storage: createJSONStorage(() => chromeStorage),
        }
    )
);

export const useSettingsActions = () => useSettingsStore((state) => state.actions);
