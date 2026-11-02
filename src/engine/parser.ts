import { enUS } from "../i18n/locales/en-US";
import type { ParseResult, ParserLanguage, RoomDefinition } from "./types";

/** Normalized name/alias -> logical id. */
export type AliasMap = ReadonlyMap<string, string>;

/**
 * Split text into comparable words: lower case, accents removed ("relógio" ->
 * "relogio"), punctuation dropped. Codes such as "03:15" are left intact.
 */
export function words(text: string): string[] {
  return text
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .toLowerCase()
    .replace(/[.,;!?¡¿"]/g, " ")
    .split(/\s+/)
    .filter(Boolean);
}

/** The lookup key for an object phrase: normalized words without articles/prepositions. */
export function phraseKey(text: string, language: ParserLanguage = enUS.parser): string {
  const stop = new Set(language.stopwords.flatMap(words));
  return words(text)
    .filter((w) => !stop.has(w))
    .join(" ");
}

/** Build the alias table for a room: ids, display names and declared aliases. */
export function buildAliasMap(room: RoomDefinition, language: ParserLanguage = enUS.parser): AliasMap {
  const map = new Map<string, string>();
  const entries = [...Object.entries(room.objects), ...Object.entries(room.items)];
  for (const [id, def] of entries) {
    const names = [id, id.replace(/_/g, " "), def.name, ...(def.aliases ?? [])];
    for (const name of names) {
      const key = phraseKey(name, language);
      if (key) map.set(key, id);
    }
  }
  return map;
}

function resolve(phrase: string[], aliases: AliasMap): string | undefined {
  return aliases.get(phrase.join(" "));
}

/** Resolve a phrase to a logical id, or keep it verbatim (e.g. a code like "0315"). */
function resolveOrRaw(phrase: string[], aliases: AliasMap): string {
  return resolve(phrase, aliases) ?? phrase.join(" ");
}

/**
 * Parse raw player input into a structured command. Does not touch game state.
 * Unknown object names are passed through; the engine decides what they mean.
 */
export function parse(
  input: string,
  aliases: AliasMap = new Map(),
  language: ParserLanguage = enUS.parser,
): ParseResult {
  const all = words(input);
  if (all.length === 0) return { ok: false, error: language.empty };

  const [typed, ...rest] = all;
  const verb = Object.entries(language.verbs).find(([word]) => words(word).join(" ") === typed)?.[1];
  if (verb === undefined) return { ok: false, error: language.unknown(typed) };
  const fail = (): ParseResult => ({ ok: false, error: language.usage[verb] });

  const stop = new Set(language.stopwords.flatMap(words));
  const args = rest.filter((w) => !stop.has(w));

  switch (verb) {
    case "look":
    case "turn":
    case "inventory":
      return rest.length === 0 ? { ok: true, command: { verb } } : fail();

    case "inspect":
    case "open":
      return args.length === 0 ? fail() : { ok: true, command: { verb, object: resolveOrRaw(args, aliases) } };

    case "use": {
      if (args.length < 2) return fail();
      // Multi-word names ("brass key") make the split point ambiguous.
      // Prefer a split where both halves are known names, then one where the
      // target is known, then simply the first word as the item.
      let split = 1;
      let best = -1;
      for (let i = 1; i < args.length; i++) {
        const score =
          (resolve(args.slice(i), aliases) ? 2 : 0) + (resolve(args.slice(0, i), aliases) ? 1 : 0);
        if (score > best) {
          best = score;
          split = i;
        }
      }
      return {
        ok: true,
        command: {
          verb,
          item: resolveOrRaw(args.slice(0, split), aliases),
          target: resolveOrRaw(args.slice(split), aliases),
        },
      };
    }
  }
}
