import { NavLink } from 'react-router-dom';


export default function Sidebar() {
    return (
        <div className="sidebar">
            <div className="sidebar-header">
                <img src="/Logo.png" alt="Navidrome" className="sidebar-logo" />
            </div>
            <nav>
                <ul>
                    <li><NavLink to="/" end>Home</NavLink></li>
                    <li><NavLink to="/albums">Albums</NavLink></li>
                    <li><NavLink to="/artists">Artists</NavLink></li>
                    <li><NavLink to="/playlists">Playlists</NavLink></li>
                    <li><NavLink to="/songs">Songs</NavLink></li>
                    <li><NavLink to="/settings">Settings</NavLink></li>
                </ul>
            </nav>
        </div>
    );
}
