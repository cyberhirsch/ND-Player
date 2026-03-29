# ND Player — Claude Context

A React Native / Expo music player that connects to a **Navidrome** server via the **Subsonic REST API**.
Full API reference: `info.txt` in the project root.

---

## Tech stack
- **Expo** (SDK 54) + **expo-router** (file-based tabs under `app/(tabs)/`)
- **Zustand** for state (`src/store/useStore.ts`)
- **expo-av** for audio playback (in `PlayerBar.tsx`)
- **expo-file-system** + **expo-secure-store** for offline downloads & credentials

---

## Subsonic API — key facts

### Auth (every request)
All calls require these query params (computed in `getAuthParams()`):

| Param | Value |
|---|---|
| `u` | username |
| `t` | md5(password + salt) |
| `s` | random salt string |
| `v` | `1.16.1` |
| `c` | `NDPlayer` |
| `f` | `json` |

Base URL pattern: `{serverUrl}/rest/{method}.view?...params`
Response wrapper: `response.data['subsonic-response']`

### Endpoints in use

| Method | Endpoint | Notes |
|---|---|---|
| Ping | `ping.view` | Health check |
| List albums (paginated) | `getAlbumList2.view` | `type=alphabeticalByName`, `size`, `offset` → `.albumList2.album[]` |
| Get album + tracks | `getAlbum.view` | `id` → `.album.song[]` |
| List playlists | `getPlaylists.view` | → `.playlists.playlist[]` |
| Get playlist tracks | `getPlaylist.view` | `id` → `.playlist.entry[]` |
| Stream audio | `stream.view` | `id` — returns binary, used as URI in expo-av |
| Cover art | `getCoverArt.view` | `id` — returns binary image |
| Starred items | `getStarred2.view` | → `.starred2.album[]`, `.starred2.song[]` |
| Search (albums + songs) | `search3.view` | `query`, `albumCount`, `songCount`, `albumOffset`, `songOffset`, `artistCount=0` → `.searchResult3` |
| All songs (paginated) | `search3.view` | Same as search but `query=''`, use `songOffset` for pagination |

### Endpoints available but not yet used (potentially useful)
- `getRandomSongs.view` — `size`, `genre`, `fromYear`, `toYear` → `.randomSongs.song[]`
- `getSongsByGenre.view` — `genre`, `count`, `offset`
- `star.view` / `unstar.view` — `id` (song, album or artist) — toggle starred
- `setRating.view` — `id`, `rating` (0–5)
- `scrobble.view` — `id`, `time`, `submission` — last.fm / play tracking
- `getArtists.view` — all artists by ID3 tags
- `getArtist.view` — `id` → artist + albums
- `getSimilarSongs2.view` — `id` (artist), `count` → artist radio
- `getTopSongs.view` — `artist` (name), `count`
- `getAlbumList2.view` with `type=starred` — starred albums list
- `savePlayQueue.view` / `getPlayQueue.view` — persist queue across devices

---

## Server / Dev credentials

| Field | Value |
|---|---|
| Server URL | `http://cyberhirsch.duckdns.org:4533` |
| Username | `test` |
| Password | `testicles` |

> These are the hardcoded defaults in `app/index.tsx` (login screen pre-fill).
> The main Navidrome account that owns all playlists is `cyberhirsch`.
> The `test` account can see all public playlists owned by `cyberhirsch`.

To compute a valid token for direct API calls:
```
salt = "abc123"
token = md5("testicles" + "abc123")  →  eb5b120cc98f41a7dd5e0e6181e60942
curl "http://cyberhirsch.duckdns.org:4533/rest/ping.view?u=test&t=eb5b120cc98f41a7dd5e0e6181e60942&s=abc123&v=1.16.1&c=NDPlayer&f=json"
```

---

## Project structure (important files)

```
app/
  (tabs)/
    _layout.tsx      # Tab bar: Albums, Playlists, Songs, Settings
    albums.tsx        # Grid of albums, bg-loads all pages, local filter + heart
    playlists.tsx     # List of playlists, local filter
    songs.tsx         # Paginated all songs, heart = starred only, search API when typing
    settings.tsx
  index.tsx           # Login screen
src/
  api/navidrome.ts    # All API calls
  store/useStore.ts   # Zustand: auth, player (queue/currentTrack), offline, library cache
  components/
    PlayerBar.tsx     # Bottom player bar; tap cover → TrackListModal
    TrackListModal.tsx # Queue sheet modal; tap track → jumpTo()
  constants/theme.ts
  utils/downloader.ts # Album/playlist/track download to device
```
