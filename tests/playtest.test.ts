// Fixes from the first external playtest.
import { describe, expect, it } from "vitest";
import { createInitialState, describeCamera, roomBrightness, validateRoom } from "../src/engine";
import { CELLAR_SOLUTION, game, playGame, studyJson, texts } from "./helpers";

const at = (roomId: string) => createInitialState(game.rooms[roomId]);

describe("help", () => {
  it("lists the basic commands in each language, never hint", () => {
    const en = texts(playGame(["help"]).last)[0];
    expect(en).toBe("Commands: look · turn · inspect <object> · open <object> · use <item> <target> · inventory");
    expect(en).not.toMatch(/hint|restart/);
    expect(texts(playGame(["ajuda"], undefined, "pt-BR").last)[0]).toMatch(/^Comandos: olhar · virar/);
    expect(texts(playGame(["ayuda"], undefined, "es").last)[0]).toMatch(/^Comandos: mirar · girar/);
  });

  it("works anywhere and changes nothing", () => {
    const start = at("study");
    expect(playGame(["help"], start).state).toEqual(start);
  });
});

describe("open <object> <code>", () => {
  it("means use <code> <object>", () => {
    for (const line of ["open drawer 0315", "open the drawer with 0315"]) {
      const { state } = playGame([line]);
      expect(state.inventory, line).toContain("brass_key");
    }
    const pt = playGame(["abrir a gaveta com 0315"], undefined, "pt-BR");
    expect(pt.state.inventory).toContain("brass_key");
  });

  it("a wrong code stays vague, and plain open still works", () => {
    expect(texts(playGame(["open drawer 1234"]).last)).toEqual(["Nothing happens."]);
    expect(texts(playGame(["open drawer"]).last)).toEqual(["It's locked. The dials need a four-digit code."]);
    expect(texts(playGame(["open painting 1234"]).last)).toEqual(["There is no such painting 1234."]);
  });
});

describe("decorative objects", () => {
  it("the papers and candle on the desk can be inspected", () => {
    for (const name of ["papers", "paper", "note", "candle"]) {
      expect(texts(playGame([`inspect ${name}`]).last)[0], name).not.toMatch(/no such|Nothing special/);
    }
    expect(texts(playGame(["examinar o papel"], undefined, "pt-BR").last)[0]).toMatch(/^Folhas soltas/);
  });
});

describe("lighting and state-dependent descriptions", () => {
  const cellar = game.rooms.cellar;

  it("the cellar is dark until the fuse goes in", () => {
    const dark = at("cellar");
    expect(roomBrightness(dark, cellar)).toBe(0.45);
    const lit = playGame(CELLAR_SOLUTION.slice(0, 5), dark).state;
    expect(lit.flags.power_on).toBe(true);
    expect(roomBrightness(lit, cellar)).toBe(1.1);
  });

  it("descriptions change when the lights come on", () => {
    const dark = at("cellar");
    const lit = playGame(CELLAR_SOLUTION.slice(0, 5), dark).state;
    expect(describeCamera(dark, cellar, "C")).not.toMatch(/painted in red/);
    expect(describeCamera(lit, cellar, "C")).toMatch(/Numbers are painted in red beside it/);
    expect(texts(playGame(["turn", "look"], lit).last)).toEqual([describeCamera(lit, cellar, "C")]);
  });

  it("rooms without lighting are drawn as painted", () => {
    expect(roomBrightness(at("study"), game.rooms.study)).toBe(1);
  });

  it("validation checks brightness, lighting rules and camera variants", () => {
    expect(() => validateRoom({ ...studyJson, brightness: 0 })).toThrow(/brightness must be a number/);
    expect(() => validateRoom({ ...studyJson, lighting: [{ when: [], brightness: 9 }] })).toThrow(
      /lighting\[0\]\.brightness/,
    );
    expect(() => validateRoom({ ...studyJson, lighting: [{ brightness: 1 }] })).toThrow(/lighting\[0\]\.when must be/);
    const cameras = { ...studyJson.cameras, A: { ...studyJson.cameras.A, variants: [{ when: [{ type: "has_item", item: "nope" }], description: "x" }] } };
    expect(() => validateRoom({ ...studyJson, cameras })).toThrow(/cameras\.A\.variants\[0\]\.when\[0\]\.item "nope"/);
  });
});
