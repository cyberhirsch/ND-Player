import { useState, useEffect } from 'react';
import { useSettingsActions, useSettingsStore } from '../store/useSettingsStore';
import { generateCredentials, navidromeApi } from '../api/navidrome';

export default function Settings() {
    const { serverUrl, username } = useSettingsStore();
    const { setServerUrl, setCredentials } = useSettingsActions();

    const [url, setUrl] = useState(serverUrl || '');
    const [user, setUser] = useState(username || '');
    const [pass, setPass] = useState('');
    const [status, setStatus] = useState('');
    const [isError, setIsError] = useState(false);

    useEffect(() => {
        setUrl(serverUrl || '');
        setUser(username || '');
    }, [serverUrl, username]);

    const handleSave = async () => {
        setStatus('Testing connection...');
        setIsError(false);
        try {
            // Temporary set to test connection
            useSettingsStore.setState({ serverUrl: url, username: user });

            if (pass) {
                const { salt, token } = generateCredentials(pass);
                setCredentials(user, salt, token);
            }

            setServerUrl(url);

            // Test connection
            await navidromeApi.ping();
            setStatus('Settings saved and connection successful!');
        } catch (e) {
            setIsError(true);
            setStatus('Connection failed. Please check your settings.');
            console.error(e);
        }
    };

    return (
        <div className="content-area">
            <h1>Settings</h1>
            <div className="settings-form">
                <div className="input-group">
                    <label>Server URL</label>
                    <input
                        type="text"
                        value={url}
                        onChange={(e) => setUrl(e.target.value)}
                        placeholder="https://music.example.com"
                    />
                </div>
                <div className="input-group">
                    <label>Username</label>
                    <input
                        type="text"
                        value={user}
                        onChange={(e) => setUser(e.target.value)}
                    />
                </div>
                <div className="input-group">
                    <label>Password (leave blank to keep current)</label>
                    <input
                        type="password"
                        value={pass}
                        onChange={(e) => setPass(e.target.value)}
                    />
                </div>

                {status && (
                    <div className={`status-message ${isError ? 'error' : 'success'}`}>
                        {status}
                    </div>
                )}

                <button onClick={handleSave} className="save-btn">
                    Save Settings
                </button>

                <div className="version-info">
                    v{chrome?.runtime?.getManifest()?.version || '1.0.0'}
                </div>
            </div>

            <style>{`
                .settings-form {
                    max-width: 500px;
                    display: flex;
                    flex-direction: column;
                    gap: 20px;
                }
                .input-group {
                    display: flex;
                    flex-direction: column;
                    gap: 8px;
                }
                .input-group label {
                    color: #aaa;
                    font-size: 0.9em;
                }
                .input-group input {
                    padding: 10px;
                    border-radius: 4px;
                    border: 1px solid #333;
                    background: #222;
                    color: white;
                    font-size: 1em;
                }
                .input-group input:focus {
                    outline: none;
                    border-color: var(--accent-color);
                }
                .save-btn {
                    padding: 12px;
                    background: var(--accent-color);
                    color: black;
                    border: none;
                    border-radius: 4px;
                    font-size: 1em;
                    cursor: pointer;
                    font-weight: bold;
                    margin-top: 10px;
                }
                .save-btn:hover {
                    filter: brightness(1.1);
                }
                .status-message {
                    padding: 10px;
                    border-radius: 4px;
                    font-size: 0.9em;
                }
                .status-message.success {
                    background: rgba(0, 255, 255, 0.1);
                    color: var(--accent-color);
                }
                .status-message.error {
                    background: rgba(255, 0, 0, 0.1);
                    color: #ff4444;
                }
                .version-info {
                    margin-top: 30px;
                    padding-top: 20px;
                    border-top: 1px solid #333;
                    color: #666;
                    font-size: 0.8em;
                    text-align: center;
                }
            `}</style>
        </div>
    );
}
