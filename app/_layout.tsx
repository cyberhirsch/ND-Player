import { Stack } from 'expo-router';
import { useEffect } from 'react';
import { useAuthStore } from '../src/store/useStore';
import { useRouter, useSegments } from 'expo-router';
import { Audio } from 'expo-av';
import { StatusBar } from 'expo-status-bar';
import { theme } from '../src/constants/theme';

export default function RootLayout() {
    const { isAuthenticated } = useAuthStore();
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
        // Don't navigate until the layout is mounted
        if (!segments || segments.length === 0) return;

        const inTabsGroup = segments[0] === '(tabs)';

        if (isAuthenticated && !inTabsGroup) {
            router.replace('/(tabs)/albums');
        } else if (!isAuthenticated && inTabsGroup) {
            router.replace('/');
        }
    }, [isAuthenticated, segments]);

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
