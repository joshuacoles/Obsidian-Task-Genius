import { moment } from "obsidian";
import type { Translation, TranslationKey, TranslationOptions } from "./types";

// Import all locale files
import ar from "./locale/ar";
import cz from "./locale/cz";
import da from "./locale/da";
import de from "./locale/de";
import en from "./locale/en";
import enGB from "./locale/en-gb";
import es from "./locale/es";
import fr from "./locale/fr";
import hi from "./locale/hi";
import id from "./locale/id";
import it from "./locale/it";
import ja from "./locale/ja";
import ko from "./locale/ko";
import nl from "./locale/nl";
import no from "./locale/no";
import pl from "./locale/pl";
import pt from "./locale/pt";
import ptBR from "./locale/pt-br";
import ro from "./locale/ro";
import ru from "./locale/ru";
import tr from "./locale/tr";
import zhCN from "./locale/zh-cn";
import zhTW from "./locale/zh-tw";

// Define supported locales map
const SUPPORTED_LOCALES = {
  ar,
  cs: cz,
  da,
  de,
  en,
  "en-gb": enGB,
  es,
  fr,
  hi,
  id,
  it,
  ja,
  ko,
  nl,
  nn: no,
  pl,
  pt,
  "pt-br": ptBR,
  ro,
  ru,
  tr,
  "zh-cn": zhCN,
  "zh-tw": zhTW,
} as const;

export type SupportedLocale = keyof typeof SUPPORTED_LOCALES;

export class TranslationManager {
  private static instance: TranslationManager;
  private currentLocale: string = "en";
  private translations: Map<string, Translation> = new Map();
  private fallbackTranslation: Translation = en;

  private constructor() {
    this.currentLocale = moment.locale();

    // Initialize with all supported translations
    Object.entries(SUPPORTED_LOCALES).forEach(([locale, translations]) => {
      this.translations.set(locale, translations as Translation);
    });
  }

  public static getInstance(): TranslationManager {
    if (!TranslationManager.instance) {
      TranslationManager.instance = new TranslationManager();
    }
    return TranslationManager.instance;
  }

  public setLocale(locale: string): void {
    if (locale in SUPPORTED_LOCALES) {
      this.currentLocale = locale;
    } else {
      console.warn(`Unsupported locale: ${locale}, falling back to English`);
      this.currentLocale = "en";
    }
  }

  public getSupportedLocales(): SupportedLocale[] {
    return Object.keys(SUPPORTED_LOCALES) as SupportedLocale[];
  }

  public t(key: TranslationKey, options?: TranslationOptions): string {
    const translation =
      this.translations.get(this.currentLocale) || this.fallbackTranslation;

    let result = this.getNestedValue(translation, key);

    if (!result) {
      console.warn(
        `Missing translation for key: ${key} in locale: ${this.currentLocale}`
      );
      result = this.getNestedValue(this.fallbackTranslation, key) || key;
    }


    if (options?.interpolation) {
      result = this.interpolate(result, options.interpolation);
    }

    // Remove leading/trailing quotes if present
    result = result.replace(/^[“”"']|[“”"']$/g, "");

    return result;
  }

  private getNestedValue(obj: Translation, path: string): string {
    // Don't split by dots since some translation keys contain dots
    return obj[path] as string;
  }

  private interpolate(
    text: string,
    values: Record<string, string | number>
  ): string {
    return text.replace(
      /\{\{(\w+)\}\}/g,
      (_, key) => values[key]?.toString() || `{{${key}}}`
    );
  }
}

export const translationManager = TranslationManager.getInstance();
export const t = (key: TranslationKey, options?: TranslationOptions): string =>
  translationManager.t(key, options);
