import axios from 'axios';
import md5 from 'md5';
import * as SecureStore from 'expo-secure-store';
import { useAuthStore } from '../store/useStore';

const CLIENT_NAME = 'NDPlayer';
const CLIENT_VERSION = '1.0.0';

export const getAuthParams = async () => {
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

export const ping = async (url: string, user: string, pass: string) => {
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
        const response = await axios.get(`${url}/rest/ping.view`, { params });
        console.log('Ping status:', response.status);
        console.log('Ping data:', JSON.stringify(response.data, null, 2));

        if (response.data && response.data['subsonic-response'] && response.data['subsonic-response'].status === 'ok') {
            return true;
        }
        return false;
    } catch (e) {
        console.error('Ping error:', e);
        return false;
    }
};

export const getAlbums = async () => {
    const params = await getAuthParams();
    const { serverUrl } = useAuthStore.getState();
    const response = await axios.get(`${serverUrl}/rest/getAlbumList2.view`, { params: { ...params, type: 'newest', size: 50 } });
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
