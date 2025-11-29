import { View, Text, TextInput, StyleSheet, ActivityIndicator, TouchableOpacity, Image } from 'react-native';
import { useState } from 'react';
import { useAuthStore } from '../src/store/useStore';
import { ping } from '../src/api/navidrome';
import * as SecureStore from 'expo-secure-store';
import { useRouter } from 'expo-router';
import { theme } from '../src/constants/theme';

export default function LoginScreen() {
    const [url, setUrl] = useState('');
    const [user, setUser] = useState('');
    const [pass, setPass] = useState('');
    const [loading, setLoading] = useState(false);
    const setAuth = useAuthStore((state) => state.setAuth);
    const router = useRouter();

    const handleLogin = async () => {
        if (!url || !user || !pass) {
            alert('Please fill in all fields');
            return;
        }
        setLoading(true);
        let serverUrl = url.trim();
        if (!serverUrl.startsWith('http')) {
            serverUrl = `https://${serverUrl}`;
        }
        if (serverUrl.endsWith('/')) {
            serverUrl = serverUrl.slice(0, -1);
        }
        if (serverUrl.endsWith('/app')) {
            serverUrl = serverUrl.slice(0, -4);
        }

        console.log('Testing connection to:', serverUrl);

        const success = await ping(serverUrl, user, pass);
        if (success) {
            await SecureStore.setItemAsync('password', pass);
            setAuth(serverUrl, user);
            router.replace('/(tabs)/albums');
        } else {
            alert('Login failed. Check credentials and server URL.');
        }
        setLoading(false);
    };

    return (
        <View style={styles.container}>
            <Image source={require('../assets/Logo.png')} style={styles.logo} resizeMode="contain" />
            <TextInput
                placeholder="Server URL (e.g. https://music.example.com)"
                placeholderTextColor={theme.colors.textSecondary}
                value={url}
                onChangeText={setUrl}
                style={styles.input}
                autoCapitalize="none"
                autoCorrect={false}
            />
            <TextInput
                placeholder="Username"
                placeholderTextColor={theme.colors.textSecondary}
                value={user}
                onChangeText={setUser}
                style={styles.input}
                autoCapitalize="none"
                autoCorrect={false}
            />
            <TextInput
                placeholder="Password"
                placeholderTextColor={theme.colors.textSecondary}
                value={pass}
                onChangeText={setPass}
                style={styles.input}
                secureTextEntry
            />
            {loading ? (
                <ActivityIndicator size="large" color={theme.colors.accent} />
            ) : (
                <TouchableOpacity style={styles.button} onPress={handleLogin}>
                    <Text style={styles.buttonText}>LOGIN</Text>
                </TouchableOpacity>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        padding: 20,
        backgroundColor: theme.colors.background
    },
    logo: {
        width: '80%',
        height: 60,
        marginBottom: 40,
        alignSelf: 'center',
    },
    input: {
        borderWidth: 1,
        borderColor: theme.colors.border,
        padding: 15,
        marginBottom: 15,
        borderRadius: 8,
        fontSize: 16,
        color: theme.colors.textPrimary,
        backgroundColor: theme.colors.player
    },
    button: {
        backgroundColor: theme.colors.accent,
        padding: 15,
        borderRadius: 8,
        alignItems: 'center',
    },
    buttonText: {
        color: '#000',
        fontWeight: 'bold',
        fontSize: 16,
    }
});
