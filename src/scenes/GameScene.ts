import { GameObjects, Input, Math, Physics, Time, type Types } from "phaser";
import Settings from "../settings";
import { BaseScene } from "./BaseScene";

const GROUND_H = 32;
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

type BgLayerDef = { key: string; parallax: number; depth: number };
const BG_LAYER_DEFS: BgLayerDef[] = [
  { key: "bg_sky", parallax: 0.0, depth: -5 },
  { key: "bg_hills", parallax: 0.05, depth: -4 },
  { key: "bg_treeline_1", parallax: 0.12, depth: -3 },
  { key: "bg_treeline_2", parallax: 0.25, depth: -2 },
  { key: "bg_tree", parallax: 0.4, depth: -1 },
];

type DecoCategory = {
  keys: string[]; // texture keys in this category (picked randomly)
  parallax: number; // scroll factor
  depth: number;
  yMode: "sky" | "ground"; // where to place it vertically
  minGap: number; // ms minimum between spawns in this category
  maxGap: number;
  allowOverlap?: boolean;
  timer?: Time.TimerEvent;
  lastItem?: GameObjects.Image;
};
const DECO_CATEGORIES: DecoCategory[] = [
  {
    // Clouds — can overlap each other, so minGap is just time-based
    keys: ["cloud_1", "cloud_2", "cloud_3", "cloud_4", "cloud_5", "cloud_6"],
    parallax: 0.07,
    depth: -1.5,
    yMode: "sky",
    minGap: 800,
    maxGap: 2000,
    allowOverlap: true,
  },
  {
    // Foreground trees — no overlap, wider gap
    keys: ["large_tent", "small_tent"],
    parallax: 0.8,
    depth: -1,
    yMode: "ground",
    minGap: 4000,
    maxGap: 6000,
    allowOverlap: false,
  },
  {
    // Mid-ground props (rocks, bushes) — no overlap
    keys: ["tall_grass"],
    parallax: 0.8,
    depth: -0.8,
    yMode: "ground",
    minGap: 1500,
    maxGap: 3500,
    allowOverlap: true,
  },
];

export default class GameScene extends BaseScene {
  private player!: Types.Physics.Arcade.SpriteWithDynamicBody;
  private groundSpriteTop!: GameObjects.TileSprite;
  private groundSpriteFill!: GameObjects.TileSprite;
  private ground!: Physics.Arcade.StaticGroup;
  private obstacles!: Physics.Arcade.Group;

  private bgLayers: GameObjects.TileSprite[] = [];
  private bgDecorations!: GameObjects.Group;

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
    this.bgLayers = [];

    this.buildBackground(width, height);
    this.buildGround(width, height);
    this.buildPlayer();
    this.buildObstacleGroup();
    this.buildDecorations();
    this.buildScore(width);
    this.scheduleObstacle();
    this.scheduleDecoration();
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

    // Scroll parallax bg tile layers
    this.bgLayers.forEach((layer) => {
      const factor: number = (layer as any).__parallax;
      if (factor > 0) {
        layer.tilePositionX += this.scrollSpeed * factor * (delta / 1000);
      }
    });

    // Scroll the ground left
    this.groundSpriteTop.tilePositionX += this.scrollSpeed * (delta / 1000);
    this.groundSpriteFill.tilePositionX += this.scrollSpeed * (delta / 1000);

    // Scroll all obstacles left
    this.obstacles.getChildren().forEach((obj) => {
      const obs = obj as Physics.Arcade.Image;
      obs.x -= this.scrollSpeed * (delta / 1000);
      if (obs.x < -obs.width) obs.destroy();
    });

    // Scroll bg decorations (clouds, trees) at their own parallax factor
    this.bgDecorations.getChildren().forEach((obj) => {
      const dec = obj as GameObjects.Image & { __parallax: number };
      dec.x -= this.scrollSpeed * dec.__parallax * (delta / 1000);
      if (dec.x < -(dec.width ?? 64)) dec.destroy();
    });

    // Ground contact — reset jump count when landing
    const onGround =
      (this.player.body.blocked.down || this.player.body.touching.down) &&
      this.player.body.velocity.y >= 0;

