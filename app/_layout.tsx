import { Stack } from 'expo-router';
import { useEffect } from 'react';
import { useAuthStore, useSettingsStore } from '../src/store/useStore';
import { useRouter, useSegments } from 'expo-router';
import { Audio } from 'expo-av';
import { StatusBar } from 'expo-status-bar';
import { theme } from '../src/constants/theme';

export default function RootLayout() {
    const { serverUrl } = useAuthStore();
    const { musicFolders } = useSettingsStore();
    const segments = useSegments();
    const router = useRouter();

    useEffect(() => {
        Audio.setAudioModeAsync({
            staysActiveInBackground: true,
            shouldDuckAndroid: true,
            playThroughEarpieceAndroid: false,
        });
    }, []);

    useEffect(() => {
        if (!segments || segments.length === 0) return;

        const inTabsGroup = segments[0] === '(tabs)';

        if (!inTabsGroup) {
            // Go to albums if server or local music is configured, otherwise settings
            if (serverUrl || musicFolders.length > 0) {
                router.replace('/(tabs)/albums');
            } else {
                router.replace('/(tabs)/settings');
            }
        }
    }, [segments]);

    return (
        <>
            <StatusBar style="light" />
            <Stack screenOptions={{
                headerStyle: { backgroundColor: theme.colors.background },
                headerTintColor: theme.colors.textPrimary,
                contentStyle: { backgroundColor: theme.colors.background },
            }}>
                <Stack.Screen name="index" options={{ headerShown: false }} />
                <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
            </Stack>
        </>
    );
}
