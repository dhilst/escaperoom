import { describe, expect, it } from "vitest";
import { loadGame } from "../../src/content";
import { createInitialState, describeCamera, roomBrightness } from "../../src/engine";
import type { GameState } from "../../src/engine";
import type { Locale } from "../../src/i18n";
import { game, playGame, texts } from "../helpers";
import { solution } from "../solutions";

const laundry = game.rooms.laundry;
const start = (locale: Locale = "en-US") => createInitialState(loadGame(locale).rooms.laundry);
const run = (lines: string[], from: GameState = start(), locale: Locale = "en-US") => playGame(lines, from, locale);
const LATER = 7 * 60 * 60_000;

/** Pillowcase pressed, soap and key in hand, boiler lit, standing at the door (camera C). */
const READY = ["washtub", "pillowcase mangle", "soap dish", "turn", "basket", "turn", "tinderbox boiler", "turn", "5183 press"];

describe("The Laundry", () => {
  it("comes right after the kitchen", () => {
    expect(game.order.indexOf("laundry")).toBe(game.order.indexOf("kitchen") + 1);
  });

  it("is solved by its solution and leads to the dining hall", () => {
    const { state, last } = run(solution("laundry"));
    expect(texts(last)[0]).toMatch(/^You rub the key with the lye soap/);
    expect(texts(last)[0]).toContain("a table laid for a dinner no one came to eat");
    expect(last).toContainEqual(expect.objectContaining({ type: "room_entered", room: "dining" }));
    expect(state).toMatchObject({ roomId: "dining", inventory: [] });
  });

  it("the washtub gives up the pillowcase once", () => {
    const { state, log } = run(["washtub", "washtub", "water"]);
    expect(texts(log[0])).toContain("[Pillowcase added to inventory]");
    expect(texts(log[1])).toEqual(["Grey water, cold and still. Nothing else lies at the bottom."]);
    expect(state.inventory).toEqual(["pillowcase"]);
  });

  it("the embroidery needs both the mangle and the firelight", () => {
    const wet = run(["washtub", "pillowcase"]);
    expect(texts(wet.last)[0]).toMatch(/lost in the folds/);
    const dark = run(["washtub", "pillowcase mangle", "pillowcase"]);
    expect(texts(dark.last)[0]).toMatch(/can't make it out/);
    expect(dark.state.inventory).toEqual(["pillowcase"]);
    const unpressed = run(["washtub", "turn", "basket", "turn", "tinderbox boiler", "pillowcase"]);
    expect(texts(unpressed.last)[0]).toMatch(/lost in the folds/);
  });

  it("reading the pressed pillowcase by firelight notes the code, once", () => {
    const { state, log } = run(["washtub", "pillowcase mangle", "turn", "basket", "turn", "tinderbox boiler", "pillowcase", "pillowcase", "inventory"]);
    expect(texts(log[6])).toEqual([
      "In the firelight the white thread shows: a curly H above four numbers.\n5 1 8 3",
      "[Monogram: 5 1 8 3 added to inventory]",
    ]);
    expect(texts(log[7])).toHaveLength(1);
    expect(texts(log[8])).toEqual(["- Pillowcase\n- Monogram: 5 1 8 3"]);
    expect(state.inventory).toEqual(["pillowcase", "monogram_note"]);
  });

  it("the boiler wants a spark; the tinderbox is used up", () => {
    expect(texts(run(["open boiler"]).last)[0]).toMatch(/only wants a spark/);
    const { state, last } = run(["turn", "basket", "turn", "tinderbox boiler", "boiler"]);
    expect(texts(last)).toEqual(["The firebox roars. The copper ticks and sighs as it warms."]);
    expect(state.flags.boiler_lit).toBe(true);
    expect(state.inventory).toEqual([]);
  });

  it("the press opens only to its code, and gives the key once", () => {
    const wrong = run(["turn", "1583 press", "0315 press", "open press"]);
    expect(texts(wrong.log[1])).toEqual(["Nothing happens."]);
    expect(texts(wrong.last)[0]).toMatch(/^Locked/);
    expect(wrong.state.flags.press_open).toBe(false);
    const { state, last } = run(["turn", "5183 press", "5183 press", "press"]);
    expect(texts(last)).toEqual(["Folded linen, smelling of lavender. Nothing else."]);
    expect(state.inventory).toEqual(["brass_key"]);
  });

  it("the key alone sticks in the rusty lock", () => {
    const { state, last } = run([...READY, "key door"]);
    expect(texts(last)).toEqual(["The key slides in, but it won't turn. The old lock is stiff with rust.\nIt needs something to make it slip."]);
    expect(state.roomId).toBe("laundry");
  });

  it("any other phrase at the door does nothing", () => {
    for (const line of ["soap door", "key soap door", "soap key", "door soap key", "soap key press"]) {
      const { state, last } = run([...READY, line]);
      expect(texts(last), line).toEqual(["Nothing happens."]);
      expect(state.roomId, line).toBe("laundry");
    }
    // without the soap
    const { state, last } = run(["turn", "5183 press", "soap key door"]);
    expect(texts(last)).toEqual(["Nothing happens."]);
    expect(state.roomId).toBe("laundry");
  });

  it("never hands out a reward twice", () => {
    const { state } = run(["washtub", "washtub", "soap dish", "dish", "turn", "basket", "laundry", "5183 press", "5183 press"]);
    expect(state.inventory).toEqual(["pillowcase", "soap", "tinderbox", "brass_key"]);
  });

  it("objects belong to their camera", () => {
    expect(texts(run(["press"]).last)).toEqual(["You don't see any press here."]);
    expect(texts(run(["turn", "mangle"]).last)).toEqual(["You don't see any mangle here."]);
    expect(texts(run(["5183 press"]).last)).toEqual(["Nothing happens."]);
  });

  it("has a decorative line for every object in the room", () => {
    const { log } = run(["boiler", "scuttle", "washtub", "mangle", "soap dish", "window", "turn", "clothesline", "basket", "press", "irons", "door"]);
    for (const events of log) expect(events.find((e) => e.type === "failure")).toBeUndefined();
  });

  it("is dim until the boiler is lit", () => {
    expect(roomBrightness(start(), laundry)).toBe(0.45);
    expect(roomBrightness(run(["turn", "basket", "turn", "tinderbox boiler"]).state, laundry)).toBe(1.1);
    const lit = run(["turn", "basket", "turn", "tinderbox boiler"]).state;
    expect(describeCamera(start(), laundry, "A")).toMatch(/cold brick firebox/);
    expect(describeCamera(lit, laundry, "A")).toMatch(/roaring firebox/);
    expect(describeCamera(lit, laundry, "C")).toMatch(/^Firelight flickers/);
  });

  it("skips the hints about steps already done", () => {
    const { state, last } = playGame(["washtub", "pillowcase mangle", "hint"], start(), "en-US", LATER);
    expect(state.hints).toEqual([2]);
    expect(texts(last)).toEqual([`Hint 3/5: ${laundry.hints![2].text}`]);
  });

  it("is translated", () => {
    const pt = run(["tina", "fronha calandra", "virar", "cesto", "virar", "pederneira caldeira", "fronha"], start("pt-BR"), "pt-BR");
    expect(texts(pt.log[0])).toContain("[Adicionado ao inventário: Fronha]");
    expect(texts(pt.last)).toEqual([
      "À luz do fogo, a linha branca aparece: um H rebuscado sobre quatro números.\n5 1 8 3",
      "[Adicionado ao inventário: Monograma: 5 1 8 3]",
    ]);
    const ptWin = run(solution("laundry", "pt-BR"), start("pt-BR"), "pt-BR");
    expect(texts(ptWin.last)[0]).toMatch(/^Você esfrega a chave no sabão/);
    expect(ptWin.state.roomId).toBe("dining");

    const es = run(["girar", "5183 armario", "llave puerta"], start("es"), "es");
    expect(texts(es.last)[0]).toMatch(/^La llave entra, pero no gira/);
    const esWin = run(solution("laundry", "es"), start("es"), "es");
    expect(texts(esWin.last)[0]).toMatch(/^Frotas la llave con el jabón/);
    expect(esWin.state.roomId).toBe("dining");
  });
});
