import { BaseScene } from "./BaseScene";

export default class BootScene extends BaseScene {
  constructor() {
    super("Boot");
  }

  create() {
    this.scene.start("Preload");
  }
}
