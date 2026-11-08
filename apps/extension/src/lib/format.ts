/** 245 → "4:05". */
export const formatDuration = (seconds: number | undefined) => {
    if (!seconds || !Number.isFinite(seconds)) return '0:00';
    const total = Math.floor(seconds);
    return `${Math.floor(total / 60)}:${String(total % 60).padStart(2, '0')}`;
};

/** Drag payload shared by song lists, the queue and the playlist editor. */
export const SONG_DRAG_TYPE = 'application/json';
