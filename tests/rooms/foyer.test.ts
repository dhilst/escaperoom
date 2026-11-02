import { describe, expect, it } from "vitest";
import { loadGame } from "../../src/content";
import { createInitialState, describeCamera, roomBrightness } from "../../src/engine";
import type { GameState } from "../../src/engine";
import type { Locale } from "../../src/i18n";
import { game, playGame, texts } from "../helpers";

const foyer = game.rooms.foyer;
const start = (locale: Locale = "en-US") => createInitialState(loadGame(locale).rooms.foyer);
const run = (lines: string[], from: GameState = start(), locale: Locale = "en-US") => playGame(lines, from, locale);

/** All three keys in hand, standing at the door (camera C). */
const KEYS = ["open coat", "inspect umbrella stand", "open grandfather clock", "turn", "use handle winch", "inspect chandelier"];
const LOCKS = ["use iron key door", "use silver key door", "use gold key door"];

describe("The Grand Foyer", () => {
  it("is the last level", () => {
    expect(game.order.at(-1)).toBe("foyer");
  });

  it("collects three keys, then each key turns its own lock", () => {
    const { state, log } = run(KEYS);
    expect(state.inventory).toEqual(["iron_key", "silver_key", "gold_key"]);
    expect(texts(log[0])).toContain("[Iron key added to inventory]");
    expect(texts(log[1])[0]).toMatch(/You found a silver key!/);
    expect(texts(log[4])).toContain("[Crank handle removed from inventory]");

    const first = run(LOCKS.slice(0, 2), state);
    expect(first.state.flags).toMatchObject({ iron_turned: true, silver_turned: true, gold_turned: false, door_open: false });
    expect(first.state.completed).toBe(false);
    expect(first.state.inventory).toEqual(["gold_key"]);

    const last = run([LOCKS[2]], first.state);
    expect(texts(last.last)[1]).toMatch(/^The last lock turns\. The great door groans and swings wide onto a grey dawn/);
    expect(texts(last.last)).toContain("You escaped!");
    expect(last.state).toMatchObject({ roomId: "foyer", completed: true });
  });

  it.each([
    [0, 1, 2],
    [0, 2, 1],
    [1, 0, 2],
    [1, 2, 0],
    [2, 0, 1],
    [2, 1, 0],
  ])("the locks can be turned in any order (%i %i %i)", (...order) => {
    const keys = run(KEYS).state;
    const { state, log } = run(order.map((i) => LOCKS[i]), keys);
    expect(log.slice(0, 2).every((events) => !events.some((e) => e.type === "game_completed"))).toBe(true);
    expect(state.completed).toBe(true);
    expect(state.inventory).toEqual([]);
  });

  it("the door does not open by hand, and a turned lock stays turned", () => {
    const { state, last } = run([...KEYS, "open door", "use iron key door", "use iron key door"]);
    expect(texts(last)).toEqual(["Nothing happens."]);
    expect(state.flags.iron_turned).toBe(true);
    expect(state.completed).toBe(false);
  });

  it("keys must be held: no lock turns before they are found", () => {
    const { state } = run(["turn", "use iron key door", "use silver key door", "use gold key door"]);
    expect(state.flags).toMatchObject({ iron_turned: false, silver_turned: false, gold_turned: false });
    expect(state.completed).toBe(false);
  });

  it("the gold key is out of reach until the chandelier is lowered", () => {
    const high = run(["turn", "inspect chandelier"]);
    expect(texts(high.last)[0]).toMatch(/out of reach/);
    expect(high.state.inventory).toEqual([]);
    const crankless = run(["turn", "use handle winch", "inspect winch"]);
    expect(texts(crankless.last)[0]).toMatch(/crank handle is missing/);
    expect(crankless.state.flags.chandelier_lowered).toBe(false);
  });

  it("the winch only works with the handle, which stays on it", () => {
    const { state } = run(["open grandfather clock", "turn", "use handle winch", "use handle winch"]);
    expect(state.flags.chandelier_lowered).toBe(true);
    expect(state.inventory).toEqual([]);
  });

  it("never hands out a reward twice", () => {
    const { state } = run([
      "open coat", "open coat", "inspect coat",
      "inspect umbrella stand", "inspect umbrellas",
      "open clock", "open clock",
      "turn", "use crank winch", "inspect chandelier", "inspect crystals",
    ]);
    expect(state.inventory).toEqual(["iron_key", "silver_key", "gold_key"]);
  });

  it("objects belong to their camera", () => {
    expect(texts(run(["open door"]).last)).toEqual(["You don't see any door here."]);
    expect(texts(run(["turn", "open coat"]).last)).toEqual(["You don't see any coat here."]);
  });

  it("is dim until the door opens onto the dawn", () => {
    const keys = run(KEYS).state;
    expect(roomBrightness(start(), foyer)).toBe(0.6);
    expect(roomBrightness(keys, foyer)).toBe(0.6);
    expect(roomBrightness(run(LOCKS, keys).state, foyer)).toBe(1.25);
  });

  it("camera C shows the chandelier lowered", () => {
    const lowered = run(KEYS.slice(0, 5)).state;
    expect(describeCamera(start(), foyer, "C")).toMatch(/High above, a crystal chandelier/);
    expect(describeCamera(lowered, foyer, "C")).toMatch(/hangs low now/);
    expect(texts(run(["look"], lowered).last)).toEqual([describeCamera(lowered, foyer, "C")]);
  });

  it("is translated", () => {
    const pt = run(["abrir o sobretudo"], start("pt-BR"), "pt-BR");
    expect(texts(pt.last)).toEqual([
      "Você revira os bolsos. Fiapos, uma mariposa morta... e metal frio.\nVocê encontrou uma chave de ferro!",
      "[Adicionado ao inventário: Chave de ferro]",
    ]);
    const es = run(["girar", "examinar el candelabro"], start("es"), "es");
    expect(texts(es.last)).toEqual([
      "Un candelabro de cristal en lo alto, fuera de tu alcance.\nAlgo dorado brilla entre los cristales.",
    ]);
    const ptWin = run(
      ["abrir o sobretudo", "examinar os guarda-chuvas", "abrir o relógio", "virar", "usar a manivela no guincho",
       "examinar o lustre", "usar a chave de ouro nas fechaduras", "usar a chave de prata na porta", "usar ferro na porta"],
      start("pt-BR"),
      "pt-BR",
    );
    expect(ptWin.state.completed).toBe(true);
    expect(texts(ptWin.last)[1]).toMatch(/^A última fechadura gira\./);
  });
});
