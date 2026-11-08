import { useState } from 'react';
import { createPortal } from 'react-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { describeError, navidromeApi } from '../api/navidrome';
import { toast } from '../store/useToastStore';

interface AddToPlaylistModalProps {
    /** What is being added, for the heading, e.g. an album name. */
    label: string;
    /** Resolves the song IDs to add (an album needs a fetch first). */
    loadSongIds: () => Promise<string[]>;
    onClose: () => void;
}

export default function AddToPlaylistModal({ label, loadSongIds, onClose }: AddToPlaylistModalProps) {
    const queryClient = useQueryClient();
    const [newName, setNewName] = useState('');
    const [busy, setBusy] = useState(false);

    const { data: playlists = [], isLoading } = useQuery({
        queryKey: ['playlists'],
        queryFn: navidromeApi.getPlaylists,
    });

    const run = async (work: (songIds: string[]) => Promise<string>) => {
        setBusy(true);
        try {
            const songIds = await loadSongIds();
            if (songIds.length === 0) {
                toast.error('Nothing to add — no songs found.');
                return;
            }
            const message = await work(songIds);
            void queryClient.invalidateQueries({ queryKey: ['playlists'] });
            void queryClient.invalidateQueries({ queryKey: ['playlist'] });
            toast.success(message);
            onClose();
        } catch (error) {
            toast.error(`Could not add to playlist: ${describeError(error)}`);
        } finally {
            setBusy(false);
        }
    };

    const addToExisting = (playlistId: string, playlistName: string) =>
        run(async (songIds) => {
            await navidromeApi.addToPlaylist(playlistId, songIds);
            return `Added ${songIds.length} ${songIds.length === 1 ? 'song' : 'songs'} to "${playlistName}".`;
        });

    const createNew = () => {
        const name = newName.trim();
        if (!name) return;
        return run(async (songIds) => {
            await navidromeApi.createPlaylist(name, songIds);
            return `Created "${name}" with ${songIds.length} ${songIds.length === 1 ? 'song' : 'songs'}.`;
        });
    };

    // Portal: render at <body> level so card stacking contexts and scroll containers cannot clip the overlay.
    return createPortal(
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content add-to-playlist" onClick={e => e.stopPropagation()}>
                <h3>Add "{label}" to playlist</h3>

                <div className="playlist-pick-list">
                    {isLoading && <div className="muted">Loading playlists…</div>}
                    {!isLoading && playlists.length === 0 && <div className="muted">No playlists yet.</div>}
                    {playlists.map(playlist => (
                        <button
                            key={playlist.id}
                            className="playlist-pick"
                            disabled={busy}
                            onClick={() => addToExisting(playlist.id, playlist.name)}
                        >
                            <span>{playlist.name}</span>
                            <span className="muted">{playlist.songCount} songs</span>
                        </button>
                    ))}
                </div>

                <input
                    type="text"
                    placeholder="New playlist name"
                    value={newName}
                    onChange={e => setNewName(e.target.value)}
                    onKeyDown={e => {
                        if (e.key === 'Enter') void createNew();
                    }}
                    disabled={busy}
                />
                <div className="modal-actions">
                    <button onClick={() => void createNew()} disabled={busy || !newName.trim()}>Create &amp; add</button>
                    <button onClick={onClose}>Cancel</button>
                </div>
            </div>
        </div>,
        document.body,
    );
}
