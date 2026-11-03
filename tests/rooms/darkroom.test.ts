import { describe, expect, it } from "vitest";
import { loadGame } from "../../src/content";
import { createInitialState, describeCamera, roomBrightness } from "../../src/engine";
import type { GameState } from "../../src/engine";
import type { Locale } from "../../src/i18n";
import { game, playGame, texts } from "../helpers";
import { solution } from "../solutions";

const darkroom = game.rooms.darkroom;
const start = (locale: Locale = "en-US") => createInitialState(loadGame(locale).rooms.darkroom);
const run = (lines: string[], from: GameState = start(), locale: Locale = "en-US") => playGame(lines, from, locale);

/** Safelight on, film and paper in hand, standing at the bench (camera A). */
const READY = ["open drawer", "bulb safelight", "turn", "open cabinet", "turn"];
/** The print developed and fixed, standing at the door (camera C). */
const PRINTED = [...READY, "film enlarger", "paper enlarger", "paper developer", "paper fixer", "turn"];

describe("The Darkroom", () => {
  it("is solved by its solution and leads to the attic", () => {
    const { state, last } = run(solution("darkroom"));
    expect(texts(last)[0]).toMatch(/^Right to fifty-nine, left to thirty\./);
    expect(texts(last)[0]).toContain("the attic above");
    expect(last).toContainEqual(expect.objectContaining({ type: "room_entered", room: "attic" }));
    expect(state.roomId).toBe("attic");
  });

  it("the drawer gives the red bulb only once", () => {
    const { state, last } = run(["open drawer", "open drawer", "drawer"]);
    expect(state.inventory).toEqual(["red_bulb"]);
    expect(texts(last)).toEqual(["Grease pencils and a dead moth. Nothing else."]);
  });

  it("the cabinet gives film and paper only once", () => {
    const { state, log } = run(["turn", "open cabinet", "open cabinet"]);
    expect(texts(log[1])).toContain("[Film canister added to inventory]");
    expect(texts(log[1])).toContain("[Photo paper added to inventory]");
    expect(texts(log[2])).toEqual(["Only empty boxes and dried-out bottles are left."]);
    expect(state.inventory).toEqual(["canister", "paper"]);
  });

  it("the red bulb in the safelight lights the room", () => {
    const { state, last } = run(["open drawer", "bulb safelight"]);
    expect(texts(last)[0]).toMatch(/swims up out of the dark/);
    expect(state.flags.safelight_on).toBe(true);
    expect(state.inventory).toEqual([]);
    expect(roomBrightness(start(), darkroom)).toBe(0.4);
    expect(roomBrightness(state, darkroom)).toBe(1.0);
    expect(describeCamera(state, darkroom, "A")).toMatch(/In the red glow/);
    expect(describeCamera(state, darkroom, "C")).toMatch(/Every face looks toward the door/);
  });

  it("the white light is taped off and stays off", () => {
    expect(texts(run(["switch"]).last)[0]).toMatch(/NO WHITE LIGHT\. RED ONLY\./);
    expect(texts(run(["open switch"]).last)[0]).toMatch(/meant it/);
  });

  it("nothing can be done with film or paper in the dark", () => {
    const { state, log } = run(["turn", "open cabinet", "turn", "film enlarger", "paper enlarger", "paper developer"]);
    for (const events of log.slice(3)) expect(texts(events)[0]).toMatch(/^You can't see your own hands/);
    expect(state.flags).toMatchObject({ film_loaded: false, paper_exposed: false, paper_developed: false });
  });

  it("the card above the trays is read by the red light, and noted once", () => {
    expect(texts(run(["card"]).last)).toEqual(["A card is pinned above the trays, too dark to read."]);
    expect(run(["card"]).state.inventory).toEqual([]);
    const { state, log } = run(["open drawer", "bulb safelight", "card", "sign", "inventory"]);
    expect(texts(log[2])[0]).toMatch(/EXPOSE\. DEVELOP\. FIX\./);
    expect(texts(log[3])).toHaveLength(1);
    expect(state.inventory).toEqual(["sign_note"]);
    expect(texts(log[4])).toEqual(["- Card: expose, develop, fix"]);
  });

  it("paper needs a negative in the enlarger first", () => {
    const { state, last } = run([...READY, "paper enlarger"]);
    expect(texts(last)).toEqual(["The enlarger has no negative in it. You'd only print white."]);
    expect(state.flags.paper_exposed).toBe(false);
  });

  it("the steps go in order and never spoil the last sheet", () => {
    const early = run([...READY, "film enlarger", "paper fixer", "paper developer"]);
    expect(texts(early.log[READY.length + 1])[0]).toMatch(/nothing on it yet/);
    expect(texts(early.last)[0]).toMatch(/never exposed/);
    expect(early.state.inventory).toEqual(["paper"]);
    expect(early.state.flags).toMatchObject({ paper_developed: false, paper_fixed: false });

    const twice = run([...READY, "film enlarger", "paper enlarger", "paper enlarger", "paper"]);
    expect(texts(twice.log[READY.length + 2])[0]).toMatch(/already exposed/);
    expect(texts(twice.last)[0]).toMatch(/has been exposed/);
  });

  it("the fixed print is the note that shows the dial's numbers", () => {
    const { state, log } = run(PRINTED);
    const fixed = texts(log[PRINTED.length - 2]);
    expect(fixed[0]).toMatch(/R 59, L 30\.$/);
    expect(fixed).toContain("[Photo paper removed from inventory]");
    expect(fixed).toContain("[Photograph: R 59, L 30 added to inventory]");
    expect(state.inventory).toEqual(["photograph"]);
  });

  it.each(["left 59 right 30 door", "right 30 left 59 door", "59 30 door", "5930 door", "right 59 left 30", "right 59 door"])(
    "any other dialling does nothing: %s",
    (line) => {
      const { state, last } = run([line], run(PRINTED).state);
      expect(texts(last)).toEqual(["Nothing happens."]);
      expect(state.roomId).toBe("darkroom");
    },
  );

  it("the short forms of right and left work too", () => {
    expect(run(["turn", "r 59 l 30 door"]).state.roomId).toBe("attic");
    expect(run(["turn", "clockwise 59 counterclockwise 30 door"]).state.roomId).toBe("attic");
  });

  it("objects belong to their camera", () => {
    expect(texts(run(["door"]).last)).toEqual(["You don't see any door here."]);
    expect(texts(run(["turn", "enlarger"]).last)).toEqual(["You don't see any enlarger here."]);
    expect(texts(run(["right 59 left 30 door"]).last)).toEqual(["Nothing happens."]);
  });

  it("has a decorative line for every object in the room", () => {
    const lines = ["bench", "drawer", "enlarger", "developer", "fixer", "trays", "safelight", "switch", "card", "timer",
      "turn", "cabinet", "sink", "line", "door", "open door"];
    for (const events of run(lines).log) expect(events.find((e) => e.type === "failure")).toBeUndefined();
  });

  it("is translated", () => {
    const pt = run(["abrir gaveta", "lâmpada luz de segurança", "cartão"], start("pt-BR"), "pt-BR");
    expect(texts(pt.log[0])).toContain("[Adicionado ao inventário: Lâmpada vermelha]");
    expect(texts(pt.last)[0]).toMatch(/EXPOR\. REVELAR\. FIXAR\./);
    const ptWin = run(["virar", "d 59 e 30 porta"], start("pt-BR"), "pt-BR");
    expect(ptWin.state.roomId).toBe("attic");
    expect(texts(ptWin.last)[0]).toMatch(/^Para a direita até cinquenta e nove/);

    const es = run(solution("darkroom", "es").slice(0, 10), start("es"), "es");
    expect(texts(es.last)).toContain("[Añadido al inventario: Fotografía: D 59, I 30]");
    expect(run(["girar", "izquierda 59 derecha 30 puerta"], start("es"), "es").state.roomId).toBe("darkroom");
  });
});
