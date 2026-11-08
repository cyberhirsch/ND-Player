import { useState, type Ref } from 'react';
import { Link } from 'react-router-dom';
import { getCoverArtUrl } from '../api/navidrome';
import { playAlbum, queueAlbum, fetchAlbumSongs } from '../lib/albumActions';
import { toggleStar, useIsStarred } from '../lib/starring';
import type { Album } from '../types';
import HeartButton from './HeartButton';
import AddToPlaylistModal from './AddToPlaylistModal';

interface AlbumCardProps {
    album: Album;
    /** Second line under the title; defaults to the artist. */
    subtitle?: string;
    cardRef?: Ref<HTMLDivElement>;
}

export default function AlbumCard({ album, subtitle, cardRef }: AlbumCardProps) {
    const starred = useIsStarred(album.id, album.starred);
    const [showPlaylistPicker, setShowPlaylistPicker] = useState(false);
    const albumUrl = `/albums/${album.id}`;

    return (
        <div ref={cardRef} className="album-card">
            <div className="album-cover-container">
                <Link to={albumUrl} className="album-cover-link" aria-label={`Open ${album.name}`}>
                    <img
                        src={getCoverArtUrl(album.coverArt || album.id, 300)}
                        alt={album.name}
                        className="album-cover"
                        loading="lazy"
                    />
                </Link>

                <HeartButton
                    className="card-heart"
                    starred={starred}
                    onToggle={() => void toggleStar('album', album.id, starred)}
                />

                {/* The overlay itself ignores the pointer so clicks fall through to the cover link. */}
                <div className="album-overlay">
                    <button className="album-action-btn" title="Add to Playlist" onClick={() => setShowPlaylistPicker(true)}>
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <line x1="12" y1="5" x2="12" y2="19"></line>
                            <line x1="5" y1="12" x2="19" y2="12"></line>
                        </svg>
                    </button>

                    <button className="album-play-btn" title="Play Album" onClick={() => void playAlbum(album.id)}>
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                            <polygon points="5 3 19 12 5 21 5 3"></polygon>
                        </svg>
                    </button>

                    <button className="album-action-btn" title="Add to Queue" onClick={() => void queueAlbum(album.id, album.name)}>
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <line x1="8" y1="6" x2="21" y2="6"></line>
                            <line x1="8" y1="12" x2="21" y2="12"></line>
                            <line x1="8" y1="18" x2="21" y2="18"></line>
                            <line x1="3" y1="6" x2="3.01" y2="6"></line>
                            <line x1="3" y1="12" x2="3.01" y2="12"></line>
                            <line x1="3" y1="18" x2="3.01" y2="18"></line>
                        </svg>
                    </button>
                </div>
            </div>

            <Link to={albumUrl} className="album-info-link">
                <div className="album-info">
                    <div className="album-name" title={album.name}>{album.name}</div>
                    <div className="album-artist" title={subtitle ?? album.artist}>{subtitle ?? album.artist}</div>
                </div>
            </Link>

            {showPlaylistPicker && (
                <AddToPlaylistModal
                    label={album.name}
                    loadSongIds={async () => (await fetchAlbumSongs(album.id)).map(song => song.id)}
                    onClose={() => setShowPlaylistPicker(false)}
                />
            )}
        </div>
    );
}
