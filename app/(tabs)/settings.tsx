import { View, Text, TextInput, StyleSheet, TouchableOpacity, ActivityIndicator, ScrollView, Alert } from 'react-native';
import { useState, useEffect } from 'react';
import { useAuthStore, useSettingsStore } from '../../src/store/useStore';
import * as SecureStore from 'expo-secure-store';
import * as FileSystem from 'expo-file-system/legacy';
import { theme } from '../../src/constants/theme';
import { FolderOpen, XCircle, Trash2, PlusCircle, LogOut, ToggleLeft, ToggleRight } from 'lucide-react-native';
import { checkConnection, ConnectionStatus } from '../../src/api/navidrome';

export default function SettingsScreen() {
    const { serverUrl, username, setAuth, logout } = useAuthStore();
    const { cacheDir, musicFolders, wifiOnly, setCacheDir, addMusicFolder, removeMusicFolder, setWifiOnly } = useSettingsStore();
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

        let cleanUrl = url.trim();
        if (cleanUrl.endsWith('/')) cleanUrl = cleanUrl.slice(0, -1);
        if (cleanUrl.endsWith('/app')) cleanUrl = cleanUrl.slice(0, -4);

        const hasProtocol = cleanUrl.startsWith('http://') || cleanUrl.startsWith('https://');
        // Try HTTPS first, fall back to HTTP if no protocol specified
        const urlsToTry = hasProtocol
            ? [cleanUrl]
            : [`https://${cleanUrl}`, `http://${cleanUrl}`];

        let successUrl: string | null = null;
        let lastResult = null as Awaited<ReturnType<typeof checkConnection>> | null;
        let httpsConnectionFailed = false;

        for (const testUrl of urlsToTry) {
            const result = await checkConnection(testUrl, user, pass);
            lastResult = result;

            if (result.status === ConnectionStatus.SUCCESS) {
                successUrl = testUrl;
                break;
            }
            // Auth error is definitive — wrong credentials, no point trying another protocol
            if (result.status === ConnectionStatus.AUTH_ERROR) break;
            // Track HTTPS connection failures to suggest http:// hint
            if (testUrl.startsWith('https://') && result.status === ConnectionStatus.CONNECTION_ERROR) {
                httpsConnectionFailed = true;
            }
        }

        if (successUrl) {
            await SecureStore.setItemAsync('password', pass);
            setAuth(successUrl, user);
            setMessage({ text: `Connected as ${user}`, type: 'success' });
        } else {
            let errorText = 'Connection failed';
            if (lastResult) {
                switch (lastResult.status) {
                    case ConnectionStatus.AUTH_ERROR:
                        errorText = 'Wrong username or password';
                        break;
                    case ConnectionStatus.CONNECTION_ERROR: {
                        const msg = lastResult.message ?? '';
                        if (cleanUrl.startsWith('https://')) {
                            errorText = 'HTTPS connection failed — your server may only support HTTP. Try adding http:// to the address.';
                        } else if (msg.includes('timed out') || msg.includes('ECONNABORTED')) {
                            errorText = 'Connection timed out — server unreachable. Check the address.';
                        } else if (msg.includes('refused') || msg.includes('ECONNREFUSED')) {
                            errorText = 'Connection refused — check the port number.';
                        } else {
                            errorText = 'Server unreachable — check the address and try again.';
                        }
                        break;
                    }
                    case ConnectionStatus.SERVER_ERROR:
                        errorText = lastResult.message ?? 'Server returned an error';
                        break;
                    default:
                        errorText = lastResult.message?.split('\n')[0] ?? 'Connection failed';
                }
            }
            setMessage({ text: errorText, type: 'error' });
        }
        setLoading(false);
    };

    const handleLogout = async () => {
        await SecureStore.deleteItemAsync('password');
        logout();
    };

    const pickCacheFolder = async () => {
        try {
            const result = await FileSystem.StorageAccessFramework.requestDirectoryPermissionsAsync();
            if (result.granted) {
                setCacheDir(result.directoryUri + '/');
            }
        } catch (e) {
            Alert.alert('Error', 'Could not open folder picker');
        }
    };

    const resetCacheFolder = () => {
        Alert.alert('Reset Cache Folder', 'Use default app storage?', [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Reset', onPress: () => setCacheDir(null) }
        ]);
    };

    const pickMusicFolder = async () => {
        try {
            const result = await FileSystem.StorageAccessFramework.requestDirectoryPermissionsAsync();
            if (result.granted) {
                addMusicFolder(result.directoryUri);
            }
        } catch (e) {
            Alert.alert('Error', 'Could not open folder picker');
        }
    };

    return (
        <ScrollView style={styles.container} contentContainerStyle={styles.content}>
            {!serverUrl && (
                <View style={styles.welcomeBanner}>
                    <Text style={styles.welcomeTitle}>Welcome to ND Player</Text>
                    <Text style={styles.welcomeText}>Connect to a Navidrome server to stream music, or add a local music folder below. You can use all features without a server.</Text>
                </View>
            )}
            <View style={styles.formGroup}>
                <Text style={styles.label}>Navidrome Server URL</Text>
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
                    <Text style={styles.saveButtonText}>TEST CONNECTION</Text>
                )}
            </TouchableOpacity>

            {/* Network */}
            <Text style={styles.sectionHeader}>Network</Text>
            <View style={styles.toggleRow}>
                <View style={styles.toggleInfo}>
                    <Text style={styles.toggleLabel}>WiFi Only</Text>
                    <Text style={styles.toggleSub}>Only stream and download over WiFi</Text>
                </View>
                <TouchableOpacity onPress={() => setWifiOnly(!wifiOnly)}>
                    {wifiOnly
                        ? <ToggleRight size={28} color={theme.colors.accent} />
                        : <ToggleLeft size={28} color={theme.colors.textSecondary} />
                    }
                </TouchableOpacity>
            </View>

            {/* Cache Folder */}
            <Text style={styles.sectionHeader}>Storage</Text>
            <View style={styles.folderRow}>
                <View style={styles.folderInfo}>
                    <Text style={styles.label}>Cache Folder</Text>
                    <Text style={styles.folderPath} numberOfLines={1}>
                        {cacheDir ? cacheDir : 'Default app storage'}
                    </Text>
                </View>
                <TouchableOpacity onPress={pickCacheFolder} style={styles.folderBtn}>
                    <FolderOpen size={22} color={theme.colors.accent} />
                </TouchableOpacity>
                {cacheDir && (
                    <TouchableOpacity onPress={resetCacheFolder} style={styles.folderBtn}>
                        <XCircle size={22} color={theme.colors.accent} />
                    </TouchableOpacity>
                )}
            </View>

            {/* Music Folders */}
            <Text style={styles.sectionHeader}>Local Music</Text>
            {musicFolders.map((uri) => (
                <View key={uri} style={styles.folderRow}>
                    <View style={styles.folderInfo}>
                        <Text style={styles.folderPath} numberOfLines={1}>{uri}</Text>
                    </View>
                    <TouchableOpacity onPress={() => removeMusicFolder(uri)} style={styles.folderBtn}>
                        <Trash2 size={22} color={theme.colors.accent} />
                    </TouchableOpacity>
                </View>
            ))}
            <TouchableOpacity style={styles.addFolderBtn} onPress={pickMusicFolder}>
                <PlusCircle size={20} color={theme.colors.accent} />
                <Text style={styles.addFolderText}>Add Music Folder</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
                <LogOut size={20} color={theme.colors.accent} />
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
    welcomeBanner: {
        backgroundColor: theme.colors.player,
        borderRadius: 10,
        borderWidth: 1,
        borderColor: theme.colors.accent,
        padding: theme.spacing.lg,
        marginBottom: theme.spacing.xl,
        gap: 8,
    },
    welcomeTitle: {
        color: theme.colors.accent,
        fontSize: theme.fontSize.lg,
        fontWeight: 'bold',
    },
    welcomeText: {
        color: theme.colors.textSecondary,
        fontSize: theme.fontSize.md,
        lineHeight: 22,
    },
    sectionHeader: {
        color: theme.colors.textSecondary,
        fontSize: theme.fontSize.sm,
        fontWeight: '600',
        textTransform: 'uppercase',
        letterSpacing: 1,
        marginTop: theme.spacing.xl,
        marginBottom: theme.spacing.sm,
    },
    toggleRow: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: theme.colors.player,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: theme.colors.border,
        padding: theme.spacing.md,
        marginBottom: theme.spacing.sm,
    },
    toggleInfo: {
        flex: 1,
        gap: 3,
    },
    toggleLabel: {
        color: theme.colors.textPrimary,
        fontSize: theme.fontSize.md,
    },
    toggleSub: {
        color: theme.colors.textSecondary,
        fontSize: theme.fontSize.sm,
    },
    folderRow: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: theme.colors.player,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: theme.colors.border,
        padding: theme.spacing.md,
        marginBottom: theme.spacing.sm,
    },
    folderInfo: {
        flex: 1,
    },
    folderPath: {
        color: theme.colors.textSecondary,
        fontSize: theme.fontSize.sm,
        marginTop: 2,
    },
    folderBtn: {
        padding: 4,
        marginLeft: 8,
    },
    addFolderBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        paddingVertical: theme.spacing.sm,
    },
    addFolderText: {
        color: theme.colors.accent,
        fontSize: theme.fontSize.md,
    },
    logoutButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: theme.spacing.xl * 2,
        gap: 8,
    },
    logoutText: {
        color: theme.colors.accent,
        fontSize: theme.fontSize.md,
        fontWeight: '500',
    }
});
