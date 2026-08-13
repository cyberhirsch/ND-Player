import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { PlayerState, Song } from '../types';

interface PlayerStore extends PlayerState {
    currentTime: number;
    duration: number;
    shuffle: boolean;
    repeat: 'off' | 'all' | 'one';
    skipOneStar: boolean;
    actions: PlayerState['actions'] & {
        addToQueue: (song: Song | Song[]) => void;
        setProgress: (time: number, duration: number) => void;
        setCurrentTime: (time: number) => void;
        reorderQueue: (fromIndex: number, toIndex: number) => void;
        removeFromQueue: (indices: number[]) => void;
        shuffleQueue: () => void;
        moveToTop: (indices: number[]) => void;
        moveToBottom: (indices: number[]) => void;
        insertAtIndex: (songs: any[], index: number) => void;
        toggleShuffle: () => void;
        toggleSkipOneStar: () => void;
        setRepeat: (mode: 'off' | 'all' | 'one') => void;
        previous: () => void;
        next: () => void;
        stop: () => void;
        updateSong: (id: string, updates: Partial<Song>) => void;
    };
}

export const usePlayerStore = create<PlayerStore>()(
    persist(
        (set, get) => ({
            isPlaying: false,
            currentSong: null,
            queue: [],
            volume: 100,
            currentTime: 0,
            duration: 0,
            shuffle: false,
            repeat: 'off',
            skipOneStar: false,
            actions: {
                play: (song) => set({ isPlaying: true, currentSong: song }),
                pause: () => set({ isPlaying: false }),
                resume: () => set({ isPlaying: true }),
                stop: () => set({ isPlaying: false, currentTime: 0 }),
                setVolume: (volume) => set({ volume }),
                addToQueue: (songOrSongs) => set((state) => ({
                    queue: [...state.queue, ...(Array.isArray(songOrSongs) ? songOrSongs : [songOrSongs])]
                })),
                clearQueue: () => set({ queue: [] }),
                setProgress: (currentTime, duration) => set({ currentTime, duration }),
                setCurrentTime: (time) => set({ currentTime: time }),

                toggleShuffle: () => set((state) => ({ shuffle: !state.shuffle })),
                toggleSkipOneStar: () => set((state) => ({ skipOneStar: !state.skipOneStar })),
                setRepeat: (mode) => set({ repeat: mode }),

                previous: () => {
                    const state = get();
                    if (state.currentTime > 3) {
                        // If played more than 3 seconds, restart song
                        set({ currentTime: 0 });
                        return;
                    }

                    const currentIndex = state.queue.findIndex(s => s.id === state.currentSong?.id);
                    if (currentIndex > 0) {
                        set({ currentSong: state.queue[currentIndex - 1], isPlaying: true });
                    } else if (state.repeat === 'all' && state.queue.length > 0) {
                        // Loop to end
                        set({ currentSong: state.queue[state.queue.length - 1], isPlaying: true });
                    }
                },

                next: () => {
                    const state = get();
                    const currentIndex = state.queue.findIndex(s => s.id === state.currentSong?.id);
                    const shouldSkip = (song: Song) => state.skipOneStar && song.userRating === 1;

                    let nextSong: Song | null = null;

                    if (state.shuffle) {
                        const validSongs = state.queue.filter(s => !shouldSkip(s));
                        if (validSongs.length > 0) {
                            const randomIndex = Math.floor(Math.random() * validSongs.length);
                            nextSong = validSongs[randomIndex];
                        }
                    } else {
                        // Find next valid song
                        for (let i = currentIndex + 1; i < state.queue.length; i++) {
                            if (!shouldSkip(state.queue[i])) {
                                nextSong = state.queue[i];
                                break;
                            }
                        }

                        // Wrap around if repeat is all or one (manual next always wraps if needed)
                        if (!nextSong && (state.repeat === 'all' || state.repeat === 'one')) {
                            for (let i = 0; i < state.queue.length; i++) {
                                if (!shouldSkip(state.queue[i])) {
                                    nextSong = state.queue[i];
                                    break;
                                }
                            }
                        }
                    }

                    if (nextSong) {
                        set({ currentSong: nextSong, isPlaying: true });
                    } else {
                        set({ isPlaying: false });
                    }
                },

                reorderQueue: (fromIndex, toIndex) => set((state) => {
                    const newQueue = [...state.queue];
                    const [removed] = newQueue.splice(fromIndex, 1);
                    newQueue.splice(toIndex, 0, removed);
                    return { queue: newQueue };
                }),
                removeFromQueue: (indices) => set((state) => ({
                    queue: state.queue.filter((_, i) => !indices.includes(i))
                })),
                shuffleQueue: () => set((state) => {
                    const shuffled = [...state.queue];
                    for (let i = shuffled.length - 1; i > 0; i--) {
                        const j = Math.floor(Math.random() * (i + 1));
                        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
                    }
                    return { queue: shuffled };
                }),
                moveToTop: (indices) => set((state) => {
                    const items = indices.map(i => state.queue[i]);
                    const remaining = state.queue.filter((_, i) => !indices.includes(i));
                    return { queue: [...items, ...remaining] };
                }),
                moveToBottom: (indices) => set((state) => {
                    const items = indices.map(i => state.queue[i]);
                    const remaining = state.queue.filter((_, i) => !indices.includes(i));
                    return { queue: [...remaining, ...items] };
                }),
                insertAtIndex: (songs, index) => set((state) => {
                    const newQueue = [...state.queue];
                    newQueue.splice(index, 0, ...songs);
                    return { queue: newQueue };
                }),
                updateSong: (id, updates) => set((state) => {
                    const newQueue = state.queue.map(song =>
                        song.id === id ? { ...song, ...updates } : song
                    );
                    const newCurrentSong = state.currentSong?.id === id
                        ? { ...state.currentSong, ...updates }
                        : state.currentSong;
                    return { queue: newQueue, currentSong: newCurrentSong };
                }),
            },
        }),
        {
            name: 'navidrome-player-storage',
            partialize: (state) => ({
                currentSong: state.currentSong,
                queue: state.queue,
                volume: state.volume,
                currentTime: state.currentTime,
                duration: state.duration,
                shuffle: state.shuffle,
                repeat: state.repeat,
                skipOneStar: state.skipOneStar,
            }),
        }
    )
);

export const usePlayerActions = () => usePlayerStore((state) => state.actions);
