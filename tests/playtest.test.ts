// Fixes from the first external playtest.
import { describe, expect, it } from "vitest";
import { createInitialState, describeCamera, roomBrightness, validateRoom } from "../src/engine";
import { CELLAR_SOLUTION, game, playGame, studyJson, texts } from "./helpers";

const at = (roomId: string) => createInitialState(game.rooms[roomId]);

describe("help", () => {
  it("explains naming and combining, never hint", () => {
    const en = texts(playGame(["help"]).last)[0];
    expect(en).toMatch(/^Name something to look at it/);
    expect(en).not.toMatch(/hint|restart/);
    expect(texts(playGame(["ajuda"], undefined, "pt-BR").last)[0]).toMatch(/^Diga o nome de algo/);
    expect(texts(playGame(["ayuda"], undefined, "es").last)[0]).toMatch(/^Di el nombre de algo/);
  });

  it("works anywhere and changes nothing", () => {
    const start = at("study");
    expect(playGame(["help"], start).state).toEqual(start);
  });
});

describe("codes", () => {
  it("a code followed by its target", () => {
    expect(playGame(["0315 drawer"]).state.inventory).toContain("brass_key");
    expect(playGame(["0315 gaveta"], undefined, "pt-BR").state.inventory).toContain("brass_key");
  });

  it("any other order or extra word is a different phrase", () => {
    for (const line of ["drawer 0315", "open drawer 0315", "0315 the drawer", "1234 drawer"]) {
      expect(texts(playGame([line]).last), line).toEqual(["Nothing happens."]);
    }
    expect(texts(playGame(["open drawer"]).last)).toEqual(["It's locked. The dials need a four-digit code."]);
  });
});

describe("decorative objects", () => {
  it("the papers and candle on the desk can be inspected", () => {
    for (const name of ["papers", "paper", "note", "candle"]) {
      expect(texts(playGame([name]).last)[0], name).not.toMatch(/no such|Nothing special/);
    }
    expect(texts(playGame(["papel"], undefined, "pt-BR").last)[0]).toMatch(/^Folhas soltas/);
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
