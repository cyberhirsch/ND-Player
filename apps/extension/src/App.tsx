import { Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import Home from './components/Home';
import Albums from './components/Albums';
import AlbumDetails from './components/AlbumDetails';
import Artists from './components/Artists';
import ArtistDetails from './components/ArtistDetails';
import Playlists from './components/Playlists';
import PlaylistDetails from './components/PlaylistDetails';
import Songs from './components/Songs';
import Settings from './components/Settings';

function App() {
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/albums" element={<Albums />} />
        <Route path="/albums/:id" element={<AlbumDetails />} />
        <Route path="/artists" element={<Artists />} />
        <Route path="/artists/:id" element={<ArtistDetails />} />
        <Route path="/playlists" element={<Playlists />} />
        <Route path="/playlists/:id" element={<PlaylistDetails />} />
        <Route path="/songs" element={<Songs />} />
        <Route path="/settings" element={<Settings />} />
      </Routes>
    </Layout>
  );
}

export default App;
