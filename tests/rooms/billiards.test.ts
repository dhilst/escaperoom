import { describe, expect, it } from "vitest";
import { loadGame } from "../../src/content";
import { createInitialState, describeCamera, roomBrightness } from "../../src/engine";
import type { GameState } from "../../src/engine";
import type { Locale } from "../../src/i18n";
import { game, playGame, texts } from "../helpers";
import { solution } from "../solutions";

const billiards = game.rooms.billiards;
const start = (locale: Locale = "en-US") => createInitialState(loadGame(locale).rooms.billiards);
const run = (lines: string[], from: GameState = start(), locale: Locale = "en-US") => playGame(lines, from, locale);

/** Lamp on and all three balls in hand, facing the cabinet (camera C). */
const BALLS = ["pull lamp", "pockets", "turn", "lift chair", "open cigar box"];

describe("The Billiard Room", () => {
  it("is solved by its solution and leads to the gallery", () => {
    const { state, last } = run(solution("billiards"));
    expect(texts(last)[0]).toMatch(/^Green, stripe, yellow\./);
    expect(texts(last)[0]).toMatch(/painted faces line the walls\.$/);
    expect(last).toContainEqual(expect.objectContaining({ type: "room_entered", room: "gallery" }));
    expect(state).toMatchObject({ roomId: "gallery", inventory: [] });
  });

  it("is dark until the lamp's chain is pulled, and stays lit", () => {
    expect(roomBrightness(start(), billiards)).toBe(0.45);
    const lit = run(["pull lamp", "pull chain"]);
    expect(roomBrightness(lit.state, billiards)).toBe(1.1);
    expect(texts(lit.log[0])[0]).toMatch(/^You tug the chain\./);
    expect(texts(lit.last)).toEqual(["You'd rather not plunge the room back into darkness."]);
    expect(describeCamera(lit.state, billiards, "A")).toMatch(/pours hard light/);
    expect(describeCamera(start(), billiards, "C")).not.toMatch(/chalk marks/);
    expect(describeCamera(lit.state, billiards, "C")).toMatch(/chalk marks/);
  });

  it("the rack, the pockets and the scoreboard need the light", () => {
    const dark = run(["rack", "pockets", "turn", "scoreboard"]);
    expect(texts(dark.log[0])[0]).toMatch(/Too dark to count/);
    expect(texts(dark.log[1])[0]).toMatch(/rather not reach in blind/);
    expect(texts(dark.log[3])[0]).toMatch(/too faint to read/);
    expect(dark.state.inventory).toEqual([]);

    const lit = run(["pull lamp", "rack", "pockets", "turn", "scoreboard", "inventory"]);
    expect(texts(lit.log[1])[0]).toMatch(/the yellow 1, the green 6 and the striped 9 are missing/);
    expect(texts(lit.log[2])).toEqual(["In the light, something gleams in a corner pocket.\nYou found the yellow 1 ball!", "[Yellow 1 ball added to inventory]"]);
    expect(texts(lit.log[4])).toEqual([
      "Beads on brass wires, and beneath them, in chalk:\nNEXT SHOTS CALLED: GREEN, STRIPE, YELLOW.",
      "[Scoreboard: green, stripe, yellow added to inventory]",
    ]);
    expect(texts(lit.log[5])).toEqual(["- Yellow 1 ball\n- Scoreboard: green, stripe, yellow"]);
  });

  it("never hands out a ball or the note twice", () => {
    const { state } = run([
      "pull lamp", "pockets", "pocket",
      "turn", "scoreboard", "chalk", "lift chair", "lift cushion", "open cigar box", "open humidor",
    ]);
    expect(state.inventory).toEqual(["one_ball", "scoreboard_note", "six_ball", "nine_ball"]);
  });

  it("the balls can be named by number or color", () => {
    for (const line of ["green stripe yellow cabinet", "six nine one cabinet", "6 9 1 liquor cabinet", "green 6 ball striped 9 ball yellow 1 ball cabinet"]) {
      expect(run([line], run(BALLS).state).state.roomId, line).toBe("gallery");
    }
  });

  it("any other order, a missing ball, or the bare code does nothing", () => {
    for (const line of ["yellow stripe green cabinet", "stripe green yellow cabinet", "green stripe cabinet", "green stripe yellow"]) {
      const { state, last } = run([line], run(BALLS).state);
      expect(texts(last), line).toEqual(["Nothing happens."]);
      expect(state.roomId, line).toBe("billiards");
      expect(state.inventory, line).toHaveLength(3);
    }
    const code = run(["691 cabinet"], run(BALLS).state);
    expect(texts(code.last)).toEqual(["There are no dials. The sockets want the balls themselves."]);
    expect(code.state.roomId).toBe("billiards");
  });

  it("one ball alone rolls back out", () => {
    const { state, last } = run(["green cabinet"], run(BALLS).state);
    expect(texts(last)[0]).toMatch(/rolls back out into your hand\.\nThe lock wants all three at once/);
    expect(state.inventory).toContain("six_ball");
  });

  it("balls must be held: the phrase does nothing before they are found", () => {
    const { state, last } = run(["turn", "green stripe yellow cabinet"]);
    expect(texts(last)).toEqual(["Nothing happens."]);
    expect(state.roomId).toBe("billiards");
  });

  it("the cabinet and panelling do not open by hand", () => {
    const { log } = run(["turn", "open cabinet", "open panelling", "open chair"]);
    expect(texts(log[1])[0]).toMatch(/^It won't open\./);
    expect(texts(log[2])[0]).toMatch(/won't budge/);
    expect(texts(log[3])[0]).toMatch(/cushion could be lifted/);
  });

  it("objects belong to their camera", () => {
    expect(texts(run(["cabinet"]).last)).toEqual(["You don't see any cabinet here."]);
    expect(texts(run(["turn", "lamp"]).last)).toEqual(["You don't see any lamp here."]);
    expect(texts(run(["turn", "pull lamp"]).last)).toEqual(["Nothing happens."]);
  });

  it("has a decorative line for every object in the room", () => {
    const { log } = run(["billiard table", "rack", "pockets", "lamp", "cues", "turn", "scoreboard", "cabinet", "armchair", "cigar box", "panelling"]);
    for (const events of log) expect(events.find((e) => e.type === "failure")).toBeUndefined();
  });

  it("is translated", () => {
    const pt = run(["puxar luminária", "caçapas"], start("pt-BR"), "pt-BR");
    expect(texts(pt.last)).toEqual([
      "Com a luz, algo reluz numa caçapa do canto.\nVocê encontrou a bola 1 amarela!",
      "[Adicionado ao inventário: Bola 1 amarela]",
    ]);
    const ptWin = run(
      ["puxar corrente", "caçapas", "virar", "levantar almofada", "abrir caixa", "seis nove um armário de bebidas"],
      start("pt-BR"),
      "pt-BR",
    );
    expect(ptWin.state.roomId).toBe("gallery");
    expect(texts(ptWin.last)[0]).toMatch(/^Verde, listrada, amarela\./);

    const es = run(["tirar lámpara", "girar", "marcador"], start("es"), "es");
    expect(texts(es.last)).toEqual([
      "Cuentas en alambres de latón y, debajo, en tiza:\nPRÓXIMOS TIROS CANTADOS: VERDE, RAYADA, AMARILLA.",
      "[Añadido al inventario: Marcador: verde, rayada, amarilla]",
    ]);
  });
});
