import Settings from "../settings";
import en from "./en";
import zh from "./zh";

type TranslationKey = keyof typeof en;

const locales = { en, zh } as const;

export function t(key: TranslationKey): string {
  const lang = Settings.load().language;
  return locales[lang]?.[key] ?? en[key];
}
