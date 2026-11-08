export interface Song {
    id: string;
    title: string;
    artist: string;
    artistId?: string;
    album: string;
    albumId?: string;
    duration: number;
    track?: number;
    year?: number;
    coverArt?: string;
    path?: string;
    starred?: string;
    userRating?: number;
}

/** A song as it sits in the play queue. `qid` is unique per queue entry, so the same song can appear twice. */
export interface QueueItem extends Song {
    qid: string;
}

export interface Album {
    id: string;
    name: string;
    artist: string;
    artistId: string;
    coverArt: string;
    songCount: number;
    duration: number;
    created: string;
    year?: number;
    genre?: string;
    starred?: string;
    song?: Song[]; // For album details
}

export interface Artist {
    id: string;
    name: string;
    albumCount: number;
    coverArt?: string;
    starred?: string;
    biography?: string;
    album?: Album[]; // For artist details
}

export interface Playlist {
    id: string;
    name: string;
    comment?: string;
    owner: string;
    public: boolean;
    songCount: number;
    duration: number;
    created: string;
    changed: string;
    coverArt?: string;
    entry?: Song[]; // For playlist details
}

export interface Genre {
    value: string;
    songCount?: number;
    albumCount?: number;
}

export interface Starred {
    artist: Artist[];
    album: Album[];
    song: Song[];
}

/** getAlbumList2 list types supported by the Subsonic API. */
export type AlbumListType =
    | 'newest'
    | 'alphabeticalByName'
    | 'alphabeticalByArtist'
    | 'frequent'
    | 'recent'
    | 'highest'
    | 'random'
    | 'starred'
    | 'byGenre'
    | 'byYear';
