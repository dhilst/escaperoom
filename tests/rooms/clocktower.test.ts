import { describe, expect, it } from "vitest";
import { loadGame } from "../../src/content";
import { createInitialState, describeCamera } from "../../src/engine";
import type { Locale } from "../../src/i18n";
import { playGame, texts } from "../helpers";

const start = (locale: Locale = "en-US") => createInitialState(loadGame(locale).rooms.clocktower);
const run = (lines: string[], locale: Locale = "en-US") => playGame(lines, start(locale), locale);
const room = loadGame("en-US").rooms.clocktower;

const GEAR = ["nest"];
const OIL = ["turn", "open cupboard", "turn"];

describe("The Clock Tower", () => {
  it("taking the gear from the nest happens once", () => {
    const { state, log } = run(["nest", "nest", "inventory"]);
    expect(texts(log[0])).toEqual([
      "Twigs, feathers, tiny bones. Something brass glints among them.\nYou take a small brass gear.",
      "[Brass gear added to inventory]",
    ]);
    expect(texts(log[1])).toEqual(["An abandoned nest of twigs and feathers. Nothing else shines in it."]);
    expect(state.inventory).toEqual(["brass_gear"]);
    expect(state.flags.gear_taken).toBe(true);
  });

  it("the cupboard gives the oil can only once", () => {
    const { state, log } = run(["turn", "open cupboard", "open cupboard"]);
    expect(texts(log[1])).toContain("The warped door scrapes open.\nYou found an oil can!");
    expect(texts(log[2])).toEqual(["It's already open. Nothing else is inside."]);
    expect(state.inventory).toEqual(["oil_can"]);
  });

  it("the door stays barred while the clock is stopped", () => {
    const { state, last } = run(["turn", "open door"]);
    expect(texts(last)).toEqual(["The bars hold fast. They're locked into the clock's mechanism."]);
    expect(state.roomId).toBe("clocktower");
  });

  it("the gear alone fits but the rusted axle won't turn", () => {
    const { state, log } = run([...GEAR, "gear mechanism", "mechanism", "turn", "open door"]);
    expect(texts(log[1])[0]).toMatch(/rusted solid/);
    expect(state.flags).toMatchObject({ gear_fitted: true, oiled: false, running: false });
    expect(state.inventory).toEqual([]);
    expect(texts(log[2])[0]).toMatch(/^The brass gear sits on its axle/);
    expect(state.roomId).toBe("clocktower");
  });

  it("oil alone loosens the axles but a gear is still missing", () => {
    const { state, log } = run([...OIL, "oil can mechanism", "mechanism", "turn", "open door"]);
    expect(texts(log[3])[0]).toMatch(/A wheel is still missing/);
    expect(state.flags).toMatchObject({ gear_fitted: false, oiled: true, running: false });
    expect(state.inventory).toEqual([]);
    expect(texts(log[4])[0]).toMatch(/still stands empty/);
    expect(state.roomId).toBe("clocktower");
  });

  it.each([
    ["gear first", [...GEAR, ...OIL, "gear mechanism", "oil can mechanism"]],
    ["oil first", [...GEAR, ...OIL, "oil mechanism", "brass gear clockwork"]],
  ])("both fixes start the clock in any order (%s) and release the door", (_name, lines) => {
    const { state, last } = run([...lines, "turn", "open door"]);
    expect(texts(last)[0]).toBe(
      "The door swings open on the beat of the clock.\nA servants' stair winds down into darkness. It smells of old bread.",
    );
    expect(state.roomId).toBe("kitchen");
  });

  it("the second fix announces the clock starting", () => {
    const { state, last } = run([...GEAR, ...OIL, "gear mechanism", "oil can mechanism"]);
    expect(texts(last)[0]).toMatch(/the clock starts/);
    expect(state.flags.running).toBe(true);
  });

  it("the mechanism can only be repaired from the gears' camera", () => {
    const { state } = run([...GEAR, "turn", "open cupboard", "gear mechanism", "oil can mechanism"]);
    expect(state.flags.running).toBe(false);
    expect(state.inventory).toEqual(["brass_gear", "oil_can"]);
  });

  it("items can't be used before they are found", () => {
    const { state } = run(["gear mechanism", "oil can mechanism", "1234 mechanism"]);
    expect(state.flags).toMatchObject({ gear_fitted: false, oiled: false, running: false });
  });

  it("both cameras change once the clock runs", () => {
    const solved = run([...GEAR, ...OIL, "gear mechanism", "oil can mechanism"]).state;
    expect(describeCamera(start(), room, "A")).toMatch(/frozen above a still pendulum/);
    expect(describeCamera(solved, room, "A")).toMatch(/pendulum swings/);
    expect(describeCamera(start(), room, "C")).toMatch(/barred with iron rods/);
    expect(describeCamera(solved, room, "C")).toMatch(/drawn back/);
    expect(texts(run([...GEAR, ...OIL, "gear mechanism", "oil can mechanism", "pendulum"]).last))
      .toEqual(["The pendulum swings, slow and heavy. Each beat shakes the floor."]);
  });

  it("every object in both cameras answers to inspect", () => {
    for (const o of ["mechanism", "nest", "beam", "pendulum"]) {
      expect(run([o]).last.find((e) => e.type === "failure"), o).toBeUndefined();
    }
    for (const o of ["clock face", "cupboard", "door"]) {
      expect(run(["turn", o]).last.find((e) => e.type === "failure"), o).toBeUndefined();
    }
  });

  it("is translated", () => {
    expect(texts(run(["ninho"], "pt-BR").last)[0]).toBe(
      "Gravetos, penas, ossinhos. Algo de latão brilha no meio deles.\nVocê pega uma pequena engrenagem de latão.",
    );
    expect(texts(run(["girar", "abrir puerta"], "es").last)).toEqual([
      "Las barras no ceden. Están trabadas en el mecanismo del reloj.",
    ]);
    expect(texts(run(["virar", "abrir porta"], "pt-BR").last)).toEqual([
      "As barras não cedem. Estão presas ao mecanismo do relógio.",
    ]);
    expect(texts(run(["nido", "engranaje reloj"], "es").last)[0]).toMatch(
      /agarrotados por el óxido/,
    );
  });
});
