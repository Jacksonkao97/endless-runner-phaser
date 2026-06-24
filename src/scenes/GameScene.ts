import { GameObjects, Math, Physics, type Types } from "phaser";
import Settings from "../settings";
import { BaseScene } from "./BaseScene";

const GROUND_Y_OFFSET = 80; // px above bottom edge where ground surface sits
const PLAYER_X_OFFSET = 120; // px from left edge where player stands
const GRAVITY = 1800; // px/s²
const JUMP_VELOCITY = -620; // px/s  (negative = upward)
const SCROLL_SPEED_INITIAL = 380; // px/s
const SCROLL_SPEED_MAX = 900; // px/s  (speed cap)
const SCROLL_ACCELERATION = 8; // px/s added per second
const OBSTACLE_INTERVAL_MIN = 900; // ms between spawns (min)
const OBSTACLE_INTERVAL_MAX = 2200; // ms between spawns (max)
const OBSTACLE_W = 32;
const OBSTACLE_H_SHORT = 48;
const OBSTACLE_H_TALL = 80;
const PLAYER_W = 32;
const PLAYER_H = 52;
const GROUND_H = 16;

export default class GameScene extends BaseScene {
  private player!: Types.Physics.Arcade.SpriteWithDynamicBody;
  private ground!: Physics.Arcade.StaticGroup;
  private obstacles!: Physics.Arcade.Group;

  private scrollSpeed = SCROLL_SPEED_INITIAL;
  private score = 0;
  private isGameOver = false;
  private isOnGround = false;
  private groundY = 0;

  private scoreText!: GameObjects.Text;
  private obstacleTimer!: Phaser.Time.TimerEvent;

  constructor() {
    super("Game");
  }

  create() {
    const { width, height } = this.scale;
    this.isGameOver = false;
    this.isOnGround = false;
    this.score = 0;
    this.scrollSpeed = SCROLL_SPEED_INITIAL;
    this.groundY = height - GROUND_Y_OFFSET;

    this.buildGround(width, height);
    this.buildPlayer(height);
    this.buildObstacleGroup();
    this.buildScore(width);
    this.scheduleObstacle();
    this.setupInput();

    this.addFooter();
    this.applyContrast(Settings.load().contrast);
  }

  update(_time: number, delta: number) {
    if (this.isGameOver) return;

    // Accelerate world scroll over time
    this.scrollSpeed = window.Math.min(
      this.scrollSpeed + SCROLL_ACCELERATION * (delta / 1000),
      SCROLL_SPEED_MAX,
    );

    // Scroll obstacles
    this.obstacles.getChildren().forEach((obj) => {
      const obs = obj as Physics.Arcade.Image;
      obs.x -= this.scrollSpeed * (delta / 1000);
      // Recycle when fully off-screen left
      if (obs.x < -obs.width) obs.destroy();
    });

    // Track ground contact
    this.isOnGround =
      (this.player.body.blocked.down || this.player.body.touching.down) &&
      this.player.body.velocity.y >= 0;

    // Score: 1 point per 10 px scrolled
    this.score += (this.scrollSpeed * (delta / 1000)) / 10;
    this.scoreText.setText(`${Math.FloorTo(this.score)}`);
  }

  private buildGround(width: number, height: number) {
    // Visual ground strip
    this.add
      .rectangle(
        width / 2,
        this.groundY + GROUND_H / 2,
        width,
        GROUND_H,
        0xf26500,
      )
      .setDepth(1);

    // Generate a minimal 1×1 texture — needed because Phaser 4
    // staticGroup.create() requires a valid texture key
    if (!this.textures.exists("ground_px")) {
      const gfx = this.make.graphics({ x: 0, y: 0 });
      gfx.setVisible(false);
      gfx.fillStyle(0xffffff);
      gfx.fillRect(0, 0, 1, 1);
      gfx.generateTexture("ground_px", 1, 1);
      gfx.destroy();
    }

    // Use staticGroup + explicit texture key (Phaser 4 compatible)
    this.ground = this.physics.add.staticGroup();
    const groundImg = this.ground.create(
      width / 2,
      this.groundY + GROUND_H / 2,
      "ground_px",
    ) as Physics.Arcade.Image;
    groundImg.setVisible(false);
    groundImg.setDisplaySize(width * 3, GROUND_H);
    groundImg.refreshBody();
  }

