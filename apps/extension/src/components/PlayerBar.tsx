import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useShallow } from 'zustand/react/shallow';
import { usePlayerStore, type RepeatMode } from '../store/usePlayerStore';
import { describeError, getCoverArtUrl, navidromeApi } from '../api/navidrome';
import { toggleStar } from '../lib/starring';
import { toast } from '../store/useToastStore';
import HeartButton from './HeartButton';

const formatTime = (seconds: number) => {
    if (!seconds || !Number.isFinite(seconds)) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
};

const REPEAT_ORDER: RepeatMode[] = ['off', 'all', 'one'];

/** The only part of the bar that changes several times a second; isolated so the rest does not re-render. */
function Scrubber() {
    const currentTime = usePlayerStore(state => state.currentTime);
    const duration = usePlayerStore(state => state.duration);
    const seekTo = usePlayerStore(state => state.actions.seekTo);
    const [dragTime, setDragTime] = useState<number | null>(null);

    const shownTime = dragTime ?? currentTime;
    const commit = () => {
        if (dragTime !== null) {
            seekTo(dragTime);
            setDragTime(null);
        }
    };

    return (
        <div className="player-scrubber">
            <span className="time-label">{formatTime(shownTime)}</span>
            <input
                type="range"
                min={0}
                max={duration || 0}
                step="any"
                value={Math.min(shownTime, duration || 0)}
                onChange={(e) => setDragTime(Number(e.target.value))}
                onMouseUp={commit}
                onTouchEnd={commit}
                onKeyUp={commit}
                className="progress-slider"
                aria-label="Seek"
                style={{ '--progress': `${duration ? (shownTime / duration) * 100 : 0}%` } as React.CSSProperties}
            />
            <span className="time-label">{formatTime(duration)}</span>
        </div>
    );
}

