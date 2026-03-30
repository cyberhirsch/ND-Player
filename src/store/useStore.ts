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
  localCoverUri?: string; // Local cover art path if downloaded
}

export type RepeatMode = 'off' | 'all' | 'one';

interface PlayerState {
  isPlaying: boolean;
  currentTrack: Track | null;
  queue: Track[];
  currentIndex: number;
  repeatMode: RepeatMode;
  setPlaying: (isPlaying: boolean) => void;
  setQueue: (tracks: Track[], startIndex?: number) => void;
  playNext: () => void;
  playPrev: () => void;
  jumpTo: (index: number) => void;
  cycleRepeat: () => void;
}

interface AuthState {
  serverUrl: string | null;
  username: string | null;
  isAuthenticated: boolean;
  setAuth: (url: string, user: string) => void;
  logout: () => void;
}

export interface DownloadedAlbum {
  id: string;
  title: string;
  artist: string;
  coverArt: string;
  tracks: Record<string, string>; // trackId -> localUri
  trackList?: Track[]; // full track metadata for offline playback
}

export interface DownloadedPlaylist {
  id: string;
  name: string;
  tracks: Record<string, string>; // trackId -> localUri
  trackList?: Track[]; // full track metadata for offline playback
}

interface OfflineState {
  isOfflineMode: boolean;
  downloadedTracks: Record<string, string>; // id -> localUri
  downloadedAlbums: Record<string, DownloadedAlbum>; // albumId -> album data
  downloadedPlaylists: Record<string, DownloadedPlaylist>; // playlistId -> playlist data
  setOfflineMode: (mode: boolean) => void;
  addDownloadedTrack: (id: string, uri: string) => void;
  removeDownloadedTrack: (id: string) => void;
  addDownloadedAlbum: (album: DownloadedAlbum) => void;
  removeDownloadedAlbum: (id: string) => void;
  addDownloadedPlaylist: (playlist: DownloadedPlaylist) => void;
  removeDownloadedPlaylist: (id: string) => void;
  isAlbumDownloaded: (id: string) => boolean;
  isPlaylistDownloaded: (id: string) => boolean;
}

interface SettingsState {
  cacheDir: string | null;
  musicFolders: string[];
  setCacheDir: (dir: string | null) => void;
  addMusicFolder: (uri: string) => void;
  removeMusicFolder: (uri: string) => void;
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set, get) => ({
      cacheDir: null,
      musicFolders: [],
      setCacheDir: (dir) => set({ cacheDir: dir }),
      addMusicFolder: (uri) => set((state) => ({
        musicFolders: state.musicFolders.includes(uri)
          ? state.musicFolders
          : [...state.musicFolders, uri]
      })),
      removeMusicFolder: (uri) => set((state) => ({
        musicFolders: state.musicFolders.filter(f => f !== uri)
      })),
    }),
    {
      name: 'settings-storage',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);

interface AlbumCache {
  data: any[];
  timestamp: number;
  hasMore: boolean;
  nextOffset: number;
}

interface LibraryState {
  albumCache: AlbumCache | null;
  setAlbumCache: (cache: AlbumCache) => void;
  appendAlbumCache: (newAlbums: any[], hasMore: boolean, nextOffset: number) => void;
  clearAlbumCache: () => void;
}

const ALBUM_CACHE_TTL = 5 * 60 * 1000; // 5 minutes

export const isAlbumCacheFresh = (cache: AlbumCache | null): boolean => {
  if (!cache) return false;
  return Date.now() - cache.timestamp < ALBUM_CACHE_TTL;
};

export const useLibraryStore = create<LibraryState>()(
  persist(
    (set, get) => ({
      albumCache: null,
      setAlbumCache: (cache) => set({ albumCache: cache }),
      appendAlbumCache: (newAlbums, hasMore, nextOffset) => {
        const existing = get().albumCache;
        set({
          albumCache: {
            data: [...(existing?.data ?? []), ...newAlbums],
            timestamp: existing?.timestamp ?? Date.now(),
            hasMore,
            nextOffset,
          }
        });
      },
      clearAlbumCache: () => set({ albumCache: null }),
    }),
    {
      name: 'library-storage',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);

export const usePlayerStore = create<PlayerState>((set, get) => ({
  isPlaying: false,
  currentTrack: null,
  queue: [],
  currentIndex: -1,
  repeatMode: 'off',
  setPlaying: (isPlaying) => set({ isPlaying }),
  setQueue: (tracks, startIndex = 0) => set({
    queue: tracks,
    currentIndex: startIndex,
    currentTrack: tracks[startIndex] || null,
  }),
  playNext: () => {
    const { queue, currentIndex, repeatMode } = get();
    if (repeatMode === 'one') {
      // Restart current track by nudging the reference
      set({ currentTrack: { ...queue[currentIndex] } });
    } else if (currentIndex < queue.length - 1) {
      set({ currentIndex: currentIndex + 1, currentTrack: queue[currentIndex + 1] });
    } else if (repeatMode === 'all' && queue.length > 0) {
      set({ currentIndex: 0, currentTrack: queue[0] });
    } else {
      set({ isPlaying: false });
    }
  },
  playPrev: () => {
    const { queue, currentIndex } = get();
    if (currentIndex > 0) {
      set({ currentIndex: currentIndex - 1, currentTrack: queue[currentIndex - 1] });
    } else if (queue[currentIndex]) {
      set({ currentTrack: { ...queue[currentIndex] } });
    }
  },
  jumpTo: (index: number) => {
    const { queue } = get();
    if (index >= 0 && index < queue.length) {
      set({ currentIndex: index, currentTrack: queue[index] });
    }
  },
  cycleRepeat: () => {
    const { repeatMode } = get();
    const next: RepeatMode = repeatMode === 'off' ? 'all' : repeatMode === 'all' ? 'one' : 'off';
    set({ repeatMode: next });
  },
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
    (set, get) => ({
      isOfflineMode: false,
      downloadedTracks: {},
      downloadedAlbums: {},
      downloadedPlaylists: {},
      setOfflineMode: (mode) => set({ isOfflineMode: mode }),
      addDownloadedTrack: (id, uri) => set((state) => ({ downloadedTracks: { ...state.downloadedTracks, [id]: uri } })),
      removeDownloadedTrack: (id) => set((state) => {
        const newTracks = { ...state.downloadedTracks };
        delete newTracks[id];
        return { downloadedTracks: newTracks };
      }),
      addDownloadedAlbum: (album) => set((state) => ({ downloadedAlbums: { ...state.downloadedAlbums, [album.id]: album } })),
      removeDownloadedAlbum: (id) => set((state) => {
        const newAlbums = { ...state.downloadedAlbums };
        delete newAlbums[id];
        return { downloadedAlbums: newAlbums };
      }),
      addDownloadedPlaylist: (playlist) => set((state) => ({ downloadedPlaylists: { ...state.downloadedPlaylists, [playlist.id]: playlist } })),
      removeDownloadedPlaylist: (id) => set((state) => {
        const newPlaylists = { ...state.downloadedPlaylists };
        delete newPlaylists[id];
        return { downloadedPlaylists: newPlaylists };
      }),
      isAlbumDownloaded: (id) => !!get().downloadedAlbums[id],
      isPlaylistDownloaded: (id) => !!get().downloadedPlaylists[id],
    }),
    {
      name: 'offline-storage',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
