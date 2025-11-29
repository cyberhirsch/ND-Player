import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import PlayerBar from '../../src/components/PlayerBar';
import { theme } from '../../src/constants/theme';
import { View } from 'react-native';

export default function TabsLayout() {
    return (
        <View style={{ flex: 1, backgroundColor: theme.colors.background }}>
            <Tabs screenOptions={{
                headerStyle: { backgroundColor: theme.colors.background },
                headerTintColor: theme.colors.textPrimary,
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
                        tabBarIcon: ({ color }) => <Ionicons name="albums" size={24} color={color} />,
                    }}
                />
                <Tabs.Screen
                    name="playlists"
                    options={{
                        title: 'Playlists',
                        tabBarIcon: ({ color }) => <Ionicons name="list" size={24} color={color} />,
                    }}
                />
            </Tabs>
            <PlayerBar />
        </View>
    );
}
