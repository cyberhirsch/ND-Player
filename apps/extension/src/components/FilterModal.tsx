import { useState } from 'react';
import { createPortal } from 'react-dom';
import { useQuery } from '@tanstack/react-query';
import { navidromeApi } from '../api/navidrome';
import { NO_FILTER, type AlbumFilter } from '../lib/albumFilter';

interface FilterModalProps {
    onClose: () => void;
    onApply: (filter: AlbumFilter) => void;
    initialFilter: AlbumFilter;
}

/** Mount only while open, so the form starts from the current filter each time. */
export default function FilterModal({ onClose, onApply, initialFilter }: FilterModalProps) {
    const [kind, setKind] = useState<AlbumFilter['kind']>(initialFilter.kind);
    const [genre, setGenre] = useState(initialFilter.kind === 'genre' ? initialFilter.genre : '');
    const [fromYear, setFromYear] = useState(initialFilter.kind === 'year' ? String(initialFilter.fromYear) : '');
    const [toYear, setToYear] = useState(initialFilter.kind === 'year' ? String(initialFilter.toYear) : '');

    const { data: genres = [] } = useQuery({
        queryKey: ['genres'],
        queryFn: navidromeApi.getGenres,
    });

    const from = Number(fromYear);
    const to = toYear ? Number(toYear) : from;
    const yearValid = Number.isInteger(from) && from > 0 && Number.isInteger(to) && to > 0;
    const canApply = kind !== 'genre' ? (kind !== 'year' || yearValid) : !!genre;

    const apply = () => {
        switch (kind) {
            case 'genre': onApply({ kind, genre }); break;
            case 'year': onApply({ kind, fromYear: from, toYear: to }); break;
            default: onApply({ kind } as AlbumFilter);
        }
    };

    const option = (value: AlbumFilter['kind'], label: string) => (
        <label className="filter-option">
            <input type="radio" name="album-filter" checked={kind === value} onChange={() => setKind(value)} />
            {label}
        </label>
    );

    return createPortal(
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content filter-modal" onClick={e => e.stopPropagation()}>
                <div className="modal-header">
                    <h3>Filter Albums</h3>
                    <button onClick={onClose} className="close-btn" aria-label="Close">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <line x1="18" y1="6" x2="6" y2="18"></line>
                            <line x1="6" y1="6" x2="18" y2="18"></line>
                        </svg>
                    </button>
                </div>

                <div className="modal-body">
                    {option('none', 'All albums')}
                    {option('starred', 'Favourites')}

                    {option('genre', 'Genre')}
                    {kind === 'genre' && (
                        <select className="filter-input" value={genre} onChange={e => setGenre(e.target.value)} autoFocus>
                            <option value="">Choose a genre…</option>
                            {genres.map(g => (
                                <option key={g.value} value={g.value}>{g.value}</option>
                            ))}
                        </select>
                    )}

                    {option('year', 'Release year')}
                    {kind === 'year' && (
                        <div className="filter-year-range">
                            <input className="filter-input" type="number" placeholder="From (YYYY)" value={fromYear} onChange={e => setFromYear(e.target.value)} autoFocus />
                            <span>to</span>
                            <input className="filter-input" type="number" placeholder="To (optional)" value={toYear} onChange={e => setToYear(e.target.value)} />
                        </div>
                    )}

                    <p className="muted filter-note">Sorting applies to "All albums" only; filtered lists use the server's own order.</p>
                </div>

                <div className="modal-actions">
                    <button className="btn-secondary" onClick={() => onApply(NO_FILTER)}>Reset</button>
                    <button className="btn-primary" onClick={apply} disabled={!canApply}>Apply</button>
                </div>
            </div>
        </div>,
        document.body,
    );
}
