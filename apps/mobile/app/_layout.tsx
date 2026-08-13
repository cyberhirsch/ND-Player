import { Stack } from 'expo-router';
import { useEffect } from 'react';
import { useAuthStore, useSettingsStore, usePlayerStore } from '../src/store/useStore';
import { useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { theme } from '../src/constants/theme';
import TrackPlayer, { Event, Capability, AppKilledPlaybackBehavior, State } from 'react-native-track-player';
import { PlaybackService } from '../src/services/PlayerService';

TrackPlayer.registerPlaybackService(() => PlaybackService);

export default function RootLayout() {
    const { serverUrl } = useAuthStore();
    const { musicFolders } = useSettingsStore();
    const segments = useSegments();
    const router = useRouter();

    // Setup RNTP once
    useEffect(() => {
        const setup = async () => {
            try {
                await TrackPlayer.setupPlayer({
                    autoHandleInterruptions: true,
                });
                await TrackPlayer.updateOptions({
                    capabilities: [
                        Capability.Play,
                        Capability.Pause,
                        Capability.SkipToNext,
                        Capability.SkipToPrevious,
                        Capability.Stop,
                    ],
                    compactCapabilities: [
                        Capability.Play,
                        Capability.Pause,
                        Capability.SkipToNext,
                    ],
                    android: {
                        appKilledPlaybackBehavior: AppKilledPlaybackBehavior.StopPlaybackAndRemoveNotification,
                    },
                });
            } catch (e) {
                // Player already set up (hot reload)
            }
        };
        setup();
    }, []);

    // Sync RNTP active track changes back to store
    useEffect(() => {
        const trackSub = TrackPlayer.addEventListener(Event.PlaybackActiveTrackChanged, (event) => {
            const { queue } = usePlayerStore.getState();
            const index = event.index ?? 0;
            if (index >= 0 && index < queue.length) {
                usePlayerStore.setState({ currentIndex: index, currentTrack: queue[index] });
            }
        });

        const stateSub = TrackPlayer.addEventListener(Event.PlaybackState, (event) => {
            usePlayerStore.setState({ isPlaying: event.state === State.Playing });
        });

        return () => {
            trackSub.remove();
            stateSub.remove();
        };
    }, []);

    // Routing
    useEffect(() => {
        if (!segments || segments.length === 0) return;
        const inTabsGroup = segments[0] === '(tabs)';
        if (!inTabsGroup) {
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
