import { AUTO, Game } from "phaser";
import WebFont from "webfontloader";
import BootScene from "./scenes/Boot";
import GameScene from "./scenes/Game";
import PreloadScene from "./scenes/Preload";
import "./style.css";

WebFont.load({
  google: {
    families: ["Black Ops One"],
  },
  active() {
    new Game({
      type: AUTO,
      width: 800,
      height: 400,
      backgroundColor: "#535353",
      parent: "game",
      scene: [BootScene, PreloadScene, GameScene],
    });
  },
});
