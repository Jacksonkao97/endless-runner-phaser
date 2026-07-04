# Endless Runner 🏃‍♂️

A 2D endless runner built with **Phaser 4**, **TypeScript**, and **Vite**. Dodge enemies, chain double jumps, and chase a new high score — with full English/Chinese localization and a global leaderboard.

![Phaser 4](https://img.shields.io/badge/Phaser-4-8b5cf6?logo=phaser)
![TypeScript](https://img.shields.io/badge/TypeScript-blue?logo=typescript)
![Vite](https://img.shields.io/badge/Vite-purple?logo=vite)
![License](https://img.shields.io/badge/license-MIT-green)

## 🎮 Play

**[Play it on GitHub Pages →](https://jacksonkao97.github.io/endless-runner/)**

## ✨ Features

- **Endless runner gameplay** — auto-scrolling parallax world with progressively increasing speed
- **Double jump** — clear ground-level, mid-air, and high-flying enemies
- **Three enemy types** — ground, mid-floating, and top-floating obstacles with weighted spawn rates
- **Parallax backgrounds** — 5-layer scrolling sky, hills, and treeline for depth
- **Ambient decorations** — clouds, tents, and grass spawn and scroll independently for atmosphere
- **Global leaderboard** — powered by Firebase, compete for the top score
- **Full keyboard + mouse/touch support** — every menu is navigable with WASD/arrows/Enter or a pointer
- **Internationalization (i18n)** — full English and Chinese (中文) language support
- **Settings** — adjustable BGM/SFX volume and screen contrast, all persisted locally
- **Scrollable credits screen** — auto-scrolling with manual override via keyboard or mouse wheel

## 🕹️ Controls

| Action | Keys |
|---|---|
| Jump / Double Jump | `Space`, `↑`, `W` |
| Menu Navigation | `↑` `↓` `W` `S` |
| Confirm / Select | `Space`, `Enter` |
| Back / Cancel | `Escape` |
| Retry (Game Over) | `R` |
| Credits Scroll | `↑` `↓`, Mouse Wheel |

Touch controls are also supported — tap anywhere to jump.

## 🛠️ Tech Stack

- **[Phaser 4](https://phaser.io/)** — game framework
- **TypeScript** — type-safe game logic
- **Vite** — dev server and build tooling
- **Google Fonts (WebFontLoader)** — "Black Ops One" display font
- **GitHub Pages** — hosting/deployment

## 📁 Project Structure

\```
src/
├── scenes/
│   ├── BaseScene.ts       # Shared utilities: footer, confirm dialogs, SFX, contrast overlay
│   ├── BootScene.ts       # Entry point, kicks off preloading
│   ├── PreloadScene.ts    # Asset loading with animated progress bar
│   ├── MenuScene.ts       # Main menu with BGM and keyboard navigation
│   ├── GameScene.ts       # Core gameplay loop
│   ├── GameOverScene.ts   # Score summary, best score tracking, retry/menu options
│   ├── SettingsScene.ts   # Volume sliders, contrast slider, language selector
│   └── CreditsScene.ts    # Scrollable credits with auto-scroll
├── i18n/
│   ├── en.ts              # English translations
│   └── zh.ts              # Chinese translations
└── settings.ts             # Persisted settings (localStorage)
\```

## 🚀 Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) (LTS recommended)
- npm

### Installation

\```bash
git clone <https://github.com/jacksonkao97/endless-runner.git>
cd endless-runner
npm install
\```

### Development

\```bash
npm run dev
\```

Starts the Vite dev server with hot reload.

### Build

\```bash
npm run build
\```

Builds a production-ready bundle to `dist/`.

### Deploy to GitHub Pages

\```bash
npm run deploy
\```

*(Adjust this section if your deploy script/workflow differs.)*

## 🔥 Firebase Setup

The leaderboard feature requires a Firebase project:

1. Create a project at [Firebase Console](https://console.firebase.google.com/)
2. Enable **Realtime Database** or **Firestore** (whichever this project uses)
3. Add your Firebase config to the appropriate config file
4. Set your database rules to allow read/write as needed for public leaderboard submissions

## 🌐 Localization

Language strings live in `src/i18n/en.ts` and `src/i18n/zh.ts`, resolved at runtime via a `t()` helper. To add a new language:

1. Duplicate `en.ts` as `<lang>.ts` and translate all keys
2. Register the new language in `settings.ts` and the language dropdown in `SettingsScene.ts`

## 🎨 Credits

**Development**
Jackson Kao

**Art & Assets**

- GandalfHardcore — 2D Pixel Art Asset Pack (itch.io)
- Zerie — 16-bit Character & Monster Pack (itch.io)
- ShinobuGaen — Demo_lugio Pack (itch.io)
- LuizMelo — Monsters Creatures Fantasy Pack (itch.io)

**Music**
Licensed under [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/) — see in-game credits for full attribution.

**Built With**
Phaser 4 · TypeScript · Vite

## 📄 License

MIT — see [LICENSE](LICENSE) for details.

---

<sub>v1.0.0</sub>
