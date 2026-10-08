# Endless Runner 🏃‍♂️

A 2D endless runner built with **Phaser 4**, **TypeScript**, and **Vite**. Dodge enemies, chain double jumps, and chase a new high score — with English/Chinese localization and a global Firebase leaderboard.

![Phaser 4](https://img.shields.io/badge/Phaser-4-8b5cf6?logo=phaser)
![TypeScript](https://img.shields.io/badge/TypeScript-blue?logo=typescript)
![Vite](https://img.shields.io/badge/Vite-purple?logo=vite)
![Firebase](https://img.shields.io/badge/Firebase-Firestore-orange?logo=firebase)
![Version](https://img.shields.io/github/package-json/v/Jacksonkao97/endless-runner-phaser)
![License](https://img.shields.io/badge/license-MIT-green)

## 🎮 Play

**[Play it on GitHub Pages →](https://jacksonkao97.github.io/endless-runner-phaser/)**

## ✨ Features

- **Endless runner gameplay** — auto-scrolling world that keeps speeding up; your score grows with distance
- **Rising difficulty** — enemies spawn closer together as your score climbs
- **Double jump** — a second, smaller jump in mid-air
- **Three enemy types** — orcs on the ground, floating eyeballs at mid height, and high flyers; the airborne ones punish badly timed jumps and double jumps
- **Parallax backgrounds** — 5-layer scrolling sky, hills, and treelines for depth
- **Ambient decorations** — clouds, tents, and grass spawn and scroll independently
- **Global leaderboard** — submit your score with a name and compete for the top 10 (Firebase Firestore)
- **Local best score** — your personal best is saved in the browser
- **Keyboard, mouse, and touch support** — every screen can be used with the keyboard or a pointer
- **Internationalization (i18n)** — English and Chinese (中文)
- **Settings** — BGM/SFX volume, screen contrast, and language, all saved locally
- **Credits screen** — auto-scrolls, with manual scrolling by keyboard or mouse wheel

## 🕹️ Controls

| Action | Keys |
|---|---|
| Jump / Double Jump | `Space`, `↑`, `W`, or tap / click anywhere |
| Menu Navigation | `↑` `↓` / `W` `S` |
| Confirm / Select | `Space`, `Enter` |
| Adjust Slider / Change Language (Settings) | `←` `→` / `A` `D` |
| Switch Yes / No (dialogs) | `←` `→` / `A` `D` |
| Back / Cancel | `Escape` (also `Backspace` on Leaderboard and Credits) |
| Retry (Game Over) | `R` |
| Credits Scroll | `↑` `↓` / `W` `S`, mouse wheel |

## 🛠️ Tech Stack

- **[Phaser 4](https://phaser.io/)** — game framework (Arcade physics)
- **TypeScript** — type-safe game logic
- **Vite** — dev server and build tooling
- **Firebase** — Firestore for the leaderboard, Anonymous Auth for writes
- **Google Fonts (WebFontLoader)** — "Black Ops One" display font
- **GitHub Actions + GitHub Pages** — build and hosting

## 📁 Project Structure

```
├── .github/workflows/deploy.yml  # Build + deploy to GitHub Pages on push to main
├── public/assets/                # Images, spritesheets, and audio (served as-is)
├── src/
│   ├── main.ts                   # Loads the font, then creates the game and registers scenes
│   ├── assets.ts                 # Asset manifest (key → path) loaded by PreloadScene
│   ├── settings.ts               # Persisted settings (localStorage)
│   ├── firebase.ts               # Firebase app, Firestore, and anonymous sign-in
│   ├── services/
│   │   └── leaderboard.ts        # submitScore / fetchTopScores
│   ├── i18n/
│   │   ├── index.ts              # t() translation helper
│   │   ├── en.ts                 # English strings (defines the translation keys)
│   │   └── zh.ts                 # Chinese strings
│   └── scenes/
│       ├── BaseScene.ts          # Shared footer, confirm dialog, SFX, contrast overlay
│       ├── PreloadScene.ts       # First scene: asset loading with a progress bar
│       ├── MenuScene.ts          # Main menu, starts the background music
│       ├── GameScene.ts          # Core gameplay loop and tuning constants
│       ├── GameOverScene.ts      # Score, local best, name entry, and score submission
│       ├── LeaderboardScene.ts   # Global top 10
│       ├── SettingsScene.ts      # Volume and contrast sliders, language selector
│       └── CreditsScene.ts       # Auto-scrolling credits
├── index.html
└── vite.config.ts                # Base path and __APP_VERSION__ injection
```

## 🚀 Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) 20.19+ or 22.12+ (required by Vite)
- npm

### Installation

```bash
git clone https://github.com/Jacksonkao97/endless-runner-phaser.git
cd endless-runner-phaser
npm install
```

### Development

```bash
npm run dev
```

Starts the Vite dev server with hot reload at **http://localhost:3000/endless-runner-phaser/**. The path matches the `base` in `vite.config.ts`, which GitHub Pages needs.

### Build

```bash
npm run build     # type-check with tsc, then bundle to dist/
npm run preview   # serve the production build locally
```

There is no separate test suite or linter. `npm run build` is the check, and CI runs the same command.

### Versioning

The version shown in the in-game footer comes from `package.json`. Bump it with `npm version patch|minor|major`.

## 🌍 Deployment

Deployment is automatic: every push to `main` runs [`.github/workflows/deploy.yml`](.github/workflows/deploy.yml), which builds the game and publishes `dist/` to GitHub Pages.

For a fork, set **Settings → Pages → Source** to **GitHub Actions**. If you rename the repository, update `base` in `vite.config.ts` to match the new name.

## 🔥 Firebase Setup

The leaderboard uses **Cloud Firestore**. Players are signed in with **Anonymous Auth** before every read or write.

To use your own Firebase project:

1. Create a project in the [Firebase Console](https://console.firebase.google.com/) and add a **Web app**
2. Enable **Firestore Database**
3. Enable **Authentication → Sign-in method → Anonymous**
4. Replace the `firebaseConfig` object in `src/firebase.ts` with your app's config
5. Publish security rules for the `scores` collection (example below)

Firebase web config values are meant to be public. The security rules are what protect the database.

Each score is a document in the `scores` collection:

| Field | Type | Notes |
|---|---|---|
| `name` | string | Player name, up to 20 characters |
| `score` | number | Final score |
| `duration` | number | Run length in seconds |
| `timestamp` | timestamp | Set by the server (`serverTimestamp()`) |

Example rules: anyone can read, signed-in users can only create well-formed scores, and nobody can edit or delete them:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /scores/{scoreId} {
      allow read: if true;
      allow create: if request.auth != null
        && request.resource.data.keys().hasOnly(['name', 'score', 'duration', 'timestamp'])
        && request.resource.data.name is string
        && request.resource.data.name.size() > 0
        && request.resource.data.name.size() <= 20
        && request.resource.data.score is number
        && request.resource.data.score >= 0
        && request.resource.data.duration is number
        && request.resource.data.duration >= 0
        && request.resource.data.timestamp == request.time;
      allow update, delete: if false;
    }
  }
}
```

## 🌐 Localization

Strings live in `src/i18n/en.ts` and `src/i18n/zh.ts`, and the `t()` helper looks them up at runtime. `en.ts` defines the set of keys, so every key must exist there. Missing translations fall back to English.

To add a language:

1. Copy `en.ts` to `<lang>.ts` and translate every value
2. Register it in the `locales` map in `src/i18n/index.ts`
3. Add it to the `language` type in `src/settings.ts`
4. Add it to the `langs` list in `SettingsScene.ts`

## 🎨 Credits

**Development**
Jackson Kao

**Art & Assets** (itch.io)

- GandalfHardcore — 2D Pixel Art Asset Pack
- Zerie — 16-bit Character & Monster Pack
- ShinobuGaen — Demo_lugio Pack
- LuizMelo — Monsters Creatures Fantasy Pack

**Music**
LunaLucid — Creative Commons Collection 2015 ([lunalucid.itch.io](https://lunalucid.itch.io)), licensed under [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/)

**Sound Effects** — [Pixabay](https://pixabay.com)
Contributors: `freesound_community`, `jofae`, `u_qqkrn9bn55`.
Pixabay Content License: free to use and modify, no attribution required (credit is appreciated). Full terms: <https://pixabay.com/service/license-summary/>

**Built With**
Phaser 4 · TypeScript · Vite · Firebase

## 📄 License

The source code is MIT — see [LICENSE](LICENSE). Third-party art, music, and sound effects keep their creators' licenses (see [Credits](#-credits)).
