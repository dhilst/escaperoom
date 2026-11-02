import type { ParseResult, RoomDefinition } from "./types";

/** Lower-cased name/alias -> logical id. */
export type AliasMap = ReadonlyMap<string, string>;

const USAGE: Record<string, string> = {
  look: "look",
  turn: "turn",
  inventory: "inventory",
  inspect: "inspect <object>",
  open: "open <object>",
  use: "use <item> <target>",
};

/** Build the alias table for a room: ids, display names and declared aliases. */
export function buildAliasMap(room: RoomDefinition): AliasMap {
  const map = new Map<string, string>();
  const entries = [...Object.entries(room.objects), ...Object.entries(room.items)];
  for (const [id, def] of entries) {
    const names = [id, id.replace(/_/g, " "), def.name, ...(def.aliases ?? [])];
    for (const name of names) map.set(normalize(name), id);
  }
  return map;
}

function normalize(text: string): string {
  return text.trim().toLowerCase().replace(/\s+/g, " ");
}

function resolve(words: string[], aliases: AliasMap): string | undefined {
  return aliases.get(words.join(" "));
}

/** Resolve a phrase to a logical id, or keep it verbatim (e.g. a code like "0315"). */
function resolveOrRaw(words: string[], aliases: AliasMap): string {
  return resolve(words, aliases) ?? words.join(" ");
}

/**
 * Parse raw player input into a structured command. Does not touch game state.
 * Unknown object names are passed through; the engine decides what they mean.
 */
export function parse(input: string, aliases: AliasMap = new Map()): ParseResult {
  const words = normalize(input).split(" ").filter(Boolean);
  if (words.length === 0) return { ok: false, error: "Type a command." };

  const [verb, ...args] = words;
  const usage = USAGE[verb];
  if (usage === undefined) {
    return { ok: false, error: `Unknown command "${verb}". Try: look, turn, inspect, open, use, inventory.` };
  }
  const fail = (): ParseResult => ({ ok: false, error: `Usage: ${usage}` });

  switch (verb) {
    case "look":
    case "turn":
    case "inventory":
      return args.length === 0 ? { ok: true, command: { verb } } : fail();

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
  return fail();
}
