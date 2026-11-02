import { describe, expect, it } from "vitest";
import { buildVocabulary, parse } from "../src/engine";
import { LANGUAGES } from "../src/i18n";
import { loadGame } from "../src/content";
import { aliases } from "./helpers";

/** The parsed phrase (ids and literals). */
const words = (input: string, vocabulary = aliases) => {
  const r = parse(input, vocabulary);
  if (!r.ok) throw new Error(r.error);
  return r.command.words;
};
const typed = (input: string) => {
  const r = parse(input, aliases);
  return r.ok ? r.command.typed : undefined;
};

describe("parser", () => {
  it("one word: global words, objects and items", () => {
    expect(words("look")).toEqual(["look"]);
    expect(words("turn")).toEqual(["turn"]);
    expect(words("inventory")).toEqual(["inventory"]);
    expect(words("clock")).toEqual(["clock"]);
    expect(words("key")).toEqual(["brass_key"]);
  });

  it("several words: a phrase, in the order typed", () => {
    expect(words("open drawer")).toEqual(["open", "drawer"]);
    expect(words("key door")).toEqual(["brass_key", "door"]);
    expect(words("door key")).toEqual(["door", "brass_key"]);
  });

  it("unknown words, such as codes, are kept literally", () => {
    expect(words("0315 drawer")).toEqual(["0315", "drawer"]);
    expect(words("painting")).toEqual(["painting"]);
  });

  it("multi-word names win over their parts (longest match)", () => {
    expect(words("dusty clock")).toEqual(["clock"]);
    expect(words("brass key exit door")).toEqual(["brass_key", "door"]);
    expect(words("old wooden desk")).toEqual(["desk"]);
  });

  it("ignores case, accents, punctuation and extra whitespace", () => {
    expect(words("  KEY   door! ")).toEqual(["brass_key", "door"]);
    const pt = buildVocabulary(loadGame("pt-BR").rooms.study, LANGUAGES["pt-BR"].parser);
    const pw = (s: string) => {
      const r = parse(s, pt, LANGUAGES["pt-BR"].parser);
      return r.ok ? r.command.words : [];
    };
    expect(pw("relogio")).toEqual(["clock"]);
    expect(pw("Relógio")).toEqual(["clock"]);
  });

  it("filler words are not ignored: they're just more words", () => {
    expect(words("use key door")).toEqual(["use", "brass_key", "door"]);
    expect(words("open the drawer")).toEqual(["open", "the", "drawer"]);
    expect(words("inspect clock")).toEqual(["inspect", "clock"]);
  });

  it("keeps the player's own wording of each word", () => {
    expect(typed("Old Painting")).toEqual(["old", "painting"]);
    expect(typed("Dusty Clock")).toEqual(["dusty clock"]);
  });

  it("hint and help are words like the others; there is no restart", () => {
    expect(words("hint")).toEqual(["hint"]);
    expect(words("HELP")).toEqual(["help"]);
    expect(words("restart")).toEqual(["restart"]); // a literal: no such word
  });

  it("only empty input is an error", () => {
    expect(parse("", aliases)).toEqual({ ok: false, error: "Type a command." });
    expect(parse("    ", aliases).ok).toBe(false);
  });

  it("works without a vocabulary (global words only)", () => {
    expect(parse("turn")).toEqual({ ok: true, command: { words: ["turn"], typed: ["turn"] } });
    expect(parse("clock")).toEqual({ ok: true, command: { words: ["clock"], typed: ["clock"] } });
  });
});
