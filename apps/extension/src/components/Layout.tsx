import { useSettingsStore } from '../store/useSettingsStore';
import ConnectScreen from './ConnectScreen';
import Sidebar from './Sidebar';
import PlayerBar from './PlayerBar';
import QueueList from './QueueList';
import AudioController from './AudioController';
import '../styles/layout.css';

export default function Layout({ children }: { children: React.ReactNode }) {
    const { serverUrl, username, token } = useSettingsStore();

    if (!serverUrl || !username || !token) {
        return <ConnectScreen />;
    }

    return (
        <div className="app-container">
            <AudioController />
            <div className="main-area">
                <Sidebar />
                <main className="content">
                    {children}
                </main>
                <div className="right-sidebar">
                    <QueueList />
                </div>
            </div>
            <PlayerBar />
        </div>
    );
}
