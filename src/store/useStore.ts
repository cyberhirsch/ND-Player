import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
import TrackPlayer, { RepeatMode as RNTPRepeatMode } from 'react-native-track-player';
import { getAuthParamsRaw, buildStreamUrl, buildCoverArtUrlSync } from '../api/navidrome';

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
  setQueue: (tracks: Track[], startIndex?: number) => Promise<void>;
  playNext: () => Promise<void>;
  playPrev: () => Promise<void>;
  jumpTo: (index: number) => Promise<void>;
  cycleRepeat: () => Promise<void>;
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
  wifiOnly: boolean;
  setCacheDir: (dir: string | null) => void;
  addMusicFolder: (uri: string) => void;
  removeMusicFolder: (uri: string) => void;
  setWifiOnly: (value: boolean) => void;
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set, get) => ({
      cacheDir: null,
      musicFolders: [],
      wifiOnly: false,
      setCacheDir: (dir) => set({ cacheDir: dir }),
      addMusicFolder: (uri) => set((state) => ({
        musicFolders: state.musicFolders.includes(uri)
          ? state.musicFolders
          : [...state.musicFolders, uri]
      })),
      removeMusicFolder: (uri) => set((state) => ({
        musicFolders: state.musicFolders.filter(f => f !== uri)
      })),
      setWifiOnly: (value) => set({ wifiOnly: value }),
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

// useOfflineStore must be defined BEFORE usePlayerStore so it can be referenced
// via useOfflineStore.getState() inside the player actions.
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

export const usePlayerStore = create<PlayerState>((set, get) => ({
  isPlaying: false,
  currentTrack: null,
  queue: [],
  currentIndex: -1,
  repeatMode: 'off',
  setPlaying: (isPlaying) => set({ isPlaying }),
  setQueue: async (tracks: Track[], startIndex = 0) => {
    set({ queue: tracks, currentIndex: startIndex, currentTrack: tracks[startIndex] || null, isPlaying: false });
    try {
      const { serverUrl } = useAuthStore.getState();
      const { downloadedTracks } = useOfflineStore.getState();
      const params = serverUrl ? await getAuthParamsRaw() : null;

      const rntpTracks = tracks.map(t => ({
        id: t.id,
        url: downloadedTracks[t.id] ?? (params && serverUrl ? buildStreamUrl(t.id, serverUrl, params) : ''),
        title: t.title,
        artist: t.artist,
        album: t.album,
        artwork: t.coverArt && params && serverUrl ? buildCoverArtUrlSync(t.coverArt, serverUrl, params) : undefined,
        duration: t.duration,
      }));

      await TrackPlayer.setQueue(rntpTracks);
      await TrackPlayer.skip(startIndex);
      await TrackPlayer.play();
      set({ isPlaying: true });
    } catch (e) {
      console.error('RNTP setQueue failed', e);
    }
  },
  playNext: async () => {
    const { queue, currentIndex, repeatMode } = get();
    if (repeatMode === 'one') {
      await TrackPlayer.seekTo(0);
      await TrackPlayer.play();
    } else if (currentIndex < queue.length - 1) {
      await TrackPlayer.skipToNext();
    } else if (repeatMode === 'all' && queue.length > 0) {
      await TrackPlayer.skip(0);
      await TrackPlayer.play();
    } else {
      await TrackPlayer.pause();
      set({ isPlaying: false });
    }
  },
  playPrev: async () => {
    const { queue, currentIndex } = get();
    if (currentIndex > 0) {
      await TrackPlayer.skipToPrevious();
    } else {
      await TrackPlayer.seekTo(0);
      await TrackPlayer.play();
    }
  },
  jumpTo: async (index: number) => {
    const { queue } = get();
    if (index >= 0 && index < queue.length) {
      set({ currentIndex: index, currentTrack: queue[index] });
      await TrackPlayer.skip(index);
      await TrackPlayer.play();
    }
  },
  cycleRepeat: async () => {
    const { repeatMode } = get();
    const next: RepeatMode = repeatMode === 'off' ? 'all' : repeatMode === 'all' ? 'one' : 'off';
    set({ repeatMode: next });
    const rntpMode = next === 'off' ? RNTPRepeatMode.Off : next === 'all' ? RNTPRepeatMode.Queue : RNTPRepeatMode.Track;
    await TrackPlayer.setRepeatMode(rntpMode);
  },
}));
