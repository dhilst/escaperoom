import { enUS } from "../i18n/locales/en-US";
import type { ParseResult, ParserLanguage, RoomDefinition } from "./types";

/** Normalized name/alias -> logical id. */
export type AliasMap = ReadonlyMap<string, string>;

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



/**
 * Parse raw player input into a structured command. Does not touch game state.
 * Unknown object names are passed through; the engine decides what they mean.
 */
export function parse(
  input: string,
  aliases: AliasMap = new Map(),
  language: ParserLanguage = enUS.parser,
): ParseResult {
  const shown = displayWords(input);
  if (shown.length === 0) return { ok: false, error: language.empty };

  const [typedVerb, ...rest] = shown;
  const verbKey = stripAccents(typedVerb);
  const verb = Object.entries(language.verbs).find(([word]) => words(word).join(" ") === verbKey)?.[1];
  if (verb === undefined) return { ok: false, error: language.unknown(verbKey) };
  const fail = (): ParseResult => ({ ok: false, error: language.usage[verb] });

  // Object phrases without articles/prepositions: `args` for matching, `argsShown` to echo back.
  const stop = new Set(language.stopwords.flatMap(words));
  const argsShown = rest.filter((w) => !stop.has(stripAccents(w)));
  const args = argsShown.map(stripAccents);

  /** The id for args[from, to) (or the raw phrase, e.g. a code) and the player's own spelling of it. */
  const lookup = (from: number, to?: number) => ({
    id: resolve(args.slice(from, to), aliases) ?? args.slice(from, to).join(" "),
    typed: argsShown.slice(from, to).join(" "),
  });

  switch (verb) {
    case "look":
    case "turn":
    case "inventory":
    case "help":
    case "hint":
      return rest.length === 0 ? { ok: true, command: { verb } } : fail();

    case "inspect":
    case "open": {
      if (args.length === 0) return fail();
      const { id, typed } = lookup(0);
      // "open drawer 0315" / "open drawer with 0315": a known object followed
      // by something else means "use <something> <object>" (codes, items).
      if (verb === "open" && resolve(args, aliases) === undefined) {
        for (let i = args.length - 1; i >= 1; i--) {
          const object = resolve(args.slice(0, i), aliases);
          if (object !== undefined) {
            const rest = lookup(i);
            return {
              ok: true,
              command: { verb: "use", item: rest.id, target: object, typed: argsShown.slice(0, i).join(" ") },
            };
          }
        }
      }
      return { ok: true, command: { verb, object: id, typed } };
    }

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
      const item = lookup(0, split).id;
      const { id: target, typed } = lookup(split);
      return { ok: true, command: { verb, item, target, typed } };
    }
  }
}
