import type { EngineMessages, ParserLanguage } from "../engine/types";

export interface UiStrings {
  restart: string;
  restartTitle: string;
  items: string;
  level(level: number, levels: number): string;
  placeholder: string;
  banner: string;
  language: string;
}

/** One complete translation: command words, engine messages and interface labels. */
export interface Language {
  locale: string;
  /** Name shown in the language picker, written in the language itself. */
  name: string;
  parser: ParserLanguage;
  engine: EngineMessages;
  ui: UiStrings;
}
