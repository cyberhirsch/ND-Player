import { View, Text, TextInput, StyleSheet, TouchableOpacity, ActivityIndicator, ScrollView } from 'react-native';
import { useState, useEffect } from 'react';
import { useAuthStore } from '../../src/store/useStore';
import * as SecureStore from 'expo-secure-store';
import { theme } from '../../src/constants/theme';
import { Ionicons } from '@expo/vector-icons';
import { ping } from '../../src/api/navidrome';

export default function SettingsScreen() {
    const { serverUrl, username, setAuth, logout } = useAuthStore();
    const [url, setUrl] = useState(serverUrl || '');
    const [user, setUser] = useState(username || '');
    const [pass, setPass] = useState('');
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState<{ text: string, type: 'success' | 'error' } | null>(null);

    useEffect(() => {
        loadPassword();
    }, []);

    const loadPassword = async () => {
        try {
            const storedPass = await SecureStore.getItemAsync('password');
            if (storedPass) {
                setPass(storedPass);
            }
        } catch (e) {
            console.error('Failed to load password', e);
        }
    };

    const handleSave = async () => {
        if (!url || !user || !pass) {
            setMessage({ text: 'Please fill in all fields', type: 'error' });
            return;
        }

        setLoading(true);
        setMessage(null);

        let serverUrl = url.trim();

        // Clean up the URL
        if (serverUrl.endsWith('/')) {
            serverUrl = serverUrl.slice(0, -1);
        }
        if (serverUrl.endsWith('/app')) {
            serverUrl = serverUrl.slice(0, -4);
        }

        // Determine protocol strategy (matching login screen behavior)
        let urlsToTry: string[] = [];

        if (serverUrl.startsWith('http://') || serverUrl.startsWith('https://')) {
            // User explicitly specified protocol, use it
            urlsToTry = [serverUrl];
        } else {
            // No protocol specified - try HTTPS first, then HTTP
            urlsToTry = [`https://${serverUrl}`, `http://${serverUrl}`];
        }

        let lastSuccess = false;
        let successfulUrl: string | null = null;

        for (const testUrl of urlsToTry) {
            const success = await ping(testUrl, user, pass);
            if (success) {
                lastSuccess = true;
                successfulUrl = testUrl;
                break;
            }
        }

        if (lastSuccess && successfulUrl) {
            await SecureStore.setItemAsync('password', pass);
            setAuth(successfulUrl, user);
            setMessage({ text: 'Settings saved successfully!', type: 'success' });
        } else {
            setMessage({ text: 'Connection failed. Check credentials and server URL.', type: 'error' });
        }
        setLoading(false);
    };

    const handleLogout = async () => {
        await SecureStore.deleteItemAsync('password');
        logout();
    };

    return (
        <ScrollView style={styles.container} contentContainerStyle={styles.content}>
            <Text style={styles.header}>Server Settings</Text>

            <View style={styles.formGroup}>
                <Text style={styles.label}>Server URL</Text>
                <TextInput
                    value={url}
                    onChangeText={setUrl}
                    style={styles.input}
                    placeholder="https://music.example.com"
                    placeholderTextColor={theme.colors.textSecondary}
                    autoCapitalize="none"
                    autoCorrect={false}
                />
            </View>

            <View style={styles.formGroup}>
                <Text style={styles.label}>Username</Text>
                <TextInput
                    value={user}
                    onChangeText={setUser}
                    style={styles.input}
                    placeholder="Username"
                    placeholderTextColor={theme.colors.textSecondary}
                    autoCapitalize="none"
                    autoCorrect={false}
                />
            </View>

            <View style={styles.formGroup}>
                <Text style={styles.label}>Password</Text>
                <TextInput
                    value={pass}
                    onChangeText={setPass}
                    style={styles.input}
                    placeholder="Password"
                    placeholderTextColor={theme.colors.textSecondary}
                // Intentionally showing plain text as requested
                />
            </View>

            {message && (
                <Text style={[styles.message, message.type === 'error' ? styles.error : styles.success]}>
                    {message.text}
                </Text>
            )}

            <TouchableOpacity
                style={styles.saveButton}
                onPress={handleSave}
                disabled={loading}
            >
                {loading ? (
                    <ActivityIndicator color="#000" />
                ) : (
                    <Text style={styles.saveButtonText}>SAVE SETTINGS</Text>
                )}
            </TouchableOpacity>

            <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
                <Ionicons name="log-out-outline" size={20} color={theme.colors.error} />
                <Text style={styles.logoutText}>Logout</Text>
            </TouchableOpacity>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: theme.colors.background,
    },
    content: {
        padding: theme.spacing.lg,
    },
    header: {
        fontSize: theme.fontSize.xxl,
        fontWeight: 'bold',
        color: theme.colors.textPrimary,
        marginBottom: theme.spacing.xl,
    },
    formGroup: {
        marginBottom: theme.spacing.lg,
    },
    label: {
        color: theme.colors.textSecondary,
        marginBottom: theme.spacing.xs,
        fontSize: theme.fontSize.md,
    },
    input: {
        backgroundColor: theme.colors.player,
        borderWidth: 1,
        borderColor: theme.colors.border,
        borderRadius: 8,
        padding: theme.spacing.md,
        color: theme.colors.textPrimary,
        fontSize: theme.fontSize.md,
    },
    saveButton: {
        backgroundColor: theme.colors.accent,
        padding: theme.spacing.md,
        borderRadius: 8,
        alignItems: 'center',
        marginTop: theme.spacing.md,
    },
    saveButtonText: {
        color: '#000',
        fontWeight: 'bold',
        fontSize: theme.fontSize.md,
    },
    message: {
        textAlign: 'center',
        marginBottom: theme.spacing.md,
        fontSize: theme.fontSize.md,
    },
    success: {
        color: theme.colors.accent,
    },
    error: {
        color: theme.colors.error,
    },
    logoutButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: theme.spacing.xl * 2,
        gap: 8,
    },
    logoutText: {
        color: theme.colors.error,
        fontSize: theme.fontSize.md,
        fontWeight: '500',
    }
});
