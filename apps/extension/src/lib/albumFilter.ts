/**
 * The Subsonic album list takes exactly one list type, so filters are one choice, not a stack of checkboxes.
 * Every option here maps directly onto a getAlbumList2 type.
 */
export type AlbumFilter =
    | { kind: 'none' }
    | { kind: 'starred' }
    | { kind: 'genre'; genre: string }
    | { kind: 'year'; fromYear: number; toYear: number };

export const NO_FILTER: AlbumFilter = { kind: 'none' };

export const describeFilter = (filter: AlbumFilter): string | null => {
    switch (filter.kind) {
        case 'starred': return 'Favourites';
        case 'genre': return `Genre: ${filter.genre}`;
        case 'year': return filter.fromYear === filter.toYear ? `Year: ${filter.fromYear}` : `Years: ${filter.fromYear}–${filter.toYear}`;
        default: return null;
    }
};
