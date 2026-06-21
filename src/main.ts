import { AUTO, Game } from "phaser";
import WebFont from "webfontloader";
import BootScene from "./scenes/BootScene";
import CreditsScene from "./scenes/CreditsScene";
import GameScene from "./scenes/GameScene";
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
      width: 1200,
      height: 600,
      backgroundColor: "#4d4d4d",
      render: {
        powerPreference: "high-performance",
      },
      parent: "game",
      scene: [
        BootScene,
        PreloadScene,
        MenuScene,
        CreditsScene,
        SettingsScene,
        GameScene,
      ],
    });
  },
});
