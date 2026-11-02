import { enUS } from "../i18n/locales/en-US";
import type { ParseResult, ParserLanguage, RoomDefinition } from "./types";

/** Normalized phrase ("caixa de fusiveis") -> id, for one room in one language. */
export type Vocabulary = ReadonlyMap<string, string>;

/** Lower case, punctuation dropped, split on whitespace. Accents are kept. */
function displayWords(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[.,;!?¡¿"]/g, " ")
    .split(/\s+/)
    .filter(Boolean);
}

const stripAccents = (word: string) => word.normalize("NFD").replace(/\p{M}/gu, "");

/**
 * Split text into comparable words: lower case, accents removed ("relógio" ->
 * "relogio"), punctuation dropped. Codes such as "03:15" are left intact.
 */
export function words(text: string): string[] {
  return displayWords(text).map(stripAccents);
}

/** The lookup key for a name: its normalized words. Nothing is ignored. */
export function phraseKey(text: string): string {
  return words(text).join(" ");
}

/**
 * Every way to say each word of a room in one language, as [key, id, source]:
 * global words, then each object, item and room verb by id, name and aliases.
 * Validation uses this to report clashes; buildVocabulary to parse.
 */
export function vocabularyEntries(room: RoomDefinition, language: ParserLanguage): [string, string, string][] {
  const entries: [string, string, string][] = Object.entries(language.words).map(([word, id]) => [
    phraseKey(word),
    id,
    "global word",
  ]);
  const groups = [
    ["objects", room.objects],
    ["items", room.items],
    ["verbs", room.verbs ?? {}],
  ] as const;
  for (const [kind, defs] of groups) {
    for (const [id, def] of Object.entries(defs)) {
      for (const name of [id, id.replace(/_/g, " "), def.name, ...(def.aliases ?? [])]) {
        entries.push([phraseKey(name), id, `${kind}.${id}`]);
      }
    }
  }
  return entries.filter(([key]) => key !== "");
}

/** Normalized phrase -> id for a room in one language (global words included). */
export function buildVocabulary(room: RoomDefinition, language: ParserLanguage = enUS.parser): Vocabulary {
  return new Map(vocabularyEntries(room, language).map(([key, id]) => [key, id]));
}

/**
 * Parse raw input into a phrase: the longest known name is taken at each
 * position ("fuse box" before "fuse"); a word the room doesn't know is kept
 * literally (codes, or names that don't exist). Does not touch game state.
 */
export function parse(
  input: string,
  vocabulary: Vocabulary = new Map(),
  language: ParserLanguage = enUS.parser,
): ParseResult {
  const shown = displayWords(input);
  if (shown.length === 0) return { ok: false, error: language.empty };
  const keys = shown.map(stripAccents);

  const globals = new Map(Object.entries(language.words).map(([word, id]) => [phraseKey(word), id]));
  const lookup = (key: string) => vocabulary.get(key) ?? globals.get(key);
  let longest = 1;
  for (const key of vocabulary.keys()) longest = Math.max(longest, key.split(" ").length);

  const ids: string[] = [];
  const typed: string[] = [];
  for (let i = 0; i < keys.length; ) {
    let length = Math.min(longest, keys.length - i);
    let id: string | undefined;
    for (; length > 0; length--) {
      id = lookup(keys.slice(i, i + length).join(" "));
      if (id !== undefined) break;
    }
    if (id === undefined) length = 1;
    ids.push(id ?? keys[i]);
    typed.push(shown.slice(i, i + length).join(" "));
    i += length;
  }
  return { ok: true, command: { words: ids, typed } };
}
