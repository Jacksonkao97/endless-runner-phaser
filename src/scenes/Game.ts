import { Scene } from "phaser";

export default class Game extends Scene {
  constructor() {
    super("Game");
  }

  create() {
    this.add.text(100, 100, "Game starts here", { color: "#111111" });
  }
}
