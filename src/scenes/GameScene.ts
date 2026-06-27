import { GameObjects, Input, Math, Physics, Time, type Types } from "phaser";
import Settings from "../settings";
import { BaseScene } from "./BaseScene";

const GROUND_H = 16;
const GROUND_Y_OFFSET = 80; // px above bottom edge where ground surface sits
const PLAYER_X_OFFSET = 120; // px from left edge where player stands
const GRAVITY = 1800; // px/s²
const JUMP_VELOCITY = -680; // px/s — single jump (clears ground obs)
const JUMP2_VELOCITY = -580; // px/s — second jump (clears mid obs)
const SCROLL_SPEED_INITIAL = 380; // px/s
const SCROLL_SPEED_MAX = 900; // px/s
const SCROLL_ACCELERATION = 8; // px/s per second
const OBSTACLE_INTERVAL_MIN = 900; // ms
const OBSTACLE_INTERVAL_MAX = 2200; // ms

const PLAYER_W = 32;
const PLAYER_H = 52;
const PLAYER_H_CROUCH = 26; // half height when crouching

const OBS_W = 32;
const OBS_GROUND_H = 48; // sits on ground
const OBS_MID_W = 52; // wider floating block
const OBS_MID_H = 32;
const OBS_TOP_W = 64;
const OBS_TOP_H = 28;
const OBS_MID_Y_OFFSET = 210; // px above groundY  → groundY - 210
const OBS_TOP_Y_OFFSET = 260; // px above groundY  → groundY - 260 (double jump reaches here)

export default class GameScene extends BaseScene {
  private player!: Types.Physics.Arcade.SpriteWithDynamicBody;
  private ground!: Physics.Arcade.StaticGroup;
  private obstacles!: Physics.Arcade.Group;

  private scrollSpeed = SCROLL_SPEED_INITIAL;
  private score = 0;
  private isGameOver = false;
  private isOnGround = false;
  private jumpCount = 0; // 0 = grounded, 1 = first jump, 2 = second jump used
  private isCrouching = false;
  private groundY = 0;

  private scoreText!: GameObjects.Text;
  private obstacleTimer!: Time.TimerEvent;

  constructor() {
    super("Game");
  }

  create() {
    const { width, height } = this.scale;
    this.isGameOver = false;
    this.isOnGround = false;
    this.isCrouching = false;
    this.jumpCount = 0;
    this.score = 0;
    this.scrollSpeed = SCROLL_SPEED_INITIAL;
    this.groundY = height - GROUND_Y_OFFSET;

    this.buildGround(width, height);
    this.buildPlayer();
    this.buildObstacleGroup();
    this.buildScore(width);
    this.scheduleObstacle();
    this.setupInput();

    this.applyContrast(Settings.load().contrast);
  }

  // ── update ────────────────────────────────────────────────────────────────────
  update(_time: number, delta: number) {
    if (this.isGameOver) return;

    this.scrollSpeed = window.Math.min(
      this.scrollSpeed + SCROLL_ACCELERATION * (delta / 1000),
      SCROLL_SPEED_MAX,
    );

    // Scroll all obstacles left
    this.obstacles.getChildren().forEach((obj) => {
      const obs = obj as Physics.Arcade.Image;
      obs.x -= this.scrollSpeed * (delta / 1000);
      if (obs.x < -obs.width) obs.destroy();
    });

    // Ground contact — reset jump count when landing
    const onGround =
      (this.player.body.blocked.down || this.player.body.touching.down) &&
      this.player.body.velocity.y >= 0;

    if (onGround && !this.isOnGround) {
      // Just landed
      this.jumpCount = 0;
      // Stand back up if crouch key released while in air
      if (!this.isCrouching) this.standUp();
    }
    this.isOnGround = onGround;

    // Score
    this.score += (this.scrollSpeed * (delta / 1000)) / 10;
    this.scoreText.setText(`${Math.FloorTo(this.score)}`);
  }

