# ND Player

A React Native / Expo music player for [Navidrome](https://www.navidrome.org/) servers, built with the Subsonic REST API.

---

## Features

- **Browse** albums, artists, and playlists from your Navidrome server
- **Songs tab** with infinite scroll and live search
- **Starred / favorites** filter on albums and songs
- **Offline playback** — download albums and playlists to your device
- **Now playing bar** with queue management, repeat modes (off / all / one)
- **Dark mode** support — follows system setting

---

## Tech Stack

| Layer | Library |
|---|---|
| Framework | [Expo](https://expo.dev/) SDK 54 + expo-router |
| State | [Zustand](https://github.com/pmndrs/zustand) |
| Audio | expo-av |
| Storage | expo-secure-store + expo-file-system |
| API | [Subsonic REST API](http://www.subsonic.org/pages/api.jsp) v1.16.1 |

---

## Getting Started

### Prerequisites
- [Node.js](https://nodejs.org/) 18+
- [Expo Go](https://expo.dev/go) on your phone, or an Android emulator
- A running [Navidrome](https://www.navidrome.org/) instance

### Installation

```bash
git clone https://github.com/cyberhirsch/ND-Player.git
cd ND-Player
npm install
```

### Dev credentials (optional)

Create a `.env.local` file in the project root to pre-fill the login screen during development:

```env
EXPO_PUBLIC_DEV_SERVER_URL=http://your-navidrome-server:4533
EXPO_PUBLIC_DEV_USERNAME=youruser
EXPO_PUBLIC_DEV_PASSWORD=yourpassword
```

This file is gitignored and will not be included in production builds.

### Run

```bash
npx expo start
```

Scan the QR code with Expo Go, or press `a` to open in an Android emulator.

---

## Building for Production

Requires [EAS CLI](https://docs.expo.dev/eas/) and an Expo account.

```bash
npm install -g eas-cli
eas login
eas build --platform android --profile production
```

This produces an `.aab` (Android App Bundle) ready for Google Play.

---

## Privacy Policy

See [docs/privacy-policy.html](docs/privacy-policy.html) — also hosted at:
`https://cyberhirsch.github.io/ND-Player/docs/privacy-policy.html`

---

## License

Copyright © 2026 cyberhirsch. All rights reserved.

This project is provided for personal use. You may not redistribute, sublicense,
or use it commercially without explicit written permission from the author.
