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
  it("is solved by reading the blocks and the mural, then pressing the pictures and dialing the code", () => {
    const { state, log } = run(["blocks", "turn", "mural", "inventory", "sun moon star 472 door"]);
    expect(texts(log[0])).toEqual([
      "Three wooden blocks, painted by a child's hand. Left to right:\na star with a 2, a sun with a 4, a moon with a 7.",
      "[Blocks: star 2, sun 4, moon 7 added to inventory]",
    ]);
    expect(texts(log[2])).toEqual([
      "A sky painted like a bedtime story, left to right:\nfirst the sun, then the moon, then a single star.",
      "[Mural: sun, moon, star added to inventory]",
    ]);
    expect(texts(log[3])).toEqual(["- Blocks: star 2, sun 4, moon 7\n- Mural: sun, moon, star"]);
    expect(texts(log[4])[0]).toMatch(/^You press the sun, the moon, the star\./);
    expect(texts(log[4])[0]).toContain("narrow corridor lined with books");
    expect(log[4]).toContainEqual(expect.objectContaining({ type: "room_entered", room: "library" }));
    expect(state).toMatchObject({ roomId: "library", inventory: [] });
  });

  it("needs both the pictures and the code, in order", () => {
    for (const line of ["472 door", "sun moon star door", "moon sun star 472 door", "sun moon star 274 door", "472 sun moon star door"]) {
      const { state, last } = run(["turn", line]);
      expect(texts(last), line).toEqual(["Nothing happens."]);
      expect(state.roomId, line).toBe("nursery");
    }
  });

  it("the lock shows its picture buttons and dials", () => {
    const { log } = run(["turn", "door", "open door"]);
    expect(texts(log[1])[0]).toMatch(/three picture buttons, a sun, a moon and a star, above three number dials/);
    expect(texts(log[2])[0]).toMatch(/picture buttons pressed in order,\nthen a code on the dials/);
  });

  it("the pictures are words of their own, not the mural", () => {
    expect(texts(run(["turn", "sun"]).last)).toEqual(["Nothing happens."]);
    expect(run(["turn", "mural"]).state.inventory).toEqual(["mural_note"]);
  });

  it("splits the clues across the cameras", () => {
    const { log } = run(["mural", "472 door", "turn", "blocks"]);
    expect(texts(log[0])).toEqual(["You don't see any mural here."]);
    expect(texts(log[1])).toEqual(["Nothing happens."]);
    expect(texts(log[3])).toEqual(["You don't see any blocks here."]);
  });

  it("records each clue once, however often it is inspected", () => {
    const { state, log } = run(["blocks", "blocks", "turn", "mural", "sky"]);
    expect(texts(log[1])).toHaveLength(1);
    expect(texts(log[4])).toHaveLength(1);
    expect(state.inventory).toEqual(["blocks_note", "mural_note"]);
  });

  it("has a decorative line for every object in the room", () => {
    const lines = ["shelf", "rocking horse", "rattle", "turn", "mobile", "lock"];
    const { log } = run(lines);
    for (const events of log) expect(events.find((e) => e.type === "failure")).toBeUndefined();
  });

  it("skips the hints about clues already found", () => {
    const { state, last } = playGame(["blocks", "turn", "mural", "hint"], start(), "en-US", LATER);
    expect(state.hints).toEqual([2]);
    expect(texts(last)).toEqual([`Hint 3/5: ${nursery.hints![2].text}`]);
  });

  it("is translated", () => {
    const pt = run(["cubos", "virar", "abrir porta", "sol lua estrela 472 porta"], "pt-BR");
    expect(texts(pt.log[0])[1]).toBe("[Adicionado ao inventário: Blocos: estrela 2, sol 4, lua 7]");
    expect(texts(pt.log[2])[0]).toMatch(/^Não abre\. O cadeado quer os botões de figuras apertados em ordem/);
    expect(texts(pt.log[3])[0]).toMatch(/^Você aperta o sol, a lua, a estrela\./);
    expect(pt.state.roomId).toBe("library");

    const es = run(["girar", "cielo", "sol luna estrella 472 puerta"], "es");
    expect(texts(es.log[1])[0]).toBe(
      "Un cielo pintado como un cuento para dormir, de izquierda a derecha:\nprimero el sol, luego la luna, luego una sola estrella.",
    );
    expect(texts(es.log[2])[0]).toContain("un pasillo estrecho, cubierto de libros");
    expect(es.state.roomId).toBe("library");
  });
});
