import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { navidromeApi } from '../api/navidrome';

export interface FilterState {
    starred?: string;
    compilation?: string;
    rated?: boolean;
    recentlyPlayed?: boolean;
    year?: string;
    genre?: string;
    artist?: string;
}

interface FilterModalProps {
    isOpen: boolean;
    onClose: () => void;
    onApply: (filters: FilterState) => void;
    initialFilters: FilterState;
}

export default function FilterModal({ isOpen, onClose, onApply, initialFilters }: FilterModalProps) {
    const [filters, setFilters] = useState<FilterState>(initialFilters);

    // Reset filters when modal opens
    useEffect(() => {
        if (isOpen) setFilters(initialFilters);
    }, [isOpen, initialFilters]);

    const { data: genres } = useQuery({
        queryKey: ['genres'],
        queryFn: navidromeApi.getGenres,
        enabled: isOpen
    });

    const { data: artists } = useQuery({
        queryKey: ['artists'],
        queryFn: navidromeApi.getArtists,
        enabled: isOpen
    });

    if (!isOpen) return null;

    const handleChange = (key: keyof FilterState, value: any) => {
        setFilters(prev => ({ ...prev, [key]: value }));
    };

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content" onClick={e => e.stopPropagation()}>
                <div className="modal-header">
                    <h2>Filter Albums</h2>
                    <button onClick={onClose} className="close-btn">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <line x1="18" y1="6" x2="6" y2="18"></line>
                            <line x1="6" y1="6" x2="18" y2="18"></line>
                        </svg>
                    </button>
                </div>

                <div className="modal-body">
                    <div className="filter-group">
                        <label>Is Favorited</label>
                        <select
                            value={filters.starred || ''}
                            onChange={e => handleChange('starred', e.target.value)}
                        >
                            <option value="">Any</option>
                            <option value="yes">Yes</option>
                            <option value="no">No</option>
                        </select>
                    </div>

                    <div className="filter-group">
                        <label>Is Compilation</label>
                        <select
                            value={filters.compilation || ''}
                            onChange={e => handleChange('compilation', e.target.value)}
                        >
                            <option value="">Any</option>
                            <option value="yes">Yes</option>
                            <option value="no">No</option>
                        </select>
                    </div>

                    <div className="filter-group-toggle">
                        <label>
                            <input
                                type="checkbox"
                                checked={filters.rated || false}
                                onChange={e => handleChange('rated', e.target.checked)}
                            />
                            Is Rated
                        </label>
                    </div>

                    <div className="filter-group-toggle">
                        <label>
                            <input
                                type="checkbox"
                                checked={filters.recentlyPlayed || false}
                                onChange={e => handleChange('recentlyPlayed', e.target.checked)}
                            />
                            Is Recently Played
                        </label>
                    </div>

                    <div className="filter-group">
                        <label>Year</label>
                        <input
                            type="number"
                            value={filters.year || ''}
                            onChange={e => handleChange('year', e.target.value)}
                            placeholder="YYYY"
                        />
                    </div>

                    <div className="filter-group">
                        <label>Genre</label>
                        <select
                            value={filters.genre || ''}
                            onChange={e => handleChange('genre', e.target.value)}
                        >
                            <option value="">Any</option>
                            {genres?.map((g: any) => (
                                <option key={g.value} value={g.value}>{g.value}</option>
                            ))}
                        </select>
                    </div>

                    <div className="filter-group">
                        <label>Artist</label>
                        <select
                            value={filters.artist || ''}
                            onChange={e => handleChange('artist', e.target.value)}
                        >
                            <option value="">Any</option>
                            {artists?.map((a: any) => (
                                <option key={a.id} value={a.id}>{a.name}</option>
                            ))}
                        </select>
                    </div>
                </div>

                <div className="modal-footer">
                    <button className="btn-secondary" onClick={() => setFilters({})}>Reset</button>
                    <button className="btn-primary" onClick={() => onApply(filters)}>Apply Filters</button>
                </div>
            </div>
        </div>
    );
}
