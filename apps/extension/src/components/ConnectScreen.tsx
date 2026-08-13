import { useState } from 'react';
import { useSettingsActions, useSettingsStore } from '../store/useSettingsStore';
import { generateCredentials, navidromeApi } from '../api/navidrome';

export default function ConnectScreen() {
    const [url, setUrl] = useState('');
    const [user, setUser] = useState('');
    const [pass, setPass] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const { setServerUrl, setCredentials } = useSettingsActions();

    const handleConnect = async () => {
        setError('');
        setLoading(true);
        try {
            // Temporary set to test connection
            useSettingsStore.setState({ serverUrl: url, username: user });
            const { salt, token } = generateCredentials(pass);

            // Update store with potential creds
            setServerUrl(url);
            setCredentials(user, salt, token);

            // Test connection
            await navidromeApi.ping();

            // If successful, the store is already updated, so we are good.
        } catch (e) {
            setError('Connection failed. Check URL and credentials.');
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="connect-screen-container">
            <div className="connect-card">
                <div className="connect-header">
                    <img src="/Logo.png" alt="Navidrome" className="connect-logo" />
                    <h1>Connect to Navidrome</h1>
                    <p className="connect-subtitle">Enter your server details to start listening</p>
                </div>

                <form
                    className="connect-form"
                    onSubmit={(e) => {
                        e.preventDefault();
                        handleConnect();
                    }}
                >
                    <div className="input-group">
                        <label htmlFor="server-url">Server URL</label>
                        <input
                            id="server-url"
                            name="url"
                            type="url"
                            placeholder="https://music.example.com"
                            value={url}
                            onChange={(e) => setUrl(e.target.value)}
                            autoComplete="url"
                            required
                        />
                    </div>
                    <div className="input-group">
                        <label htmlFor="username">Username</label>
                        <input
                            id="username"
                            name="username"
                            type="text"
                            placeholder="Your username"
                            value={user}
                            onChange={(e) => setUser(e.target.value)}
                            autoComplete="username"
                            required
                        />
                    </div>
                    <div className="input-group">
                        <label htmlFor="password">Password</label>
                        <input
                            id="password"
                            name="password"
                            type="password"
                            placeholder="Your password"
                            value={pass}
                            onChange={(e) => setPass(e.target.value)}
                            autoComplete="current-password"
                            required
                        />
                    </div>

                    {error && <div className="connect-error">{error}</div>}

                    <button
                        className="connect-button"
                        type="submit"
                        disabled={loading}
                    >
                        {loading ? 'Connecting...' : 'Connect'}
                    </button>
                </form>
            </div>
        </div>
    );
}
