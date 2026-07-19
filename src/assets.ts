type image = {
  key: string;
  path: string;
};

type spriteSheet = {
  key: string;
  path: string;
  frameWidth: number;
  frameHeight: number;
};

type audio = {
  key: string;
  path: string;
};

export const images: image[] = [
  {
    key: "bg_sky",
    path: "assets/images/bg/normal/GandalfHardcore Background layers_layer 5.png",
  },
  {
    key: "bg_hills",
    path: "assets/images/bg/normal/GandalfHardcore Background layers_layer 4.png",
  },
  {
    key: "bg_treeline_1",
    path: "assets/images/bg/normal/GandalfHardcore Background layers_layer 3.png",
  },
  {
    key: "bg_treeline_2",
    path: "assets/images/bg/normal/GandalfHardcore Background layers_layer 2.png",
  },
  {
    key: "bg_tree",
    path: "assets/images/bg/normal/GandalfHardcore Background layers_layer 1.png",
  },
  {
    key: "cloud_1",
    path: "assets/images/deco/cloud1.png",
  },
  {
    key: "cloud_2",
    path: "assets/images/deco/cloud2.png",
  },
  {
    key: "cloud_3",
    path: "assets/images/deco/cloud3.png",
  },
  {
    key: "cloud_4",
    path: "assets/images/deco/cloud4.png",
  },
  {
    key: "cloud_5",
    path: "assets/images/deco/cloud5.png",
  },
  {
    key: "cloud_6",
    path: "assets/images/deco/cloud6.png",
  },
  {
    key: "hot_air_balloon",
    path: "assets/images/deco/hot air balloon.png",
  },
  {
    key: "large_tent",
    path: "assets/images/deco/Large Tent.png",
  },
  {
    key: "small_tent",
    path: "assets/images/deco/Small Tent.png",
  },
  {
    key: "tall_grass",
    path: "assets/images/deco/Tall Grass.png",
  },
];

export const spritesheets: spriteSheet[] = [
  {
    key: "ground_texture",
    path: "assets/images/Floor Tiles1.png",
    frameWidth: 32,
    frameHeight: 32,
  },
  {
    key: "character",
    path: "assets/images/Male Skin2.png",
    frameWidth: 80,
    frameHeight: 64,
  },
  {
    key: "enemy_ground_walk",
    path: "assets/images/enemy/Orc-Walk.png",
    frameWidth: 100,
    frameHeight: 100,
  },
  {
    key: "enemy_ground_attack",
    path: "assets/images/enemy/Orc-Attack01.png",
    frameWidth: 100,
    frameHeight: 100,
  },
  {
    key: "enemy_ground_idle",
    path: "assets/images/enemy/Orc-Idle.png",
    frameWidth: 100,
    frameHeight: 100,
  },
  {
    key: "enemy_top_fly",
    path: "assets/images/enemy/demo_lugia-Sheet.png",
    frameWidth: 208,
    frameHeight: 208,
  },
  {
    key: "enemy_mid_attack",
    path: "assets/images/enemy/eye_ball_attack.png",
    frameWidth: 150,
    frameHeight: 150,
  },
];

export const audio: audio[] = [
  { key: "bgm", path: "assets/audio/bgm_1.mp3" },
  { key: "sfx_jump", path: "assets/audio/jump_1.mp3" },
  { key: "sfx_double_jump", path: "assets/audio/jump_1.mp3" },
  { key: "sfx_land", path: "assets/audio/landing_1.mp3" },
  { key: "sfx_death", path: "assets/audio/dead_1.mp3" },
];
