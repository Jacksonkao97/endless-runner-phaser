import { Input } from "phaser";
import Settings from "../settings";
import { BaseScene } from "./BaseScene";

export default class CreditsScene extends BaseScene {
  private backKey!: Input.Keyboard.Key;
  private escKey!: Input.Keyboard.Key;

  constructor() {
    super("Credits");
  }

  create() {
    const { width, height } = this.scale;
    const centerX = width / 2;
    const centerY = height / 2;

    // ── Background ────────────────────────────────────────────────────────────
    this.add.rectangle(centerX, centerY, width, height, 0x0a0a0f);

    // ── Title ─────────────────────────────────────────────────────────────────
    this.add
      .text(centerX, centerY - 220, "CREDITS", {
        fontFamily: "Black Ops One",
        fontSize: "42px",
        color: "#ffffff",
        letterSpacing: 6,
      })
      .setOrigin(0.5);

    // Divider under title
    this.add
      .rectangle(centerX, centerY - 185, 320, 1, 0xffffff, 0.2)
      .setOrigin(0.5);

    // ── Credit sections ───────────────────────────────────────────────────────
    const sections: { label: string; lines: string[] }[] = [
      {
        label: "DEVELOPMENT",
        lines: ["Jackson Kao"],
      },
      {
        label: "MUSIC",
        lines: [
          "LunaLucid",
          "Creative Commons Collection 2015",
          "lunalucid.itch.io",
          "Licensed under CC BY 4.0",
        ],
      },
      {
        label: "ART & ASSETS",
        lines: ["GandalfHardcore", "2D Pixel Art Asset Pack", "itch.io"],
      },
      {
        label: "BUILT WITH",
        lines: ["Phaser 3  ·  TypeScript  ·  Vite"],
      },
    ];

    let offsetY = centerY - 135;

    for (const section of sections) {
      // Section label
      this.add
        .text(centerX, offsetY, section.label, {
          fontFamily: "Black Ops One",
          fontSize: "13px",
          color: "#888888",
          letterSpacing: 4,
        })
        .setOrigin(0.5);

      offsetY += 28;

      // Section content lines
      for (const line of section.lines) {
        this.add
          .text(centerX, offsetY, line, {
            fontFamily: "Black Ops One",
            fontSize: "18px",
            color: "#e8e8e8",
          })
          .setOrigin(0.5);

        offsetY += 26;
      }

      offsetY += 22; // gap between sections
    }

    // ── Back prompt ───────────────────────────────────────────────────────────
    const backPrompt = this.add
      .text(centerX, centerY + 230, "[ BACKSPACE / ESC ] BACK TO MENU", {
        fontFamily: "Black Ops One",
        fontSize: "13px",
        color: "#555555",
        letterSpacing: 3,
      })
      .setOrigin(0.5);

    // Subtle pulse on the back prompt
    this.tweens.add({
      targets: backPrompt,
      alpha: { from: 0.4, to: 1 },
      duration: 1200,
      yoyo: true,
      repeat: -1,
      ease: "Sine.easeInOut",
    });

    // Keyboard
    this.backKey = this.input.keyboard!.addKey(
      Input.Keyboard.KeyCodes.BACKSPACE,
    );
    this.escKey = this.input.keyboard!.addKey(Input.Keyboard.KeyCodes.ESC);
    this.input
      .keyboard!.addKey(Input.Keyboard.KeyCodes.SPACE)
      .once("down", () => this.goBack());
    this.input
      .keyboard!.addKey(Input.Keyboard.KeyCodes.ENTER)
      .once("down", () => this.goBack());

    this.backKey.once("down", () => this.goBack());
    this.escKey.once("down", () => this.goBack());

    // Click anywhere
    this.input.once("pointerup", () => this.goBack());

    this.addFooter();

    this.applyContrast(Settings.load().contrast);
  }

  private goBack(): void {
    this.scene.start("Menu");
  }
}
