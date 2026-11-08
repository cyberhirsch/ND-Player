import { describeError, navidromeApi } from '../api/navidrome';
import { usePlayerStore } from '../store/usePlayerStore';
import { toast } from '../store/useToastStore';
import type { Song } from '../types';

export const fetchAlbumSongs = async (albumId: string): Promise<Song[]> =>
    (await navidromeApi.getAlbum(albumId)).song ?? [];

export const fetchPlaylistSongs = async (playlistId: string): Promise<Song[]> =>
    (await navidromeApi.getPlaylist(playlistId)).entry ?? [];

/** Replace the queue with the songs and start playing. Reports failures as toasts. */
export const playSongsFrom = async (load: () => Promise<Song[]>, what: string) => {
    try {
        const songs = await load();
        if (songs.length === 0) {
            toast.error(`${what} has no songs.`);
            return;
        }
        usePlayerStore.getState().actions.playQueue(songs, 0);
    } catch (error) {
        toast.error(`Could not play ${what.toLowerCase()}: ${describeError(error)}`);
    }
};

export const queueSongsFrom = async (load: () => Promise<Song[]>, name: string) => {
    try {
        const songs = await load();
        if (songs.length === 0) {
            toast.error(`"${name}" has no songs.`);
            return;
        }
        usePlayerStore.getState().actions.addToQueue(songs);
        toast.success(`Added "${name}" to the queue.`);
    } catch (error) {
        toast.error(`Could not add to queue: ${describeError(error)}`);
    }
};

export const playAlbum = (albumId: string) => playSongsFrom(() => fetchAlbumSongs(albumId), 'This album');
export const queueAlbum = (albumId: string, name: string) => queueSongsFrom(() => fetchAlbumSongs(albumId), name);
export const playPlaylist = (playlistId: string) => playSongsFrom(() => fetchPlaylistSongs(playlistId), 'This playlist');
