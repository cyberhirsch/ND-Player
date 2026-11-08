import { useLocation } from 'react-router-dom';
import { useSettingsHydrated, useSettingsStore } from '../store/useSettingsStore';
import ConnectScreen from './ConnectScreen';
import Sidebar from './Sidebar';
import PlayerBar from './PlayerBar';
import QueueList from './QueueList';
import AudioController from './AudioController';
import ErrorBoundary from './ErrorBoundary';
import Toaster from './Toaster';
import '../styles/layout.css';
import '../styles/components.css';

export default function Layout({ children }: { children: React.ReactNode }) {
    const hydrated = useSettingsHydrated();
    const connected = useSettingsStore(state => !!(state.serverUrl && state.username && state.token));
    const location = useLocation();

    // Settings load asynchronously from chrome.storage; don't flash the connect screen meanwhile.
    if (!hydrated) return null;

    if (!connected) {
        return (
            <>
                <ConnectScreen />
                <Toaster />
            </>
        );
    }

    return (
        <div className="app-container">
            <AudioController />
            <div className="main-area">
                <Sidebar />
                <main className="content">
                    <ErrorBoundary key={location.pathname}>
                        {children}
                    </ErrorBoundary>
                </main>
                <div className="right-sidebar">
                    <ErrorBoundary>
                        <QueueList />
                    </ErrorBoundary>
                </div>
            </div>
            <PlayerBar />
            <Toaster />
        </div>
    );
}
