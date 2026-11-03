import { describe, expect, it } from "vitest";
import { loadGame } from "../../src/content";
import { createInitialState, describeCamera, roomBrightness } from "../../src/engine";
import type { GameState } from "../../src/engine";
import type { Locale } from "../../src/i18n";
import { game, playGame, texts } from "../helpers";
import { solution } from "../solutions";

const armory = game.rooms.armory;
const start = (locale: Locale = "en-US") => createInitialState(loadGame(locale).rooms.armory);
const run = (lines: string[], from: GameState = start(), locale: Locale = "en-US") => playGame(lines, from, locale);

/** The shield is back on its hook and the sconces burn; standing at the crest (camera C). */
const HUNG = ["turn", "open display case", "turn", "knife armour", "turn", "shield crest"];

describe("The Trophy Room", () => {
  it("comes between the armoury's neighbours: gallery before, bedroom after", () => {
    const i = game.order.indexOf("armory");
    expect(game.order[i - 1]).toBe("gallery");
    expect(game.order[i + 1]).toBe("bedroom");
  });

  it("is solved by its solution and leads to the bedroom", () => {
    const { state, last } = run(solution("armory"));
    expect(texts(last)[0]).toMatch(/^You press the bear, the wolf, the lion, then the eagle\./);
    expect(texts(last)[0]).toMatch(/four-poster bed/);
    expect(last).toContainEqual(expect.objectContaining({ type: "room_entered", room: "bedroom" }));
    expect(state).toMatchObject({ roomId: "bedroom", inventory: [] });
  });

  it("the display case gives the knife once", () => {
    const { state, last } = run(["turn", "open case", "open case", "case"]);
    expect(state.inventory).toEqual(["knife"]);
    expect(texts(last)[0]).toMatch(/shape of the knife/);
  });

  it("the shield is cut free from the armour with the knife, only once", () => {
    const { state, log } = run(["turn", "open case", "turn", "armour", "knife armour", "knife armour", "armour"]);
    expect(texts(log[3])[0]).toMatch(/leather strap/);
    expect(texts(log[4])).toContain("[Shield added to inventory]");
    expect(texts(log[5])).toEqual(["The strap is already cut."]);
    expect(texts(log[6])[0]).toMatch(/empty-handed/);
    expect(state.inventory).toEqual(["knife", "shield"]);
  });

  it("the shield shows the four beasts, each in its home", () => {
    const { last } = run(HUNG.slice(0, 4).concat("shield"));
    expect(texts(last)[0]).toMatch(/eagle among clouds,\na lion on a throne, a bear in a cave, a wolf among pines/);
  });

  it("the motto can't be read in the dark, and is noted once the shield is back", () => {
    const dark = run(["turn", "crest"]);
    expect(texts(dark.last)[0]).toMatch(/too deep in shadow to read/);
    expect(dark.state.inventory).toEqual([]);
    const { state, log } = run([...HUNG, "crest", "crest", "inventory"]);
    expect(texts(log[HUNG.length - 1])[0]).toMatch(/gas sconces hiss, sputter and catch/);
    expect(texts(log[HUNG.length])[0]).toMatch(/FROM THE CAVE, THROUGH THE FOREST, TO THE THRONE, INTO THE SKY/);
    expect(texts(log[HUNG.length])).toContain("[Motto: cave, forest, throne, sky added to inventory]");
    expect(texts(log[HUNG.length + 1])).toHaveLength(1);
    expect(texts(log[HUNG.length + 2])).toEqual(["- Hunting knife\n- Motto: cave, forest, throne, sky"]);
    expect(state.inventory).not.toContain("shield");
  });

  it("the beasts must be pressed in the motto's order, at the crest, with the shield hung", () => {
    const hung = run(HUNG).state;
    for (const line of [
      "eagle lion wolf bear crest",
      "bear wolf eagle lion crest",
      "bear wolf lion crest",
      "bear wolf lion eagle",
      "wolf bear lion eagle crest",
    ]) {
      const { state, last } = run([line], hung);
      expect(texts(last), line).toEqual(["Nothing happens."]);
      expect(state.roomId, line).toBe("armory");
    }
    // The right order does nothing before the shield is back.
    expect(texts(run(["turn", "bear wolf lion eagle crest"]).last)).toEqual(["Nothing happens."]);
  });

  it("the door is barred from inside the wall", () => {
    const { state, last } = run(["turn", "open door"]);
    expect(texts(last)[0]).toMatch(/won't budge/);
    expect(state.roomId).toBe("armory");
  });

  it("objects belong to their camera", () => {
    expect(texts(run(["crest"]).last)).toEqual(["You don't see any crest here."]);
    expect(texts(run(["turn", "armour"]).last)).toEqual(["You don't see any armour here."]);
    expect(texts(run(["turn", "open case", "knife armour"]).last)).toEqual(["Nothing happens."]);
  });

  it("has a decorative line for every object in the room", () => {
    const { log } = run(["fireplace", "swords", "stag", "armour", "open armour", "turn", "rack", "sconces", "door", "case"]);
    for (const events of log) expect(events.find((e) => e.type === "failure")).toBeUndefined();
  });

  it("is dim until the sconces are lit, and the views follow the story", () => {
    const hung = run(HUNG).state;
    expect(roomBrightness(start(), armory)).toBe(0.45);
    expect(roomBrightness(run(HUNG.slice(0, 4)).state, armory)).toBe(0.45);
    expect(roomBrightness(hung, armory)).toBe(1.1);
    expect(describeCamera(start(), armory, "A")).toMatch(/a shield strapped to its arm/);
    expect(describeCamera(run(HUNG.slice(0, 4)).state, armory, "A")).toMatch(/its shield arm empty/);
    expect(describeCamera(start(), armory, "C")).toMatch(/empty hook between two dead gas sconces/);
    expect(describeCamera(hung, armory, "C")).toMatch(/Gas sconces hiss/);
  });

  it("is translated", () => {
    const pt = run(["virar", "abrir vitrine", "virar", "faca armadura"], start("pt-BR"), "pt-BR");
    expect(texts(pt.log[1])).toContain("[Adicionado ao inventário: Faca de caça]");
    expect(texts(pt.last)).toContain("[Adicionado ao inventário: Escudo]");
    const ptWin = run(solution("armory", "pt-BR"), start("pt-BR"), "pt-BR");
    expect(texts(ptWin.last)[0]).toMatch(/^Você aperta o urso, o lobo, o leão e depois a águia\./);
    expect(ptWin.state.roomId).toBe("bedroom");

    const es = run(["girar", "blasón"], start("es"), "es");
    expect(texts(es.last)[0]).toMatch(/^Un tablero de roble con un blasón\./);
    const esWin = run(solution("armory", "es"), start("es"), "es");
    expect(texts(esWin.log[6])).toContain("[Añadido al inventario: Lema: cueva, bosque, trono, cielo]");
    expect(esWin.state.roomId).toBe("bedroom");
  });
});
