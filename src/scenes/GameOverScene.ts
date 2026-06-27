import { t } from "../i18n";
import Settings from "../settings";
import { BaseScene } from "./BaseScene";

export default class GameOverScene extends BaseScene {
  private keyboardActive = true;
  private selectedIndex = 0;

  constructor() {
    super("GameOver");
  }

  create() {
    const { width, height } = this.scale;
    const centerX = width / 2;
    const centerY = height / 2;
    this.keyboardActive = true;
    this.selectedIndex = 0;

    // ── Score from GameScene ──────────────────────────────────────────────────
    const { score = 0 } = this.scene.settings.data as { score?: number };

    // ── Best score (localStorage) ─────────────────────────────────────────────
    const bestKey = "endless_runner_best";
    const prev = parseInt(localStorage.getItem(bestKey) ?? "0", 10);
    const isNewBest = score > prev;
    if (isNewBest) localStorage.setItem(bestKey, String(score));
    const best = isNewBest ? score : prev;

    // ── Background dim ────────────────────────────────────────────────────────
    this.add
      .rectangle(centerX, centerY, width, height, 0x000000, 0.6)
      .setDepth(0);

    // ── GAME OVER title ───────────────────────────────────────────────────────
    this.add
      .text(centerX, centerY - 180, t("gameover.title"), {
        fontSize: "56px",
        color: "#ffffff",
        fontFamily: "Black Ops One",
      })
      .setOrigin(0.5)
      .setDepth(1);

    // ── Score block ───────────────────────────────────────────────────────────
    this.add
      .text(centerX, centerY - 90, t("gameover.score"), {
        fontSize: "14px",
        color: "#888888",
        fontFamily: "Black Ops One",
        letterSpacing: 3,
      })
      .setOrigin(0.5)
      .setDepth(1);

    this.add
      .text(centerX, centerY - 55, String(score), {
        fontSize: "52px",
        color: "#f26500",
        fontFamily: "Black Ops One",
      })
      .setOrigin(0.5)
      .setDepth(1);

    // ── New best badge ────────────────────────────────────────────────────────
    if (isNewBest) {
      const badge = this.add
        .text(centerX, centerY + 10, t("gameover.newBest"), {
          fontSize: "18px",
          color: "#DFE8A6",
          fontFamily: "Black Ops One",
        })
        .setOrigin(0.5)
        .setDepth(1)
        .setAlpha(0);

      this.tweens.add({
        targets: badge,
        alpha: 1,
        y: centerY,
        duration: 500,
        ease: "Back.easeOut",
        delay: 200,
      });

      this.time.delayedCall(750, () => {
        this.tweens.add({
          targets: badge,
          alpha: { from: 0.6, to: 1 },
          duration: 700,
          yoyo: true,
          repeat: -1,
          ease: "Sine.easeInOut",
        });
      });
    }

    // ── Best score line ───────────────────────────────────────────────────────
    this.add
      .text(centerX, centerY + 40, `${t("gameover.best")}  ${best}`, {
        fontSize: "14px",
        color: "#666666",
        fontFamily: "Black Ops One",
        letterSpacing: 2,
      })
      .setOrigin(0.5)
      .setDepth(1);

    // ── Divider ───────────────────────────────────────────────────────────────
    this.add.rectangle(centerX, centerY + 75, 260, 1, 0x333333).setDepth(1);

    // ── Buttons ───────────────────────────────────────────────────────────────
    const buttons = [
      { label: t("gameover.retry"), action: () => this.scene.start("Game") },
      { label: t("gameover.menu"), action: () => this.scene.start("Menu") },
    ];

    const btnRefs = buttons.map((btn, i) =>
      this.createButton(
        centerX,
        centerY + 115 + i * 46,
        btn.label,
        btn.action,
        i,
      ),
    );

    this.highlightButtons(btnRefs, this.selectedIndex);

    // ── Keyboard nav ──────────────────────────────────────────────────────────
    const onKeyDown = (e: KeyboardEvent) => {
      if (!this.keyboardActive) return;

      switch (e.key) {
        case "ArrowUp":
        case "w":
        case "W":
          this.selectedIndex =
            (this.selectedIndex - 1 + buttons.length) % buttons.length;
          this.highlightButtons(btnRefs, this.selectedIndex);
          break;

        case "ArrowDown":
        case "s":
        case "S":
          this.selectedIndex = (this.selectedIndex + 1) % buttons.length;
          this.highlightButtons(btnRefs, this.selectedIndex);
          break;

        case " ":
        case "Enter":
          btnRefs[this.selectedIndex].emit("pointerup");
          break;

        case "r":
        case "R":
          this.scene.start("Game");
          break;

        case "Escape":
          this.scene.start("Menu");
          break;
      }
    };

    this.input.keyboard!.on("keydown", onKeyDown);

    this.events.once("shutdown", () => {
      this.input.keyboard!.off("keydown", onKeyDown);
    });

    // ── Keyboard hint ─────────────────────────────────────────────────────────
    this.add
      .text(centerX, centerY + 220, t("gameover.hint"), {
        fontSize: "12px",
        color: "#444444",
        fontFamily: "Black Ops One",
        letterSpacing: 2,
      })
      .setOrigin(0.5)
      .setDepth(1);

    this.applyContrast(Settings.load().contrast);
  }

  // ─────────────────────────────────────────────────────────────────────────────

  private createButton(
    x: number,
    y: number,
    label: string,
    onClick: () => void,
    index: number,
  ) {
    const btn = this.add
      .text(x, y, label, {
        fontSize: "22px",
        color: "#aaaaaa",
        fontFamily: "Black Ops One",
      })
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true })
      .setDepth(1);

    btn.on("pointerover", () => {
      this.selectedIndex = index;
      btn.setColor("#ffffff");
    });
    btn.on("pointerout", () => btn.setColor("#aaaaaa"));
    btn.on("pointerdown", () => btn.setColor("#f26500"));
    btn.on("pointerup", () => {
      btn.setColor("#ffffff");
      onClick();
    });

    return btn;
  }

  private highlightButtons(
    btns: Phaser.GameObjects.Text[],
    activeIndex: number,
  ) {
    btns.forEach((b, i) =>
      b.setColor(i === activeIndex ? "#ffffff" : "#aaaaaa"),
    );
  }
}
