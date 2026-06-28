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
];

export const audio = [{ key: "bgm", path: "assets/audio/bgm_1.mp3" }];
