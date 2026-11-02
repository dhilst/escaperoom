import { describe, expect, it } from "vitest";
import { loadGame } from "../../src/content";
import { createInitialState, describeCamera, roomBrightness } from "../../src/engine";
import { game, playGame, texts } from "../helpers";
import { solution } from "../solutions";

const chapel = game.rooms.chapel;
const start = () => createInitialState(chapel);
const run = (lines: string[]) => playGame(lines, start());

/** Taper in hand and lit, standing at the altar (camera A). */
const READY = ["open candle box", "turn", "taper lamp", "turn"];
const GUTTER = "The wick flares, then a cold draft sweeps the altar.\nEvery flame there gutters out. Only the taper still burns.";

describe("The Chapel", () => {
  it("is solved by its solution and leads to the clock tower", () => {
    const { state, last } = run(solution("chapel"));
    expect(texts(last)[0]).toMatch(/spiral stair climbs into the tower/);
    expect(state.roomId).toBe("clocktower");
  });

  it("the candle box gives the taper only once", () => {
    const { state, last } = run(["open candle box", "open box", "box"]);
    expect(state.inventory).toEqual(["taper"]);
    expect(texts(last)[0]).toMatch(/empty/);
  });

  it("an unlit taper lights nothing", () => {
    const { state, last } = run(["open candle box", "taper white candle"]);
    expect(texts(last)).toEqual(["The taper isn't lit."]);
    expect(state.flags.lit).toBe(0);
  });

  it("the taper is lit from the lamp, only once", () => {
    const { state, last } = run(["open candle box", "turn", "taper lamp", "taper lamp"]);
    expect(state.flags.taper_lit).toBe(true);
    expect(texts(last)).toEqual(["The taper already burns."]);
  });

  it("the lamp and candles are on different cameras", () => {
    expect(texts(run(["open candle box", "taper lamp"]).last)).toEqual(["Nothing happens."]);
    expect(texts(run(["open candle box", "turn", "taper red candle"]).last)).toEqual(["Nothing happens."]);
    expect(texts(run(["lamp"]).last)).toEqual(["You don't see any lamp here."]);
  });

  it("the hymnal's verse is noted in the inventory, once", () => {
    const { state, log } = run(["turn", "hymnal", "book", "inventory"]);
    expect(texts(log[1])[0]).toContain("\"First the dawn, then the blood, then the night.\"");
    expect(state.inventory).toEqual(["hymnal_note"]);
    expect(texts(log[3])).toEqual(["- Hymnal: dawn, blood, night"]);
    expect(texts(playGame(["turn", "hymnal", "turn", "note"], start()).last)[0]).toMatch(/underlined verse/);
  });

  it("candles advance the count in the right order", () => {
    const { state, log } = run([...READY, "taper white candle", "taper red candle"]);
    expect(texts(log[4])[0]).toMatch(/^The white candle takes the flame/);
    expect(texts(log[5])[0]).toMatch(/^The red candle catches/);
    expect(state.flags).toMatchObject({ lit: 2, panel_open: false });
  });

  it("a wrong order snuffs every flame and starts over", () => {
    const wrongFirst = run([...READY, "taper red candle"]);
    expect(texts(wrongFirst.last)).toEqual([GUTTER]);
    expect(wrongFirst.state.flags.lit).toBe(0);

    const late = run([...READY, "taper white candle", "taper black candle"]);
    expect(late.state.flags.lit).toBe(0);
    expect(late.state.flags.taper_lit).toBe(true);

    const retry = run([...READY, "taper black candle", "taper white candle", "taper red candle",
      "taper black candle"]);
    expect(retry.state.flags).toMatchObject({ lit: 3, panel_open: true });
  });

  it("relighting a burning candle counts as a mistake", () => {
    const twice = run([...READY, "taper white candle", "taper white candle"]);
    expect(texts(twice.last)).toEqual([GUTTER]);
    expect(twice.state.flags.lit).toBe(0);
    const redTwice = run([...READY, "taper white candle", "taper red candle", "taper red candle"]);
    expect(redTwice.state.flags.lit).toBe(0);
  });

  it("once the panel opens, the candles stay lit", () => {
    const done = [...READY, "taper white candle", "taper red candle", "taper black candle"];
    const { state, last } = run([...done, "taper white candle", "taper black candle"]);
    expect(texts(last)).toEqual(["All three candles already burn. Better leave them be."]);
    expect(state.flags).toMatchObject({ lit: 3, panel_open: true });
  });

  it("the confessional is a dead end until the panel opens", () => {
    const { state, last } = run(["turn", "open confessional"]);
    expect(texts(last)[0]).toMatch(/back panel is solid/);
    expect(state.roomId).toBe("chapel");
  });

  it("brightens with each candle and darkens again on a mistake", () => {
    const at = (lines: string[]) => roomBrightness(run(lines).state, chapel);
    expect(at([])).toBe(0.5);
    expect(at([...READY, "taper white candle"])).toBe(0.7);
    expect(at([...READY, "taper white candle", "taper red candle"])).toBe(0.85);
    expect(at([...READY, "taper white candle", "taper red candle", "taper black candle"])).toBe(1.05);
    expect(at([...READY, "taper white candle", "taper black candle"])).toBe(0.5);
  });

  it("the altar view tells how many candles burn", () => {
    const desc = (lines: string[]) => describeCamera(run(lines).state, chapel, "A");
    expect(desc([])).toMatch(/cold/);
    expect(desc([...READY, "taper white candle"])).toMatch(/One candle burns/);
    expect(desc([...READY, "taper white candle", "taper red candle"])).toMatch(/Two candles burn/);
    expect(desc([...READY, "taper white candle", "taper red candle", "taper black candle"])).toMatch(
      /All three candles burn/,
    );
  });

  it("is translated", () => {
    const pt = playGame(["abrir caixa de velas", "pavio vela branca"], createInitialState(loadGame("pt-BR").rooms.chapel), "pt-BR");
    expect(texts(pt.log[0])).toContain("[Adicionado ao inventário: Pavio de cera]");
    expect(texts(pt.last)).toEqual(["O pavio não está aceso."]);
    const es = playGame(["girar", "himnario"], createInitialState(loadGame("es").rooms.chapel), "es");
    expect(texts(es.last)).toEqual([
      "Una cinta marca la página. Un verso está subrayado con tinta:\n\"Primero el alba, luego la sangre, luego la noche.\"",
      "[Añadido al inventario: Himnario: alba, sangre, noche]",
    ]);
  });
});
