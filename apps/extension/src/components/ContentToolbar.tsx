import { useEffect, useRef, useState } from 'react';

export interface SortOption {
    label: string;
    value: string;
}

interface ContentToolbarProps {
    onSearch: (query: string) => void;
    onRefresh: () => void;
    /** Omit to hide the sort menu. */
    sortOptions?: SortOption[];
    currentSort?: string;
    onSortChange?: (sort: string) => void;
    /** Omit to hide the filter button. */
    onFilterClick?: () => void;
    /** Highlights the filter button when a filter is in effect. */
    filterActive?: boolean;
    /** Omit to hide the grid/list toggle. */
    viewMode?: 'grid' | 'list';
    onViewToggle?: () => void;
    searchPlaceholder?: string;
}

export default function ContentToolbar({
    onSearch,
    onRefresh,
    sortOptions,
    currentSort,
    onSortChange,
    onFilterClick,
    filterActive = false,
    viewMode,
    onViewToggle,
    searchPlaceholder = 'Search...',
}: ContentToolbarProps) {
    const [isSortOpen, setIsSortOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const sortRef = useRef<HTMLDivElement>(null);

    // Close the sort menu on any click outside it.
    useEffect(() => {
        if (!isSortOpen) return;
        const handleClick = (e: MouseEvent) => {
            if (sortRef.current && !sortRef.current.contains(e.target as Node)) setIsSortOpen(false);
        };
        document.addEventListener('mousedown', handleClick);
        return () => document.removeEventListener('mousedown', handleClick);
    }, [isSortOpen]);

    return (
        <div className="content-toolbar">
            <div className="toolbar-search">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="search-icon">
                    <circle cx="11" cy="11" r="8"></circle>
                    <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                </svg>
                <input
                    type="search"
                    placeholder={searchPlaceholder}
                    value={searchQuery}
                    onChange={(e) => {
                        setSearchQuery(e.target.value);
                        onSearch(e.target.value);
                    }}
                    className="search-input"
                    aria-label={searchPlaceholder}
                />
            </div>

            <div className="toolbar-actions">
                {sortOptions && sortOptions.length > 0 && onSortChange && (
                    <div className="sort-dropdown-container" ref={sortRef}>
                        <button
                            className={`toolbar-btn ${isSortOpen ? 'active' : ''}`}
                            onClick={() => setIsSortOpen(!isSortOpen)}
                            title="Sort Order"
                            aria-expanded={isSortOpen}
                        >
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <line x1="21" y1="10" x2="3" y2="10"></line>
                                <line x1="21" y1="6" x2="3" y2="6"></line>
                                <line x1="21" y1="14" x2="3" y2="14"></line>
                                <line x1="21" y1="18" x2="3" y2="18"></line>
                            </svg>
                        </button>
                        {isSortOpen && (
                            <div className="sort-menu" role="menu">
                                {sortOptions.map((option) => (
                                    <button
                                        key={option.value}
                                        role="menuitemradio"
                                        aria-checked={currentSort === option.value}
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
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {onFilterClick && (
                    <button className={`toolbar-btn ${filterActive ? 'active filter-on' : ''}`} onClick={onFilterClick} title="Filter Options">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill={filterActive ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2">
                            <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"></polygon>
                        </svg>
                    </button>
                )}

                <button className="toolbar-btn" onClick={onRefresh} title="Refresh">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M23 4v6h-6"></path>
                        <path d="M1 20v-6h6"></path>
                        <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"></path>
                    </svg>
                </button>

                {viewMode && onViewToggle && (
                    <button
                        className="toolbar-btn"
                        onClick={onViewToggle}
                        title={viewMode === 'grid' ? 'Switch to list view' : 'Switch to grid view'}
                    >
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
                )}
            </div>
        </div>
    );
}
