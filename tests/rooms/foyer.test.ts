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
const KEYS = ["open coat", "umbrella stand", "open grandfather clock", "turn", "handle winch", "chandelier"];

describe("The Grand Foyer", () => {
  it("is the last level", () => {
    expect(game.order.at(-1)).toBe("foyer");
  });

  it("collects three keys, then turns them together in the door's order", () => {
    const { state, log } = run(KEYS);
    expect(state.inventory).toEqual(["iron_key", "silver_key", "gold_key"]);
    expect(texts(log[0])).toContain("[Iron key added to inventory]");
    expect(texts(log[1])[0]).toMatch(/You found a silver key!/);
    expect(texts(log[4])).toContain("[Crank handle removed from inventory]");

    const won = run(["gold silver iron door"], state);
    expect(texts(won.last)[0]).toMatch(/^Gold, then silver, then iron: the locks give way from the floor up\./);
    expect(texts(won.last)).toContain("You escaped!");
    expect(won.state).toMatchObject({ roomId: "foyer", completed: true, inventory: [] });
  });

  it("the door shows the locks' order and the inscription, and notes them", () => {
    const { state, last } = run(["turn", "door", "door"]);
    expect(texts(last)[0]).toMatch(/iron at the top, silver in the middle, gold at the bottom.*FROM THE EARTH TO THE SKY/s);
    expect(state.inventory).toEqual(["door_note"]);
  });

  it.each(["iron silver gold door", "gold iron silver door", "silver gold iron door", "gold silver door", "gold silver iron"])(
    "any other order or a missing key does nothing: %s",
    (line) => {
      const { state, last } = run([line], run(KEYS).state);
      expect(texts(last)).toEqual(["Nothing happens."]);
      expect(state.completed).toBe(false);
      expect(state.inventory).toEqual(["iron_key", "silver_key", "gold_key"]);
    },
  );

  it("the door does not open by hand, and one key alone won't turn", () => {
    const { state, log } = run([...KEYS, "open door", "iron key door"]);
    expect(texts(log[KEYS.length])).toEqual(["It won't move. The locks hold it shut."]);
    expect(texts(log[KEYS.length + 1])[0]).toMatch(/won't turn alone\.\nThe three locks are linked/);
    expect(state.completed).toBe(false);
    expect(state.inventory).toEqual(["iron_key", "silver_key", "gold_key"]);
  });

  it("keys must be held: the phrase does nothing before they are found", () => {
    const { state, last } = run(["turn", "gold silver iron door"]);
    expect(texts(last)).toEqual(["Nothing happens."]);
    expect(state.completed).toBe(false);
  });

  it("the gold key is out of reach until the chandelier is lowered", () => {
    const high = run(["turn", "chandelier"]);
    expect(texts(high.last)[0]).toMatch(/out of reach/);
    expect(high.state.inventory).toEqual([]);
    const crankless = run(["turn", "handle winch", "winch"]);
    expect(texts(crankless.last)[0]).toMatch(/crank handle is missing/);
    expect(crankless.state.flags.chandelier_lowered).toBe(false);
  });

  it("the winch only works with the handle, which stays on it", () => {
    const { state } = run(["open grandfather clock", "turn", "handle winch", "handle winch"]);
    expect(state.flags.chandelier_lowered).toBe(true);
    expect(state.inventory).toEqual([]);
  });

  it("never hands out a reward twice", () => {
    const { state } = run([
      "open coat", "open coat", "coat",
      "umbrella stand", "umbrellas",
      "open clock", "open clock",
      "turn", "crank winch", "chandelier", "crystals",
    ]);
    expect(state.inventory).toEqual(["iron_key", "silver_key", "gold_key"]);
  });

  it("objects belong to their camera", () => {
    expect(texts(run(["door"]).last)).toEqual(["You don't see any door here."]);
    expect(texts(run(["turn", "coat"]).last)).toEqual(["You don't see any coat here."]);
    expect(texts(run(["turn", "open coat"]).last)).toEqual(["Nothing happens."]);
  });

  it("is dim until the door opens onto the dawn", () => {
    const keys = run(KEYS).state;
    expect(roomBrightness(start(), foyer)).toBe(0.6);
    expect(roomBrightness(keys, foyer)).toBe(0.6);
    expect(roomBrightness(run(["gold silver iron door"], keys).state, foyer)).toBe(1.25);
  });

  it("camera C shows the chandelier lowered", () => {
    const lowered = run(KEYS.slice(0, 5)).state;
    expect(describeCamera(start(), foyer, "C")).toMatch(/High above, a crystal chandelier/);
    expect(describeCamera(lowered, foyer, "C")).toMatch(/hangs low now/);
    expect(texts(run(["look"], lowered).last)).toEqual([describeCamera(lowered, foyer, "C")]);
  });

  it("is translated", () => {
    const pt = run(["abrir sobretudo"], start("pt-BR"), "pt-BR");
    expect(texts(pt.last)).toEqual([
      "Você revira os bolsos. Fiapos, uma mariposa morta... e metal frio.\nVocê encontrou uma chave de ferro!",
      "[Adicionado ao inventário: Chave de ferro]",
    ]);
    const es = run(["girar", "candelabro"], start("es"), "es");
    expect(texts(es.last)).toEqual([
      "Un candelabro de cristal en lo alto, fuera de tu alcance.\nAlgo dorado brilla entre los cristales.",
    ]);
    const ptWin = run(
      ["abrir sobretudo", "guarda-chuvas", "abrir relógio", "virar", "manivela guincho", "lustre", "ouro prata ferro porta"],
      start("pt-BR"),
      "pt-BR",
    );
    expect(ptWin.state.completed).toBe(true);
    expect(texts(ptWin.last)[0]).toMatch(/^Ouro, depois prata, depois ferro/);
  });
});
