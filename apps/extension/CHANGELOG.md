# Changelog

All notable changes to this project will be documented in this file.

## [1.0.3] - 2026-11-08

### Added
- **Media Session support**: Hardware media keys, the OS media controls and lock-screen / notification widgets now control playback, show the current track with artwork, and can seek.
- **Favourite hearts on albums and artists**: Starred albums and artists show a heart in the top-right corner of their cards; hover any card to star or unstar it. Album and artist pages have the heart as well.
- **Add to Playlist**: The album card button now adds the whole album to an existing playlist or a new one (it previously showed a "not implemented" alert). Also available on the album page.
- **Notifications**: Failed actions, skipped tracks and saved playlists now show a short message instead of failing silently.
- **Disconnect** button in Settings.

### Fixed
- **Login accepted any password**: Credentials are now checked before they are saved, and wrong passwords, unreachable servers and other errors are reported with a clear message.
- **Album covers did not open the album**: Clicking a cover in the album grid opens the album again, and the cover in the player bar now opens the current song's album.
- **Duplicate songs in the queue**: A song that appears twice no longer makes "Next" jump back and forth between the copies.
- **"Previous" restarted the song only once**: It now restarts reliably every time. "Stop" also returns to the start reliably.
- **Album search** searches the whole library on the server instead of only the albums already loaded.
- **Album filters**: Genre and year filters now actually filter. Filter options the server cannot provide (compilation, rated, artist) were removed, and sort options are limited to orders the server supports.
- **Resume after reload**: The current track resumes where it left off when the player is reopened.
- **Unplayable tracks**: A track that fails to stream is skipped with a message instead of stalling the player.
- **Empty libraries**: Users without playlists or genres no longer see a blank page; any page error now shows a message instead of an empty screen.
- **Shuffle** no longer repeats the current track immediately, and "Previous" in shuffle mode returns to the track that actually played before.
- **Saving a reordered playlist** happens in a single request, so a network error can no longer leave the playlist empty.
- **Clicking the toolbar icon** focuses the open player tab instead of opening a second player.

### Changed
- **Performance**: The interface no longer re-renders several times per second during playback, and the queue is saved to storage at most once per second instead of on every progress tick.
- **Privacy and permissions**: Login details are stored on this device only (`chrome.storage.local`) instead of being synced to your Google account; existing logins are moved automatically. Access is requested only for your own server instead of all websites, and the unused unlimited-storage permission was removed.
- The "Favorite Tracks" shelf on Home shows a random selection of your starred songs.

## [1.0.2] - 2026-11-08

### Fixed
- **Album card hover button**: The play button on album covers turned Spotify green on hover because of a hardcoded `#1ed760`. It now stays on the theme accent colour and simply brightens.
- **Truncated album titles**: Long album names and artist names were clipped mid-word with no ellipsis. Both now truncate cleanly with `...`.

### Changed
- The extension now lives in the ND Player monorepo under `apps/extension`, and is built and packaged by CI on every push.

## [1.0.1] - 2026-03-09

### Added
- **Keyboard Shortcuts**: Implemented Spacebar to toggle Play/Pause. The shortcut is automatically disabled when typing in inputs or text areas to prevent accidental triggers.

### Fixed
- **Repeat One Mode**: Fixed an issue where "Repeat One" would sometimes skip to the next track or stop. It now correctly loops the current song using the native audio loop property.

## [1.0.0] - 2026-01-17

### Added
- Initial release of the Navidrome Music Player Extension.
- Core playback features (Play, Pause, Next, Previous).
- Playlist and Queue management.
- Shuffle and Repeat (All/Off) modes.
- Star ratings and favorite toggling.
- Album art and metadata display.
