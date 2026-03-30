# ND Player — Task List

## 🔴 Critical

- [ ] **Auth credentials embedded in stream/cover URLs** — auth token visible in network logs, image cache, referrer headers (`navidrome.ts` → `getStreamUrl` / `getCoverArtUrl`)
- [ ] **No user-facing error feedback** — API failures, download failures, and playback errors all silently log to console only (`albums.tsx`, `playlists.tsx`, `downloader.ts`, `PlayerBar.tsx`)
- [ ] **Race condition on rapid track changes** — if `currentTrack` changes while `loadSound()` is still awaiting the network, the old sound can overwrite the new one (`PlayerBar.tsx`)

---

## 🟠 High

- [ ] **No seek bar / no playback progress** — core music player feature entirely absent; `duration` field exists on `Track` but is never rendered (`PlayerBar.tsx`)
- [ ] **No shuffle / repeat** — buttons don't exist and the store has no state for it (`useStore.ts`, `PlayerBar.tsx`)
- [ ] **No storage quota check before downloading** — could silently fill the device (`downloader.ts`)
- [ ] **Partial download cleanup** — if a download fails mid-album, already-saved files are never deleted (`downloader.ts` catch block)
- [ ] **Duplicate download prevention missing** — tapping "Download" twice starts two concurrent downloads (`albums.tsx`, `playlists.tsx`)
- [ ] **Cover art never downloaded for playlists** — albums store `localCoverUri` but playlists download nothing (`downloader.ts` → `downloadPlaylist`)
- [ ] **`playPrev()` does nothing at index 0** — should restart the track or wrap to the end (`useStore.ts`)

---

## 🟡 Medium

- [ ] **URL normalization logic duplicated** — same protocol-fallback code copy-pasted (`index.tsx` + `settings.tsx`)
- [ ] **`downloadAlbum` and `downloadPlaylist` are ~90% identical** — should be extracted into a shared helper (`downloader.ts`)
- [ ] **Album/playlist list hardcoded to 50 items** — no pagination or "load more" (`navidrome.ts` → `size: 50`)
- [ ] **No background playback config for iOS** — `shouldDuckAndroid` set but no iOS audio session config (`app.json` / audio setup)

---

## 🔵 Low / Maintainability

- [ ] **`any` types on all API responses** — no interfaces for Navidrome response shapes (`navidrome.ts`, `albums.tsx`, `playlists.tsx`)
- [ ] **Magic numbers/strings** — `'1.16.1'`, `size: 50`, `numColumns = 2`, `'cover_'` prefix all inline (multiple files)
- [ ] **No queue management UI** — can't see, reorder, or remove tracks from the queue
- [ ] **No global error boundary** — an unhandled throw in any component crashes the whole app silently (app root)
- [ ] **Internet check hits `google.com`** — unreliable on corporate/restricted networks (`index.tsx`)

---

## ✅ Fixed

- [x] Duplicate status message on login screen (`app/index.tsx`)
- [x] Offline playback hits the server for track metadata — now uses stored `trackList` (`albums.tsx`, `playlists.tsx`)
- [x] `PlayerBar` loads cover art from server in offline mode — now uses `localCoverUri` (`PlayerBar.tsx`)
- [x] Stale closure for `sound` in `loadSound` — replaced state with `useRef` (`PlayerBar.tsx`)
- [x] Sound double-unload risk from cleanup effect — removed redundant effect (`PlayerBar.tsx`)
- [x] `downloadTrack` `onProgress` param accepted but never called — parameter removed (`downloader.ts`)
- [x] Hardcoded `.mp3` extension on downloaded files — extension removed (`downloader.ts`)
- [x] `setQueue()` set `isPlaying: true` before audio loaded — removed, PlayerBar sets it after load (`useStore.ts`)
- [x] `playPrev()` did nothing at index 0 — now restarts the current track (`useStore.ts`)
- [x] No loading spinner while audio loads — spinner shown on play button during load (`PlayerBar.tsx`)
- [x] No fallback UI for missing cover art — musical note icon shown when cover unavailable (`PlayerBar.tsx`, `albums.tsx`)
- [x] `loadAlbums`/`loadPlaylists` showed no loading indicator on mode switch — `setLoading(true)` added at top (`albums.tsx`, `playlists.tsx`)
- [x] API failures and playback errors silently swallowed — error Alerts added in catch blocks (`albums.tsx`, `playlists.tsx`)
- [x] Double-tap on Download started duplicate downloads — guard added in `handleDownload` (`albums.tsx`, `playlists.tsx`)
- [x] `AlbumCover` re-rendered on every parent render — wrapped in `memo` (`albums.tsx`)
- [x] `renderItem` callbacks recreated every render — wrapped in `useCallback` (`albums.tsx`, `playlists.tsx`)
- [x] Partial downloads left orphaned files on failure — cleanup in catch block (`downloader.ts`)
