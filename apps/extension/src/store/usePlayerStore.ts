import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { createDebouncedLocalStorage } from './chromeStorage';
import type { QueueItem, Song } from '../types';

export type RepeatMode = 'off' | 'all' | 'one';

interface SeekRequest {
    time: number;
    nonce: number;
}

interface PlayerActions {
    /** Replace the queue and start playing at `startIndex`. */
    playQueue: (songs: Song[], startIndex?: number) => void;
    /** Play the queue entry at `index` (restarts it if it is already current). */
    playAt: (index: number) => void;
    addToQueue: (songs: Song | Song[]) => void;
    insertAtIndex: (songs: Song[], index: number) => void;
    clearQueue: () => void;
    removeFromQueue: (indices: number[]) => void;
    reorderQueue: (fromIndex: number, toIndex: number) => void;
    moveToTop: (indices: number[]) => void;
    moveToBottom: (indices: number[]) => void;
    shuffleQueue: () => void;

    pause: () => void;
    resume: () => void;
    stop: () => void;
    next: () => void;
    previous: () => void;

    setVolume: (volume: number) => void;
    /** Report progress from the audio element. Never moves the playhead. */
    setProgress: (time: number, duration: number) => void;
    /** Move the playhead. */
    seekTo: (time: number) => void;

    toggleShuffle: () => void;
    toggleSkipOneStar: () => void;
    setRepeat: (mode: RepeatMode) => void;
    /** Patch every queue entry of this song (and the current song). */
    updateSong: (id: string, updates: Partial<Song>) => void;
}

interface PlayerState {
    isPlaying: boolean;
    queue: QueueItem[];
    currentQid: string | null;
    currentSong: QueueItem | null;
    volume: number;
    currentTime: number;
    duration: number;
    shuffle: boolean;
    repeat: RepeatMode;
    skipOneStar: boolean;
    /** qids played before the current one, for "previous" in shuffle mode. */
    history: string[];
    seekRequest: SeekRequest | null;
    actions: PlayerActions;
}

const HISTORY_LIMIT = 200;

const newQid = () => crypto.randomUUID();
const toQueueItems = (songs: Song[]): QueueItem[] => songs.map(song => ({ ...song, qid: newQid() }));

