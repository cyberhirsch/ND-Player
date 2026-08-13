import { useState } from 'react';

interface ContentToolbarProps {
    onSearch: (query: string) => void;
    onSortChange: (sort: string) => void;
    onFilterClick: () => void;
    onRefresh: () => void;
    onViewToggle: () => void;
    viewMode: 'grid' | 'list';
    currentSort: string;
}

export default function ContentToolbar({
    onSearch,
    onSortChange,
    onFilterClick,
    onRefresh,
    onViewToggle,
    viewMode,
    currentSort
}: ContentToolbarProps) {
    const [isSortOpen, setIsSortOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');

    const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setSearchQuery(e.target.value);
        onSearch(e.target.value);
    };

    const sortOptions = [
        { label: 'Album Artist', value: 'alphabeticalByArtist' },
        { label: 'Artist', value: 'artist' }, // Might map to same as above or specific API type
        { label: 'Duration', value: 'duration' },
        { label: 'Explicit Status', value: 'explicit' },
        { label: 'Most Played', value: 'frequent' },
        { label: 'Name', value: 'alphabetical' },
        { label: 'Random', value: 'random' },
        { label: 'Rating', value: 'rating' },
        { label: 'Recently Added', value: 'newest' },
        { label: 'Recently Played', value: 'recent' },
        { label: 'Song Count', value: 'songCount' },
        { label: 'Favorited', value: 'starred' },
        { label: 'Release Year', value: 'byYear' },
    ];

    return (
        <div className="content-toolbar">
            {/* Search Bar */}
            <div className="toolbar-search">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="search-icon">
                    <circle cx="11" cy="11" r="8"></circle>
                    <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                </svg>
                <input
                    type="text"
                    placeholder="Search..."
                    value={searchQuery}
                    onChange={handleSearchChange}
                    className="search-input"
                />
            </div>

            <div className="toolbar-actions">
                {/* Sort Order */}
                <div className="sort-dropdown-container">
                    <button
                        className={`toolbar-btn ${isSortOpen ? 'active' : ''}`}
                        onClick={() => setIsSortOpen(!isSortOpen)}
                        title="Sort Order"
                    >
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <line x1="21" y1="10" x2="3" y2="10"></line>
                            <line x1="21" y1="6" x2="3" y2="6"></line>
                            <line x1="21" y1="14" x2="3" y2="14"></line>
                            <line x1="21" y1="18" x2="3" y2="18"></line>
                            <polygon points="16 16 12 20 8 16" fill="currentColor" stroke="none" transform="translate(0, 2) scale(0.5)" />
                        </svg>
                    </button>
                    {isSortOpen && (
                        <div className="sort-menu">
                            {sortOptions.map((option) => (
                                <div
                                    key={option.value}
                                    className={`sort-option ${currentSort === option.value ? 'selected' : ''}`}
                                    onClick={() => {
                                        onSortChange(option.value);
                                        setIsSortOpen(false);
                                    }}
                                >
                                    {option.label}
                                    {currentSort === option.value && (
                                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                            <polyline points="20 6 9 17 4 12"></polyline>
                                        </svg>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Filter Options */}
                <button className="toolbar-btn" onClick={onFilterClick} title="Filter Options">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"></polygon>
                    </svg>
                </button>

                {/* Refresh */}
                <button className="toolbar-btn" onClick={onRefresh} title="Refresh">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M23 4v6h-6"></path>
                        <path d="M1 20v-6h6"></path>
                        <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"></path>
                    </svg>
                </button>

                {/* More Actions */}
                <button className="toolbar-btn" title="More Actions">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <circle cx="12" cy="12" r="1"></circle>
                        <circle cx="19" cy="12" r="1"></circle>
                        <circle cx="5" cy="12" r="1"></circle>
                    </svg>
                </button>

                {/* View Toggle */}
                <button className="toolbar-btn" onClick={onViewToggle} title="Toggle View">
                    {viewMode === 'grid' ? (
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <rect x="3" y="3" width="7" height="7"></rect>
                            <rect x="14" y="3" width="7" height="7"></rect>
                            <rect x="14" y="14" width="7" height="7"></rect>
                            <rect x="3" y="14" width="7" height="7"></rect>
                        </svg>
                    ) : (
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <line x1="8" y1="6" x2="21" y2="6"></line>
                            <line x1="8" y1="12" x2="21" y2="12"></line>
                            <line x1="8" y1="18" x2="21" y2="18"></line>
                            <line x1="3" y1="6" x2="3.01" y2="6"></line>
                            <line x1="3" y1="12" x2="3.01" y2="12"></line>
                            <line x1="3" y1="18" x2="3.01" y2="18"></line>
                        </svg>
                    )}
                </button>
            </div>
            <style>{`
                .content-toolbar {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-bottom: 20px;
                    gap: 1rem;
                }
                .toolbar-search {
                    position: relative;
                    flex: 1;
                    max-width: 400px;
                }
                .search-icon {
                    position: absolute;
                    left: 10px;
                    top: 50%;
                    transform: translateY(-50%);
                    color: #aaa;
                    pointer-events: none;
                }
                .search-input {
                    width: 100%;
                    padding: 10px 10px 10px 35px;
                    border-radius: 4px;
                    border: 1px solid #333;
                    background: #222;
                    color: white;
                    font-size: 1em;
                }
                .search-input:focus {
                    outline: none;
                    border-color: var(--accent-color);
                }
                .toolbar-actions {
                    display: flex;
                    gap: 10px;
                }
                .toolbar-btn {
                    padding: 8px;
                    background: transparent;
                    border: 1px solid transparent;
                    color: #aaa;
                    border-radius: 4px;
                    cursor: pointer;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                }
                .toolbar-btn:hover, .toolbar-btn.active {
                    color: white;
                    background: rgba(255, 255, 255, 0.1);
                }
                .sort-dropdown-container {
                    position: relative;
                }
                .sort-menu {
                    position: absolute;
                    top: 100%;
                    right: 0;
                    background: #222;
                    border: 1px solid #333;
                    border-radius: 4px;
                    padding: 5px 0;
                    z-index: 100;
                    min-width: 150px;
                    margin-top: 5px;
                }
                .sort-option {
                    padding: 8px 15px;
                    cursor: pointer;
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    color: #ccc;
                }
                .sort-option:hover {
                    background: rgba(255, 255, 255, 0.1);
                    color: white;
                }
                .sort-option.selected {
                    color: var(--accent-color);
                }
            `}</style>
        </div>
    );
}
