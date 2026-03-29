import { View, Text, TextInput, StyleSheet, ActivityIndicator, TouchableOpacity, Image, Alert } from 'react-native';
import { useState, useEffect } from 'react';
import Constants from 'expo-constants';
import { useAuthStore } from '../src/store/useStore';
import { checkConnection, ConnectionStatus } from '../src/api/navidrome';
import * as SecureStore from 'expo-secure-store';
import { useRouter } from 'expo-router';
import { theme } from '../src/constants/theme';

export default function LoginScreen() {
    const [url, setUrl] = useState(process.env.EXPO_PUBLIC_DEV_SERVER_URL ?? '');
    const [user, setUser] = useState(process.env.EXPO_PUBLIC_DEV_USERNAME ?? '');
    const [pass, setPass] = useState(process.env.EXPO_PUBLIC_DEV_PASSWORD ?? '');
    const [loading, setLoading] = useState(false);
    const [statusMessage, setStatusMessage] = useState('');
    const [internetStatus, setInternetStatus] = useState<'checking' | 'connected' | 'disconnected' | null>(null);
    const setAuth = useAuthStore((state) => state.setAuth);
    const router = useRouter();

    // Check internet connectivity on mount
    useEffect(() => {
        checkInternetConnectivity();
    }, []);

    const checkInternetConnectivity = async () => {
        setInternetStatus('checking');
        try {
            const result = await checkConnection('https://www.google.com', '', '');
            if (result.status === ConnectionStatus.CONNECTION_ERROR) {
                setInternetStatus('disconnected');
            } else {
                setInternetStatus('connected');
            }
        } catch (e) {
            setInternetStatus('disconnected');
        }
    };

    const handleLogin = async () => {
        if (!url || !user || !pass) {
            Alert.alert('Missing Information', 'Please fill in all fields');
            return;
        }
        setLoading(true);
        setStatusMessage('Testing internet connectivity...');

        // First, test basic internet connectivity
        try {
            const connectivityTest = await checkConnection('https://www.google.com', '', '');
            console.log('Internet connectivity test:', connectivityTest.status);

            if (connectivityTest.status === ConnectionStatus.CONNECTION_ERROR) {
                setLoading(false);
                setStatusMessage('');
                Alert.alert(
                    'No Internet Connection',
                    'Cannot reach the internet. Please check your connection and try again.\n\nTested: https://www.google.com'
                );
                return;
            }
        } catch (e) {
            console.log('Connectivity test failed, continuing anyway:', e);
        }

        setStatusMessage('Connecting to server...');

        let serverUrl = url.trim();

        // Clean up the URL
        if (serverUrl.endsWith('/')) {
            serverUrl = serverUrl.slice(0, -1);
        }
        if (serverUrl.endsWith('/app')) {
            serverUrl = serverUrl.slice(0, -4);
        }

        // Determine protocol strategy
        let urlsToTry: string[] = [];

        if (serverUrl.startsWith('http://') || serverUrl.startsWith('https://')) {
            // User explicitly specified protocol, try it first, then the other
            const hasHttps = serverUrl.startsWith('https://');
            const baseUrl = serverUrl.replace(/^https?:\/\//, '');

            if (hasHttps) {
                urlsToTry = [`https://${baseUrl}`, `http://${baseUrl}`];
            } else {
                urlsToTry = [`http://${baseUrl}`, `https://${baseUrl}`];
            }
        } else {
            // No protocol specified - try HTTPS first, then HTTP
            urlsToTry = [`https://${serverUrl}`, `http://${serverUrl}`];
        }

        let lastResult: any = null;
        let successfulUrl: string | null = null;
        let diagnosticInfo: string[] = [];

        for (const testUrl of urlsToTry) {
            console.log('Testing connection to:', testUrl);
            setStatusMessage(`Trying ${testUrl}...`);

            const result = await checkConnection(testUrl, user, pass);
            lastResult = result;

            // Log diagnostic info
            const statusText = result.status === ConnectionStatus.SUCCESS ? '✓ SUCCESS' :
                result.status === ConnectionStatus.AUTH_ERROR ? '✗ AUTH FAILED' :
                    result.status === ConnectionStatus.CONNECTION_ERROR ? '✗ NO CONNECTION' :
                        result.status === ConnectionStatus.SERVER_ERROR ? '✗ SERVER ERROR' :
                            '✗ UNKNOWN ERROR';
            diagnosticInfo.push(`${statusText}: ${testUrl}\n${result.message || ''}`);

            if (result.status === ConnectionStatus.SUCCESS) {
                successfulUrl = testUrl;
                break;
            }

            // If it's not a connection error, don't try other protocols
            // (auth errors, server errors mean we reached the server)
            if (result.status !== ConnectionStatus.CONNECTION_ERROR) {
                successfulUrl = testUrl; // Use this URL even though login failed
                break;
            }

            // Connection error - try next protocol if available
        }

        if (lastResult.status === ConnectionStatus.SUCCESS && successfulUrl) {
            await SecureStore.setItemAsync('password', pass);
            setAuth(successfulUrl, user);
            setStatusMessage('Login successful!');
            router.replace('/(tabs)/albums');
        } else {
            setStatusMessage('');
            let errorTitle = 'Login Failed';
            let errorMessage = lastResult.message || 'Unknown error occurred';
            let troubleshooting = '';

            const isHttps = successfulUrl?.startsWith('https://');
            const hasErrorCode = (code: string) => lastResult.message?.includes(code);

            switch (lastResult.status) {
                case ConnectionStatus.CONNECTION_ERROR:
                    errorTitle = 'Connection Error';
                    troubleshooting = '\n\nTroubleshooting:\n' +
                        '• Verify the server is running and accessible.\n' +
                        (hasErrorCode('ERR_NETWORK') ? '• SSL/Cleartext Issue: Android might be blocking the connection. If using HTTP, ensure cleartext is allowed. If using HTTPS, ensure the certificate is valid (not self-signed).\n' : '') +
                        (isHttps ? '• Try using http:// instead of https:// if your server doesn\'t support SSL.\n' : '• Try using https:// if your server requires it.\n') +
                        '• Check if your firewall is blocking the port.\n' +
                        '• Test the URL in your phone\'s browser (you confirmed this works).';
                    break;
                case ConnectionStatus.AUTH_ERROR:
                    errorTitle = 'Authentication Failed';
                    errorMessage = `Invalid username or password.\n\nServer: ${successfulUrl}`;
                    break;
                case ConnectionStatus.SERVER_ERROR:
                    errorTitle = 'Server Error';
                    errorMessage = `Server returned an error.\n\nServer: ${successfulUrl}`;
                    break;
            }

            Alert.alert(errorTitle, errorMessage + troubleshooting);
        }
        setLoading(false);
    };

    return (
        <View style={styles.container}>
            <Image source={require('../assets/Logo.png')} style={styles.logo} resizeMode="contain" />
            <TextInput
                placeholder="Server URL (e.g. music.example.com)"
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
            {internetStatus && (
                <View style={styles.connectivityStatus}>
                    <Text style={[
                        styles.connectivityText,
                        internetStatus === 'connected' && styles.connectivityConnected,
                        internetStatus === 'disconnected' && styles.connectivityDisconnected
                    ]}>
                        {internetStatus === 'checking' && '🔄 Checking internet...'}
                        {internetStatus === 'connected' && '✓ Internet connected'}
                        {internetStatus === 'disconnected' && '✗ No internet connection'}
                    </Text>
                    {internetStatus === 'disconnected' && (
                        <TouchableOpacity onPress={checkInternetConnectivity}>
                            <Text style={styles.retryText}>Retry</Text>
                        </TouchableOpacity>
                    )}
                </View>
            )}
            {statusMessage ? (
                <Text style={styles.statusText}>{statusMessage}</Text>
            ) : null}
            {loading ? (
                <ActivityIndicator size="large" color={theme.colors.accent} />
            ) : (
                <TouchableOpacity style={styles.button} onPress={handleLogin}>
                    <Text style={styles.buttonText}>LOGIN</Text>
                </TouchableOpacity>
            )}
            <Text style={styles.versionText}>v{Constants.expoConfig?.version || '1.0.1'}</Text>
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
    },
    statusText: {
        color: theme.colors.accent,
        fontSize: 14,
        textAlign: 'center',
        marginBottom: 10,
    },
    connectivityStatus: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 15,
        gap: 10,
    },
    connectivityText: {
        fontSize: 14,
        textAlign: 'center',
    },
    connectivityConnected: {
        color: '#4CAF50',
    },
    connectivityDisconnected: {
        color: theme.colors.error,
    },
    retryText: {
        color: theme.colors.accent,
        fontSize: 14,
        textDecorationLine: 'underline',
    },
    versionText: {
        color: theme.colors.textSecondary,
        fontSize: 12,
        textAlign: 'center',
        marginTop: 20,
    }
});
