// Modern translation system for Obsidian plugins
import { moment } from "obsidian";
import { type TranslationManager, translationManager } from "./manager";
import type { TranslationOptions } from "./types";
export type { TranslationKey } from "./types";

// Initialize translations
export async function initializeTranslations(): Promise<void> {
  const currentLocale = moment.locale();
  translationManager.setLocale(currentLocale);
}

// Export the translation function
export const t: TranslationManager['t'] & ((key: string, options?: TranslationOptions) => string) = translationManager.t.bind(translationManager);