  private buildPlayer(height: number) {
    // Placeholder: a white rectangle standing on the ground
    const playerY = this.groundY - PLAYER_H / 2;

    // Generate placeholder texture once; guarded for scene restarts
    if (!this.textures.exists("player_placeholder")) {
      const gfx = this.make.graphics({ x: 0, y: 0 });
      gfx.setVisible(false);
      gfx.fillStyle(0xdfe8a6);
      gfx.fillRect(0, 0, PLAYER_W, PLAYER_H);
      gfx.generateTexture("player_placeholder", PLAYER_W, PLAYER_H);
      gfx.destroy();
    }

    this.player = this.physics.add.sprite(
      PLAYER_X_OFFSET,
      playerY,
      "player_placeholder",
    );
    this.player.setGravityY(GRAVITY);
    this.player.setCollideWorldBounds(true);
    this.player.setDepth(2);

    // Player ↔ ground collision
    this.physics.add.collider(this.player, this.ground);
  }

  private buildObstacleGroup() {
    // Obstacle textures (short + tall) — guarded so they survive scene restart
    if (!this.textures.exists("obs_short")) {
      const shortGfx = this.make.graphics({ x: 0, y: 0 });
      shortGfx.setVisible(false);
      shortGfx.fillStyle(0xff4444);
      shortGfx.fillRect(0, 0, OBSTACLE_W, OBSTACLE_H_SHORT);
      shortGfx.generateTexture("obs_short", OBSTACLE_W, OBSTACLE_H_SHORT);
      shortGfx.destroy();
    }
    if (!this.textures.exists("obs_tall")) {
      const tallGfx = this.make.graphics({ x: 0, y: 0 });
      tallGfx.setVisible(false);
      tallGfx.fillStyle(0xff4444);
      tallGfx.fillRect(0, 0, OBSTACLE_W, OBSTACLE_H_TALL);
      tallGfx.generateTexture("obs_tall", OBSTACLE_W, OBSTACLE_H_TALL);
      tallGfx.destroy();
    }

    this.obstacles = this.physics.add.group();

    // Player ↔ obstacle overlap → game over
    this.physics.add.overlap(this.player, this.obstacles, () => {
      this.triggerGameOver();
    });
  }

  private buildScore(width: number) {
    this.scoreText = this.add
      .text(width - 20, 20, "0", {
        fontSize: "28px",
        color: "#ffffff",
        fontFamily: "Black Ops One",
      })
      .setOrigin(1, 0)
      .setDepth(10);
  }

  private scheduleObstacle() {
    const delay = Math.Between(OBSTACLE_INTERVAL_MIN, OBSTACLE_INTERVAL_MAX);

    this.obstacleTimer = this.time.delayedCall(delay, () => {
      if (!this.isGameOver) {
        this.spawnObstacle();
        this.scheduleObstacle(); // reschedule
      }
    });
  }

  private spawnObstacle() {
    const { width } = this.scale;
    const isTall = window.Math.random() < 0.35; // 35% chance of tall obstacle
    const texKey = isTall ? "obs_tall" : "obs_short";
    const obsH = isTall ? OBSTACLE_H_TALL : OBSTACLE_H_SHORT;

    const obs = this.obstacles.create(
      width + OBSTACLE_W,
      this.groundY - obsH / 2,
      texKey,
    ) as Physics.Arcade.Image;

    obs.setImmovable(true);
    obs.setDepth(2);
    if (obs.body) {
      (obs.body as Physics.Arcade.Body).allowGravity = false;
    }
  }

  private setupInput() {
    // Jump on Space / ArrowUp / W / tap
    const jump = () => {
      if (this.isGameOver) return;
      if (this.isOnGround) {
        this.player.setVelocityY(JUMP_VELOCITY);
        this.playSfx("sfx_jump"); // wire up your SFX key when ready
      }
    };

    this.input.keyboard!.on("keydown", (e: KeyboardEvent) => {
      if (
        e.key === " " ||
        e.key === "ArrowUp" ||
        e.key === "w" ||
        e.key === "W"
      ) {
        jump();
      }
    });

    // Touch / click
    this.input.on("pointerdown", jump);

    // Cleanup on shutdown
    this.events.once("shutdown", () => {
      this.input.keyboard!.removeAllListeners();
      this.input.removeAllListeners();
      if (this.obstacleTimer) this.obstacleTimer.remove();
    });
  }

  private triggerGameOver() {
    if (this.isGameOver) return;
    this.isGameOver = true;

    // Stop all obstacles in place
    this.obstacles.getChildren().forEach((obj) => {
      (obj as Physics.Arcade.Image).setActive(false);
    });

    // Brief red flash on player
    this.tweens.add({
      targets: this.player,
      alpha: 0,
      duration: 80,
      yoyo: true,
      repeat: 3,
      onComplete: () => {
        this.scene.start("GameOver", { score: Math.FloorTo(this.score) });
      },
    });
  }
}
