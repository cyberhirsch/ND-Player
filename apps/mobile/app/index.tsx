import { Redirect } from 'expo-router';
import { useAuthStore, useSettingsStore } from '../src/store/useStore';

export default function Index() {
    const serverUrl = useAuthStore((state) => state.serverUrl);
    const musicFolders = useSettingsStore((state) => state.musicFolders);

    if (serverUrl || musicFolders.length > 0) {
        return <Redirect href="/(tabs)/albums" />;
    }
    return <Redirect href="/(tabs)/settings" />;
}
