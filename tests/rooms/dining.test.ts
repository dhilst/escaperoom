import { describe, expect, it } from "vitest";
import { loadGame } from "../../src/content";
import { createInitialState, describeCamera, roomBrightness } from "../../src/engine";
import type { GameState } from "../../src/engine";
import type { Locale } from "../../src/i18n";
import { game, playGame, texts } from "../helpers";
import { solution } from "../solutions";

const dining = game.rooms.dining;
const start = (locale: Locale = "en-US") => createInitialState(loadGame(locale).rooms.dining);
const run = (lines: string[], from: GameState = start(), locale: Locale = "en-US") => playGame(lines, from, locale);
const LATER = 7 * 60 * 60_000;

/** Candles lit, standing at the portrait and bells (camera C). */
const LIT = ["open sideboard", "lighter candelabra", "turn"];

describe("The Dining Hall", () => {
  it("comes right after the laundry", () => {
    expect(game.order[game.order.indexOf("dining") - 1]).toBe("laundry");
  });

  it("is solved by its solution and leads to the music room", () => {
    const { state, last } = run(solution("dining"));
    expect(texts(last)[0]).toMatch(/^Edmund, Agnes, Clara, Henry: the bells ring out/);
    expect(texts(last)[0]).toMatch(/silent instruments\.$/);
    expect(last).toContainEqual(expect.objectContaining({ type: "room_entered", room: "musicroom" }));
    expect(state).toMatchObject({ roomId: "musicroom", inventory: [] });
  });

  it("the sideboard gives the lighter once, and it lights the candelabra", () => {
    const { state, log } = run(["open sideboard", "open sideboard", "lighter candelabra", "candelabra"]);
    expect(texts(log[0])).toContain("[Silver lighter added to inventory]");
    expect(texts(log[1])).toEqual(["Only tarnished spoons are left."]);
    expect(texts(log[2])).toContain("[Silver lighter removed from inventory]");
    expect(texts(log[3])[0]).toMatch(/Four flames lean/);
    expect(state.flags.candles_lit).toBe(true);
    expect(state.inventory).toEqual([]);
  });

  it("the portrait's plaque can't be read in the dark", () => {
    const { state, last } = run(["turn", "portrait"]);
    expect(texts(last)[0]).toMatch(/too dark to read/);
    expect(state.inventory).toEqual([]);
  });

  it("in candlelight the plaque gives the ages, noted once", () => {
    const { state, log } = run([...LIT, "portrait", "plaque", "inventory"]);
    expect(texts(log[3])).toEqual([
      "A father, a mother, a grown daughter and a small boy stare down at the table.\nThe brass plaque reads: HENRY, AGED 52 · CLARA, 47 · AGNES, 19 · LITTLE EDMUND, 9.",
      "[Plaque: Henry 52, Clara 47, Agnes 19, Edmund 9 added to inventory]",
    ]);
    expect(texts(log[4])).toHaveLength(1);
    expect(state.inventory).toEqual(["plaque_note"]);
  });

  it("the place cards and the bell board are noted once each", () => {
    const { state, log } = run(["cards", "card", "turn", "bells", "bell board"]);
    expect(texts(log[0])[1]).toBe("[Place cards: Clara, Henry, Edmund, Agnes added to inventory]");
    expect(texts(log[1])).toHaveLength(1);
    expect(texts(log[3])[0]).toMatch(/"Ring for dinner as the family sat: youngest first, eldest last\."/);
    expect(texts(log[4])).toHaveLength(1);
    expect(state.inventory).toEqual(["cards_note", "bells_note"]);
  });

  it.each([
    "clara henry edmund agnes bells", // the order of the place cards
    "henry clara agnes edmund bells", // eldest first
    "edmund agnes clara bells",
    "edmund agnes clara henry",
    "edmund bells",
    "agnes edmund clara henry bells",
  ])("any other order or a missing name does nothing: %s", (line) => {
    const { state, last } = run(["turn", line]);
    expect(texts(last)).toEqual(["Nothing happens."]);
    expect(state.roomId).toBe("dining");
  });

  it("the names alone are words of the room, not objects", () => {
    expect(texts(run(["turn", "henry"]).last)).toEqual(["Nothing happens."]);
  });

  it("objects belong to their camera", () => {
    expect(texts(run(["bells"]).last)).toEqual(["You don't see any bells here."]);
    expect(texts(run(["turn", "candelabra"]).last)).toEqual(["You don't see any candelabra here."]);
    expect(texts(run(["edmund agnes clara henry bells"]).last)).toEqual(["Nothing happens."]);
  });

  it("has a decorative line for every object in the room", () => {
    const lines = ["table", "cards", "chairs", "candelabra", "sideboard", "curtains", "turn", "portrait", "fireplace", "bells", "panelling"];
    for (const events of run(lines).log) expect(events.find((e) => e.type === "failure")).toBeUndefined();
  });

  it("is dim until the candles burn", () => {
    expect(roomBrightness(start(), dining)).toBe(0.45);
    expect(roomBrightness(run(LIT).state, dining)).toBe(1.1);
    expect(describeCamera(start(), dining, "C")).toMatch(/faces lost in shadow/);
    expect(describeCamera(run(LIT).state, dining, "C")).toMatch(/Candlelight finds the faces/);
  });

  it("skips the hints about steps already done", () => {
    const { state, last } = playGame([...LIT, "portrait", "hint"], start(), "en-US", LATER);
    expect(state.hints).toEqual([3]);
    expect(texts(last)).toEqual([`Hint 4/5: ${dining.hints![3].text}`]);
  });

  it("is translated", () => {
    const pt = run(solution("dining", "pt-BR"), start("pt-BR"), "pt-BR");
    expect(texts(pt.log[0])).toContain("[Adicionado ao inventário: Isqueiro de prata]");
    expect(texts(pt.last)[0]).toMatch(/^Edmund, Agnes, Clara, Henry: as campainhas tocam/);
    expect(pt.state.roomId).toBe("musicroom");

    const es = run(["girar", "campanillas"], start("es"), "es");
    expect(texts(es.last)[1]).toBe("[Añadido al inventario: Campanillas: el menor primero, el mayor al final]");
    expect(texts(run(["girar", "retrato"], start("es"), "es").last)[0]).toMatch(/demasiado oscura/);
  });
});
