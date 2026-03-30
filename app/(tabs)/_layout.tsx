import { Tabs, useNavigationContainerRef } from 'expo-router';
import { CloudOff, Cloud, Library, Users, List, Music, Settings } from 'lucide-react-native';
import PlayerBar from '../../src/components/PlayerBar';
import { theme } from '../../src/constants/theme';
import { View, TouchableOpacity } from 'react-native';
import { useOfflineStore } from '../../src/store/useStore';
import { BottomTabBar } from '@react-navigation/bottom-tabs';

export default function TabsLayout() {
    const isOfflineMode = useOfflineStore((state) => state.isOfflineMode);
    const setOfflineMode = useOfflineStore((state) => state.setOfflineMode);

    return (
        <View style={{ flex: 1, backgroundColor: theme.colors.background }}>
            <Tabs
                tabBar={(props) => (
                    <View>
                        <PlayerBar />
                        <BottomTabBar {...props} />
                    </View>
                )}
                screenOptions={{
                    headerStyle: { backgroundColor: theme.colors.background },
                    headerTintColor: theme.colors.textPrimary,
                    headerRight: () => (
                        <TouchableOpacity
                            onPress={() => setOfflineMode(!isOfflineMode)}
                            style={{ marginRight: 16 }}
                        >
                            {isOfflineMode
                                ? <CloudOff size={24} color={theme.colors.textSecondary} />
                                : <Cloud size={24} color={theme.colors.accent} />
                            }
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
                }}
            >
                <Tabs.Screen
                    name="albums"
                    options={{
                        title: 'Albums',
                        tabBarIcon: ({ color }) => <Library size={22} color={color} />,
                    }}
                />
                <Tabs.Screen
                    name="artists"
                    options={{
                        title: 'Artists',
                        tabBarIcon: ({ color }) => <Users size={22} color={color} />,
                    }}
                />
                <Tabs.Screen
                    name="playlists"
                    options={{
                        title: 'Playlists',
                        tabBarIcon: ({ color }) => <List size={22} color={color} />,
                    }}
                />
                <Tabs.Screen
                    name="songs"
                    options={{
                        title: 'Songs',
                        tabBarIcon: ({ color }) => <Music size={22} color={color} />,
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
                        tabBarIcon: ({ color }) => <Settings size={22} color={color} />,
                    }}
                />
            </Tabs>
        </View>
    );
}
