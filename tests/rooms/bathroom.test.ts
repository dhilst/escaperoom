import { describe, expect, it } from "vitest";
import { loadGame } from "../../src/content";
import { createInitialState, describeCamera, roomBrightness } from "../../src/engine";
import type { GameState } from "../../src/engine";
import type { Locale } from "../../src/i18n";
import { game, playGame, texts } from "../helpers";
import { solution } from "../solutions";

const bathroom = game.rooms.bathroom;
const LATER = 7 * 60 * 60_000;
const start = (locale: Locale = "en-US") => createInitialState(loadGame(locale).rooms.bathroom);
const run = (lines: string[], from: GameState = start(), locale: Locale = "en-US") => playGame(lines, from, locale);

/** Key, lighter, lamp lit and the mirror read: standing at the door (camera C) with the code. */
const CODE = ["pull plug", "turn", "open robe", "lighter lamp", "turn", "lighter geyser", "open hot tap", "mirror", "turn"];
/** Everything in hand, cabinet open, facing the door. */
const READY = [...CODE, "8264 cabinet"];

describe("The Bathroom", () => {
  it("is solved by its solution and leads to the darkroom", () => {
    expect(game.order.indexOf("bathroom") + 1).toBe(game.order.indexOf("darkroom"));
    const { state, last } = run(solution("bathroom"));
    expect(texts(last)[0]).toMatch(/^You soak the key in castor oil.*pitch darkness and a sharp smell of chemicals\./s);
    expect(last).toContainEqual(expect.objectContaining({ type: "room_entered", room: "darkroom" }));
    expect(state).toMatchObject({ roomId: "darkroom", inventory: [] });
  });

  it("draining the tub gives the rusty key, once", () => {
    const { state, log } = run(["tub", "pull plug", "open plug", "tub"]);
    expect(texts(log[0])[0]).toMatch(/Something glints at the bottom/);
    expect(texts(log[1])).toContain("[Rusty key added to inventory]");
    expect(texts(log[2])).toEqual(["The tub is already empty."]);
    expect(texts(log[3])[0]).toMatch(/empty now/);
    expect(state.inventory).toEqual(["rusty_key"]);
  });

  it("the bathrobe's pocket holds a lighter, once", () => {
    const { state, log } = run(["turn", "robe", "open robe", "open bathrobe", "pocket"]);
    expect(texts(log[1])[0]).toMatch(/One pocket sags/);
    expect(texts(log[2])).toContain("[Brass lighter added to inventory]");
    expect(texts(log[3])).toEqual(["Nothing else in the pockets."]);
    expect(texts(log[4])[0]).toMatch(/empty now/);
    expect(state.inventory).toEqual(["lighter"]);
  });

  it("no hot water until the geyser burns, and no steam on the mirror before that", () => {
    const cold = run(["open hot tap", "mirror"]);
    expect(texts(cold.log[0])[0]).toMatch(/icy water, then nothing/);
    expect(texts(cold.log[1])[0]).toMatch(/Your own face/);
    expect(cold.state.inventory).toEqual([]);
    expect(texts(run(["open cold tap"]).last)[0]).toMatch(/only makes the room colder/);
  });

  it("steam from the hot tap shows the code on the mirror, noted once", () => {
    const { state, log } = run(["turn", "open robe", "turn", "lighter geyser", "open hot tap", "mirror", "glass", "inventory"]);
    expect(texts(log[3])[0]).toMatch(/geyser begins to hum/);
    expect(texts(log[4])[0]).toMatch(/mirror fogs over/);
    expect(texts(log[5])).toEqual([
      "Figures bloom in the fog on the glass, where a finger once wrote:\n8 2 6 4",
      "[Mirror: 8 2 6 4 added to inventory]",
    ]);
    expect(texts(log[6])).toHaveLength(1);
    expect(texts(log[7])).toEqual(["- Brass lighter\n- Mirror: 8 2 6 4"]);
    expect(state.inventory).toEqual(["lighter", "mirror_note"]);
  });

  it("the cabinet's dials need the lamp lit", () => {
    const dark = run(["turn", "cabinet", "8264 cabinet"]);
    expect(texts(dark.log[1])[0]).toMatch(/Too dark/);
    expect(texts(dark.log[2])).toEqual(["Nothing happens."]);
    expect(dark.state.flags.cabinet_open).toBe(false);

    const lit = run(["turn", "open robe", "lighter lamp", "cabinet", "1234 cabinet", "8264 cabinet", "8264 cabinet"]);
    expect(texts(lit.log[3])[0]).toMatch(/four brass number dials/);
    expect(texts(lit.log[4])).toEqual(["Nothing happens."]);
    expect(texts(lit.log[5])).toContain("[Castor oil added to inventory]");
    expect(texts(lit.log[6])).toEqual(["The cabinet is already open."]);
    expect(lit.state.inventory).toEqual(["lighter", "oil"]);
  });

  it("the rusted lock needs the oil and the key together, in that order", () => {
    const { log, state } = run(READY);
    const at = (line: string) => texts(run([line], state).last);
    expect(at("key door")[0]).toMatch(/rusted solid/);
    expect(at("oil door")[0]).toMatch(/Wasted on the outside/);
    expect(at("oil key")[0]).toMatch(/Better done at the lock itself/);
    for (const line of ["key oil door", "oil key", "open door", "8264 door"]) {
      expect(run([line], state).state.roomId, line).toBe("bathroom");
    }
    expect(texts(log.at(-1)!)).toContain("[Castor oil added to inventory]");
  });

  it("is dim until the gas lamp is lit", () => {
    expect(roomBrightness(start(), bathroom)).toBe(0.45);
    expect(roomBrightness(run(["turn", "open robe", "lighter lamp"]).state, bathroom)).toBe(1.1);
    expect(texts(run(["turn", "open robe", "lighter lamp", "lighter lamp"]).last)).toEqual(["The lamp already burns."]);
  });

  it("the views change with the steam and the lamp", () => {
    const steamy = run(["turn", "open robe", "lighter lamp", "turn", "lighter geyser", "open hot tap"]).state;
    expect(describeCamera(start(), bathroom, "A")).toMatch(/full of grey water/);
    expect(describeCamera(steamy, bathroom, "A")).toMatch(/white with fog/);
    expect(describeCamera(start(), bathroom, "C")).toMatch(/gas lamp is dark/);
    expect(describeCamera(steamy, bathroom, "C")).toMatch(/hisses, bright and white/);
  });

  it("objects belong to their camera", () => {
    expect(texts(run(["door"]).last)).toEqual(["You don't see any door here."]);
    expect(texts(run(["turn", "mirror"]).last)).toEqual(["You don't see any mirror here."]);
    expect(texts(run(["turn", "pull plug"]).last)).toEqual(["Nothing happens."]);
  });

  it("has a decorative line for every object in the room", () => {
    const lines = ["tub", "plug", "hot tap", "cold tap", "geyser", "mirror", "washbasin", "turn",
      "medicine cabinet", "toilet", "towels", "bathrobe", "gas lamp", "door", "pull toilet", "open toilet"];
    for (const events of run(lines).log) expect(events.find((e) => e.type === "failure")).toBeUndefined();
  });

  it("skips the hints about steps already done", () => {
    const { state, last } = playGame(["pull plug", "turn", "open robe", "hint"], start(), "en-US", LATER);
    expect(state.hints).toEqual([2]);
    expect(texts(last)).toEqual([`Hint 3/5: ${bathroom.hints![2].text}`]);
  });

  it("is translated", () => {
    const pt = run(["puxar tampão", "virar", "abrir roupão", "armário"], start("pt-BR"), "pt-BR");
    expect(texts(pt.log[0])).toContain("[Adicionado ao inventário: Chave enferrujada]");
    expect(texts(pt.log[3])[0]).toMatch(/escuro demais/);
    const es = run(solution("bathroom", "es").slice(0, 8), start("es"), "es");
    expect(texts(es.last)).toEqual([
      "En el vaho del vidrio aparecen marcas, donde un dedo escribió una vez:\n8 2 6 4",
      "[Añadido al inventario: Espejo: 8 2 6 4]",
    ]);
    const ptWin = run(solution("bathroom", "pt-BR"), start("pt-BR"), "pt-BR");
    expect(texts(ptWin.last)[0]).toMatch(/^Você encharca a chave de óleo de rícino/);
    expect(ptWin.state.roomId).toBe("darkroom");
  });
});
