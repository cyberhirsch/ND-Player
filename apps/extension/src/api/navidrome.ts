import axios, { AxiosError } from 'axios';
import md5 from 'md5';
import { useSettingsStore } from '../store/useSettingsStore';
import type { Album, AlbumListType, Artist, Genre, Playlist, Song, Starred } from '../types';

const CLIENT_NAME = 'NavidromeExtension';
const API_VERSION = '1.16.1';

export interface Credentials {
    serverUrl: string;
    username: string;
    salt: string;
    token: string;
}

type ParamValue = string | number | boolean | undefined | null | Array<string | number>;
type Params = Record<string, ParamValue>;

interface SubsonicEnvelope {
    status: 'ok' | 'failed';
    error?: { code: number; message: string };
    [key: string]: unknown;
}

/** A Subsonic-level failure. The server answers HTTP 200 with `status: "failed"`, so these must be detected by hand. */
export class SubsonicError extends Error {
    readonly code: number;

    constructor(code: number, message: string) {
        super(message);
        this.name = 'SubsonicError';
        this.code = code;
    }
}

/** Strip trailing slashes and web-UI suffixes such as `/app` or `/#`. */
export const cleanServerUrl = (url: string) =>
    url.trim().replace(/\/+$/, '').replace(/\/(app|#)$/, '').replace(/\/+$/, '');

const authParams = (creds: Credentials) => ({
    u: creds.username,
    t: creds.token,
    s: creds.salt,
    v: API_VERSION,
    c: CLIENT_NAME,
    f: 'json',
});

const currentCredentials = (): Credentials | null => {
    const { serverUrl, username, salt, token } = useSettingsStore.getState();
    if (!serverUrl || !username || !salt || !token) return null;
    return { serverUrl, username, salt, token };
};

const serializeParams = (params: Params) => {
    const searchParams = new URLSearchParams();
    for (const [key, value] of Object.entries(params)) {
        if (value === undefined || value === null) continue;
        if (Array.isArray(value)) {
            value.forEach(v => searchParams.append(key, String(v)));
        } else {
            searchParams.append(key, String(value));
        }
    }
    return searchParams.toString();
};

const buildUrl = (endpoint: string, extra: Params) => {
    const creds = currentCredentials();
    if (!creds) return '';
    const query = serializeParams({ ...authParams(creds), ...extra });
    return `${cleanServerUrl(creds.serverUrl)}/rest/${endpoint}?${query}`;
};

export const getStreamUrl = (id: string) => buildUrl('stream', { id });
export const getCoverArtUrl = (id: string, size?: number) => buildUrl('getCoverArt', { id, size });

const unwrap = (data: unknown): SubsonicEnvelope => {
    const envelope = (data as { 'subsonic-response'?: SubsonicEnvelope } | null)?.['subsonic-response'];
    if (!envelope) {
        throw new SubsonicError(0, 'The server did not return a Subsonic response. Check the server URL.');
    }
    if (envelope.status === 'failed') {
        throw new SubsonicError(envelope.error?.code ?? 0, envelope.error?.message ?? 'Request failed');
    }
    return envelope;
};

export const apiClient = axios.create({
    paramsSerializer: { serialize: (params) => serializeParams(params as Params) },
});

apiClient.interceptors.request.use((config) => {
    const creds = currentCredentials();
    if (creds) {
        config.baseURL = `${cleanServerUrl(creds.serverUrl)}/rest`;
        config.params = { ...config.params, ...authParams(creds) };
    }
    return config;
});

const get = async (endpoint: string, params: Params = {}) => {
    if (!currentCredentials()) throw new SubsonicError(0, 'Not connected to a server.');
    const response = await apiClient.get(`/${endpoint}`, { params });
    return unwrap(response.data);
};

/** Form-encoded POST (OpenSubsonic `formPost`) — keeps long ID lists out of the URL. */
const post = async (endpoint: string, params: Params = {}) => {
    if (!currentCredentials()) throw new SubsonicError(0, 'Not connected to a server.');
    const response = await apiClient.post(`/${endpoint}`, serializeParams(params), {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    });
    return unwrap(response.data);
};

/** Human-readable message for any error thrown by this module or axios. */
export const describeError = (error: unknown): string => {
    if (error instanceof SubsonicError) {
        switch (error.code) {
            case 40: return 'Wrong username or password.';
            case 41: return 'This server does not accept token authentication for your account.';
            case 50: return 'Your account is not allowed to do that.';
            case 70: return 'Not found on the server.';
            default: return error.message;
        }
    }
    if (error instanceof AxiosError) {
        if (!error.response) return 'Could not reach the server. Check the URL and your connection.';
        return `The server responded with HTTP ${error.response.status}.`;
    }
    if (error instanceof Error) return error.message;
    return 'Something went wrong.';
};

/** Test credentials without touching the stored settings. Throws on any failure. */
export const testConnection = async (creds: Credentials) => {
    const response = await axios.get(`${cleanServerUrl(creds.serverUrl)}/rest/ping`, {
        params: authParams(creds),
        paramsSerializer: { serialize: (params) => serializeParams(params as Params) },
        timeout: 15000,
    });
    return unwrap(response.data);
};

export interface AlbumListOptions {
    genre?: string;
    fromYear?: number;
    toYear?: number;
}

type StarKind = 'song' | 'album' | 'artist';
const starParam: Record<StarKind, string> = { song: 'id', album: 'albumId', artist: 'artistId' };

export const navidromeApi = {
    ping: () => get('ping'),

    /** getAlbumList2 (ID3). `byGenre` needs `genre`; `byYear` needs `fromYear` and `toYear`. */
    getAlbumList: async (type: AlbumListType, size = 50, offset = 0, options: AlbumListOptions = {}): Promise<Album[]> => {
        const params: Params = { type, size, offset };
        if (type === 'byGenre') params.genre = options.genre;
        if (type === 'byYear') {
            params.fromYear = options.fromYear;
            params.toYear = options.toYear;
        }
        const envelope = await get('getAlbumList2', params);
        return (envelope.albumList2 as { album?: Album[] } | undefined)?.album ?? [];
    },

    getAlbum: async (id: string): Promise<Album> => {
        const envelope = await get('getAlbum', { id });
        return envelope.album as Album;
    },

    getArtists: async (): Promise<Artist[]> => {
        const envelope = await get('getArtists');
        const indexes = (envelope.artists as { index?: { artist?: Artist[] }[] } | undefined)?.index ?? [];
        return indexes.flatMap(index => index.artist ?? []);
    },

    getArtist: async (id: string): Promise<Artist> => {
        const envelope = await get('getArtist', { id });
        return envelope.artist as Artist;
    },

    getGenres: async (): Promise<Genre[]> => {
        const envelope = await get('getGenres');
        return (envelope.genres as { genre?: Genre[] } | undefined)?.genre ?? [];
    },

    getPlaylists: async (): Promise<Playlist[]> => {
        const envelope = await get('getPlaylists');
        return (envelope.playlists as { playlist?: Playlist[] } | undefined)?.playlist ?? [];
    },

    getPlaylist: async (id: string): Promise<Playlist> => {
        const envelope = await get('getPlaylist', { id });
        return envelope.playlist as Playlist;
    },

    createPlaylist: async (name: string, songIds: string[] = []): Promise<Playlist> => {
        const envelope = await post('createPlaylist', { name, songId: songIds });
        return envelope.playlist as Playlist;
    },

    deletePlaylist: (id: string) => get('deletePlaylist', { id }),

    addToPlaylist: (playlistId: string, songIds: string[]) =>
        post('updatePlaylist', { playlistId, songIdToAdd: songIds }),

    /** Replace a playlist's tracks in one request, so a failure can never leave it half-emptied. */
    replacePlaylistTracks: (playlistId: string, currentTrackCount: number, songIds: string[]) =>
        post('updatePlaylist', {
            playlistId,
            songIndexToRemove: Array.from({ length: currentTrackCount }, (_, i) => i),
            songIdToAdd: songIds,
        }),

    setStarred: (kind: StarKind, id: string, starred: boolean) =>
        get(starred ? 'star' : 'unstar', { [starParam[kind]]: id }),

    setRating: (id: string, rating: number) => get('setRating', { id, rating }),

    searchAlbums: async (query: string, count = 50, offset = 0): Promise<Album[]> => {
        const envelope = await get('search3', {
            query,
            artistCount: 0,
            albumCount: count,
            albumOffset: offset,
            songCount: 0,
        });
        return (envelope.searchResult3 as { album?: Album[] } | undefined)?.album ?? [];
    },

    getStarred: async (): Promise<Starred> => {
        const envelope = await get('getStarred2');
        const starred = (envelope.starred2 ?? {}) as Partial<Starred>;
        return {
            artist: starred.artist ?? [],
            album: starred.album ?? [],
            song: starred.song ?? [],
        };
    },

    getSongs: async (offset = 0, size = 100, query = ''): Promise<Song[]> => {
        const envelope = await get('search3', {
            query,
            songCount: size,
            songOffset: offset,
            artistCount: 0,
            albumCount: 0,
        });
        return (envelope.searchResult3 as { song?: Song[] } | undefined)?.song ?? [];
    },
};

export const generateCredentials = (password: string) => {
    const bytes = new Uint8Array(8);
    crypto.getRandomValues(bytes);
    const salt = Array.from(bytes, b => b.toString(16).padStart(2, '0')).join('');
    return { salt, token: md5(password + salt) };
};
