import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import PlayerBar from '../../src/components/PlayerBar';
import { theme } from '../../src/constants/theme';
import { View, TouchableOpacity } from 'react-native';
import { useOfflineStore } from '../../src/store/useStore';

export default function TabsLayout() {
    const isOfflineMode = useOfflineStore((state) => state.isOfflineMode);
    const setOfflineMode = useOfflineStore((state) => state.setOfflineMode);

    return (
        <View style={{ flex: 1, backgroundColor: theme.colors.background }}>
            <Tabs screenOptions={{
                headerStyle: { backgroundColor: theme.colors.background },
                headerTintColor: theme.colors.textPrimary,
                headerRight: () => (
                    <TouchableOpacity
                        onPress={() => setOfflineMode(!isOfflineMode)}
                        style={{ marginRight: 16 }}
                    >
                        <Ionicons
                            name={isOfflineMode ? 'cloud-offline' : 'cloud-done'}
                            size={24}
                            color={isOfflineMode ? theme.colors.textSecondary : theme.colors.accent}
                        />
                    </TouchableOpacity>
                ),
                tabBarStyle: {
                    backgroundColor: theme.colors.player,
                    borderTopColor: theme.colors.border,
                    height: 60,
                    paddingBottom: 8,
                    paddingTop: 8
                },
                tabBarActiveTintColor: theme.colors.accent,
                tabBarInactiveTintColor: theme.colors.textSecondary,
            }}>
                <Tabs.Screen
                    name="albums"
                    options={{
                        title: 'Albums',
                        tabBarIcon: ({ color }) => <Ionicons name="albums" size={22} color={color} />,
                    }}
                />
                <Tabs.Screen
                    name="artists"
                    options={{
                        title: 'Artists',
                        tabBarIcon: ({ color }) => <Ionicons name="people" size={22} color={color} />,
                    }}
                />
                <Tabs.Screen
                    name="playlists"
                    options={{
                        title: 'Playlists',
                        tabBarIcon: ({ color }) => <Ionicons name="list" size={22} color={color} />,
                    }}
                />
                <Tabs.Screen
                    name="songs"
                    options={{
                        title: 'Songs',
                        tabBarIcon: ({ color }) => <Ionicons name="musical-note" size={22} color={color} />,
                    }}
                />
                <Tabs.Screen
                    name="search"
                    options={{ href: null }}
                />
                <Tabs.Screen
                    name="settings"
                    options={{
                        title: 'Settings',
                        tabBarIcon: ({ color }) => <Ionicons name="settings-outline" size={22} color={color} />,
                    }}
                />
            </Tabs>
            <PlayerBar />
        </View>
    );
}
