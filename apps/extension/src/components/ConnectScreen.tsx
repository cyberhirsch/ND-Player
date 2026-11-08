import { useState } from 'react';
import { useSettingsActions } from '../store/useSettingsStore';
import { tryConnect } from '../lib/connect';

export default function ConnectScreen() {
    const [url, setUrl] = useState('');
    const [user, setUser] = useState('');
    const [pass, setPass] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const { setConnection } = useSettingsActions();

    const handleConnect = async () => {
        setError('');
        setLoading(true);
        // Credentials are stored only after the server has accepted them.
        const result = await tryConnect(url, user, { password: pass });
        setLoading(false);
        if (result.ok) {
            setConnection(result.creds);
        } else {
            setError(result.message);
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
                        void handleConnect();
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

                    {error && <div className="connect-error" role="alert">{error}</div>}

                    <button className="connect-button" type="submit" disabled={loading}>
                        {loading ? 'Connecting...' : 'Connect'}
                    </button>
                </form>
            </div>
        </div>
    );
}
