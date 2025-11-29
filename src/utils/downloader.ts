import * as FileSystem from 'expo-file-system';
import { getStreamUrl } from '../api/navidrome';
import { useOfflineStore } from '../store/useStore';

export const downloadTrack = async (trackId: string) => {
    try {
        const url = await getStreamUrl(trackId);
        const fileUri = FileSystem.documentDirectory + `${trackId}.mp3`;

        const downloadResumable = FileSystem.createDownloadResumable(
            url,
            fileUri,
            {},
            (downloadProgress) => {
                // const progress = downloadProgress.totalBytesWritten / downloadProgress.totalBytesExpectedToWrite;
                // We could update progress in store if needed
            }
        );

        const result = await downloadResumable.downloadAsync();
        if (result && result.uri) {
            useOfflineStore.getState().addDownloadedTrack(trackId, result.uri);
            return result.uri;
        }
    } catch (e) {
        console.error("Download failed", e);
    }
    return null;
};

export const deleteTrack = async (trackId: string) => {
    const uri = useOfflineStore.getState().downloadedTracks[trackId];
    if (uri) {
        await FileSystem.deleteAsync(uri, { idempotent: true });
        useOfflineStore.getState().removeDownloadedTrack(trackId);
    }
};
