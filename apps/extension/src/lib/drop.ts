import { fetchAlbumSongs } from './albumActions';
import { SONG_DRAG_TYPE } from './format';
import type { Song } from '../types';

type DropPayload = { type: 'song'; song: Song } | { type: 'album'; id: string };

/** True for drags carrying songs from elsewhere in the app (as opposed to reordering within a list). */
export const isExternalDrag = (e: React.DragEvent) => e.dataTransfer.types.includes(SONG_DRAG_TYPE);

/** Songs carried by an external drag: a song row, or an album that must be fetched first. */
export const songsFromDrop = async (e: React.DragEvent): Promise<Song[]> => {
    const raw = e.dataTransfer.getData(SONG_DRAG_TYPE);
    if (!raw) return [];
    const data = JSON.parse(raw) as DropPayload;
    if (data.type === 'song') return [data.song];
    if (data.type === 'album') return fetchAlbumSongs(data.id);
    return [];
};
