# Changelog

All notable changes to this project will be documented in this file.

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
