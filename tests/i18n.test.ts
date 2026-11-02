import { describe, expect, it } from "vitest";
import { loadGame, rawContent } from "../src/content";
import { buildVocabulary, createGameState, parse } from "../src/engine";
import { LANGUAGES, LOCALES, localeFromParam, localize, missingTranslations, type Locale } from "../src/i18n";
import { playGame, texts } from "./helpers";
import { fullSolution } from "./solutions";

const parserFor = (locale: Locale, roomId = "study") => {
  const language = LANGUAGES[locale].parser;
  const aliases = buildVocabulary(loadGame(locale).rooms[roomId], language);
  return (input: string) => parse(input, aliases, language);
};

const SOLUTIONS = Object.fromEntries(LOCALES.map((l) => [l, fullSolution(l)])) as Record<Locale, string[]>;

describe("locale selection (?lang=)", () => {
  it("defaults to US English", () => {
    expect(localeFromParam(null)).toBe("en-US");
    expect(localeFromParam("")).toBe("en-US");
    expect(localeFromParam("fr")).toBe("en-US");
  });

  it("accepts loose spellings", () => {
    expect(localeFromParam("pt-BR")).toBe("pt-BR");
    expect(localeFromParam("pt_BR")).toBe("pt-BR");
    expect(localeFromParam("pt-br")).toBe("pt-BR");
    expect(localeFromParam("pt")).toBe("pt-BR");
    expect(localeFromParam("es")).toBe("es");
    expect(localeFromParam("es-MX")).toBe("es");
    expect(localeFromParam("en")).toBe("en-US");
  });
});

describe("localized data", () => {
  it("localize() picks one language and falls back to English", () => {
    const data = { a: { "en-US": "door", "pt-BR": "porta" }, b: [{ "en-US": ["x"], es: ["y"] }], code: "0315" };
    expect(localize(data, "pt-BR")).toEqual({ a: "porta", b: [["x"]], code: "0315" });
    expect(localize(data, "es")).toEqual({ a: "door", b: [["y"]], code: "0315" });
  });

  it("missingTranslations() reports incomplete entries with their path", () => {
    expect(missingTranslations({ x: [{ t: { "en-US": "a", es: "b" } }] })).toEqual(["x[0].t is missing pt-BR"]);
  });

  it("every room and the manifest are fully translated", () => {
    const all = [rawContent.manifest, ...rawContent.rooms];
    expect(all.flatMap((data) => missingTranslations(data))).toEqual([]);
  });

  it("no player-facing text was left as a plain, untranslated string", () => {
    const plain: string[] = [];
    const walk = (v: unknown, path: string) => {
      if (Array.isArray(v)) return v.forEach((x, i) => walk(x, `${path}[${i}]`));
      if (typeof v !== "object" || v === null) return;
      for (const [k, x] of Object.entries(v)) {
        if (["title", "description", "name", "text", "aliases"].includes(k) && (typeof x === "string" || Array.isArray(x))) {
          plain.push(`${path}.${k}`);
        } else walk(x, `${path}.${k}`);
      }
    };
    rawContent.rooms.forEach((room, i) => walk(room, `rooms[${i}]`));
    walk(rawContent.manifest, "game");
    expect(plain).toEqual([]);
  });

  it.each(LOCALES)("%s: the game validates, including unique names for its parser", (locale) => {
    const game = loadGame(locale);
    expect(game.order.slice(0, 3)).toEqual(["study", "cellar", "observatory"]);
  });
});

