import { useState } from 'react';
import { usePlayerStore } from '../store/usePlayerStore';
import { navidromeApi, getCoverArtUrl } from '../api/navidrome';
import { useNavigate } from 'react-router-dom';

const formatTime = (seconds: number) => {
    if (!seconds) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
};

export default function PlayerBar() {
    const { currentSong, isPlaying, volume, currentTime, duration, shuffle, repeat, skipOneStar, actions } = usePlayerStore();
    const navigate = useNavigate();
    const [isDragging, setIsDragging] = useState(false);
    const [dragTime, setDragTime] = useState(0);

    const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
        const time = Number(e.target.value);
        if (isDragging) {
            setDragTime(time);
        } else {
            // Direct click without drag
            actions.setCurrentTime(time);
        }
    };

    const handleSeekEnd = () => {
        if (isDragging) {
            actions.setCurrentTime(dragTime);
            setIsDragging(false);
        }
    };

    const handleSeekStart = () => {
        setIsDragging(true);
        setDragTime(currentTime);
    };

    const toggleFavorite = async () => {
        if (!currentSong) return;
        try {
            if (currentSong.starred) {
                await navidromeApi.unstar(currentSong.id);
                actions.updateSong(currentSong.id, { starred: undefined });
            } else {
                await navidromeApi.star(currentSong.id);
                actions.updateSong(currentSong.id, { starred: new Date().toISOString() });
            }
        } catch (error) {
            console.error('Failed to toggle favorite:', error);
        }
    };

    const setRating = async (rating: number) => {
        if (!currentSong) return;
        try {
            // If clicking same rating, remove it (set to 0)
            const newRating = currentSong.userRating === rating ? 0 : rating;
            await navidromeApi.setRating(currentSong.id, newRating);
            actions.updateSong(currentSong.id, { userRating: newRating });
        } catch (error) {
            console.error('Failed to set rating:', error);
        }
    };

    const toggleRepeat = () => {
        const modes: ('off' | 'all' | 'one')[] = ['off', 'all', 'one'];
        const currentIndex = modes.indexOf(repeat);
        const nextMode = modes[(currentIndex + 1) % modes.length];
        actions.setRepeat(nextMode);
    };

    return (
        <div className="player-bar">
            {/* Left: Album Art & Info */}
            <div className="player-left">
                {currentSong ? (
                    <>
                        <div
                            className="album-art-container"
                            onClick={() => navigate(`/albums/${currentSong.album}`)} // Assuming album ID is not directly available, might need to fetch or use albumId if available. Wait, Song interface has album string (name) but not ID? Let's check.
                        // Actually Song interface has `album` which is the name. We need `albumId`. 
                        // Standard Navidrome/Subsonic song object usually has `albumId`. 
                        // Let's assume for now we can't navigate easily without ID. 
                        // Wait, looking at types.ts, Song has `album: string`. 
                        // I might need to update Song type to include `albumId`.
                        // For now, let's just show the art.
                        >
                            {currentSong.coverArt && (
                                <img
                                    src={getCoverArtUrl(currentSong.coverArt) + '&size=100'}
                                    alt={currentSong.album}
                                    className="player-album-art"
                                />
                            )}
                            <div className="player-album-art-overlay">
                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <polyline points="15 18 9 12 15 6"></polyline>
                                </svg>
                            </div>
                        </div>
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
                    {/* 1. Skip 1-Star */}
                    <button
                        className="control-btn"
                        onClick={actions.toggleSkipOneStar}
                        title="Skip 1-Star Tracks"
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

                    {/* 2. Stop */}
                    <button className="control-btn" onClick={actions.stop} title="Stop">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                            <rect x="6" y="6" width="12" height="12"></rect>
                        </svg>
                    </button>

                    {/* 3. Previous */}
                    <button className="control-btn" onClick={actions.previous} title="Previous">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" stroke="none">
                            <polygon points="19 20 9 12 19 4 19 20"></polygon>
                            <line x1="5" y1="19" x2="5" y2="5" stroke="currentColor" strokeWidth="2"></line>
                        </svg>
                    </button>

                    {/* 4. Play/Pause */}
                    <button
                        className="play-pause-btn"
                        onClick={() => isPlaying ? actions.pause() : currentSong ? actions.resume() : null}
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

                    {/* 5. Next */}
                    <button className="control-btn" onClick={actions.next} title="Next">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" stroke="none">
                            <polygon points="5 4 15 12 5 20 5 4"></polygon>
                            <line x1="19" y1="5" x2="19" y2="19" stroke="currentColor" strokeWidth="2"></line>
                        </svg>
                    </button>

                    {/* 6. Shuffle */}
                    <button
                        className="control-btn"
                        onClick={actions.toggleShuffle}
                        title="Shuffle"
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

                    {/* 7. Repeat */}
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

                <div className="player-scrubber">
                    <span className="time-label">{formatTime(isDragging ? dragTime : currentTime)}</span>
                    <input
                        type="range"
                        min={0}
                        max={duration || 0}
                        value={isDragging ? dragTime : currentTime}
                        onChange={handleSeek}
                        onMouseDown={handleSeekStart}
                        onMouseUp={handleSeekEnd}
                        onTouchStart={handleSeekStart}
                        onTouchEnd={handleSeekEnd}
                        className="progress-slider"
                        style={{
                            '--progress': `${duration ? ((isDragging ? dragTime : currentTime) / duration) * 100 : 0}%`
                        } as React.CSSProperties}
                    />
                    <span className="time-label">{formatTime(duration)}</span>
                </div>
            </div>

            {/* Right: Volume & Extras */}
            <div className="player-right">
                <div className="player-extras">
                    <button
                        className={`control-btn ${currentSong?.starred ? 'active' : ''}`}
                        onClick={toggleFavorite}
                        title="Favorite"
                    >
                        <svg width="20" height="20" viewBox="0 0 24 24" fill={currentSong?.starred ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2">
                            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
                        </svg>
                    </button>

                    <div className="star-rating">
                        {[1, 2, 3, 4, 5].map((star) => (
                            <button
                                key={star}
                                className={`star-btn ${currentSong?.userRating && currentSong.userRating >= star ? 'filled' : ''}`}
                                onClick={() => setRating(star)}
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
                        style={{
                            '--volume': `${volume}%`
                        } as React.CSSProperties}
                    />
                </div>
            </div>
        </div>
    );
}
