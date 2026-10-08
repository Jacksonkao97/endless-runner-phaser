# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm install        # install dependencies
npm run dev        # Vite dev server → http://localhost:3000/endless-runner-phaser/
npm run build      # tsc type-check, then vite build to dist/
npm run preview    # serve the built dist/
npx tsc            # type-check only (noEmit)
```

There is no test suite and no linter. `npm run build` is the verification step: CI runs exactly that, and the strict tsconfig (`noUnusedLocals`, `noUnusedParameters`) fails the build on unused code. Prefix intentionally unused parameters with `_`.

Deployment is automatic: pushing to `main` runs `.github/workflows/deploy.yml` (Node 22), which builds and publishes `dist/` to GitHub Pages. There is no deploy script.

## Architecture

Phaser 4 + TypeScript + Vite, a single-page 2D endless runner with a Firebase Firestore leaderboard and English/Chinese localization.

### Boot and scene flow

`src/main.ts` waits for WebFontLoader to load the Google font "Black Ops One", then creates the `Phaser.Game` (800×600, `Scale.FIT`, arcade physics with **zero global gravity**). Every text object uses `fontFamily: "Black Ops One"`.

The scenes are registered in order in `main.ts`, and each one has a string key passed to `super(...)`:
`Preload` → `Menu` → {`Game`, `Leaderboard`, `Settings`, `Credits`}; `Game` → `GameOver` → {`Game`, `Menu`, `Leaderboard`}.
Scenes switch with `this.scene.start(key, data?)`. For example, `GameScene` passes `{ score, duration }` to `GameOver`, which reads it from `this.scene.settings.data`. There is no `BootScene`.

### BaseScene conventions (`src/scenes/BaseScene.ts`)

Every scene extends `BaseScene`, which provides:
- `addFooter(depth?)`: shows the developer name and the version. The version comes from `__APP_VERSION__`, which `vite.config.ts` injects from `package.json`, so bumping the version in `package.json` updates the in-game display.
- `showConfirm(msg, onYes, onNo, onOpen?, onClose?)`: a modal dialog with its own keyboard handling. Scenes use `onOpen`/`onClose` to toggle a `keyboardActive` flag so their own menu navigation pauses while the dialog is open.
- `playSfx(key)`: plays a sound at the persisted SFX volume.
- `applyContrast(value)`: a black overlay at depth 999. **Every scene calls `this.applyContrast(Settings.load().contrast)` at the end of `create()`.** `SettingsScene.saveAndApply()` re-applies it to all active scenes.

### Input pattern

Menus don't use Phaser key objects. They attach raw listeners with `this.input.keyboard!.on("keydown", (e: KeyboardEvent) => switch (e.key) ...)`, with WASD and arrow keys as aliases, and Space/Enter call `button.emit("pointerup")` so keyboard and pointer share one code path. Every screen should also be usable with only a pointer or touch.

On shutdown, Phaser automatically clears listeners on `this.input` and `this.input.keyboard`, along with `this.time` timers and tweens. Some scenes also remove these by hand in `this.events.once("shutdown", ...)`. Phaser does **not** reset:
- Scene instances, which are reused between visits. Reset per-run fields at the top of `create()`.
- Module-level state, such as the mutable `DECO_CATEGORIES` objects in `GameScene`.
- `this.scene.settings.data`, which keeps the last data that was passed in when a later `start()` passes none.

Inside `create()`, `this.time.now` can be stale because the scene clock hasn't ticked yet. For delays, use `this.time.delayedCall`.

### Gameplay (`src/scenes/GameScene.ts`)

- The world does not move through physics. `update()` scrolls the ground tile sprites, parallax background layers, obstacles and decorations by hand using `scrollSpeed * delta`, and destroys objects once they leave the screen. Only the player has gravity (`setGravityY(GRAVITY)`).
- Every tuning value (jump velocities, scroll speed and acceleration, obstacle spawn intervals, `DIFFICULTY_SCORE_SCALE`) is a constant at the top of the file. Difficulty has two parts: `scrollSpeed` rises steadily, and the obstacle spawn interval is linearly interpolated from the `OBSTACLE_INTERVAL_*` values to the `*_FLOOR` values based on `score / DIFFICULTY_SCORE_SCALE`.
- Obstacles are defined in the `OBSTACLE_TYPES` table: texture/animation key, hitbox size, display scale, a `getY(groundY)` placement function, and a spawn `weight`. The weights should sum to 1. Decorations are defined in the same data-driven way in `DECO_CATEGORIES`, with per-category spawn timers.
- Parallax factors are stored on game objects as an ad-hoc `__parallax` property.
- Animations are global to the game, so they're created behind `if (!this.anims.exists(key))` guards. Placeholder textures are generated when an asset is missing.
- `Math` is imported from Phaser in this file, so it shadows the global; use `window.Math` for native methods such as `random`/`round`.
- Crouch is stubbed out in comments. The comment in `crouchDown` explains why: never `setScale` a physics sprite in Phaser 4; resize the body and offset it instead.
- Double jump: `jumpCount` resets on the landing edge, which is detected in `update()`.

### Assets

Asset files live in `public/assets/` and are registered in `src/assets.ts` (`images`, `spritesheets`, `audio`). `PreloadScene` loads everything in those lists, and it also waits at least 3 seconds for its progress animation. To add an asset, add an entry to `assets.ts` and reference it by key. Paths must stay **relative** (no leading `/`) so they resolve under the Vite `base` of `/endless-runner-phaser/`.

### Persistence, settings, i18n

- `src/settings.ts` stores `{ bgmVolume, sfxVolume, language, contrast }` in localStorage under the key `endless-runner-settings`. `Settings.load()` merges the saved values over the defaults. The best score is stored separately in `endless_runner_best` (`GameOverScene`).
- `t(key)` (`src/i18n/index.ts`) reads the language from `Settings.load()` on every call and falls back to English. Its key type comes from `en.ts`, so a new key must be added to `en.ts` first and then to `zh.ts`. Text is resolved when a scene's `create()` runs, so changing the language calls `this.scene.restart()` to redraw the scene, and `restoreRow` keeps the keyboard focus on the same row. To add a language, add a locale file, register it in `i18n/index.ts`, widen the `language` union in `settings.ts`, and add it to the dropdown in `SettingsScene.ts`.
- The BGM instance is shared across scenes: `MenuScene` reuses `this.sound.get("bgm")` if it exists instead of creating a second one, and `SettingsScene` adjusts its volume live.

### Leaderboard (Firebase)

`src/firebase.ts` initializes Firebase with the public web config and signs in anonymously, exporting an `authReady` promise. `src/services/leaderboard.ts` awaits `authReady` before every Firestore call. Scores go to the `scores` collection as `{ name, score, duration, timestamp: serverTimestamp() }`, and the top 10 are read with `orderBy("score", "desc")`.
