import { BaseScene } from "./BaseScene";

const messages = [
  "Loading...",
  "Warming up...",
  "Almost there...",
  "Get ready...",
];

export default class PreloadScene extends BaseScene {
  constructor() {
    super("Preload");
  }

  preload() {
    const { width, height } = this.scale;
    const centerX = width / 2;
    const centerY = height / 2;

    this.add
      .text(centerX, centerY - 60, "Endless_Runner", {
        fontSize: "52px",
        color: "#DFE8A6",
        fontFamily: "Black Ops One",
      })
      .setOrigin(0.5);

    const dot = this.add.circle(centerX - 250, centerY + 20, 5, 0xf26500);
    this.tweens.add({
      targets: dot,
      alpha: 0.3,
      duration: 800,
      yoyo: true,
      repeat: -1,
      ease: "Sine.easeInOut",
    });

    let index = 0;
    const loadingText = this.add
      .text(centerX - 230, centerY + 20, messages[0], {
        fontSize: "14px",
        color: "#aaaaaa",
        fontFamily: "Black Ops One",
      })
      .setOrigin(0, 0.5);

    this.time.addEvent({
      delay: 1500,
      repeat: -1,
      callback: () => {
        index = (index + 1) % messages.length;
        loadingText.setText(messages[index]);
      },
    });

    const pct = this.add
      .text(centerX + 250, centerY + 20, "0%", {
        fontSize: "16px",
        color: "#aaaaaa",
        fontFamily: "Black Ops One",
      })
      .setOrigin(1, 0.5);

    const loadingBarPos = centerY + 50;
    const barWidth = 520;
    this.add
      .rectangle(centerX, loadingBarPos, barWidth, 4, 0x333333)
      .setOrigin(0.5);

    const barFill = this.add
      .rectangle(centerX - barWidth / 2, loadingBarPos, 0, 4, 0xf26500)
      .setOrigin(0, 0.5);

    let assetsLoaded = false;
    let minTimeDone = false;

    const tryStart = () => {
      if (assetsLoaded && minTimeDone) {
        this.startGame();
      }
    };

    this.load.on("progress", (value: number) => {
      barFill.width = barWidth * value;
      pct.setText(`${Math.round(value * 100)}%`);
    });

    this.load.on("complete", () => {
      assetsLoaded = true;
      tryStart();
    });

    this.load.audio("bgm", "assets/audio/bgm_1.mp3");

    // Remove when have real assets to load.
    this.tweens.add({
      targets: barFill,
      width: barWidth,
      duration: 3000,
      ease: "Sine.easeInOut",
      onUpdate: () => {
        const value = barFill.width / barWidth;
        pct.setText(`${Math.round(value * 100)}%`);
      },
    });

    this.time.delayedCall(3000, () => {
      minTimeDone = true;
      tryStart();
    });
  }

  create() {
    this.addFooter();
  }

  startGame() {
    this.scene.start("Menu");
  }
}
