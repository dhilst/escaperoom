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

  it("the altar asks for the colors in the hymn's order", () => {
    expect(texts(run(["altar"]).last)[0]).toMatch(/NAME THE COLORS AS THE HYMN SINGS THEM/);
  });

  it("one candle at a time no longer works", () => {
    const { state, last } = run([...READY, "taper white candle"]);
    expect(texts(last)).toEqual(["The wick won't take a lone flame.\nCarry the taper to all three candles at once, in the hymn's order."]);
    expect(state.flags.lit).toBe(0);
  });

  it("naming the three candles in the hymn's order at the altar opens the panel", () => {
    const { state, last } = run([...READY, "white red black altar"]);
    expect(texts(last)[0]).toMatch(/^You touch the taper to the white candle, then the red, then the black/);
    expect(state.flags).toMatchObject({ lit: 3, panel_open: true });
    // the full names work too
    expect(run([...READY, "white candle red candle black candle altar"]).state.flags.panel_open).toBe(true);
  });

  it("or carrying the taper to the three candles, with or without the altar", () => {
    for (const line of ["taper white red black", "taper white red black altar"]) {
      const { state, last } = run([...READY, line]);
      expect(texts(last)[0], line).toMatch(/^You touch the taper to the white candle, then the red, then the black/);
      expect(state.flags, line).toMatchObject({ lit: 3, panel_open: true });
    }
    for (const line of ["taper red white black", "taper white red", "taper black red white altar"]) {
      expect(run([...READY, line]).state.flags.panel_open, line).toBe(false);
    }
    expect(texts(run(["open candle box", "taper white red black"]).last)).toEqual(["The taper isn't lit."]);
    const again = run([...READY, "taper white red black", "taper white red black"]);
    expect(texts(again.last)).toEqual(["All three candles already burn. Better leave them be."]);
  });

  it("any other order, a missing word, or no flame does nothing", () => {
    for (const line of ["red white black altar", "black red white altar", "white red black", "white red altar"]) {
      const { state, last } = run([...READY, line]);
      expect(texts(last), line).toEqual(["Nothing happens."]);
      expect(state.flags.panel_open, line).toBe(false);
    }
    expect(texts(run(["white red black altar"]).last)).toEqual(["Nothing happens."]); // no taper yet
    expect(texts(run(["open candle box", "white red black altar"]).last)).toEqual(["Nothing happens."]); // unlit
  });

  it("once the panel opens, the candles stay lit", () => {
    const { state, last } = run([...READY, "white red black altar", "taper red candle", "white red black altar"]);
    expect(texts(last)).toEqual(["All three candles already burn. Better leave them be."]);
    expect(state.flags).toMatchObject({ lit: 3, panel_open: true });
  });

  it("the confessional is a dead end until the panel opens", () => {
    const { state, last } = run(["turn", "open confessional"]);
    expect(texts(last)[0]).toMatch(/back panel is solid/);
    expect(state.roomId).toBe("chapel");
  });

  it("is dark until the three candles burn together", () => {
    expect(roomBrightness(start(), chapel)).toBe(0.5);
    expect(roomBrightness(run(READY).state, chapel)).toBe(0.5);
    expect(roomBrightness(run([...READY, "white red black altar"]).state, chapel)).toBe(1.05);
  });

  it("the altar view changes once all three candles burn", () => {
    const desc = (lines: string[]) => describeCamera(run(lines).state, chapel, "A");
    expect(desc(READY)).not.toMatch(/All three candles burn/);
    expect(desc([...READY, "white red black altar"])).toMatch(/All three candles burn/);
  });

  it("is translated", () => {
    const pt = playGame(["abrir caixa de velas", "pavio vela branca"], createInitialState(loadGame("pt-BR").rooms.chapel), "pt-BR");
    expect(texts(pt.log[0])).toContain("[Adicionado ao inventário: Pavio de cera]");
    expect(texts(pt.last)).toEqual(["O pavio não está aceso."]);
    const ptWin = playGame(
      ["abrir caixa de velas", "virar", "pavio lamparina", "virar", "branca vermelha preta altar"],
      createInitialState(loadGame("pt-BR").rooms.chapel),
      "pt-BR",
    );
    expect(ptWin.state.flags.panel_open).toBe(true);
    const es = playGame(["girar", "himnario"], createInitialState(loadGame("es").rooms.chapel), "es");
    expect(texts(es.last)).toEqual([
      "Una cinta marca la página. Un verso está subrayado con tinta:\n\"Primero el alba, luego la sangre, luego la noche.\"",
      "[Añadido al inventario: Himnario: alba, sangre, noche]",
    ]);
  });
});
