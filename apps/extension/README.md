# Navidrome Player — Chrome extension

A full-page music player for [Navidrome](https://www.navidrome.org/), packaged as a
Manifest V3 Chrome extension. Clicking the toolbar icon opens the player in a tab.

Part of the [ND Player](../../README.md) repo; the Expo mobile client lives in
[`apps/mobile`](../mobile).

---

## Features

- Browse albums, artists, playlists and songs
- Queue management, shuffle, repeat (off / all / one)
- Star ratings and favourites
- Spacebar play/pause (disabled while typing in inputs)
- Add albums to a playlist or to the queue straight from the grid

---

## Development

```bash
npm install
npm run dev
```

Vite serves the player at `http://localhost:5173` — the whole UI runs in a normal tab,
so most work needs no extension reload.

## Build & load in Chrome

```bash
npm run build
```

Then in Chrome: `chrome://extensions` → enable **Developer mode** → **Load unpacked** →
select this app's `dist/` folder.

---

## Layout

```
public/manifest.json   MV3 manifest, icons, background service worker
src/
  api/                 Subsonic calls
  store/               Zustand state
  components/          Albums, Artists, Home, PlayerBar, Queue, Settings, …
  styles/layout.css    Main stylesheet (--accent-color: #00ffff)
store-assets/          Chrome Web Store promo tiles (PSDs are gitignored)
```

Version history is in [CHANGELOG.md](CHANGELOG.md); privacy terms in [PRIVACY.md](PRIVACY.md).