describe("parser in other languages", () => {
  const w = (locale: Locale, input: string) => {
    const r = parserFor(locale)(input);
    return r.ok ? r.command.words : r.error;
  };

  it("pt-BR: names, global words and accents", () => {
    expect(w("pt-BR", "relógio")).toEqual(["clock"]);
    expect(w("pt-BR", "RELOGIO")).toEqual(["clock"]);
    expect(w("pt-BR", "chave porta")).toEqual(["brass_key", "door"]);
    expect(w("pt-BR", "chave de latão porta")).toEqual(["brass_key", "door"]);
    expect(w("pt-BR", "abrir gaveta")).toEqual(["open", "drawer"]);
    expect(w("pt-BR", "inventário")).toEqual(["inventory"]);
    expect(w("pt-BR", "inventario")).toEqual(["inventory"]);
    expect(w("pt-BR", "olhar")).toEqual(["look"]);
    expect(w("pt-BR", "virar")).toEqual(["turn"]);
  });

  it("es: names, global words and accents", () => {
    expect(w("es", "reloj")).toEqual(["clock"]);
    expect(w("es", "abrir cajon")).toEqual(["open", "drawer"]);
    expect(w("es", "llave puerta")).toEqual(["brass_key", "door"]);
    expect(w("es", "mirar")).toEqual(["look"]);
    expect(w("es", "girar")).toEqual(["turn"]);
  });

  it("articles and prepositions are words like any other", () => {
    expect(w("pt-BR", "chave na porta")).toEqual(["brass_key", "na", "door"]);
    expect(w("es", "la llave")).toEqual(["la", "brass_key"]);
    expect(texts(playGame(["chave na porta"], undefined, "pt-BR").last)).toEqual(["Nada acontece."]);
  });

  it("only empty input is a syntax error, in the player's language", () => {
    expect(parserFor("es")("")).toEqual({ ok: false, error: "Escribe un comando." });
    expect(parserFor("pt-BR")("  ")).toEqual({ ok: false, error: "Digite um comando." });
  });

  it("each language has its own words; the internal ids work everywhere", () => {
    expect(texts(playGame(["olhar"], undefined, "es").last)).toEqual(['Aquí no hay "olhar".']);
    expect(texts(playGame(["mirar"]).last)).toEqual(["There is no such mirar."]);
    // Ids (look, clock, brass_key...) are understood in every language.
    expect(w("pt-BR", "clock")).toEqual(["clock"]);
    expect(playGame(["look"], undefined, "pt-BR").last[0]).toMatchObject({ type: "message" });
  });
});

describe("playing in other languages", () => {
  it("engine responses are translated", () => {
    expect(texts(playGame(["quadro"], undefined, "pt-BR").last)).toEqual(['Não há "quadro" aqui.']);
    expect(texts(playGame(["porta"], undefined, "pt-BR").last)).toEqual(['Daqui você não vê "porta".']);
    expect(texts(playGame(["escrivaninha", "abrir escrivaninha"], undefined, "pt-BR").last)).toEqual([
      "Nada acontece.",
    ]);
    expect(texts(playGame(["abrir relógio"], undefined, "pt-BR").last)).toEqual(["Nada acontece."]);
    expect(texts(playGame(["inventário"], undefined, "pt-BR").last)).toEqual(["Você não está carregando nada."]);
    expect(texts(playGame(["0315 gaveta"], undefined, "pt-BR").last)).toEqual([
      "Os discos se encaixam com um clique. A gaveta se abre.\nVocê encontrou uma chave de latão!",
      "[Adicionado ao inventário: Chave de latão]",
    ]);
    expect(texts(playGame(["cuadro"], undefined, "es").last)).toEqual(['Aquí no hay "cuadro".']);
    expect(texts(playGame(["puerta"], undefined, "es").last)).toEqual(['Desde aquí no ves "puerta".']);
    expect(texts(playGame(["girar"], undefined, "es").last)[0]).toBe("Te giras hacia el otro lado de la habitación.");
  });

  it.each(LOCALES)("%s: the whole game can be won with natural commands", (locale) => {
    const { state, last } = playGame(SOLUTIONS[locale], createGameState(loadGame(locale)), locale);
    expect(state.completed).toBe(true);
    expect(texts(last).at(-1)).toBe(LANGUAGES[locale].engine.escaped);
  });

  it("the game state is identical whatever the language", () => {
    const finals = LOCALES.map((locale) =>
      playGame(SOLUTIONS[locale].slice(0, 10), createGameState(loadGame(locale)), locale).state,
    );
    expect(finals[1]).toEqual(finals[0]);
    expect(finals[2]).toEqual(finals[0]);
  });
});
