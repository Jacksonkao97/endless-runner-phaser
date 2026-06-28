import { GameObjects, Math, Time, Tweens } from "phaser";
import Settings from "../settings";
import { BaseScene } from "./BaseScene";

const SCROLL_SPEED = 28; // px/s for auto-scroll
const MANUAL_STEP = 40; // px per arrow key press
const SCROLL_WHEEL_STEP = 60; // px per mouse wheel tick

export default class CreditsScene extends BaseScene {
  private container!: GameObjects.Container;
  private contentHeight = 0; // total height of scrollable content
  private minY = 0; // container.y upper bound (scrolled to bottom)
  private autoScrollTween?: Tweens.Tween;
  private resumeTimer?: Time.TimerEvent;

  constructor() {
    super("Credits");
  }

  create() {
    const { width, height } = this.scale;
    const centerX = width / 2;

    this.add.rectangle(centerX, height / 2, width, height, 0x0a0a0f);

    // Rendered at high depth so it sits above the container.
    const TITLE_H = 80;
    this.add
      .rectangle(centerX, TITLE_H / 2, width, TITLE_H, 0x0a0a0f)
      .setDepth(10);

    this.add
      .text(centerX, 38, "CREDITS", {
        fontFamily: "Black Ops One",
        fontSize: "42px",
        color: "#ffffff",
        letterSpacing: 6,
      })
      .setOrigin(0.5)
      .setDepth(11);

    this.add.rectangle(centerX, 72, 320, 1, 0xffffff, 0.2).setDepth(11);

    const FOOTER_H = 48;
    this.add
      .rectangle(centerX, height - FOOTER_H / 2, width, FOOTER_H, 0x0a0a0f)
      .setDepth(10);

    const backPrompt = this.add
      .text(
        centerX,
        height - 20,
        "[ ESC / BACKSPACE ] BACK  ·  [ ↑↓ ] SCROLL",
        {
          fontFamily: "Black Ops One",
          fontSize: "12px",
          color: "#555555",
          letterSpacing: 2,
        },
      )
      .setOrigin(0.5)
      .setDepth(11);

    this.tweens.add({
      targets: backPrompt,
      alpha: { from: 0.4, to: 1 },
      duration: 1200,
      yoyo: true,
      repeat: -1,
      ease: "Sine.easeInOut",
    });

    // All credit content lives inside this container. Scrolling = moving container.y.
    this.container = this.add.container(0, 0).setDepth(5);

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
        lines: [
          "GandalfHardcore",
          "2D Pixel Art Asset Pack",
          "itch.io",
          "",
          "Zerie",
          "16-bit Character & Monster Pack",
          "itch.io",
        ],
      },
      {
        label: "BUILT WITH",
        lines: ["Phaser 3  ·  TypeScript  ·  Vite"],
      },
    ];

    const CONTENT_START_Y = TITLE_H + 30; // start below the fixed title
    let offsetY = CONTENT_START_Y;

    for (const section of sections) {
      const label = this.make
        .text({
          x: centerX,
          y: offsetY,
          text: section.label,
          style: {
            fontFamily: "Black Ops One",
            fontSize: "13px",
            color: "#888888",
            letterSpacing: 4,
          },
          add: false,
        })
        .setOrigin(0.5);
      this.container.add(label);
      offsetY += 30;

      for (const line of section.lines) {
        if (line === "") {
          // empty string = spacer between creators in the same section
          offsetY += 16;
          continue;
        }
        const txt = this.make
          .text({
            x: centerX,
            y: offsetY,
            text: line,
            style: {
              fontFamily: "Black Ops One",
              fontSize: "18px",
              color: "#e8e8e8",
            },
            add: false,
          })
          .setOrigin(0.5);
        this.container.add(txt);
        offsetY += 28;
      }

      offsetY += 28; // gap between sections
    }

    // Bottom padding so last item isn't flush against the footer
    offsetY += 40;
    this.contentHeight = offsetY;

    // container.y = 0        → top of content visible (start position)
    // container.y = minY     → bottom of content visible
    const scrollableArea = height - TITLE_H - FOOTER_H;
    this.minY = window.Math.min(0, scrollableArea - this.contentHeight);

    // Duration = distance / speed (ms)
    const scrollDistance = -this.minY; // how far we need to travel
    const duration = (scrollDistance / SCROLL_SPEED) * 1000;

    this.autoScrollTween = this.tweens.add({
      targets: this.container,
      y: this.minY,
      duration,
      ease: "Linear",
    });

    const onKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case "Escape":
        case "Backspace":
          this.goBack();
          break;

        case "ArrowUp":
        case "w":
        case "W":
          this.manualScroll(-MANUAL_STEP);
          break;

        case "ArrowDown":
        case "s":
        case "S":
          this.manualScroll(MANUAL_STEP);
          break;
      }
    };

    this.input.keyboard!.on("keydown", onKeyDown);

    // Mouse wheel scroll
    this.input.on(
      "wheel",
      (_ptr: unknown, _objs: unknown, _dx: unknown, dy: number) => {
        this.manualScroll(dy > 0 ? SCROLL_WHEEL_STEP : -SCROLL_WHEEL_STEP);
      },
    );

    this.events.once("shutdown", () => {
      this.input.keyboard!.off("keydown", onKeyDown);
      this.input.off("wheel");
      this.resumeTimer?.remove();
      this.autoScrollTween?.stop();
    });

    this.addFooter();
    this.applyContrast(Settings.load().contrast);
  }

  private manualScroll(delta: number) {
    this.autoScrollTween?.pause();

    const next = Math.Clamp(this.container.y - delta, this.minY, 0);
    this.container.y = next;

    // Reset resume timer on every interaction
    this.resumeTimer?.remove();
    this.resumeTimer = this.time.delayedCall(2000, () => {
      const remaining = window.Math.abs(this.container.y - this.minY);
      if (remaining < 1) return; // already at bottom, nothing to scroll

      const duration = (remaining / SCROLL_SPEED) * 1000;
      this.autoScrollTween = this.tweens.add({
        targets: this.container,
        y: this.minY,
        duration,
        ease: "Linear",
      });
    });
  }

  private goBack(): void {
    this.scene.start("Menu");
  }
}
