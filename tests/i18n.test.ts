import { describe, expect, it } from "vitest";
import { loadGame, rawContent } from "../src/content";
import { buildAliasMap, createGameState, parse } from "../src/engine";
import { LANGUAGES, LOCALES, localeFromParam, localize, missingTranslations, type Locale } from "../src/i18n";
import { playGame, texts } from "./helpers";
import { fullSolution } from "./solutions";

const parserFor = (locale: Locale, roomId = "study") => {
  const language = LANGUAGES[locale].parser;
  const aliases = buildAliasMap(loadGame(locale).rooms[roomId], language);
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
  it("pt-BR: verbs, articles, prepositions and accents", () => {
    const p = parserFor("pt-BR");
    expect(p("examinar o relógio")).toMatchObject({ ok: true, command: { verb: "inspect", object: "clock" } });
    expect(p("EXAMINAR relogio")).toMatchObject({ ok: true, command: { verb: "inspect", object: "clock" } });
    expect(p("inspecionar a gaveta")).toMatchObject({ ok: true, command: { verb: "inspect", object: "drawer" } });
    expect(p("usar a chave na porta")).toMatchObject({ ok: true, command: { verb: "use", item: "brass_key", target: "door" } });
    expect(p("usar chave de latão porta")).toMatchObject({
      ok: true,
      command: { verb: "use", item: "brass_key", target: "door" },
    });
    expect(p("inventário")).toMatchObject({ ok: true, command: { verb: "inventory" } });
    expect(p("inventario")).toMatchObject({ ok: true, command: { verb: "inventory" } });
    expect(p("olhar")).toMatchObject({ ok: true, command: { verb: "look" } });
    expect(p("virar")).toMatchObject({ ok: true, command: { verb: "turn" } });
  });

  it("es: verbs, articles, prepositions and accents", () => {
    const p = parserFor("es");
    expect(p("examinar el reloj")).toMatchObject({ ok: true, command: { verb: "inspect", object: "clock" } });
    expect(p("abrir el cajon")).toMatchObject({ ok: true, command: { verb: "open", object: "drawer" } });
    expect(p("usar la llave en la puerta")).toMatchObject({
      ok: true,
      command: { verb: "use", item: "brass_key", target: "door" },
    });
    expect(p("mirar")).toMatchObject({ ok: true, command: { verb: "look" } });
    expect(p("girar")).toMatchObject({ ok: true, command: { verb: "turn" } });
  });

  it("English articles and prepositions are ignored too", () => {
    const p = parserFor("en-US");
    expect(p("use the key on the door")).toMatchObject({
      ok: true,
      command: { verb: "use", item: "brass_key", target: "door" },
    });
    expect(p("inspect the clock")).toMatchObject({ ok: true, command: { verb: "inspect", object: "clock" } });
  });

  it("syntax errors are reported in the player's language", () => {
    expect(parserFor("pt-BR")("dançar")).toMatchObject({
      ok: false,
      error: 'Comando desconhecido "dancar". Tente: olhar, virar, examinar, abrir, usar, inventário, ajuda.',
    });
    expect(parserFor("pt-BR")("usar chave")).toEqual({ ok: false, error: "Uso: usar <item> <alvo>" });
    expect(parserFor("es")("examinar")).toEqual({ ok: false, error: "Uso: examinar <objeto>" });
    expect(parserFor("es")("")).toEqual({ ok: false, error: "Escribe un comando." });
  });

  it("each language only accepts its own verbs", () => {
    expect(parserFor("pt-BR")("look").ok).toBe(false);
    expect(parserFor("es")("olhar").ok).toBe(false);
    expect(parserFor("en-US")("mirar").ok).toBe(false);
  });
});

describe("playing in other languages", () => {
  it("engine responses are translated", () => {
    expect(texts(playGame(["examinar o quadro"], undefined, "pt-BR").last)).toEqual(['Não há "quadro" aqui.']);
    expect(texts(playGame(["examinar a porta"], undefined, "pt-BR").last)).toEqual(['Daqui você não vê "porta".']);
    expect(texts(playGame(["examinar a escrivaninha", "abrir a escrivaninha"], undefined, "pt-BR").last)).toEqual([
      "Nada acontece.",
    ]);
    expect(texts(playGame(["abrir o relógio"], undefined, "pt-BR").last)).toEqual(["Nada acontece."]);
    expect(texts(playGame(["inventário"], undefined, "pt-BR").last)).toEqual(["Você não está carregando nada."]);
    expect(texts(playGame(["usar 0315 na gaveta"], undefined, "pt-BR").last)).toEqual([
      "Os discos se encaixam com um clique. A gaveta se abre.\nVocê encontrou uma chave de latão!",
      "[Adicionado ao inventário: Chave de latão]",
    ]);
    expect(texts(playGame(["examinar el cuadro"], undefined, "es").last)).toEqual(['Aquí no hay "cuadro".']);
    expect(texts(playGame(["examinar la puerta"], undefined, "es").last)).toEqual(['Desde aquí no ves "puerta".']);
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
