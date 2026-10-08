export interface GameSettings {
  bgmVolume: number;
  sfxVolume: number;
  language: "en" | "zh";
  contrast: number; // 0–1; drives the darkening overlay in BaseScene
}

const DEFAULTS: GameSettings = {
  bgmVolume: 0.3,
  sfxVolume: 0.3,
  language: "en",
  contrast: 0.5,
};

const KEY = "endless-runner-settings";

const Settings = {
  load(): GameSettings {
    try {
      const saved = localStorage.getItem(KEY);
      return saved ? { ...DEFAULTS, ...JSON.parse(saved) } : { ...DEFAULTS };
    } catch {
      return { ...DEFAULTS };
    }
  },

  save(settings: GameSettings) {
    localStorage.setItem(KEY, JSON.stringify(settings));
  },

  reset() {
    localStorage.removeItem(KEY);
    return { ...DEFAULTS };
  },
};

export default Settings;
