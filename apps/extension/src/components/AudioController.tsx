import { useEffect, useRef } from 'react';
import { usePlayerStore } from '../store/usePlayerStore';
import { getStreamUrl } from '../api/navidrome';

// Expose audio element globally so PlayerBar can access it
declare global {
    interface Window {
        audioElement?: HTMLAudioElement;
    }
}

export default function AudioController() {
    const { currentSong, isPlaying, volume, currentTime, repeat, actions } = usePlayerStore();
    const audioRef = useRef<HTMLAudioElement | null>(null);
    const lastSeekTime = useRef<number>(0);

    // Initialise the Audio element once
    useEffect(() => {
        if (!audioRef.current) {
            audioRef.current = new Audio();
            window.audioElement = audioRef.current; // Expose globally
        }
        const audio = audioRef.current;
        const handleEnded = () => {
            // Only call next() if not looping (repeat 'one' uses audio.loop)
            if (audio && !audio.loop) {
                actions.next();
            }
        };
        audio?.addEventListener('ended', handleEnded);
        return () => {
            audio?.removeEventListener('ended', handleEnded);
        };
    }, [actions]);

    // Keyboard shortcuts
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.code === 'Space') {
                // Ignore if typing in an input, textarea, etc.
                const activeElement = document.activeElement;
                if (activeElement && (
                    activeElement.tagName === 'INPUT' ||
                    activeElement.tagName === 'TEXTAREA' ||
                    (activeElement as HTMLElement).isContentEditable
                )) {
                    return;
                }

                e.preventDefault(); // Prevent scrolling
                if (isPlaying) {
                    actions.pause();
                } else if (currentSong) {
                    actions.resume();
                }
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isPlaying, currentSong, actions]);


    // Sync loop property and volume
    useEffect(() => {
        if (audioRef.current) {
            audioRef.current.loop = repeat === 'one';
            audioRef.current.volume = volume / 100;
        }
    }, [repeat, volume]);

    // Sync seeks from store to audio element
    useEffect(() => {
        const audio = audioRef.current;
        if (!audio || !currentSong) return;

        // Only seek if the time difference is significant (more than 1 second)
        // This prevents feedback loops from timeupdate events
        const timeDiff = Math.abs(audio.currentTime - currentTime);
        if (timeDiff > 1 && currentTime !== lastSeekTime.current) {
            audio.currentTime = currentTime;
            lastSeekTime.current = currentTime;
        }
    }, [currentTime, currentSong]);

    // Load / unload source and handle play/pause based on state
    useEffect(() => {
        const audio = audioRef.current;
        if (!audio) return;

        if (currentSong) {
            const streamUrl = getStreamUrl(currentSong.id);
            if (audio.src !== streamUrl) {
                audio.src = streamUrl;
                audio.load();
            }
            if (isPlaying) {
                audio.play().catch(console.error);
            } else {
                audio.pause();
            }
        } else {
            audio.pause();
            audio.src = '';
        }
    }, [currentSong, isPlaying, actions]);

    // Sync playback progress to store
    useEffect(() => {
        const audio = audioRef.current;
        if (!audio) return;
        const updateProgress = () => {
            actions.setProgress(audio.currentTime, audio.duration);
        };
        audio.addEventListener('timeupdate', updateProgress);
        audio.addEventListener('loadedmetadata', updateProgress);
        return () => {
            audio.removeEventListener('timeupdate', updateProgress);
            audio.removeEventListener('loadedmetadata', updateProgress);
        };
    }, [actions]);

    return null;
}
