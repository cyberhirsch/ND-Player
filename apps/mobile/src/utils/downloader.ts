import * as FileSystem from 'expo-file-system/legacy';
import { getStreamUrl, getAlbum, getPlaylist, getCoverArtUrl } from '../api/navidrome';
import { useOfflineStore, useSettingsStore, DownloadedAlbum, DownloadedPlaylist, Track } from '../store/useStore';

const getCacheDir = (): string => {
    const custom = useSettingsStore.getState().cacheDir;
    return custom ?? (FileSystem.documentDirectory as string);
};

export interface DownloadProgress {
    current: number;
    total: number;
    trackTitle?: string;
}

export const downloadTrack = async (trackId: string) => {
    try {
        const url = await getStreamUrl(trackId);
        const fileUri = getCacheDir() + trackId;

        // Use the new downloadAsync API instead of deprecated createDownloadResumable
        const result = await FileSystem.downloadAsync(url, fileUri);

        if (result && result.uri) {
            useOfflineStore.getState().addDownloadedTrack(trackId, result.uri);
            return result.uri;
        }
    } catch (e) {
        console.error("Download failed", e);
    }
    return null;
};

export const deleteTrack = async (trackId: string) => {
    const uri = useOfflineStore.getState().downloadedTracks[trackId];
    if (uri) {
        await FileSystem.deleteAsync(uri, { idempotent: true });
        useOfflineStore.getState().removeDownloadedTrack(trackId);
    }
};

export const downloadAlbum = async (
    albumId: string,
    onProgress?: (progress: DownloadProgress) => void
) => {
    try {
        const album = await getAlbum(albumId);
        if (!album || !album.song || album.song.length === 0) {
            throw new Error('Album has no tracks');
        }

        const tracks: Record<string, string> = {};
        const totalTracks = album.song.length;

        for (let i = 0; i < album.song.length; i++) {
            const track = album.song[i];
            if (onProgress) {
                onProgress({
                    current: i + 1,
                    total: totalTracks,
                    trackTitle: track.title
                });
            }

            const uri = await downloadTrack(track.id);
            if (uri) {
                tracks[track.id] = uri;
            }
        }

        // Download cover art
        const coverUrl = await getCoverArtUrl(album.coverArt);
        const coverUri = getCacheDir() + `cover_${album.coverArt}.jpg`;
        await FileSystem.downloadAsync(coverUrl, coverUri);

        const trackList: Track[] = album.song
            .filter((s: any) => tracks[s.id])
            .map((s: any) => ({
                id: s.id,
                title: s.title,
                artist: s.artist,
                album: s.album || album.name,
                coverArt: s.coverArt,
                duration: s.duration,
                path: tracks[s.id],
                localCoverUri: coverUri,
            }));

        const downloadedAlbum: DownloadedAlbum = {
            id: albumId,
            title: album.name,
            artist: album.artist,
            coverArt: coverUri,
            tracks,
            trackList
        };

        useOfflineStore.getState().addDownloadedAlbum(downloadedAlbum);
        return downloadedAlbum;
    } catch (e) {
        console.error('Album download failed', e);
        // Clean up any tracks that were downloaded before the failure
        for (const [trackId, uri] of Object.entries(tracks)) {
            await FileSystem.deleteAsync(uri, { idempotent: true });
            useOfflineStore.getState().removeDownloadedTrack(trackId);
        }
        return null;
    }
};

export const deleteAlbum = async (albumId: string) => {
    const album = useOfflineStore.getState().downloadedAlbums[albumId];
    if (!album) return;

    // Delete all tracks
    for (const trackId of Object.keys(album.tracks)) {
        await deleteTrack(trackId);
    }

    // Delete cover art
    if (album.coverArt) {
        await FileSystem.deleteAsync(album.coverArt, { idempotent: true });
    }

    useOfflineStore.getState().removeDownloadedAlbum(albumId);
};

export const downloadPlaylist = async (
    playlistId: string,
    onProgress?: (progress: DownloadProgress) => void
) => {
    try {
        const playlist = await getPlaylist(playlistId);
        if (!playlist || !playlist.entry || playlist.entry.length === 0) {
            throw new Error('Playlist has no tracks');
        }

        const tracks: Record<string, string> = {};
        const totalTracks = playlist.entry.length;

        for (let i = 0; i < playlist.entry.length; i++) {
            const track = playlist.entry[i];
            if (onProgress) {
                onProgress({
                    current: i + 1,
                    total: totalTracks,
                    trackTitle: track.title
                });
            }

            const uri = await downloadTrack(track.id);
            if (uri) {
                tracks[track.id] = uri;
            }
        }

        const trackList: Track[] = playlist.entry
            .filter((s: any) => tracks[s.id])
            .map((s: any) => ({
                id: s.id,
                title: s.title,
                artist: s.artist,
                album: s.album || '',
                coverArt: s.coverArt,
                duration: s.duration,
                path: tracks[s.id],
            }));

        const downloadedPlaylist: DownloadedPlaylist = {
            id: playlistId,
            name: playlist.name,
            tracks,
            trackList
        };

        useOfflineStore.getState().addDownloadedPlaylist(downloadedPlaylist);
        return downloadedPlaylist;
    } catch (e) {
        console.error('Playlist download failed', e);
        // Clean up any tracks that were downloaded before the failure
        for (const [trackId, uri] of Object.entries(tracks)) {
            await FileSystem.deleteAsync(uri, { idempotent: true });
            useOfflineStore.getState().removeDownloadedTrack(trackId);
        }
        return null;
    }
};

export const deletePlaylist = async (playlistId: string) => {
    const playlist = useOfflineStore.getState().downloadedPlaylists[playlistId];
    if (!playlist) return;

    // Delete all tracks
    for (const trackId of Object.keys(playlist.tracks)) {
        await deleteTrack(trackId);
    }

    useOfflineStore.getState().removeDownloadedPlaylist(playlistId);
};
