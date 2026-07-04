import Settings from "../settings";
import { BaseScene } from "./BaseScene";

export default class LeaderboardScene extends BaseScene {
  constructor() {
    super("Leaderboard");
  }

  create() {
    const { width, height } = this.scale;
    const centerX = width / 2;
    const centerY = height / 2;

    this.add.rectangle(centerX, centerY, width, height, 0x0a0a0f);

    // ── Title ─────────────────────────────────────────────────────────────────
    this.add
      .text(centerX, centerY - 120, "LEADERBOARD", {
        fontFamily: "Black Ops One",
        fontSize: "42px",
        color: "#ffffff",
        letterSpacing: 6,
      })
      .setOrigin(0.5);

    this.add.rectangle(centerX, centerY - 86, 320, 1, 0xffffff, 0.2);

    // ── WIP message ───────────────────────────────────────────────────────────
    const wip = this.add
      .text(centerX, centerY - 10, "🚧 Coming Soon 🚧", {
        fontFamily: "Black Ops One",
        fontSize: "22px",
        color: "#f26500",
      })
      .setOrigin(0.5);

    this.tweens.add({
      targets: wip,
      alpha: { from: 0.6, to: 1 },
      duration: 900,
      yoyo: true,
      repeat: -1,
      ease: "Sine.easeInOut",
    });

    this.add
      .text(
        centerX,
        centerY + 30,
        "Online leaderboards are still being built.\nCheck back in a future update!",
        {
          fontFamily: "Black Ops One",
          fontSize: "13px",
          color: "#888888",
          align: "center",
          lineSpacing: 8,
        },
      )
      .setOrigin(0.5);

    // ── Home button ───────────────────────────────────────────────────────────
    const homeBtn = this.add
      .text(centerX, centerY + 110, "← Back to Menu", {
        fontFamily: "Black Ops One",
        fontSize: "18px",
        color: "#aaaaaa",
      })
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true });

    homeBtn.on("pointerover", () => homeBtn.setColor("#ffffff"));
    homeBtn.on("pointerout", () => homeBtn.setColor("#aaaaaa"));
    homeBtn.on("pointerdown", () => homeBtn.setColor("#f26500"));
    homeBtn.on("pointerup", () => this.goHome());

    // Give it focus styling by default since it's the only interactive element
    homeBtn.setColor("#ffffff");

    // ── Keyboard nav ──────────────────────────────────────────────────────────
    const onKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case "Escape":
        case "Backspace":
        case " ":
        case "Enter":
          this.goHome();
          break;
      }
    };

    this.input.keyboard!.on("keydown", onKeyDown);

    this.events.once("shutdown", () => {
      this.input.keyboard!.off("keydown", onKeyDown);
    });

    this.addFooter();
    this.applyContrast(Settings.load().contrast);
  }

  private goHome() {
    this.scene.start("Menu");
  }
}
