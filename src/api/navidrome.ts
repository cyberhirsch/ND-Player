import axios from 'axios';
import md5 from 'md5';
import * as SecureStore from 'expo-secure-store';
import * as Network from 'expo-network';
import { useAuthStore, useSettingsStore } from '../store/useStore';

const checkWifiPolicy = async () => {
    const { wifiOnly } = useSettingsStore.getState();
    if (!wifiOnly) return;
    const state = await Network.getNetworkStateAsync();
    if (state.type !== Network.NetworkStateType.WIFI) {
        throw new Error('WiFi only mode is enabled. Connect to WiFi to stream music.');
    }
};

const CLIENT_NAME = 'NDPlayer';
const CLIENT_VERSION = '1.0.0';

export const getAuthParams = async () => {
    await checkWifiPolicy();
    const { serverUrl, username } = useAuthStore.getState();
    const password = await SecureStore.getItemAsync('password');

    if (!serverUrl || !username || !password) {
        throw new Error('Missing credentials');
    }

    const salt = Math.random().toString(36).substring(2, 15);
    const token = md5(password + salt);

    return {
        u: username,
        t: token,
        s: salt,
        v: '1.16.1',
        c: CLIENT_NAME,
        f: 'json'
    };
};

export enum ConnectionStatus {
    SUCCESS = 'SUCCESS',
    AUTH_ERROR = 'AUTH_ERROR',
    CONNECTION_ERROR = 'CONNECTION_ERROR',
    SERVER_ERROR = 'SERVER_ERROR',
    UNKNOWN_ERROR = 'UNKNOWN_ERROR'
}

export interface ConnectionResult {
    status: ConnectionStatus;
    message?: string;
}

export const checkConnection = async (url: string, user: string, pass: string): Promise<ConnectionResult> => {
    const salt = Math.random().toString(36).substring(2, 15);
    const token = md5(pass + salt);
    const params = {
        u: user,
        t: token,
        s: salt,
        v: '1.16.1',
        c: CLIENT_NAME,
        f: 'json'
    };

    try {
        // Check server reachability with a 15 second timeout
        const response = await axios.get(`${url}/rest/ping.view`, {
            params,
            timeout: 15000, // 15 second timeout
            validateStatus: (status) => status < 500 // Resolve even on 4xx to catch auth errors
        });

        console.log('Ping status:', response.status);

        if (response.status === 200) {
            if (response.data && response.data['subsonic-response']) {
                const subResponse = response.data['subsonic-response'];
                if (subResponse.status === 'ok') {
                    return { status: ConnectionStatus.SUCCESS };
                } else if (subResponse.error) {
                    // Subsonic API returns 200 OK but with error body for some logic errors
                    // Error code 40 is "Wrong username or password"
                    if (subResponse.error.code === 40) {
                        return { status: ConnectionStatus.AUTH_ERROR, message: 'Invalid username or password' };
                    }
                    return { status: ConnectionStatus.SERVER_ERROR, message: subResponse.error.message };
                }
            }
            return { status: ConnectionStatus.SERVER_ERROR, message: 'Invalid server response format' };
        }

        // Handle 401/403 specifically if the server uses HTTP status codes for auth
        if (response.status === 401 || response.status === 403) {
            return { status: ConnectionStatus.AUTH_ERROR, message: 'Invalid username or password' };
        }

        return { status: ConnectionStatus.SERVER_ERROR, message: `Server returned status ${response.status}` };

    } catch (e: any) {
        console.error('Ping error:', e);
        const errorCode = e.code || (e.response ? `HTTP_${e.response.status}` : 'UNKNOWN');
        const errorMessage = e.message || 'Unknown network error';

        if (e.response) {
            // The request was made and the server responded with a status code
            if (e.response.status === 401 || e.response.status === 403) {
                return { status: ConnectionStatus.AUTH_ERROR, message: 'Invalid username or password' };
            }
            return {
                status: ConnectionStatus.SERVER_ERROR,
                message: `Server error: ${e.response.status} (${errorCode})\n${errorMessage}`
            };
        } else if (e.request) {
            // The request was made but no response was received
            let customMsg = 'Server unreachable. Check URL and internet connection.';
            if (errorCode === 'ECONNABORTED') customMsg = 'Connection timed out (15s).';
            if (errorCode === 'ECONNREFUSED') customMsg = 'Connection refused by server. Check port.';
            if (errorCode === 'ERR_NETWORK') customMsg = 'Network error. Possibly blocked by Android Cleartext policy or SSL issue.';

            return {
                status: ConnectionStatus.CONNECTION_ERROR,
                message: `${customMsg}\nCode: ${errorCode}\n${errorMessage}`
            };
        } else {
            // Something happened in setting up the request that triggered an Error
            return {
                status: ConnectionStatus.UNKNOWN_ERROR,
                message: `Request setup failed: ${errorMessage}\nCode: ${errorCode}`
            };
        }
    }
};