export default function PlayerBar() {
    const { currentSong, isPlaying, volume, shuffle, repeat, skipOneStar } = usePlayerStore(useShallow(state => ({
        currentSong: state.currentSong,
        isPlaying: state.isPlaying,
        volume: state.volume,
        shuffle: state.shuffle,
        repeat: state.repeat,
        skipOneStar: state.skipOneStar,
    })));
    const actions = usePlayerStore(state => state.actions);
    const navigate = useNavigate();

    const setRating = async (rating: number) => {
        if (!currentSong) return;
        const previous = currentSong.userRating ?? 0;
        const newRating = previous === rating ? 0 : rating; // clicking the same rating clears it
        actions.updateSong(currentSong.id, { userRating: newRating });
        try {
            await navidromeApi.setRating(currentSong.id, newRating);
        } catch (error) {
            actions.updateSong(currentSong.id, { userRating: previous });
            toast.error(`Could not save rating: ${describeError(error)}`);
        }
    };

    const toggleRepeat = () => {
        actions.setRepeat(REPEAT_ORDER[(REPEAT_ORDER.indexOf(repeat) + 1) % REPEAT_ORDER.length]);
    };

    const openAlbum = () => {
        if (currentSong?.albumId) navigate(`/albums/${currentSong.albumId}`);
    };

    return (
        <div className="player-bar">
            {/* Left: Album Art & Info */}
            <div className="player-left">
                {currentSong ? (
                    <>
                        <button
                            type="button"
                            className="album-art-container"
                            onClick={openAlbum}
                            disabled={!currentSong.albumId}
                            title={currentSong.albumId ? `Open album "${currentSong.album}"` : undefined}
                        >
                            {currentSong.coverArt && (
                                <img
                                    src={getCoverArtUrl(currentSong.coverArt, 100)}
                                    alt={currentSong.album}
                                    className="player-album-art"
                                />
                            )}
                            {currentSong.albumId && (
                                <div className="player-album-art-overlay">
                                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <path d="M15 3h6v6M10 14L21 3M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                                    </svg>
                                </div>
                            )}
                        </button>
                        <div className="player-song-info">
                            <div className="player-title" title={currentSong.title}>{currentSong.title}</div>
                            <div className="player-artist" title={currentSong.artist}>{currentSong.artist}</div>
                        </div>
                    </>
                ) : (
                    <div className="player-placeholder">Select a song to play</div>
                )}
            </div>

            {/* Center: Controls & Scrubber */}
            <div className="player-center">
                <div className="player-controls">
                    <button
                        className="control-btn"
                        onClick={actions.toggleSkipOneStar}
                        title="Skip 1-Star Tracks"
                        aria-pressed={skipOneStar}
                        style={{ color: skipOneStar ? 'var(--accent-color)' : undefined }}
                    >
                        {skipOneStar ? (
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" fill="currentColor" stroke="none" />
                                <line x1="4" y1="4" x2="20" y2="20" stroke="currentColor" strokeWidth="2" />
                            </svg>
                        ) : (
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                            </svg>
                        )}
                    </button>

                    <button className="control-btn" onClick={actions.stop} title="Stop">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                            <rect x="6" y="6" width="12" height="12"></rect>
                        </svg>
                    </button>

                    <button className="control-btn" onClick={actions.previous} title="Previous">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" stroke="none">
                            <polygon points="19 20 9 12 19 4 19 20"></polygon>
                            <line x1="5" y1="19" x2="5" y2="5" stroke="currentColor" strokeWidth="2"></line>
                        </svg>
                    </button>

                    <button
                        className="play-pause-btn"
                        onClick={() => (isPlaying ? actions.pause() : actions.resume())}
                        title={isPlaying ? 'Pause' : 'Play'}
                    >
                        {isPlaying ? (
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                                <rect x="6" y="4" width="4" height="16"></rect>
                                <rect x="14" y="4" width="4" height="16"></rect>
                            </svg>
                        ) : (
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                                <polygon points="5 3 19 12 5 21 5 3"></polygon>
                            </svg>
                        )}
                    </button>

                    <button className="control-btn" onClick={actions.next} title="Next">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" stroke="none">
                            <polygon points="5 4 15 12 5 20 5 4"></polygon>
                            <line x1="19" y1="5" x2="19" y2="19" stroke="currentColor" strokeWidth="2"></line>
                        </svg>
                    </button>

                    <button
                        className="control-btn"
                        onClick={actions.toggleShuffle}
                        title="Shuffle"
                        aria-pressed={shuffle}
                        style={{ color: shuffle ? 'var(--accent-color)' : undefined }}
                    >
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <polyline points="16 3 21 3 21 8"></polyline>
                            <line x1="4" y1="20" x2="21" y2="3"></line>
                            <polyline points="21 16 21 21 16 21"></polyline>
                            <line x1="15" y1="15" x2="21" y2="21"></line>
                            <line x1="4" y1="4" x2="9" y2="9"></line>
                        </svg>
                    </button>

                    <button
                        className="control-btn"
                        onClick={toggleRepeat}
                        title={`Repeat: ${repeat}`}
                        style={{ color: repeat !== 'off' ? 'var(--accent-color)' : undefined }}
                    >
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <polyline points="17 1 21 5 17 9"></polyline>
                            <path d="M3 11V9a4 4 0 0 1 4-4h14"></path>
                            <polyline points="7 23 3 19 7 15"></polyline>
                            <path d="M21 13v2a4 4 0 0 1-4 4H3"></path>
                        </svg>
                        {repeat === 'one' && (
                            <span style={{ position: 'absolute', fontSize: '10px', fontWeight: 'bold' }}>1</span>
                        )}
                    </button>
                </div>

                <Scrubber />
            </div>

            {/* Right: Volume & Extras */}
            <div className="player-right">
                <div className="player-extras">
                    {currentSong && (
                        <HeartButton
                            className="control-btn"
                            size={20}
                            starred={!!currentSong.starred}
                            onToggle={() => void toggleStar('song', currentSong.id, !!currentSong.starred)}
                        />
                    )}

                    <div className="star-rating">
                        {[1, 2, 3, 4, 5].map((star) => (
                            <button
                                key={star}
                                className={`star-btn ${currentSong?.userRating && currentSong.userRating >= star ? 'filled' : ''}`}
                                onClick={() => void setRating(star)}
                                disabled={!currentSong}
                                title={`Rate ${star} star${star === 1 ? '' : 's'}`}
                            >
                                ★
                            </button>
                        ))}
                    </div>
                </div>

                <div className="volume-controls">
                    <button
                        className="control-btn"
                        onClick={() => actions.setVolume(volume === 0 ? 100 : 0)}
                        title={volume === 0 ? 'Unmute' : 'Mute'}
                    >
                        {volume === 0 ? (
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon>
                                <line x1="23" y1="9" x2="17" y2="15"></line>
                                <line x1="17" y1="9" x2="23" y2="15"></line>
                            </svg>
                        ) : (
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon>
                                <path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"></path>
                            </svg>
                        )}
                    </button>
                    <input
                        type="range"
                        min="0"
                        max="100"
                        value={volume}
                        onChange={(e) => actions.setVolume(Number(e.target.value))}
                        className="volume-slider"
                        aria-label="Volume"
                        style={{ '--volume': `${volume}%` } as React.CSSProperties}
                    />
                </div>
            </div>
        </div>
    );
}
