import axios from 'axios';
import md5 from 'md5';
import { useSettingsStore } from '../store/useSettingsStore';

const CLIENT_NAME = 'NavidromeExtension';
const API_VERSION = '1.16.1';

export const getApiUrl = (endpoint: string) => {
    const { serverUrl, username, salt, token } = useSettingsStore.getState();
    if (!serverUrl || !username) return '';

    const params = new URLSearchParams({
        u: username,
        t: token,
        s: salt,
        v: API_VERSION,
        c: CLIENT_NAME,
        f: 'json',
    });

    // Remove trailing slashes and common web UI paths like /app or /#
    let cleanUrl = serverUrl.trim().replace(/\/+$/, '');
    cleanUrl = cleanUrl.replace(/\/(app|#)$/, '');

    return `${cleanUrl}/rest/${endpoint}?${params.toString()}`;
};

export const getStreamUrl = (id: string) => getApiUrl('stream') + `&id=${id}`;
export const getCoverArtUrl = (id: string) => getApiUrl('getCoverArt') + `&id=${id}`;

export const apiClient = axios.create();

apiClient.interceptors.request.use((config) => {
    const { serverUrl, username, salt, token } = useSettingsStore.getState();

    if (serverUrl && username && token && salt) {
        let cleanUrl = serverUrl.trim().replace(/\/+$/, '');
        cleanUrl = cleanUrl.replace(/\/(app|#)$/, '');

        config.baseURL = `${cleanUrl}/rest`;
        config.params = {
            ...config.params,
            u: username,
            t: token,
            s: salt,
            v: API_VERSION,
            c: CLIENT_NAME,
            f: 'json',
        };
    }
    return config;
});

// Add params serializer to handle array parameters correctly (e.g. songIdToAdd=1&songIdToAdd=2)
apiClient.defaults.paramsSerializer = {
    serialize: (params) => {
        const searchParams = new URLSearchParams();
        for (const key in params) {
            const value = params[key];
            if (Array.isArray(value)) {
                value.forEach(v => searchParams.append(key, v));
            } else if (value !== undefined && value !== null) {
                searchParams.append(key, value);
            }
        }
        return searchParams.toString();
    }
};

export const navidromeApi = {
    ping: async () => {
        const response = await apiClient.get('/ping');
        return response.data['subsonic-response'];
    },
    getScanStatus: async () => {
        const response = await apiClient.get('/getScanStatus');
        return response.data['subsonic-response'].scanStatus;
    },
    getMusicFolders: async () => {
        const response = await apiClient.get('/getMusicFolders');
        return response.data['subsonic-response'].musicFolders.musicFolder;
    },
    getRandomSongs: async (size = 20) => {
        const response = await apiClient.get('/getRandomSongs', { params: { size } });
        return response.data['subsonic-response'].randomSongs?.song || [];
    },
    getAlbumList: async (type = 'newest', size = 20, offset = 0, genre?: string, year?: string) => {
        const params: any = { type, size, offset };
        if (genre) params.genre = genre;
        if (year) params.year = year;
        const response = await apiClient.get('/getAlbumList', { params });
        const albumList = response.data['subsonic-response']?.albumList;
        return albumList?.album || [];
    },
    getAlbum: async (id: string) => {
        const response = await apiClient.get('/getAlbum', { params: { id } });
        return response.data['subsonic-response'].album;
    },
    getArtists: async () => {
        const response = await apiClient.get('/getArtists');
        const indexes = response.data['subsonic-response'].artists.index;
        return Array.isArray(indexes) ? indexes.flatMap((index: any) => index.artist) : [];
    },
    getArtist: async (id: string) => {
        const response = await apiClient.get('/getArtist', { params: { id } });
        return response.data['subsonic-response'].artist;
    },
    getGenres: async () => {
        const response = await apiClient.get('/getGenres');
        return response.data['subsonic-response'].genres.genre;
    },
    getPlaylists: async () => {
        const response = await apiClient.get('/getPlaylists');
        return response.data['subsonic-response'].playlists.playlist;
    },
    getPlaylist: async (id: string) => {
        const response = await apiClient.get('/getPlaylist', { params: { id } });
        return response.data['subsonic-response'].playlist;
    },
    createPlaylist: async (name: string, comment?: string) => {
        const response = await apiClient.get('/createPlaylist', {
            params: { name, comment }
        });
        return response.data['subsonic-response'].playlist;
    },
    updatePlaylist: async (id: string, name?: string, comment?: string, isPublic?: boolean) => {
        const response = await apiClient.get('/updatePlaylist', {
            params: { playlistId: id, name, comment, public: isPublic }
        });
        return response.data['subsonic-response'];
    },
    deletePlaylist: async (id: string) => {
        const response = await apiClient.get('/deletePlaylist', { params: { id } });
        return response.data['subsonic-response'];
    },
    addToPlaylist: async (playlistId: string, songIds: string[]) => {
        const response = await apiClient.get('/updatePlaylist', {
            params: {
                playlistId,
                songIdToAdd: songIds
            }
        });
        return response.data['subsonic-response'];
    },
    removeFromPlaylist: async (playlistId: string, indices: number[]) => {
        const response = await apiClient.get('/updatePlaylist', {
            params: {
                playlistId,
                songIndexToRemove: indices
            }
        });
        return response.data['subsonic-response'];
    },
    star: async (id: string) => {
        const response = await apiClient.get('/star', { params: { id } });
        return response.data['subsonic-response'];
    },
    unstar: async (id: string) => {
        const response = await apiClient.get('/unstar', { params: { id } });
        return response.data['subsonic-response'];
    },
    setRating: async (id: string, rating: number) => {
        const response = await apiClient.get('/setRating', { params: { id, rating } });
        return response.data['subsonic-response'];
    },
    search: async (query: string) => {
        const response = await apiClient.get('/search3', {
            params: {
                query,
                artistCount: 0,
                albumCount: 50,
                songCount: 0
            }
        });
        return response.data['subsonic-response'].searchResult3;
    },
    getStarred: async () => {
        const response = await apiClient.get('/getStarred2');
        return response.data['subsonic-response'].starred2;
    },
    getSongsByRating: async (rating: number, count = 100) => {
        // Subsonic API doesn't support filtering by rating directly for all songs.
        // As a better approach for "Favorite Tracks", we first fetch starred songs (which are often 5-star)
        // and then supplement with a larger random sample if needed.

        try {
            const starred = await navidromeApi.getStarred();
            const starredSongs = starred?.song || [];

            // Filter starred songs by rating if they have it, or just include them if rating is 5
            const ratedStarred = starredSongs.filter((song: any) =>
                (song.userRating === rating) || (rating === 5 && song.starred)
            );

            if (ratedStarred.length >= count) {
                return ratedStarred.slice(0, count);
            }

            // If we still need more, or for non-5-star ratings, fetch more random songs
            // Use a larger sample size to increase chances of finding rated songs
            const randomSongs = await navidromeApi.getRandomSongs(500);
            const ratedRandom = randomSongs.filter((song: any) => song.userRating === rating);

            // Combine and de-duplicate
            const combined = [...ratedStarred];
            const seenIds = new Set(combined.map(s => s.id));

            for (const song of ratedRandom) {
                if (!seenIds.has(song.id)) {
                    combined.push(song);
                    if (combined.length >= count) break;
                }
            }

            return combined;
        } catch (error) {
            console.error("Error fetching rated songs:", error);
            return [];
        }
    },
    getSongs: async (offset = 0, size = 100, query = '') => {
        const response = await apiClient.get('/search3', {
            params: {
                query,
                songCount: size,
                songOffset: offset,
                artistCount: 0,
                albumCount: 0
            }
        });
        return response.data['subsonic-response'].searchResult3.song || [];
    },
};

export const generateCredentials = (password: string) => {
    const salt = Math.random().toString(36).substring(2, 15);
    const token = md5(password + salt);
    return { salt, token };
};
