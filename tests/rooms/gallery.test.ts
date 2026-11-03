import { describe, expect, it } from "vitest";
import { loadGame } from "../../src/content";
import { createInitialState, describeCamera, roomBrightness } from "../../src/engine";
import type { GameState } from "../../src/engine";
import type { Locale } from "../../src/i18n";
import { game, playGame, texts } from "../helpers";
import { solution } from "../solutions";

const gallery = game.rooms.gallery;
const start = (locale: Locale = "en-US") => createInitialState(loadGame(locale).rooms.gallery);
const run = (lines: string[], from: GameState = start(), locale: Locale = "en-US") => playGame(lines, from, locale);

/** Gas lit, back at the portraits (camera A). */
const LIT = ["turn", "open bench", "wheel valve", "turn"];
/** Key in hand, the iron door uncovered, standing before it (camera C). */
const READY = [...LIT, "cornelius", "turn", "open portrait"];

describe("The Portrait Gallery", () => {
  it("is solved by its solution and leads to the trophy room", () => {
    const { state, last } = run(solution("gallery"));
    expect(texts(last)[0]).toMatch(/suits of armour stand guard/);
    expect(last).toContainEqual(expect.objectContaining({ type: "room_entered", room: "armory" }));
    expect(state.roomId).toBe("armory");
  });

  it("the valve needs the wheel hidden under the bench cushion", () => {
    const bare = run(["turn", "open valve"]);
    expect(texts(bare.last)[0]).toMatch(/needs a wheel/);
    const { state, log } = run(["turn", "bench", "open bench", "open bench"]);
    expect(texts(log[1])[0]).toMatch(/lumpy/);
    expect(texts(log[2])).toContain("[Valve wheel added to inventory]");
    expect(texts(log[3])[0]).toMatch(/Nothing else/);
    expect(state.inventory).toEqual(["valve_wheel"]);
  });

  it("is dark until the gas is lit", () => {
    expect(roomBrightness(start(), gallery)).toBe(0.4);
    const lit = run(LIT);
    expect(roomBrightness(lit.state, gallery)).toBe(1.1);
    expect(lit.state.inventory).toEqual([]);
    expect(describeCamera(lit.state, gallery, "A")).toMatch(/^Gaslight warms/);
    expect(texts(run(["sconces"], lit.state).last)[0]).toMatch(/gas burns/);
  });

  it("the plaques and the portraits can't be read in the dark", () => {
    const { state, log } = run(["plaques", "cornelius"]);
    expect(texts(log[0])[0]).toMatch(/Too dark to read/);
    expect(texts(log[1])[0]).toMatch(/Too dark/);
    expect(state.inventory).toEqual([]);
  });

  it("the plaques and the bust are noted once", () => {
    const { state, log } = run([...LIT, "plaques", "names", "bust", "inscription", "inventory"]);
    expect(texts(log[4])[0]).toContain("CORNELIUS · 1844   AMBROSE · 1753   DOROTHEA · 1877   BEATRICE · 1810");
    expect(texts(log[6])[0]).toContain("FROM THE FIRST OF US TO THE LAST, EACH BY THE LAST FIGURE OF OUR BIRTH.");
    expect(state.inventory).toEqual(["plaques_note", "bust_note"]);
    expect(texts(log[8])).toEqual([
      "- Plaques: Cornelius 1844, Ambrose 1753, Dorothea 1877, Beatrice 1810\n- Bust: first to last, last figure of each birth",
    ]);
  });

  it("the bust can be read by touch, even in the dark", () => {
    expect(run(["bust"]).state.inventory).toEqual(["bust_note"]);
  });

  it("Cornelius hides the small key, found once and only in the light", () => {
    const { state, last } = run([...LIT, "cornelius", "cornelius", "pipe"]);
    expect(state.inventory).toEqual(["small_key"]);
    expect(texts(last)[0]).toMatch(/now empty/);
  });

  it("the iron door is hidden behind the lady's portrait", () => {
    const hidden = run(["turn", "safe"]);
    expect(texts(hidden.last)).toEqual(["You see only faded wallpaper."]);
    const { state, log } = run(["turn", "portrait", "open portrait", "open lady", "safe"]);
    expect(texts(log[1])[0]).toMatch(/crooked/);
    expect(texts(log[2])[0]).toMatch(/iron door with four brass dials and a keyhole/);
    expect(texts(log[3])).toEqual(["It's already open."]);
    expect(state.flags.portrait_open).toBe(true);
    expect(describeCamera(state, gallery, "C")).toMatch(/iron door/);
  });

  it("key and code must be given together, the key first", () => {
    const { state, log } = run([...READY, "key safe", "3047 safe", "open safe"]);
    expect(texts(log[READY.length])[0]).toMatch(/turns halfway and stops/);
    expect(texts(log[READY.length + 1])).toEqual(["Nothing happens."]);
    expect(texts(log[READY.length + 2])[0]).toMatch(/won't move/);
    expect(state.roomId).toBe("gallery");
  });

  it.each(["key 4370 safe", "key 3074 safe", "3047 key safe", "key 0347 safe", "key 3047"])(
    "anything else does nothing: %s",
    (line) => {
      const { state, last } = run([line], run(READY).state);
      expect(texts(last)).toEqual(["Nothing happens."]);
      expect(state.roomId).toBe("gallery");
    },
  );

  it("the code does nothing while the portrait still covers the door", () => {
    const { state, last } = run([...LIT, "cornelius", "turn", "key 3047 safe"]);
    expect(texts(last)).toEqual(["Nothing happens."]);
    expect(state.roomId).toBe("gallery");
  });

  it("objects belong to their camera", () => {
    expect(texts(run(["bench"]).last)).toEqual(["You don't see any bench here."]);
    expect(texts(run(["turn", "bust"]).last)).toEqual(["You don't see any bust here."]);
  });

  it("has a decorative line for every object", () => {
    const { log } = run(["ancestors", "ambrose", "beatrice", "dorothea", "window", "rug", "turn", "valve", "rug"]);
    for (const events of log) expect(events.find((e) => e.type === "failure")).toBeUndefined();
  });

  it("is translated", () => {
    const pt = run(solution("gallery", "pt-BR"), start("pt-BR"), "pt-BR");
    expect(pt.state.roomId).toBe("armory");
    expect(texts(pt.log[4])[1]).toBe("[Adicionado ao inventário: Placas: Cornelius 1844, Ambrose 1753, Dorothea 1877, Beatrice 1810]");
    const es = run(["girar", "abrir banco", "volante válvula"], start("es"), "es");
    expect(texts(es.last)[0]).toMatch(/^El volante encaja en el eje/);
    const esWin = run(solution("gallery", "es"), start("es"), "es");
    expect(texts(esWin.last)[0]).toMatch(/armaduras montan guardia/);
  });
});
