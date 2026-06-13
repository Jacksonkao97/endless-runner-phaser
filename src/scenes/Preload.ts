import { Scene } from "phaser";

export default class Preload extends Scene {
  constructor() {
    super("Preload");
  }

  preload() {
    const { width, height } = this.scale;

    this.add
      .text(width / 2, height / 2 - 60, "Endless Runner", {
        fontSize: "32px",
        color: "#fff",
        fontFamily: "Black Ops One",
      })
      .setOrigin(0.5);

    const barFill = this.add
      .rectangle(width / 2 - 110, height / 2, 0, 4, 0x111111)
      .setOrigin(0, 0.5);

    const pct = this.add
      .text(width / 2, height / 2 + 16, "0%", {
        fontSize: "12px",
        color: "#aaaaaa",
      })
      .setOrigin(0.5);

    this.load.on("progress", (value: number) => {
      barFill.width = 220 * value;
      pct.setText(`${Math.round(value * 100)}%`);
    });

    // this.load.on("complete", () => {
    //   this.scene.start("Game");
    // });

    // this.load.image('player', 'assets/player.png')
  }

  startGame() {
    this.scene.start("Game");
  }
}
