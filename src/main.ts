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

WebFont.load({
  google: {
    families: ["Black Ops One"],
  },
  active() {
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
  },
});