// Deprecated: kept for backward compatibility if needed, but we should switch to checkConnection
export const ping = async (url: string, user: string, pass: string) => {
    const result = await checkConnection(url, user, pass);
    return result.status === ConnectionStatus.SUCCESS;
};

export const getArtists = async () => {
    const params = await getAuthParams();
    const { serverUrl } = useAuthStore.getState();
    const response = await axios.get(`${serverUrl}/rest/getArtists.view`, { params });
    const indexes = response.data['subsonic-response'].artists?.index || [];
    // Flatten the alphabetical index groups into a single artist array
    return indexes.flatMap((idx: any) => idx.artist || []);
};

export const getArtist = async (id: string) => {
    const params = await getAuthParams();
    const { serverUrl } = useAuthStore.getState();
    const response = await axios.get(`${serverUrl}/rest/getArtist.view`, { params: { ...params, id } });
    return response.data['subsonic-response'].artist;
};

export const getAlbums = async (offset = 0, size = 50) => {
    const params = await getAuthParams();
    const { serverUrl } = useAuthStore.getState();
    const response = await axios.get(`${serverUrl}/rest/getAlbumList2.view`, {
        params: { ...params, type: 'alphabeticalByName', size, offset }
    });
    return response.data['subsonic-response'].albumList2.album || [];
};

export const getAlbum = async (id: string) => {
    const params = await getAuthParams();
    const { serverUrl } = useAuthStore.getState();
    const response = await axios.get(`${serverUrl}/rest/getAlbum.view`, { params: { ...params, id } });
    return response.data['subsonic-response'].album;
};

export const getPlaylists = async () => {
    const params = await getAuthParams();
    const { serverUrl } = useAuthStore.getState();
    const response = await axios.get(`${serverUrl}/rest/getPlaylists.view`, { params });
    return response.data['subsonic-response'].playlists.playlist || [];
};

export const getPlaylist = async (id: string) => {
    const params = await getAuthParams();
    const { serverUrl } = useAuthStore.getState();
    const response = await axios.get(`${serverUrl}/rest/getPlaylist.view`, { params: { ...params, id } });
    return response.data['subsonic-response'].playlist;
};

export const getStreamUrl = async (id: string) => {
    const params = await getAuthParams();
    const { serverUrl } = useAuthStore.getState();
    const queryParams = new URLSearchParams(params as any).toString();
    return `${serverUrl}/rest/stream.view?id=${id}&${queryParams}`;
};

export const getCoverArtUrl = async (id: string) => {
    const params = await getAuthParams();
    const { serverUrl } = useAuthStore.getState();
    const queryParams = new URLSearchParams(params as any).toString();
    return `${serverUrl}/rest/getCoverArt.view?id=${id}&${queryParams}`;
};


export const getStarred = async () => {
    const params = await getAuthParams();
    const { serverUrl } = useAuthStore.getState();
    const response = await axios.get(`${serverUrl}/rest/getStarred2.view`, { params });
    const result = response.data['subsonic-response'].starred2 || {};
    return {
        albums: result.album || [],
        songs: result.song || [],
    };
};

export const search = async (query: string, albumCount = 10, songCount = 20) => {
    const params = await getAuthParams();
    const { serverUrl } = useAuthStore.getState();
    const response = await axios.get(`${serverUrl}/rest/search3.view`, {
        params: { ...params, query, albumCount, songCount, artistCount: 0 }
    });
    const result = response.data['subsonic-response'].searchResult3 || {};
    return {
        albums: result.album || [],
        songs: result.song || [],
    };
};

export const getSongs = async (offset = 0, size = 50) => {
    const params = await getAuthParams();
    const { serverUrl } = useAuthStore.getState();
    const response = await axios.get(`${serverUrl}/rest/search3.view`, {
        params: { ...params, query: '', songCount: size, songOffset: offset, albumCount: 0, artistCount: 0 }
    });
    const result = response.data['subsonic-response'].searchResult3 || {};
    return result.song || [];
};

// Raw auth params without wifi check - for building URLs in bulk
export const getAuthParamsRaw = async (): Promise<Record<string, string> | null> => {
    const { serverUrl, username } = useAuthStore.getState();
    const password = await SecureStore.getItemAsync('password');
    if (!serverUrl || !username || !password) return null;
    const salt = Math.random().toString(36).substring(2, 15);
    const token = md5(password + salt);
    return { u: username, t: token, s: salt, v: '1.16.1', c: CLIENT_NAME, f: 'json' };
};

export const buildStreamUrl = (id: string, serverUrl: string, params: Record<string, string>): string =>
    `${serverUrl}/rest/stream.view?id=${id}&${new URLSearchParams(params).toString()}`;

export const buildCoverArtUrlSync = (id: string, serverUrl: string, params: Record<string, string>): string =>
    `${serverUrl}/rest/getCoverArt.view?id=${id}&${new URLSearchParams(params).toString()}`;
