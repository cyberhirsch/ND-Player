# Chrome Web Store Description

## Short Description (Summary)
A modern, beautiful, and full-featured music player extension for your Navidrome server.

## Detailed Description

ND Player - Navidrome Music Player Extension

Transform your browser into a powerful music player for your personal music collection. Navidrome Player connects directly to your self-hosted Navidrome server, bringing your entire library to your fingertips with a sleek, modern interface inspired by the best streaming services.

Key Features:

Modern, Responsive UI
Enjoy a premium visual experience with a dark, neon-accented design that looks great on any screen size. The interface is fast, fluid, and intuitive.

Smart Home Screen
Get quick access to what matters most:
- Recent Albums: See your latest additions at a glance.
- Recently Edited Playlists: Jump back into your favorite mixes.
- Favorite Tracks: Rediscover a random selection of your starred songs.

Full Playback Control
- Seamless playback with support for all major audio formats.
- Full queue management: Shuffle, repeat, reorder, and clear tracks.
- Media Session integration: Control playback using your keyboard media keys or system controls.

Library Management
- Albums & Artists: Browse your collection with beautiful grid views and detailed artist/album pages.
- Playlists: Create, edit, and manage your playlists directly from the extension.
- Search: Instantly find any artist, album, or song in your library.
- Filters: Narrow albums to your favourites, a genre, or a range of release years.

Favorites & Ratings
- Star your favorite tracks, albums and artists. A heart marks them throughout your library.
- Rate songs from one to five stars, and optionally skip 1-star tracks automatically.

Getting Started:
1. Install the extension.
2. Click the extension icon to open the player.
3. Enter your Navidrome server URL, username, and password.
4. Start streaming your music!

Privacy Policy:
This extension connects ONLY to the Navidrome server URL you provide. It does not collect any personal data, usage statistics, or send data to any third-party servers. Your credentials are stored locally on your device.

Note: A self-hosted Navidrome server is required to use this extension.

Disclaimer:
This is currently in beta stage. Please report any bugs you might encounter! Thank you!

[1.0.3] - 2026-11-08

Added
Media Session support: hardware media keys and your system's media controls now control playback and show the current track with artwork.
Favourite hearts on album and artist cards; hover a card to star or unstar it.
Add to Playlist from any album card or album page.
Clear messages when something fails, and a Disconnect button in Settings.

Fixed
Wrong passwords are now rejected at login instead of being accepted.
Clicking an album cover opens the album again, including the cover in the player bar.
Album search covers your whole library; genre and year filters work.
Duplicate songs in the queue, "Previous", shuffle and resume-after-reload all behave correctly.
Unplayable tracks are skipped with a message instead of stalling playback.
Clicking the toolbar icon focuses the open player instead of opening a second one.

Changed
Smoother playback UI with far less background work.
Login details stay on this device and are no longer synced to your Google account. Access is requested only for your own server instead of all websites.

[1.0.2] - 2026-11-08

Fixed
Album card hover button: The play button on album covers turned green on hover because of a hardcoded colour value. It now stays on the theme accent colour and simply brightens.
Truncated album titles: Long album and artist names were clipped mid-word with no ellipsis. Both now truncate cleanly.

[1.0.1] - 2026-03-09

Added
Keyboard Shortcuts: Implemented Spacebar to toggle Play/Pause. The shortcut is automatically disabled when typing in inputs or text areas to prevent accidental triggers.

Fixed
Repeat One Mode: Fixed an issue where "Repeat One" would sometimes skip to the next track or stop. It now correctly loops the current song using the native audio loop property.

[1.0.0] - 2026-01-17

Added
Initial release of the Navidrome Music Player Extension.
Core playback features (Play, Pause, Next, Previous).
Playlist and Queue management.
Shuffle and Repeat (All/Off) modes.
Star ratings and favorite toggling.
Album art and metadata display.
