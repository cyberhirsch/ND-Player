import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { CloudOff } from 'lucide-react-native';
import { theme } from '../constants/theme';

export default function NoServer() {
    const router = useRouter();
    return (
        <View style={styles.container}>
            <CloudOff size={48} color={theme.colors.textSecondary} />
            <Text style={styles.title}>No server configured</Text>
            <Text style={styles.subtitle}>Add a Navidrome server in Settings to stream music, or add a local music folder.</Text>
            <TouchableOpacity style={styles.button} onPress={() => router.push('/(tabs)/settings')}>
                <Text style={styles.buttonText}>Go to Settings</Text>
            </TouchableOpacity>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: theme.colors.background,
        padding: 32,
        gap: 12,
    },
    title: {
        color: theme.colors.textPrimary,
        fontSize: theme.fontSize.lg,
        fontWeight: '600',
        textAlign: 'center',
    },
    subtitle: {
        color: theme.colors.textSecondary,
        fontSize: theme.fontSize.md,
        textAlign: 'center',
        lineHeight: 22,
    },
    button: {
        marginTop: 8,
        backgroundColor: theme.colors.accent,
        paddingHorizontal: 24,
        paddingVertical: 12,
        borderRadius: 8,
    },
    buttonText: {
        color: '#000',
        fontWeight: 'bold',
        fontSize: theme.fontSize.md,
    },
});
