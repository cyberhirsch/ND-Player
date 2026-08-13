export interface Song {
    id: string;
    title: string;
    artist: string;
    album: string;
    duration: number;
    coverArt?: string;
    path?: string;
    starred?: string;
    userRating?: number;
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
    song?: Song[]; // For album details
}

export interface Artist {
    id: string;
    name: string;
    albumCount: number;
    coverArt?: string;
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

export interface PlayerState {
    isPlaying: boolean;
    currentSong: Song | null;
    queue: Song[];
    volume: number;
    currentTime: number;
    duration: number;
    actions: {
        play: (song: Song) => void;
        pause: () => void;
        resume: () => void;
        setVolume: (volume: number) => void;
        addToQueue: (song: Song) => void;
        clearQueue: () => void;
        setProgress: (time: number, duration: number) => void;
        setCurrentTime: (time: number) => void;
    }
}