export const usePlayerStore = create<PlayerState>()(
    persist(
        (set, get) => {
            /** State patch that makes `item` the current, playing entry. */
            const select = (item: QueueItem, pushHistory = true): Partial<PlayerState> => {
                const { currentQid, history } = get();
                return {
                    currentQid: item.qid,
                    currentSong: item,
                    isPlaying: true,
                    currentTime: 0,
                    duration: 0,
                    history: pushHistory && currentQid && currentQid !== item.qid
                        ? [...history, currentQid].slice(-HISTORY_LIMIT)
                        : history,
                };
            };

            const restart = () => {
                const nonce = (get().seekRequest?.nonce ?? 0) + 1;
                set({ currentTime: 0, seekRequest: { time: 0, nonce } });
            };

            const currentIndex = () => {
                const { queue, currentQid } = get();
                return currentQid ? queue.findIndex(item => item.qid === currentQid) : -1;
            };

            const isSkipped = (item: QueueItem) => get().skipOneStar && item.userRating === 1;

            /** Move a set of entries to the front or back while preserving their relative order. */
            const moveIndices = (indices: number[], toFront: boolean) => {
                const { queue } = get();
                const picked = new Set(indices);
                const moved = queue.filter((_, i) => picked.has(i));
                const rest = queue.filter((_, i) => !picked.has(i));
                set({ queue: toFront ? [...moved, ...rest] : [...rest, ...moved] });
            };

            return {
                isPlaying: false,
                queue: [],
                currentQid: null,
                currentSong: null,
                volume: 100,
                currentTime: 0,
                duration: 0,
                shuffle: false,
                repeat: 'off',
                skipOneStar: false,
                history: [],
                seekRequest: null,
                actions: {
                    playQueue: (songs, startIndex = 0) => {
                        const queue = toQueueItems(songs);
                        const start = queue[Math.min(Math.max(startIndex, 0), queue.length - 1)];
                        if (!start) {
                            set({ queue, currentQid: null, currentSong: null, isPlaying: false, history: [] });
                            return;
                        }
                        set({ queue, ...select(start, false), history: [] });
                    },

                    playAt: (index) => {
                        const item = get().queue[index];
                        if (!item) return;
                        if (item.qid === get().currentQid) {
                            restart();
                            set({ isPlaying: true });
                            return;
                        }
                        set(select(item));
                    },

                    addToQueue: (songs) => {
                        const list = Array.isArray(songs) ? songs : [songs];
                        set({ queue: [...get().queue, ...toQueueItems(list)] });
                    },

                    insertAtIndex: (songs, index) => {
                        const queue = [...get().queue];
                        queue.splice(index, 0, ...toQueueItems(songs));
                        set({ queue });
                    },

                    // The current song keeps playing; it is simply no longer part of the queue.
                    clearQueue: () => set({ queue: [], history: [] }),

                    removeFromQueue: (indices) => {
                        const removed = new Set(indices);
                        set({ queue: get().queue.filter((_, i) => !removed.has(i)) });
                    },

                    reorderQueue: (fromIndex, toIndex) => {
                        const queue = [...get().queue];
                        const [moved] = queue.splice(fromIndex, 1);
                        if (!moved) return;
                        queue.splice(toIndex, 0, moved);
                        set({ queue });
                    },

                    moveToTop: (indices) => moveIndices(indices, true),
                    moveToBottom: (indices) => moveIndices(indices, false),

                    shuffleQueue: () => {
                        const queue = [...get().queue];
                        for (let i = queue.length - 1; i > 0; i--) {
                            const j = Math.floor(Math.random() * (i + 1));
                            [queue[i], queue[j]] = [queue[j], queue[i]];
                        }
                        set({ queue });
                    },

                    pause: () => set({ isPlaying: false }),
                    resume: () => {
                        if (get().currentSong) set({ isPlaying: true });
                    },
                    stop: () => {
                        set({ isPlaying: false });
                        restart();
                    },

                    next: () => {
                        const { queue, shuffle, repeat, currentQid } = get();
                        const index = currentIndex();
                        let nextItem: QueueItem | undefined;

                        if (shuffle) {
                            const candidates = queue.filter(item => !isSkipped(item) && item.qid !== currentQid);
                            if (candidates.length > 0) {
                                nextItem = candidates[Math.floor(Math.random() * candidates.length)];
                            } else if (repeat !== 'off' && index !== -1) {
                                restart();
                                set({ isPlaying: true });
                                return;
                            }
                        } else {
                            nextItem = queue.slice(index + 1).find(item => !isSkipped(item));
                            if (!nextItem && repeat !== 'off') {
                                nextItem = queue.find(item => !isSkipped(item));
                            }
                        }

                        if (nextItem) {
                            set(select(nextItem));
                        } else {
                            set({ isPlaying: false });
                        }
                    },

                    previous: () => {
                        const { queue, shuffle, repeat, currentTime, history } = get();
                        if (currentTime > 3) {
                            restart();
                            return;
                        }

                        if (shuffle) {
                            const remaining = [...history];
                            while (remaining.length > 0) {
                                const qid = remaining.pop();
                                const item = queue.find(entry => entry.qid === qid);
                                if (item) {
                                    set({ ...select(item, false), history: remaining });
                                    return;
                                }
                            }
                            restart();
                            return;
                        }

                        const index = currentIndex();
                        if (index > 0) {
                            set(select(queue[index - 1]));
                        } else if (repeat === 'all' && queue.length > 0) {
                            set(select(queue[queue.length - 1]));
                        } else {
                            restart();
                        }
                    },

                    setVolume: (volume) => set({ volume }),
                    setProgress: (currentTime, duration) => set({ currentTime, duration }),
                    seekTo: (time) => {
                        const nonce = (get().seekRequest?.nonce ?? 0) + 1;
                        set({ currentTime: time, seekRequest: { time, nonce } });
                    },

                    toggleShuffle: () => set({ shuffle: !get().shuffle }),
                    toggleSkipOneStar: () => set({ skipOneStar: !get().skipOneStar }),
                    setRepeat: (repeat) => set({ repeat }),

                    updateSong: (id, updates) => {
                        const { queue, currentSong } = get();
                        set({
                            queue: queue.map(item => (item.id === id ? { ...item, ...updates } : item)),
                            currentSong: currentSong?.id === id ? { ...currentSong, ...updates } : currentSong,
                        });
                    },
                },
            };
        },
        {
            name: 'navidrome-player-storage',
            version: 1,
            storage: createJSONStorage(() => createDebouncedLocalStorage()),
            partialize: (state) => ({
                queue: state.queue,
                currentQid: state.currentQid,
                volume: state.volume,
                currentTime: state.currentTime,
                shuffle: state.shuffle,
                repeat: state.repeat,
                skipOneStar: state.skipOneStar,
            }),
            // Version 0 (up to 1.0.2) stored plain songs plus a separate `currentSong`.
            migrate: (persisted, version) => {
                if (version === 0) {
                    const old = persisted as { queue?: Song[]; currentSong?: Song | null } & Record<string, unknown>;
                    const queue = toQueueItems(old.queue ?? []);
                    const currentQid = queue.find(item => item.id === old.currentSong?.id)?.qid ?? null;
                    return { ...old, queue, currentQid, currentSong: undefined };
                }
                return persisted;
            },
            merge: (persisted, current) => {
                const state = { ...current, ...(persisted as Partial<PlayerState>) };
                const currentSong = state.queue.find(item => item.qid === state.currentQid) ?? null;
                return { ...state, currentSong, currentQid: currentSong?.qid ?? null, isPlaying: false };
            },
        }
    )
);

export const usePlayerActions = () => usePlayerStore((state) => state.actions);
