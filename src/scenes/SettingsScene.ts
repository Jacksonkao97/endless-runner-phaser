import { GameObjects, Math, Sound } from "phaser";
import { t } from "../i18n";
import Settings, { type GameSettings } from "../settings";
import { BaseScene } from "./BaseScene";

type SettingRow = {
  type: "slider" | "dropdown";
  label: string;
  onChange: (direction: number) => void; // -1 or +1
  onSelect?: () => void; // for dropdown open/close
};

export default class SettingsScene extends BaseScene {
  private current!: GameSettings;
  private rows: SettingRow[] = [];
  private selectedRow = 0;
  private keyboardActive = true;

  constructor() {
    super("Settings");
  }

  create() {
    const { width, height } = this.scale;
    const centerX = width / 2;
    const centerY = height / 2;
    this.rows = [];
    this.selectedRow = 0;
    this.keyboardActive = true;

    this.current = Settings.load();

    this.add
      .text(centerX, centerY - 160, t("settings.title"), {
        fontSize: "36px",
        color: "#ffffff",
        fontFamily: "Black Ops One",
      })
      .setOrigin(0.5);

    // build rows — each returns a highlight function
    const highlighters: ((active: boolean) => void)[] = [];

    const bgm = this.addSlider(
      centerX,
      centerY - 80,
      t("settings.bgmVolume"),
      this.current.bgmVolume,
      (val) => {
        this.current.bgmVolume = val;
        this.saveAndApply();
      },
    );
    highlighters.push(bgm.highlight);
    this.rows.push({
      type: "slider",
      label: t("settings.bgmVolume"),
      onChange: (dir) => bgm.nudge(dir),
    });

    const sfx = this.addSlider(
      centerX,
      centerY - 20,
      t("settings.sfxVolume"),
      this.current.sfxVolume,
      (val) => {
        this.current.sfxVolume = val;
        this.saveAndApply();
      },
    );
    highlighters.push(sfx.highlight);
    this.rows.push({
      type: "slider",
      label: t("settings.sfxVolume"),
      onChange: (dir) => sfx.nudge(dir),
    });

    const contrast = this.addSlider(
      centerX,
      centerY + 40,
      t("settings.contrast"),
      this.current.contrast,
      (val) => {
        this.current.contrast = val;
        this.saveAndApply();
      },
    );
    highlighters.push(contrast.highlight);
    this.rows.push({
      type: "slider",
      label: t("settings.contrast"),
      onChange: (dir) => contrast.nudge(dir),
    });

    const lang = this.addLanguageRow(
      centerX,
      centerY + 100,
      () => {
        this.keyboardActive = false;
      },
      () => {
        this.keyboardActive = true;
      },
    );
    highlighters.push(lang.highlight);
    this.rows.push({
      type: "dropdown",
      label: t("settings.language"),
      onChange: (dir) => lang.nudge(dir),
      onSelect: () => lang.toggle(),
    });

    // back row
    const back = this.add
      .text(centerX, centerY + 180, "← Back", {
        fontSize: "16px",
        color: "#aaaaaa",
        fontFamily: "Black Ops One",
      })
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true });

    back.on("pointerover", () => back.setColor("#ffffff"));
    back.on("pointerout", () =>
      back.setColor(
        this.selectedRow === this.rows.length ? "#ffffff" : "#aaaaaa",
      ),
    );
    back.on("pointerup", () => this.scene.start("Menu"));

    highlighters.push((active) =>
      back.setColor(active ? "#ffffff" : "#aaaaaa"),
    );
    this.rows.push({
      type: "slider",
      label: t("settings.back"),
      onChange: () => {},
    });

    // initial highlight
    const highlightAll = (index: number) => {
      highlighters.forEach((h, i) => h(i === index));
    };
    highlightAll(this.selectedRow);

    // keyboard nav
    const onKeyDown = (e: KeyboardEvent) => {
      if (!this.keyboardActive) return;

      switch (e.key) {
        case "ArrowUp":
        case "w":
        case "W":
          this.selectedRow =
            (this.selectedRow - 1 + this.rows.length) % this.rows.length;
          highlightAll(this.selectedRow);
          break;

        case "ArrowDown":
        case "s":
        case "S":
          this.selectedRow = (this.selectedRow + 1) % this.rows.length;
          highlightAll(this.selectedRow);
          break;

        case "ArrowLeft":
        case "a":
        case "A":
          this.rows[this.selectedRow].onChange(-1);
          break;

        case "ArrowRight":
        case "d":
        case "D":
          this.rows[this.selectedRow].onChange(1);
          break;

        case " ":
        case "Enter":
          if (this.selectedRow === this.rows.length - 1) {
            this.scene.start("Menu");
          } else {
            this.rows[this.selectedRow].onSelect?.();
          }
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

    this.addFooter();

    this.applyContrast(Settings.load().contrast);
  }

  private addSlider(
    x: number,
    y: number,
    label: string,
    initialValue: number,
    onChange: (val: number) => void,
  ) {
    const trackWidth = 200;
    const trackX = x - trackWidth / 2;
    const STEP = 0.05;

    const labelText = this.add
      .text(trackX, y, label, {
        fontSize: "13px",
        color: "#aaaaaa",
        fontFamily: "Black Ops One",
      })
      .setOrigin(0, 0.5);

    const valueText = this.add
      .text(x + trackWidth / 2, y, `${Math.RoundTo(initialValue * 100)}%`, {
        fontSize: "13px",
        color: "#ffffff",
        fontFamily: "Black Ops One",
      })
      .setOrigin(1, 0.5);

    this.add.rectangle(x, y + 20, trackWidth, 4, 0x333333).setOrigin(0.5);

    const fill = this.add
      .rectangle(trackX, y + 20, trackWidth * initialValue, 4, 0xf26500)
      .setOrigin(0, 0.5);

    const handle = this.add
      .circle(trackX + trackWidth * initialValue, y + 20, 8, 0xffffff)
      .setInteractive({ useHandCursor: true });

    this.input.setDraggable(handle);

    let currentValue = initialValue;

    const applyValue = (val: number) => {
      currentValue = Math.Clamp(val, 0, 1);
      handle.setPosition(trackX + trackWidth * currentValue, y + 20);
      fill.width = trackWidth * currentValue;
      valueText.setText(`${Math.RoundTo(currentValue * 100)}%`);
      onChange(currentValue);
    };

    handle.on("drag", (_: unknown, dragX: number) => {
      const clamped = Math.Clamp(dragX, trackX, trackX + trackWidth);
      applyValue((clamped - trackX) / trackWidth);
    });

    return {
      nudge: (dir: number) => applyValue(currentValue + dir * STEP),
      highlight: (active: boolean) =>
        labelText.setColor(active ? "#ffffff" : "#aaaaaa"),
    };
  }

  private addLanguageRow(
    x: number,
    y: number,
    onOpen: () => void,
    onClose: () => void,
  ) {
    const trackWidth = 200;
    const langs: { label: string; value: "en" | "zh" }[] = [
      { label: "English", value: "en" },
      { label: "中文", value: "zh" },
    ];

    const labelText = this.add
      .text(x - trackWidth / 2, y, t("settings.language"), {
        fontSize: "13px",
        color: "#aaaaaa",
        fontFamily: "Black Ops One",
      })
      .setOrigin(0, 0.5);

    let currentIndex = langs.findIndex(
      (l) => l.value === this.current.language,
    );
    let isOpen = false;

    const selected = this.add
      .text(x + trackWidth / 2, y, `${langs[currentIndex].label} ▾`, {
        fontSize: "14px",
        color: "#ffffff",
        fontFamily: "Black Ops One",
      })
      .setOrigin(1, 0.5)
      .setInteractive({ useHandCursor: true });

    const dropBg = this.add
      .rectangle(
        x + trackWidth / 2 - 55,
        y + 15,
        110,
        langs.length * 30,
        0x222222,
      )
      .setOrigin(0.5, 0)
      .setVisible(false)
      .setInteractive();

    const options = langs.map((lang, i) => {
      const opt = this.add
        .text(x + trackWidth / 2 - 15, y + 25 + i * 30, lang.label, {
          fontSize: "13px",
          color: this.current.language === lang.value ? "#f26500" : "#aaaaaa",
          fontFamily: "Black Ops One",
        })
        .setOrigin(1, 0.5)
        .setInteractive({ useHandCursor: true })
        .setVisible(false);

      opt.on("pointerover", () => {
        if (this.current.language !== lang.value) opt.setColor("#ffffff");
      });
      opt.on("pointerout", () => {
        if (this.current.language !== lang.value) opt.setColor("#aaaaaa");
      });
      opt.on("pointerup", () => {
        this.current.language = lang.value;
        this.saveAndApply();
        this.scene.restart();
      });

      return opt;
    });

    const openDropdown = () => {
      isOpen = true;
      dropBg.setVisible(true);
      this.children.bringToTop(dropBg);
      options.forEach((o) => {
        o.setVisible(true);
        this.children.bringToTop(o);
      });
      selected.setText(`${langs[currentIndex].label} ▴`);
      onOpen();
    };

    const closeDropdown = () => {
      isOpen = false;
      dropBg.setVisible(false);
      options.forEach((o) => o.setVisible(false));
      selected.setText(`${langs[currentIndex].label} ▾`);
      onClose();
    };

    selected.on("pointerup", () => (isOpen ? closeDropdown() : openDropdown()));

    this.input.on(
      "pointerdown",
      (_: unknown, targets: GameObjects.GameObject[]) => {
        if (
          isOpen &&
          !targets.includes(selected) &&
          !targets.includes(dropBg) &&
          !options.some((o) => targets.includes(o))
        ) {
          closeDropdown();
        }
      },
    );

    return {
      toggle: () => (isOpen ? closeDropdown() : openDropdown()),
      nudge: (dir: number) => {
        // cycle through languages with A/D
        currentIndex = (currentIndex + dir + langs.length) % langs.length;
        this.current.language = langs[currentIndex].value;
        this.saveAndApply();
        selected.setText(`${langs[currentIndex].label} ▾`);
      },
      highlight: (active: boolean) =>
        labelText.setColor(active ? "#ffffff" : "#aaaaaa"),
    };
  }

  private saveAndApply() {
    Settings.save(this.current);

    const music = this.sound.get("bgm");
    if (music) {
      (music as Sound.WebAudioSound).setVolume(this.current.bgmVolume);
    }

    this.scene.manager.scenes
      .filter((scene) => this.scene.isActive(scene.scene.key))
      .forEach((scene) =>
        (scene as BaseScene).applyContrast?.(this.current.contrast),
      );
  }
}
