import { t } from "../i18n";
import {
  fetchTopScores,
  type LeaderboardRecord,
} from "../services/leaderboard";
import Settings from "../settings";
import { BaseScene } from "./BaseScene";

const ROW_START_Y_OFFSET = -60; // relative to centerY, first row position
const ROW_HEIGHT = 34;
const MAX_ROWS = 10;

export default class LeaderboardScene extends BaseScene {
  private keyboardActive = true;

  constructor() {
    super("Leaderboard");
  }

  create() {
    const { width, height } = this.scale;
    const centerX = width / 2;
    const centerY = height / 2;
    this.keyboardActive = true;

    this.add.rectangle(centerX, centerY, width, height, 0x0a0a0f);

    // ── Title ─────────────────────────────────────────────────────────────────
    this.add
      .text(centerX, centerY - 220, t("leaderboard.title"), {
        fontFamily: "Black Ops One",
        fontSize: "42px",
        color: "#ffffff",
        letterSpacing: 6,
      })
      .setOrigin(0.5);

    this.add.rectangle(centerX, centerY - 186, 320, 1, 0xffffff, 0.2);

    // ── Loading state ─────────────────────────────────────────────────────────
    const loadingText = this.add
      .text(centerX, centerY, t("leaderboard.loading"), {
        fontFamily: "Black Ops One",
        fontSize: "16px",
        color: "#888888",
      })
      .setOrigin(0.5);

    this.tweens.add({
      targets: loadingText,
      alpha: { from: 0.4, to: 1 },
      duration: 800,
      yoyo: true,
      repeat: -1,
      ease: "Sine.easeInOut",
    });

    // ── Home button ───────────────────────────────────────────────────────────
    const homeBtn = this.add
      .text(centerX, height - 60, t("leaderboard.back"), {
        fontFamily: "Black Ops One",
        fontSize: "18px",
        color: "#ffffff",
      })
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true });

    homeBtn.on("pointerover", () => homeBtn.setColor("#ffffff"));
    homeBtn.on("pointerout", () => homeBtn.setColor("#ffffff"));
    homeBtn.on("pointerdown", () => homeBtn.setColor("#f26500"));
    homeBtn.on("pointerup", () => this.goHome());

    // ── Keyboard nav (always available: Esc/Backspace/Enter go home) ─────────
    const onKeyDown = (e: KeyboardEvent) => {
      if (!this.keyboardActive) return;

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

    // ── Fetch scores ──────────────────────────────────────────────────────────
    fetchTopScores(MAX_ROWS)
      .then((records) => {
        if (!this.scene.isActive()) return; // scene left before fetch resolved
        loadingText.destroy();
        this.renderScores(records, centerX, centerY);
      })
      .catch((err) => {
        console.error("[leaderboard] fetch failed:", err);
        if (!this.scene.isActive()) return;
        loadingText.setText(t("leaderboard.loadError"));
        loadingText.setColor("#ff6666");
      });
  }

  private renderScores(
    records: LeaderboardRecord[],
    centerX: number,
    centerY: number,
  ) {
    if (records.length === 0) {
      this.add
        .text(centerX, centerY, t("leaderboard.empty"), {
          fontFamily: "Black Ops One",
          fontSize: "16px",
          color: "#888888",
        })
        .setOrigin(0.5);
      return;
    }

    // ── Column headers ─────────────────────────────────────────────────────
    const headerY = centerY + ROW_START_Y_OFFSET - 28;
    const colRank = centerX - 260;
    const colName = centerX - 200;
    const colScore = centerX + 120;
    const colDuration = centerX + 240;

    const headerStyle = {
      fontFamily: "Black Ops One",
      fontSize: "11px",
      color: "#666666",
      letterSpacing: 2,
    };

    this.add.text(colRank, headerY, "#", headerStyle).setOrigin(0, 0.5);
    this.add
      .text(colName, headerY, t("leaderboard.colName"), headerStyle)
      .setOrigin(0, 0.5);
    this.add
      .text(colScore, headerY, t("leaderboard.colScore"), headerStyle)
      .setOrigin(1, 0.5);
    this.add
      .text(colDuration, headerY, t("leaderboard.colDuration"), headerStyle)
      .setOrigin(1, 0.5);

    this.add.rectangle(centerX, headerY + 16, 560, 1, 0x333333);

    // ── Rows ──────────────────────────────────────────────────────────────
    records.forEach((record, i) => {
      const y = centerY + ROW_START_Y_OFFSET + i * ROW_HEIGHT;
      const isTop3 = i < 3;
      const rankColor = isTop3 ? "#f26500" : "#aaaaaa";
      const textColor = isTop3 ? "#ffffff" : "#cccccc";

      if (i % 2 === 0) {
        this.add.rectangle(centerX, y, 560, ROW_HEIGHT - 4, 0xffffff, 0.03);
      }

      this.add
        .text(colRank, y, String(i + 1), {
          fontFamily: "Black Ops One",
          fontSize: "16px",
          color: rankColor,
        })
        .setOrigin(0, 0.5);

      this.add
        .text(colName, y, this.truncateName(record.name), {
          fontFamily: "Black Ops One",
          fontSize: "16px",
          color: textColor,
        })
        .setOrigin(0, 0.5);

      this.add
        .text(colScore, y, String(record.score), {
          fontFamily: "Black Ops One",
          fontSize: "16px",
          color: textColor,
        })
        .setOrigin(1, 0.5);

      this.add
        .text(colDuration, y, this.formatDuration(record.duration), {
          fontFamily: "Black Ops One",
          fontSize: "14px",
          color: "#888888",
        })
        .setOrigin(1, 0.5);
    });
  }

  private truncateName(name: string): string {
    if (!name) return "???";
    return name.length > 16 ? `${name.slice(0, 16)}…` : name;
  }

  private formatDuration(seconds: number): string {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${String(s).padStart(2, "0")}`;
  }

  private goHome() {
    this.scene.start("Menu");
  }
}