    if (onGround && !this.isOnGround) {
      this.jumpCount = 0;
      if (!this.isCrouching) this.standUp();
      this.player.play("run");
    }
    this.isOnGround = onGround;

    // Score
    this.score += (this.scrollSpeed * (delta / 1000)) / 10;
    this.scoreText.setText(`${Math.FloorTo(this.score)}`);
  }

  private buildBackground(width: number, height: number) {
    const TEX_H = 346;
    const scaleY = height / TEX_H;

    // ── Sky: full-bleed stretched TileSprite ──────────────────────────────────
    const skyDef = BG_LAYER_DEFS[0];
    const skyLayer = this.add
      .tileSprite(width / 2, height / 2, width, height, skyDef.key)
      .setOrigin(0.5, 0.5)
      .setTileScale(1, scaleY)
      .setDepth(skyDef.depth);
    (skyLayer as any).__parallax = skyDef.parallax;
    this.bgLayers.push(skyLayer);

    // ── Layers 2–5: anchored to bottom ───────────────────────────────────────
    for (const def of BG_LAYER_DEFS.slice(1)) {
      const layer = this.add
        .tileSprite(width / 2, height, width, TEX_H, def.key)
        .setOrigin(0.5, 1)
        .setDepth(def.depth);
      (layer as any).__parallax = def.parallax;
      this.bgLayers.push(layer);
    }
  }

  private buildDecorations() {
    this.bgDecorations = this.add.group();
  }

  private scheduleDecoration() {
    for (const cat of DECO_CATEGORIES) {
      this.scheduleCategorySpawn(cat);
    }
  }

  private scheduleCategorySpawn(cat: DecoCategory) {
    const delay = Math.Between(cat.minGap, cat.maxGap);
    cat.timer = this.time.delayedCall(delay, () => {
      if (!this.isGameOver) {
        this.spawnDecoration(cat);
        this.scheduleCategorySpawn(cat); // reschedule
      }
    });
  }

  private spawnDecoration(cat: DecoCategory) {
    const { width } = this.scale;

    // Overlap guard — skip this spawn if the previous item hasn't cleared
    // the right edge of the screen yet. Rescheduling handles the retry.
    if (!cat.allowOverlap && cat.lastItem?.active) {
      const lastRight = cat.lastItem.x + cat.lastItem.width;
      if (lastRight > width) return; // still on screen, skip
    }

    const texKey = cat.keys[Math.Between(0, cat.keys.length - 1)];
    const src = this.textures.get(texKey).getSourceImage() as HTMLImageElement;

    let y: number;
    if (cat.yMode === "sky") {
      y = Math.Between(50, this.groundY - 280);
    } else {
      y = this.groundY - src.height;
    }

    const dec = this.add
      .image(width + src.width, y, texKey)
      .setOrigin(0, 0)
      .setDepth(cat.depth);

    (dec as any).__parallax = cat.parallax;
    this.bgDecorations.add(dec);
    cat.lastItem = dec;
  }

  private buildGround(width: number, _height: number) {
    this.groundSpriteTop = this.add
      .tileSprite(
        width / 2,
        this.groundY + GROUND_H / 2,
        width,
        GROUND_H,
        "ground_texture",
        1,
      )
      .setDepth(1);

    this.groundSpriteFill = this.add
      .tileSprite(
        width / 2,
        this.groundY + GROUND_H + GROUND_H / 2,
        width,
        GROUND_H,
        "ground_texture",
        19,
      )
      .setDepth(1);

    if (!this.textures.exists("ground_texture")) {
      const gfx = this.make.graphics({ x: 0, y: 0 });
      gfx.setVisible(false);
      gfx.fillStyle(0xffffff);
      gfx.fillRect(0, 0, 1, 1);
      gfx.generateTexture("ground_texture", 1, 1);
      gfx.destroy();
    }

    this.ground = this.physics.add.staticGroup();
    const groundImg = this.ground.create(
      width / 2,
      this.groundY + GROUND_H / 2,
      "ground_texture",
    ) as Physics.Arcade.Image;
    groundImg.setVisible(false);
    groundImg.setDisplaySize(width * 3, GROUND_H);
    groundImg.refreshBody();
  }

  private buildPlayer() {
    const playerY = this.groundY - PLAYER_H / 2;

    if (!this.textures.exists("character")) {
      const gfx = this.make.graphics({ x: 0, y: 0 });
      gfx.setVisible(false);
      gfx.fillStyle(0xdfe8a6);
      gfx.fillRect(0, 0, PLAYER_W, PLAYER_H);
      gfx.generateTexture("character", PLAYER_W, PLAYER_H);
      gfx.destroy();
    }

    if (!this.anims.exists("run")) {
      this.anims.create({
        key: "run",
        frames: this.anims.generateFrameNumbers("character", {
          start: 20,
          end: 27,
        }),
        frameRate: 16,
        repeat: -1,
      });
    }

    if (!this.anims.exists("jump")) {
      this.anims.create({
        key: "jump",
        frames: this.anims.generateFrameNumbers("character", {
          start: 30,
          end: 33,
        }),
        frameRate: 8,
        repeat: 0,
        hideOnComplete: false,
      });
    }

    if (!this.anims.exists("fall")) {
      this.anims.create({
        key: "fall",
        frames: this.anims.generateFrameNumbers("character", {
          start: 40,
          end: 44,
        }),
        frameRate: 8,
        repeat: 0,
      });
    }

    if (!this.anims.exists("dead")) {
      this.anims.create({
        key: "dead",
        frames: this.anims.generateFrameNumbers("character", {
          start: 60,
          end: 69,
        }),
        frameRate: 20,
        repeat: 0,
      });
    }

    this.player = this.physics.add.sprite(
      PLAYER_X_OFFSET,
      playerY,
      "character",
    );
    this.player.setFlipX(true);
    this.player.play("run");
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

  private tryJump() {
    if (this.isGameOver) return;
    if (this.isCrouching) return; // can't jump while crouching

    if (this.isOnGround && this.jumpCount === 0) {
      // First jump
      this.player.setVelocityY(JUMP_VELOCITY);
      this.jumpCount = 1;
      // this.playSfx("sfx_jump");
      this.player.play("jump");
      this.player.chain("fall");
    } else if (!this.isOnGround && this.jumpCount === 1) {
      // Double jump
      this.player.setVelocityY(JUMP2_VELOCITY);
      this.jumpCount = 2;
      // this.playSfx("sfx_jump");
      this.player.play("jump");
      this.player.chain("fall");
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
          // this.crouchDown();
          break;
      }
    };

    const onKeyUp = (e: KeyboardEvent) => {
      if (e.key === "ArrowDown" || e.key === "s" || e.key === "S") {
        // Only stand up if on ground; if in air, standUp runs on landing
        if (this.isOnGround) this.standUp();
        // else this.isCrouching = false;
      }
    };

    this.input.keyboard!.on("keydown", onKeyDown);
    this.input.keyboard!.on("keyup", onKeyUp);

    // Touch: tap upper half = jump, tap lower half = crouch
    this.input.on("pointerdown", (ptr: Input.Pointer) => {
      this.tryJump();
      // if (ptr.y < this.scale.height / 2) this.tryJump();
      // else this.crouchDown();
    });
    this.input.on("pointerup", () => {
      if (this.isOnGround) this.standUp();
      // else this.isCrouching = false;
    });

    this.events.once("shutdown", () => {
      this.input.keyboard!.removeAllListeners();
      this.input.removeAllListeners();
      if (this.obstacleTimer) this.obstacleTimer.remove();
      for (const cat of DECO_CATEGORIES) {
        cat.timer?.remove();
      }
    });
  }

  private triggerGameOver() {
    if (this.isGameOver) return;
    this.isGameOver = true;

    this.obstacles.getChildren().forEach((obj) => {
      (obj as Physics.Arcade.Image).setActive(false);
    });

    this.player.play("dead");
    this.player.once("animationcomplete-dead", () => {
      this.time.delayedCall(500, () => {
        this.scene.start("GameOver", { score: Math.FloorTo(this.score) });
      });
    });
  }
}
