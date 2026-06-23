import Settings from "../settings";
import { BaseScene } from "./BaseScene";

export default class GameScene extends BaseScene {
  constructor() {
    super("Game");
  }

  create() {
    this.add.text(100, 100, "Game starts here", { color: "#111111" });

    this.addFooter();

    this.applyContrast(Settings.load().contrast);
  }
}
