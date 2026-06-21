import type { Sound } from "phaser";
import Settings from "../settings";
import { BaseScene } from "./BaseScene";

export default class MenuScene extends BaseScene {
  public bgm!: Sound.WebAudioSound;

  private buttons = [
    { label: "Play", scene: "Game" },
    { label: "Leaderboard", scene: "Leaderboard" },
    { label: "Settings", scene: "Settings" },
    { label: "Credits", scene: "Credits" },
    { label: "Exit", scene: null },
  ];

  private keyboardActive = true;

  constructor() {
    super("Menu");
  }

  create() {
    const settings = Settings.load();
    const existing = this.sound.get("bgm") as Sound.WebAudioSound;
    const bgm =
      existing ??
      (this.sound.add("bgm", {
        loop: true,
        volume: settings.bgmVolume,
      }) as Sound.WebAudioSound);

    if (!bgm.isPlaying) {
      bgm.play();
    }

    this.bgm = bgm;

    const { width, height } = this.scale;
    const centerX = width / 2;
    const centerY = height / 2;

    this.add
      .text(centerX, centerY - 100, "Endless Runner", {
        fontSize: "40px",
        color: "#DFE8A6",
        fontFamily: "Black Ops One",
      })
      .setOrigin(0.5);

    let selectedIndex = 0;
    const buttonRefs = this.buttons.map((btn, i) =>
      this.createButton(centerX, centerY - 20 + i * 40, btn.label, () => {
        if (btn.scene) {
          this.scene.start(btn.scene);
        } else {
          this.showConfirm(
            "Want to check out\nthe source code?",
            () =>
              window.open(
                "https://github.com/yourusername/endless-runner",
                "_blank",
              ),
            () => {}, // do nothing on No,
            () => {
              this.keyboardActive = false;
            },
            () => {
              this.keyboardActive = true;
            },
          );
        }
      }),
    );

    const highlight = (index: number) => {
      buttonRefs.forEach((btn, i) =>
        btn.setColor(i === index ? "#ffffff" : "#aaaaaa"),
      );
    };

    highlight(selectedIndex);

    this.input.keyboard!.on("keydown", (e: KeyboardEvent) => {
      if (!this.keyboardActive) return;

      switch (e.key) {
        case "ArrowUp":
        case "w":
        case "W":
          selectedIndex =
            (selectedIndex - 1 + this.buttons.length) % this.buttons.length;
          highlight(selectedIndex);
          break;

        case "ArrowDown":
        case "s":
        case "S":
          selectedIndex = (selectedIndex + 1) % this.buttons.length;
          highlight(selectedIndex);
          break;

        case " ":
        case "Enter":
          buttonRefs[selectedIndex].emit("pointerup");
          break;
      }
    });

    this.addFooter();

    this.applyContrast(Settings.load().contrast);
  }

  private createButton(
    x: number,
    y: number,
    label: string,
    onClick: () => void,
  ) {
    const btn = this.add
      .text(x, y, label, {
        fontSize: "20px",
        color: "#aaaaaa",
        fontFamily: "Black Ops One",
      })
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true });

    btn.on("pointerover", () => btn.setColor("#ffffff"));
    btn.on("pointerout", () => btn.setColor("#aaaaaa"));
    btn.on("pointerdown", () => btn.setColor("#f26500"));
    btn.on("pointerup", () => {
      btn.setColor("#ffffff");
      onClick();
    });

    return btn;
  }
}
