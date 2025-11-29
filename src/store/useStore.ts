import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';

export interface Track {
  id: string;
  title: string;
  artist: string;
  album: string;
  coverArt: string;
  duration: number;
  path?: string; // Local path if downloaded
}

interface PlayerState {
  isPlaying: boolean;
  currentTrack: Track | null;
  queue: Track[];
  currentIndex: number;
  setPlaying: (isPlaying: boolean) => void;
  setQueue: (tracks: Track[], startIndex?: number) => void;
  playNext: () => void;
  playPrev: () => void;
}

interface AuthState {
  serverUrl: string | null;
  username: string | null;
  isAuthenticated: boolean;
  setAuth: (url: string, user: string) => void;
  logout: () => void;
}

interface OfflineState {
  downloadedTracks: Record<string, string>; // id -> localUri
  addDownloadedTrack: (id: string, uri: string) => void;
  removeDownloadedTrack: (id: string) => void;
}

export const usePlayerStore = create<PlayerState>((set, get) => ({
  isPlaying: false,
  currentTrack: null,
  queue: [],
  currentIndex: -1,
  setPlaying: (isPlaying) => set({ isPlaying }),
  setQueue: (tracks, startIndex = 0) => set({
    queue: tracks,
    currentIndex: startIndex,
    currentTrack: tracks[startIndex] || null,
    isPlaying: true
  }),
  playNext: () => {
    const { queue, currentIndex } = get();
    if (currentIndex < queue.length - 1) {
      set({ currentIndex: currentIndex + 1, currentTrack: queue[currentIndex + 1] });
    } else {
      set({ isPlaying: false });
    }
  },
  playPrev: () => {
    const { queue, currentIndex } = get();
    if (currentIndex > 0) {
      set({ currentIndex: currentIndex - 1, currentTrack: queue[currentIndex - 1] });
    }
  }
}));

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      serverUrl: null,
      username: null,
      isAuthenticated: false,
      setAuth: (url, user) => set({ serverUrl: url, username: user, isAuthenticated: true }),
      logout: () => set({ serverUrl: null, username: null, isAuthenticated: false }),
    }),
    {
      name: 'auth-storage',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);

export const useOfflineStore = create<OfflineState>()(
  persist(
    (set) => ({
      downloadedTracks: {},
      addDownloadedTrack: (id, uri) => set((state) => ({ downloadedTracks: { ...state.downloadedTracks, [id]: uri } })),
      removeDownloadedTrack: (id) => set((state) => {
        const newTracks = { ...state.downloadedTracks };
        delete newTracks[id];
        return { downloadedTracks: newTracks };
      }),
    }),
    {
      name: 'offline-storage',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
