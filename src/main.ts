// main.ts
import { AUTO, Game, Scale } from "phaser";
import WebFont from "webfontloader";
import CreditsScene from "./scenes/CreditsScene";
import GameOverScene from "./scenes/GameOverScene";
import GameScene from "./scenes/GameScene";
import LeaderboardScene from "./scenes/LeaderboardScene";
import MenuScene from "./scenes/MenuScene";
import PreloadScene from "./scenes/PreloadScene";
import SettingsScene from "./scenes/SettingsScene";
import "./style.css";

function startGame() {
  new Game({
    type: AUTO,
    width: 800,
    height: 600,
    backgroundColor: "#4d4d4d",
    render: {
      powerPreference: "high-performance",
    },
    parent: "game",
    scale: {
      mode: Scale.FIT,
      autoCenter: Scale.CENTER_BOTH,
      width: 800,
      height: 600,
      max: {
        width: 1600,
        height: 1200,
      },
    },
    physics: {
      default: "arcade",
      arcade: {
        gravity: { x: 0, y: 0 },
        debug: false,
      },
    },
    scene: [
      PreloadScene,
      MenuScene,
      LeaderboardScene,
      CreditsScene,
      SettingsScene,
      GameScene,
      GameOverScene,
    ],
  });
}

WebFont.load({
  google: {
    families: ["Black Ops One"],
  },
  active: startGame,
  // If the font can't load (offline, blocked), start with the fallback font
  // instead of leaving a blank page.
  inactive: startGame,
});

// Firebase is code-split out of the main bundle so it doesn't delay the first
// frame. Start loading it now so anonymous sign-in is usually done by the time
// the player opens the leaderboard.
void import("./firebase");
