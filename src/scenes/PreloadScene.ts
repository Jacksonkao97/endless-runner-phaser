import { audio, images, spritesheets } from "../assets";
import { BaseScene } from "./BaseScene";

const MIN_SPLASH_MS = 3000;

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

    // The bar shows the smaller of the real load progress and a timed
    // progress, so it fills smoothly over at least MIN_SPLASH_MS but never
    // runs ahead of the actual load.
    let loadProgress = 0;
    const timed = { progress: 0 };
    const renderProgress = () => {
      const value = Math.min(loadProgress, timed.progress);
      barFill.width = barWidth * value;
      pct.setText(`${Math.round(value * 100)}%`);
    };

    this.load.on("progress", (value: number) => {
      loadProgress = value;
      renderProgress();
    });

    this.load.on("complete", () => {
      loadProgress = 1;
      assetsLoaded = true;
      renderProgress();
      tryStart();
    });

    images.forEach(({ key, path }) => this.load.image(key, path));

    spritesheets.forEach(({ key, path, frameWidth, frameHeight }) =>
      this.load.spritesheet(key, path, { frameWidth, frameHeight }),
    );

    audio.forEach(({ key, path }) => this.load.audio(key, path));

    this.tweens.add({
      targets: timed,
      progress: 1,
      duration: MIN_SPLASH_MS,
      ease: "Sine.easeInOut",
      onUpdate: renderProgress,
      onComplete: () => {
        minTimeDone = true;
        tryStart();
      },
    });
  }

  create() {
    this.addFooter();
  }

  startGame() {
    this.scene.start("Menu");
  }
}
