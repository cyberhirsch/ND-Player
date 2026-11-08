import { useEffect, useRef, useState } from 'react';
import { usePlayerStore } from '../store/usePlayerStore';
import { getCoverArtUrl, getStreamUrl } from '../api/navidrome';
import { toast } from '../store/useToastStore';

/** Stop auto-skipping after this many tracks fail in a row (e.g. the server is down). */
const MAX_CONSECUTIVE_ERRORS = 5;

const hasMediaSession = () => typeof navigator !== 'undefined' && 'mediaSession' in navigator;

export default function AudioController() {
    const currentSong = usePlayerStore(state => state.currentSong);
    const isPlaying = usePlayerStore(state => state.isPlaying);
    const volume = usePlayerStore(state => state.volume);
    const repeat = usePlayerStore(state => state.repeat);
    const seekRequest = usePlayerStore(state => state.seekRequest);
    const actions = usePlayerStore(state => state.actions);

    const [audio] = useState(() => {
        const element = new Audio();
        element.preload = 'auto';
        return element;
    });
    const loadedQid = useRef<string | null>(null);
    /** Seek to apply once metadata is available (resume after reload, or a seek before load finished). */
    const pendingSeek = useRef<number | null>(usePlayerStore.getState().currentTime || null);
    const consecutiveErrors = useRef(0);
    const lastPositionUpdate = useRef(0);

    // Audio element events.
    useEffect(() => {

        const reportProgress = () => {
            actions.setProgress(audio.currentTime, Number.isFinite(audio.duration) ? audio.duration : 0);

            const now = performance.now();
            if (hasMediaSession() && Number.isFinite(audio.duration) && audio.duration > 0 && now - lastPositionUpdate.current > 1000) {
                lastPositionUpdate.current = now;
                try {
                    navigator.mediaSession.setPositionState({
                        duration: audio.duration,
                        position: Math.min(audio.currentTime, audio.duration),
                        playbackRate: audio.playbackRate,
                    });
                } catch {
                    // Ignore: Chrome throws if position and duration are momentarily inconsistent.
                }
            }
        };

        const handleLoadedMetadata = () => {
            if (pendingSeek.current !== null) {
                audio.currentTime = Math.min(pendingSeek.current, audio.duration || pendingSeek.current);
                pendingSeek.current = null;
            }
            reportProgress();
        };

        const handleEnded = () => {
            // Repeat-one uses audio.loop, so 'ended' never fires for it.
            if (!audio.loop) actions.next();
        };

        const handlePlaying = () => {
            consecutiveErrors.current = 0;
        };

        const handleError = () => {
            if (!audio.getAttribute('src')) return;
            const { currentSong: failed, queue } = usePlayerStore.getState();
            consecutiveErrors.current += 1;
            const title = failed?.title ? `"${failed.title}"` : 'this track';

            if (consecutiveErrors.current >= Math.min(MAX_CONSECUTIVE_ERRORS, Math.max(queue.length, 1))) {
                toast.error(`Could not play ${title}. Playback stopped after ${consecutiveErrors.current} failed tracks.`);
                consecutiveErrors.current = 0;
                actions.pause();
                return;
            }
            toast.error(`Could not play ${title} — skipping.`);
            actions.next();
        };

        audio.addEventListener('timeupdate', reportProgress);
        audio.addEventListener('durationchange', reportProgress);
        audio.addEventListener('loadedmetadata', handleLoadedMetadata);
        audio.addEventListener('ended', handleEnded);
        audio.addEventListener('playing', handlePlaying);
        audio.addEventListener('error', handleError);
        return () => {
            audio.removeEventListener('timeupdate', reportProgress);
            audio.removeEventListener('durationchange', reportProgress);
            audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
            audio.removeEventListener('ended', handleEnded);
            audio.removeEventListener('playing', handlePlaying);
            audio.removeEventListener('error', handleError);
        };
    }, [audio, actions]);

    // Load a new source whenever the current queue entry changes (also when the same song appears twice).
    useEffect(() => {
        if (!currentSong) {
            loadedQid.current = null;
            audio.pause();
            audio.removeAttribute('src');
            audio.load();
            return;
        }
        if (loadedQid.current !== currentSong.qid) {
            const isFirstLoad = loadedQid.current === null;
            loadedQid.current = currentSong.qid;
            if (!isFirstLoad) pendingSeek.current = null;
            audio.src = getStreamUrl(currentSong.id);
            audio.load();
        }
    }, [audio, currentSong]);

    // Play / pause.
    useEffect(() => {
        if (!currentSong) return;
        if (isPlaying) {
            audio.play().catch((error: unknown) => {
                if (error instanceof DOMException && error.name === 'AbortError') return; // source changed mid-start
                if (error instanceof DOMException && error.name === 'NotAllowedError') {
                    actions.pause(); // autoplay blocked until the user interacts
                    return;
                }
                console.error('Playback failed:', error);
            });
        } else {
            audio.pause();
        }
    }, [audio, currentSong, isPlaying, actions]);

    // Explicit seeks from the UI, media keys or "previous" restarts.
    useEffect(() => {
        if (!seekRequest) return;
        if (audio.readyState >= HTMLMediaElement.HAVE_METADATA) {
            audio.currentTime = seekRequest.time;
        } else {
            pendingSeek.current = seekRequest.time;
        }
    }, [audio, seekRequest]);

    useEffect(() => {
        audio.loop = repeat === 'one';
        audio.volume = Math.min(Math.max(volume / 100, 0), 1);
    }, [audio, repeat, volume]);

    // Space toggles play/pause unless the user is typing.
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.code !== 'Space') return;
            const active = document.activeElement as HTMLElement | null;
            if (active && (['INPUT', 'TEXTAREA', 'SELECT'].includes(active.tagName) || active.isContentEditable)) {
                return;
            }
            e.preventDefault();
            const { isPlaying: playing } = usePlayerStore.getState();
            if (playing) actions.pause(); else actions.resume();
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [actions]);

    // Media Session: OS media controls, hardware media keys, lock-screen / notification metadata.
    useEffect(() => {
        if (!hasMediaSession()) return;
        const session = navigator.mediaSession;
        const seekBy = (offset: number) => {
            const { currentTime, duration } = usePlayerStore.getState();
            actions.seekTo(Math.min(Math.max(currentTime + offset, 0), duration || Infinity));
        };
        const handlers: [MediaSessionAction, MediaSessionActionHandler][] = [
            ['play', () => actions.resume()],
            ['pause', () => actions.pause()],
            ['stop', () => actions.stop()],
            ['previoustrack', () => actions.previous()],
            ['nexttrack', () => actions.next()],
            ['seekbackward', (details) => seekBy(-(details.seekOffset ?? 10))],
            ['seekforward', (details) => seekBy(details.seekOffset ?? 10)],
            ['seekto', (details) => {
                if (details.seekTime !== undefined) actions.seekTo(details.seekTime);
            }],
        ];
        for (const [action, handler] of handlers) {
            try {
                session.setActionHandler(action, handler);
            } catch {
                // Action not supported by this browser.
            }
        }
        return () => {
            for (const [action] of handlers) {
                try {
                    session.setActionHandler(action, null);
                } catch {
                    // Ignore.
                }
            }
        };
    }, [actions]);

    useEffect(() => {
        if (!hasMediaSession()) return;
        if (!currentSong) {
            navigator.mediaSession.metadata = null;
            return;
        }
        const coverId = currentSong.coverArt || currentSong.albumId || currentSong.id;
        navigator.mediaSession.metadata = new MediaMetadata({
            title: currentSong.title,
            artist: currentSong.artist,
            album: currentSong.album,
            artwork: [
                { src: getCoverArtUrl(coverId, 256), sizes: '256x256' },
                { src: getCoverArtUrl(coverId, 512), sizes: '512x512' },
            ],
        });
    }, [currentSong]);

    useEffect(() => {
        if (!hasMediaSession()) return;
        navigator.mediaSession.playbackState = !currentSong ? 'none' : isPlaying ? 'playing' : 'paused';
    }, [currentSong, isPlaying]);

    return null;
}
