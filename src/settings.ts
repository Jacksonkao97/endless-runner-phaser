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

function read(): GameSettings {
  try {
    const saved = localStorage.getItem(KEY);
    return saved ? { ...DEFAULTS, ...JSON.parse(saved) } : { ...DEFAULTS };
  } catch {
    return { ...DEFAULTS };
  }
}

// In-memory copy so t() and playSfx() don't re-parse localStorage on every call.
// All writes go through save()/reset(), which keep it in sync.
let cached: GameSettings | null = null;

const Settings = {
  load(): GameSettings {
    cached ??= read();
    return { ...cached };
  },

  save(settings: GameSettings) {
    cached = { ...settings };
    localStorage.setItem(KEY, JSON.stringify(settings));
  },

  reset() {
    localStorage.removeItem(KEY);
    cached = { ...DEFAULTS };
    return { ...DEFAULTS };
  },
};

export default Settings;
