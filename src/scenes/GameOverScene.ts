import { t } from "../i18n";
import { submitScore } from "../services/leaderboard";
import Settings from "../settings";
import { BaseScene } from "./BaseScene";

export default class GameOverScene extends BaseScene {
  private keyboardActive = true;
  private playerName = "";

  constructor() {
    super("GameOver");
  }

  create() {
    const { width, height } = this.scale;
    const centerX = width / 2;
    const centerY = height / 2;
    this.keyboardActive = true;
    this.playerName = "";

    // ── Score & duration from GameScene ─────────────────────────────────────
    const { score = 0, duration = 0 } = this.scene.settings.data as {
      score?: number;
      duration?: number;
    };

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

    // ── Row layout ───────────────────────────────────────────────────────────
    const ROW1_Y = centerY + 118;
    const ROW2_Y = centerY + 168;
    const ROW3_Y = centerY + 214;
    const HINT_Y = centerY + 255;

    // ── Nav state (rebuilt after submit) ────────────────────────────────────
    let navItems: Phaser.GameObjects.Text[] = [];
    let selectedIndex = 0;

    const highlightNav = () => {
      navItems.forEach((item, i) =>
        item.setColor(i === selectedIndex ? "#ffffff" : "#aaaaaa"),
      );
    };

    // Generic button builder — highlight lookup is dynamic via navItems.indexOf,
    // so it stays correct even after row 1 is rebuilt post-submit.
    const buildButton = (
      x: number,
      y: number,
      label: string,
      onClick: () => void,
    ) => {
      const btn = this.add
        .text(x, y, label, {
          fontSize: "20px",
          color: "#aaaaaa",
          fontFamily: "Black Ops One",
        })
        .setOrigin(0.5)
        .setInteractive({ useHandCursor: true })
        .setDepth(1);

      btn.on("pointerover", () => {
        const idx = navItems.indexOf(btn);
        if (idx !== -1) selectedIndex = idx;
        highlightNav();
      });
      btn.on("pointerout", () => {
        highlightNav();
      });
      btn.on("pointerdown", () => btn.setColor("#f26500"));
      btn.on("pointerup", () => {
        btn.setColor("#ffffff");
        onClick();
      });

      return btn;
    };

    // ── Row 1: name box + submit ────────────────────────────────────────────
    const NAME_BOX_X = centerX - 75;
    const NAME_BOX_W = 165;
    const SUBMIT_X = centerX + 110;

    let nameBoxBg: Phaser.GameObjects.Rectangle | null = null;
    let nameText: Phaser.GameObjects.Text | null = null;
    let submitBtn: Phaser.GameObjects.Text | null = null;
    let viewLeaderboardBtn: Phaser.GameObjects.Text | null = null;
    let loadingText: Phaser.GameObjects.Text | null = null;

    const nameLabel = () =>
      this.playerName ? this.playerName : t("gameover.enterNamePlaceholder");

    const buildRow1Input = () => {
      nameBoxBg = this.add
        .rectangle(NAME_BOX_X, ROW1_Y, NAME_BOX_W, 38, 0x111111)
        .setStrokeStyle(1, 0x333333)
        .setDepth(0.5);

      nameText = buildButton(NAME_BOX_X, ROW1_Y, nameLabel(), () =>
        promptForName(),
      );
      nameText.setFontSize(15);
      nameText.setColor(this.playerName ? "#ffffff" : "#666666");

      submitBtn = buildButton(SUBMIT_X, ROW1_Y, t("gameover.submitScore"), () =>
        handleSubmit(),
      );

      navItems = [nameText, submitBtn, playAgainBtn, menuBtn];
      selectedIndex = 0;
      highlightNav();
    };

    const destroyRow1Input = () => {
      nameBoxBg?.destroy();
      nameText?.destroy();
      submitBtn?.destroy();
      nameBoxBg = null;
      nameText = null;
      submitBtn = null;
    };

    const buildViewLeaderboardButton = () => {
      viewLeaderboardBtn = buildButton(
        centerX,
        ROW1_Y,
        t("gameover.viewLeaderboard"),
        () => this.scene.start("Leaderboard"),
      );
      navItems = [viewLeaderboardBtn, playAgainBtn, menuBtn];
      selectedIndex = 0;
      highlightNav();
    };

    // ── Row 2 & 3: always-present buttons ───────────────────────────────────
    const playAgainBtn = buildButton(centerX, ROW2_Y, t("gameover.retry"), () =>
      this.scene.start("Game"),
    );
    const menuBtn = buildButton(centerX, ROW3_Y, t("gameover.menu"), () =>
      this.scene.start("Menu"),
    );

    buildRow1Input();

    // ── Name entry + submit logic ───────────────────────────────────────────
    const promptForName = () => {
      const input = window.prompt(
        t("gameover.enterNamePrompt"),
        this.playerName,
      );
      if (input !== null) {
        this.playerName = input.trim().slice(0, 20);
        if (nameText) {
          nameText.setText(nameLabel());
          nameText.setColor(this.playerName ? "#ffffff" : "#666666");
        }
      }
    };

    const setRowsVisible = (visible: boolean) => {
      [playAgainBtn, menuBtn].forEach((btn) => {
        btn.setVisible(visible);
        if (visible) btn.setInteractive({ useHandCursor: true });
        else btn.disableInteractive();
      });
    };

    const showLoading = () => {
      this.keyboardActive = false;
      destroyRow1Input();
      setRowsVisible(false);
      loadingText = this.add
        .text(centerX, ROW1_Y, t("gameover.submitting"), {
          fontSize: "16px",
          color: "#888888",
          fontFamily: "Black Ops One",
        })
        .setOrigin(0.5)
        .setDepth(1);

      this.tweens.add({
        targets: loadingText,
        alpha: { from: 0.4, to: 1 },
        duration: 600,
        yoyo: true,
        repeat: -1,
        ease: "Sine.easeInOut",
      });
    };

    const hideLoading = (success: boolean) => {
      loadingText?.destroy();
      loadingText = null;
      setRowsVisible(true);
      this.keyboardActive = true;

      if (success) {
        buildViewLeaderboardButton();
      } else {
        buildRow1Input();
      }
    };

    const handleSubmit = () => {
      if (!this.playerName.trim()) {
        promptForName();
        if (!this.playerName.trim()) return;
      }

      showLoading();

      submitScore({
        name: this.playerName.trim(),
        score,
        duration,
      })
        .then(() => {
          hideLoading(true);
        })
        .catch(() => {
          hideLoading(false);
          if (nameText) nameText.setColor("#ff6666");
        });
    };

    // ── Keyboard nav ──────────────────────────────────────────────────────────
    const onKeyDown = (e: KeyboardEvent) => {
      if (!this.keyboardActive) return;

      switch (e.key) {
        case "ArrowUp":
        case "w":
        case "W":
          selectedIndex =
            (selectedIndex - 1 + navItems.length) % navItems.length;
          highlightNav();
          break;

        case "ArrowDown":
        case "s":
        case "S":
          selectedIndex = (selectedIndex + 1) % navItems.length;
          highlightNav();
          break;

        case " ":
        case "Enter":
          navItems[selectedIndex]?.emit("pointerup");
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
      .text(centerX, HINT_Y, t("gameover.hint"), {
        fontSize: "12px",
        color: "#444444",
        fontFamily: "Black Ops One",
        letterSpacing: 2,
      })
      .setOrigin(0.5)
      .setDepth(1);

    this.applyContrast(Settings.load().contrast);
  }
}
