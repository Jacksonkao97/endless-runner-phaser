import { GameObjects, Scene } from "phaser";
import Settings from "../settings";

const VERSION = "v1.0.0";
const DEV_NAME = "Jackson Kao";

export class BaseScene extends Scene {
  private contrastOverlay?: GameObjects.Rectangle;

  addFooter() {
    const { height } = this.scale;
    const bottomY = height - 24;

    this.add
      .text(10, bottomY - 16, "Developed by", {
        fontSize: "11px",
        color: "#aaaaaa",
        fontFamily: "Black Ops One",
      })
      .setOrigin(0, 0.5);

    this.add
      .text(10, bottomY, DEV_NAME, {
        fontSize: "14px",
        color: "#ffffff",
        fontFamily: "Black Ops One",
      })
      .setOrigin(0, 0.5);

    this.add.rectangle(115, bottomY - 8, 1, 32, 0xaaaaaa);

    this.add
      .text(130, bottomY - 16, "Version", {
        fontSize: "11px",
        color: "#aaaaaa",
        fontFamily: "Black Ops One",
      })
      .setOrigin(0, 0.5);

    this.add
      .text(130, bottomY, VERSION, {
        fontSize: "14px",
        color: "#ffffff",
        fontFamily: "Black Ops One",
      })
      .setOrigin(0, 0.5);
  }

  showConfirm(
    message: string,
    onYes: () => void,
    onNo: () => void,
    onOpen?: () => void,
    onClose?: () => void,
  ) {
    const { width, height } = this.scale;
    const centerX = width / 2;
    const centerY = height / 2;

    // dim overlay
    const overlay = this.add
      .rectangle(centerX, centerY, width, height, 0x000000, 0.7)
      .setInteractive(); // blocks clicks behind it

    // dialog box
    const box = this.add.rectangle(centerX, centerY, 380, 160, 0x111111);
    box.setStrokeStyle(1, 0x333333);

    // message
    const text = this.add
      .text(centerX, centerY - 30, message, {
        fontSize: "16px",
        color: "#ffffff",
        fontFamily: "Black Ops One",
        align: "center",
        wordWrap: { width: 400 },
      })
      .setOrigin(0.5);

    // yes button
    const yes = this.add
      .text(centerX - 60, centerY + 40, "Yes", {
        fontSize: "16px",
        color: "#f26500",
        fontFamily: "Black Ops One",
      })
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true });

    // no button
    const no = this.add
      .text(centerX + 60, centerY + 40, "No", {
        fontSize: "16px",
        color: "#f26500",
        fontFamily: "Black Ops One",
      })
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true });

    let selectedIndex = 0;
    const options = [yes, no];

    const highlight = (index: number) => {
      yes.setColor(index === 0 ? "#f26500" : "#aaaaaa");
      no.setColor(index === 1 ? "#f26500" : "#aaaaaa");
    };

    highlight(selectedIndex);

    onOpen?.();

    const destroy = () => {
      overlay.destroy();
      box.destroy();
      text.destroy();
      yes.destroy();
      no.destroy();
      this.input.keyboard!.off("keydown", onKeyDown);
      onClose?.();
    };

    const onKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case "ArrowLeft":
        case "ArrowRight":
        case "a":
        case "A":
        case "d":
        case "D":
          selectedIndex = selectedIndex === 0 ? 1 : 0;
          highlight(selectedIndex);
          break;

        case " ":
        case "Enter":
          options[selectedIndex].emit("pointerup");
          break;

        case "Escape":
          destroy();
          onNo();
          break;
      }
    };

    this.input.keyboard!.on("keydown", onKeyDown);

    yes.on("pointerover", () => {
      selectedIndex = 0;
      highlight(0);
    });
    no.on("pointerover", () => {
      selectedIndex = 1;
      highlight(1);
    });
    yes.on("pointerup", () => {
      destroy();
      onYes();
    });
    no.on("pointerup", () => {
      destroy();
      onNo();
    });
  }

  playSfx(key: string) {
    const settings = Settings.load();
    this.sound.play(key, { volume: settings.sfxVolume });
  }

  applyContrast(value: number) {
    const alpha = (1 - value) * 0.5;

    if (this.contrastOverlay && this.contrastOverlay.active) {
      this.contrastOverlay.setAlpha(alpha);
    } else {
      this.contrastOverlay = this.add
        .rectangle(
          this.scale.width / 2,
          this.scale.height / 2,
          this.scale.width,
          this.scale.height,
          0x000000,
        )
        .setDepth(999)
        .setAlpha(alpha);
    }
  }
}
