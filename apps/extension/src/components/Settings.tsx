import { useEffect, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useSettingsActions, useSettingsStore } from '../store/useSettingsStore';
import { tryConnect } from '../lib/connect';
import { hasHostPermission, originPattern, requestHostPermission } from '../lib/hostPermission';

const appVersion = () => {
    try {
        return chrome.runtime.getManifest().version;
    } catch {
        return 'dev';
    }
};

export default function Settings() {
    // The form starts from the stored values; this page remounts on every visit.
    const [url, setUrl] = useState(() => useSettingsStore.getState().serverUrl);
    const [user, setUser] = useState(() => useSettingsStore.getState().username);
    const [pass, setPass] = useState('');
    const [status, setStatus] = useState('');
    const [isError, setIsError] = useState(false);
    const [saving, setSaving] = useState(false);
    const [hostAccess, setHostAccess] = useState<boolean | null>(null);

    const serverUrl = useSettingsStore(state => state.serverUrl);
    const { setConnection, disconnect } = useSettingsActions();
    const queryClient = useQueryClient();

    useEffect(() => {
        let cancelled = false;
        hasHostPermission(serverUrl).then(granted => {
            if (!cancelled) setHostAccess(granted);
        });
        return () => {
            cancelled = true;
        };
    }, [serverUrl]);

    const handleSave = async () => {
        setSaving(true);
        setIsError(false);
        setStatus('Testing connection...');
        // Blank password: re-test the stored token against the (possibly new) URL and username.
        const { salt, token } = useSettingsStore.getState();
        const result = await tryConnect(url, user, pass ? { password: pass } : { salt, token });
        setSaving(false);
        if (!result.ok) {
            setIsError(true);
            setStatus(`Not saved. ${result.message}`);
            return;
        }
        setConnection(result.creds);
        setPass('');
        queryClient.clear();
        setStatus('Settings saved and connection successful!');
    };

    const handleGrantAccess = () => {
        requestHostPermission(serverUrl).then(setHostAccess).catch(() => setHostAccess(false));
    };

    return (
        <div className="content-area settings-page">
            <h1>Settings</h1>
            <form
                className="settings-form"
                onSubmit={(e) => {
                    e.preventDefault();
                    void handleSave();
                }}
            >
                <div className="input-group">
                    <label htmlFor="settings-url">Server URL</label>
                    <input id="settings-url" type="url" value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://music.example.com" />
                </div>
                <div className="input-group">
                    <label htmlFor="settings-user">Username</label>
                    <input id="settings-user" type="text" value={user} onChange={(e) => setUser(e.target.value)} autoComplete="username" />
                </div>
                <div className="input-group">
                    <label htmlFor="settings-pass">Password (leave blank to keep current)</label>
                    <input id="settings-pass" type="password" value={pass} onChange={(e) => setPass(e.target.value)} autoComplete="current-password" />
                </div>

                {status && (
                    <div className={`status-message ${isError ? 'error' : 'success'}`} role="status">
                        {status}
                    </div>
                )}

                <button type="submit" className="save-btn" disabled={saving}>
                    {saving ? 'Testing…' : 'Save Settings'}
                </button>
            </form>

            {hostAccess === false && originPattern(serverUrl) && (
                <div className="settings-section">
                    <h2>Server access</h2>
                    <p className="muted">
                        Chrome has not granted this extension access to your server. Most Navidrome setups work without it,
                        but if requests fail, allow access.
                    </p>
                    <button className="btn-secondary" onClick={handleGrantAccess}>Allow access to {originPattern(serverUrl)}</button>
                </div>
            )}

            <div className="settings-section">
                <button className="btn-secondary" onClick={disconnect}>Disconnect</button>
            </div>

            <div className="version-info">v{appVersion()}</div>
        </div>
    );
}
