import { AUTO, Game } from "phaser";
import WebFont from "webfontloader";
import BootScene from "./scenes/BootScene";
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
      physics: {
        default: "arcade",
        arcade: {
          gravity: { x: 0, y: 0 },
          debug: false,
        },
      },
      scene: [
        BootScene,
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