  private buildGround(width: number, height: number) {
    this.add
      .rectangle(
        width / 2,
        this.groundY + GROUND_H / 2,
        width,
        GROUND_H,
        0xf26500,
      )
      .setDepth(1);

    if (!this.textures.exists("ground_px")) {
      const gfx = this.make.graphics({ x: 0, y: 0 });
      gfx.setVisible(false);
      gfx.fillStyle(0xffffff);
      gfx.fillRect(0, 0, 1, 1);
      gfx.generateTexture("ground_px", 1, 1);
      gfx.destroy();
    }

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

  private buildPlayer() {
    const playerY = this.groundY - PLAYER_H / 2;

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

    // Physics body matches standing height by default
    this.player.body.setSize(PLAYER_W, PLAYER_H);

    this.physics.add.collider(this.player, this.ground);
  }

  private buildObstacleGroup() {
    // Ground obstacle texture
    if (!this.textures.exists("obs_ground")) {
      const gfx = this.make.graphics({ x: 0, y: 0 });
      gfx.setVisible(false);
      gfx.fillStyle(0xff4444);
      gfx.fillRect(0, 0, OBS_W, OBS_GROUND_H);
      gfx.generateTexture("obs_ground", OBS_W, OBS_GROUND_H);
      gfx.destroy();
    }
    // Mid floating obstacle texture (orange tint — different danger signal)
    if (!this.textures.exists("obs_mid")) {
      const gfx = this.make.graphics({ x: 0, y: 0 });
      gfx.setVisible(false);
      gfx.fillStyle(0xff8800);
      gfx.fillRect(0, 0, OBS_MID_W, OBS_MID_H);
      gfx.generateTexture("obs_mid", OBS_MID_W, OBS_MID_H);
      gfx.destroy();
    }
    // Top floating obstacle texture (yellow — highest threat)
    if (!this.textures.exists("obs_top")) {
      const gfx = this.make.graphics({ x: 0, y: 0 });
      gfx.setVisible(false);
      gfx.fillStyle(0xffdd00);
      gfx.fillRect(0, 0, OBS_TOP_W, OBS_TOP_H);
      gfx.generateTexture("obs_top", OBS_TOP_W, OBS_TOP_H);
      gfx.destroy();
    }

    this.obstacles = this.physics.add.group();

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

  // ─────────────────────────────────────────────────────────────────────────────
  // Obstacle spawning
  // ─────────────────────────────────────────────────────────────────────────────

  private scheduleObstacle() {
    const delay = Math.Between(OBSTACLE_INTERVAL_MIN, OBSTACLE_INTERVAL_MAX);
    this.obstacleTimer = this.time.delayedCall(delay, () => {
      if (!this.isGameOver) {
        this.spawnObstacle();
        this.scheduleObstacle();
      }
    });
  }

  private spawnObstacle() {
    const { width } = this.scale;

    // Weighted random: 50% ground, 30% mid, 20% top
    const roll = window.Math.random();
    let texKey: string;
    let obsY: number;
    let obsW: number;
    let obsH: number;

    if (roll < 0.5) {
      // Ground obstacle — jump over it
      texKey = "obs_ground";
      obsW = OBS_W;
      obsH = OBS_GROUND_H;
      obsY = this.groundY - obsH / 2;
    } else if (roll < 0.8) {
      // Mid floating — double jump or crouch under it
      texKey = "obs_mid";
      obsW = OBS_MID_W;
      obsH = OBS_MID_H;
      obsY = this.groundY - OBS_MID_Y_OFFSET;
    } else {
      // Top floating — must crouch (double jump will hit it)
      texKey = "obs_top";
      obsW = OBS_TOP_W;
      obsH = OBS_TOP_H;
      obsY = this.groundY - OBS_TOP_Y_OFFSET;
    }

    const obs = this.obstacles.create(
      width + obsW,
      obsY,
      texKey,
    ) as Physics.Arcade.Image;

    obs.setImmovable(true);
    obs.setDepth(2);
    if (obs.body) {
      (obs.body as Physics.Arcade.Body).allowGravity = false;
      (obs.body as Physics.Arcade.Body).setSize(obsW, obsH);
    }
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // Player actions
  // ─────────────────────────────────────────────────────────────────────────────

  private tryJump() {
    if (this.isGameOver) return;
    if (this.isCrouching) return; // can't jump while crouching

    if (this.isOnGround && this.jumpCount === 0) {
      // First jump
      this.player.setVelocityY(JUMP_VELOCITY);
      this.jumpCount = 1;
      this.playSfx("sfx_jump");
    } else if (!this.isOnGround && this.jumpCount === 1) {
      // Double jump
      this.player.setVelocityY(JUMP2_VELOCITY);
      this.jumpCount = 2;
      this.playSfx("sfx_jump");
    }
  }

  private crouchDown() {
    if (this.isGameOver) return;
    if (this.isCrouching) return;
    this.isCrouching = true;

    // NEVER use setScale on a physics sprite in Phaser 4 — it scales the
    // body dimensions too, shrinking the body to 13px instead of 26px.
    // Only resize the physics body and use setOffset to keep feet at groundY.
    // With center origin: body bottom = sprite.y + bodyH/2.
    // After setSize to PLAYER_H_CROUCH (26), bottom rises by (52-26)/2 = 13px.
    // setOffset(0, 13) shifts body down 13px, restoring bottom to groundY.
    const diff = (PLAYER_H - PLAYER_H_CROUCH) / 2; // = 13
    this.player.body.setSize(PLAYER_W, PLAYER_H_CROUCH);
    this.player.body.setOffset(0, diff);
  }

  private standUp() {
    if (!this.isCrouching) return;
    this.isCrouching = false;

    this.player.body.setSize(PLAYER_W, PLAYER_H);
    this.player.body.setOffset(0, 0);
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // Input
  // ─────────────────────────────────────────────────────────────────────────────

  private setupInput() {
    const onKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case " ":
        case "ArrowUp":
        case "w":
        case "W":
          this.tryJump();
          break;

        case "ArrowDown":
        case "s":
        case "S":
          this.crouchDown();
          break;
      }
    };

    const onKeyUp = (e: KeyboardEvent) => {
      if (e.key === "ArrowDown" || e.key === "s" || e.key === "S") {
        // Only stand up if on ground; if in air, standUp runs on landing
        if (this.isOnGround) this.standUp();
        else this.isCrouching = false; // flag cleared, standUp fires on land
      }
    };

    this.input.keyboard!.on("keydown", onKeyDown);
    this.input.keyboard!.on("keyup", onKeyUp);

    // Touch: tap upper half = jump, tap lower half = crouch
    this.input.on("pointerdown", (ptr: Input.Pointer) => {
      if (ptr.y < this.scale.height / 2) this.tryJump();
      else this.crouchDown();
    });
    this.input.on("pointerup", () => {
      if (this.isOnGround) this.standUp();
      else this.isCrouching = false;
    });

    this.events.once("shutdown", () => {
      this.input.keyboard!.removeAllListeners();
      this.input.removeAllListeners();
      if (this.obstacleTimer) this.obstacleTimer.remove();
    });
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // Game Over
  // ─────────────────────────────────────────────────────────────────────────────

  private triggerGameOver() {
    if (this.isGameOver) return;
    this.isGameOver = true;

    this.obstacles.getChildren().forEach((obj) => {
      (obj as Physics.Arcade.Image).setActive(false);
    });

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
