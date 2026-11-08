import { create } from 'zustand';
import { describeError, navidromeApi } from '../api/navidrome';
import { queryClient } from './react-query';
import { usePlayerStore } from '../store/usePlayerStore';
import { toast } from '../store/useToastStore';

type StarKind = 'song' | 'album' | 'artist';

interface StarOverrides {
    overrides: Record<string, boolean>;
    setOverride: (id: string, starred: boolean) => void;
}

/**
 * Optimistic star state. Albums and artists live in several React Query caches (lists, search, home),
 * so instead of patching each one, the latest known value per ID is kept here and wins over cached data.
 */
const useStarOverrides = create<StarOverrides>()((set) => ({
    overrides: {},
    setOverride: (id, starred) => set(state => ({ overrides: { ...state.overrides, [id]: starred } })),
}));

/** Whether an item is starred, given the `starred` timestamp the server sent with it. */
export const useIsStarred = (id: string, serverStarred?: string) =>
    useStarOverrides(state => state.overrides[id] ?? !!serverStarred);

export const toggleStar = async (kind: StarKind, id: string, currentlyStarred: boolean) => {
    const next = !currentlyStarred;
    const { setOverride } = useStarOverrides.getState();
    const { updateSong } = usePlayerStore.getState().actions;

    setOverride(id, next);
    if (kind === 'song') updateSong(id, { starred: next ? new Date().toISOString() : undefined });

    try {
        await navidromeApi.setStarred(kind, id, next);
        void queryClient.invalidateQueries({ queryKey: ['starred'] });
    } catch (error) {
        setOverride(id, currentlyStarred);
        if (kind === 'song') updateSong(id, { starred: currentlyStarred ? new Date().toISOString() : undefined });
        toast.error(`Could not update favourites: ${describeError(error)}`);
    }
};
