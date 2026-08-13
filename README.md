# ND Player

Navidrome clients for phone and browser, in one repo. Both talk to a
[Navidrome](https://www.navidrome.org/) server over the
[Subsonic REST API](http://www.subsonic.org/pages/api.jsp) v1.16.1.

| App | Path | Stack |
|---|---|---|
| **ND Player** (Android) | [`apps/mobile`](apps/mobile) | Expo SDK 54, expo-router, Zustand, expo-av |
| **Navidrome Player** (Chrome extension) | [`apps/extension`](apps/extension) | Vite, React 19, react-router-dom, Zustand |

Shared reference material lives in [`docs/`](docs) — `docs/subsonic-api.txt` is the full
Subsonic API dump both clients are written against.

---

## Layout

```
apps/
  mobile/      Expo app  — see apps/mobile/README.md
  extension/   Chrome MV3 extension — see apps/extension/README.md
docs/
  subsonic-api.txt      Subsonic API reference (both clients)
  privacy-policy.html   Play Store privacy policy — published via GitHub Pages,
                        keep at this path so the live URL stays valid
.github/workflows/build-android.yml   EAS build for apps/mobile
```

There is no workspace root package — each app installs and builds on its own:

```bash
cd apps/mobile && npm install      # then: npx expo start
cd apps/extension && npm install   # then: npm run dev
```

---

## License

Copyright © 2026 cyberhirsch. All rights reserved.

Provided for personal use. You may not redistribute, sublicense, or use it
commercially without explicit written permission from the author.
