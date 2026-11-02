import { describe, expect, it } from "vitest";
import { loadGame } from "../../src/content";
import { createInitialState } from "../../src/engine";
import type { Locale } from "../../src/i18n";
import { game, playGame, texts } from "../helpers";

const nursery = game.rooms.nursery;
const start = (locale: Locale = "en-US") => createInitialState(loadGame(locale).rooms.nursery);
const run = (lines: string[], locale: Locale = "en-US") => playGame(lines, start(locale), locale);
const LATER = 7 * 60 * 60_000;

describe("The Nursery", () => {
  it("is solved by reading the blocks, then the mural, then dialing the code", () => {
    const { state, log } = run(["inspect blocks", "turn", "inspect mural", "inventory", "use 472 door"]);
    expect(texts(log[0])).toEqual([
      "Three wooden blocks, painted by a child's hand. Left to right:\na star with a 2, a sun with a 4, a moon with a 7.",
      "[Blocks: star 2, sun 4, moon 7 added to inventory]",
    ]);
    expect(texts(log[2])).toEqual([
      "A sky painted like a bedtime story, left to right:\nfirst the sun, then the moon, then a single star.",
      "[Mural: sun, moon, star added to inventory]",
    ]);
    expect(texts(log[3])).toEqual(["- Blocks: star 2, sun 4, moon 7\n- Mural: sun, moon, star"]);
    expect(texts(log[4])[0]).toContain("narrow corridor lined with books");
    expect(log[4]).toContainEqual(expect.objectContaining({ type: "room_entered", room: "library" }));
    expect(state).toMatchObject({ roomId: "library", inventory: [] });
  });

  it("accepts the code typed with open", () => {
    expect(run(["turn", "open door 472"]).state.roomId).toBe("library");
  });

  it("stays locked for the open verb and for wrong codes, without giving anything away", () => {
    const { state, log } = run(["turn", "open door", "use 247 door", "use 427 door", "use 742 lock"]);
    expect(texts(log[1])).toEqual(["It won't open. The brass lock has three dials, waiting for a code."]);
    for (const events of log.slice(2)) expect(texts(events)).toEqual(["Nothing happens."]);
    expect(state.roomId).toBe("nursery");
  });

  it("splits the clues across the cameras", () => {
    const { log } = run(["inspect mural", "use 472 door", "turn", "inspect blocks"]);
    expect(texts(log[0])).toEqual(["You don't see any mural here."]);
    expect(texts(log[1])).toEqual(["You don't see any door here."]);
    expect(texts(log[3])).toEqual(["You don't see any blocks here."]);
  });

  it("records each clue once, however often it is inspected", () => {
    const { state, log } = run(["inspect blocks", "inspect blocks", "turn", "inspect mural", "inspect sky"]);
    expect(texts(log[1])).toHaveLength(1);
    expect(texts(log[4])).toHaveLength(1);
    expect(state.inventory).toEqual(["blocks_note", "mural_note"]);
  });

  it("has a decorative line for every object in the room", () => {
    const lines = ["inspect shelf", "inspect rocking horse", "inspect rattle", "turn", "inspect mobile", "inspect lock"];
    const { log } = run(lines);
    for (const events of log) expect(events.find((e) => e.type === "failure")).toBeUndefined();
  });

  it("skips the hints about clues already found", () => {
    const { state, last } = playGame(["inspect blocks", "turn", "inspect mural", "hint"], start(), "en-US", LATER);
    expect(state.hints).toEqual([2]);
    expect(texts(last)).toEqual([`Hint 3/5: ${nursery.hints![2].text}`]);
  });

  it("is translated", () => {
    const pt = run(["examinar os cubos", "virar", "abrir a porta", "abrir o cadeado 472"], "pt-BR");
    expect(texts(pt.log[0])[1]).toBe("[Adicionado ao inventário: Blocos: estrela 2, sol 4, lua 7]");
    expect(texts(pt.log[2])).toEqual(["Não abre. O cadeado de latão tem três discos, esperando um código."]);
    expect(pt.state.roomId).toBe("library");

    const es = run(["girar", "examinar el cielo", "usar 472 en el candado"], "es");
    expect(texts(es.log[1])[0]).toBe(
      "Un cielo pintado como un cuento para dormir, de izquierda a derecha:\nprimero el sol, luego la luna, luego una sola estrella.",
    );
    expect(texts(es.log[2])[0]).toContain("un pasillo estrecho, cubierto de libros");
    expect(es.state.roomId).toBe("library");
  });
});
