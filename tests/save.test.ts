import { describe, expect, it } from "vitest";
import { loadGame } from "../src/content";
import { createGameState, restoreState } from "../src/engine";
import { game, playGame } from "./helpers";
import { fullSolution, solution } from "./solutions";

const roundTrip = (value: unknown) => JSON.parse(JSON.stringify(value));
/** Somewhere in the cellar with the toolbox open, a hint revealed and the camera turned. */
const midGame = () => {
  const inCellar = playGame(solution("study"), createGameState(game), "en-US", 0).state;
  return playGame(["hint", "open toolbox", "turn"], inCellar, "en-US", 7 * 3_600_000).state;
};

describe("saved games", () => {
  it("survive a JSON round trip unchanged", () => {
    const state = midGame();
    expect(state).toMatchObject({ roomId: "cellar", camera: "C", inventory: ["crowbar"], hints: [0] });
    expect(restoreState(roundTrip(state), game)).toEqual(state);
  });

  it("are language-neutral: a game saved in one language resumes in another", () => {
    const pt = playGame(solution("study", "pt-BR"), createGameState(loadGame("pt-BR")), "pt-BR").state;
    expect(restoreState(roundTrip(pt), loadGame("es"))).toEqual(pt);
  });

  it("can be played on to the end", () => {
    const studyLength = solution("study").length;
    const saved = restoreState(roundTrip(playGame(solution("study")).state), game)!;
    const { state } = playGame(fullSolution().slice(studyLength), saved);
    expect(state.completed).toBe(true);
  });

  it("don't restore a finished game", () => {
    const won = playGame(fullSolution()).state;
    expect(won.completed).toBe(true);
    expect(restoreState(roundTrip(won), game)).toBeUndefined();
  });

  it("are rejected when they don't fit the current game", () => {
    const good = roundTrip(midGame());
    const bad: [string, unknown][] = [
      ["not an object", null],
      ["an array", []],
      ["unknown room", { ...good, roomId: "attic" }],
      ["bad camera", { ...good, camera: "B" }],
      ["completed missing", { ...good, completed: undefined }],
      ["no hint clock", { ...good, levelStartedAt: "yesterday" }],
      ["item from another room", { ...good, inventory: ["brass_key"] }],
      ["duplicate item", { ...good, inventory: ["crowbar", "crowbar"] }],
      ["flags not an object", { ...good, flags: [] }],
      ["odd flag value", { ...good, flags: { power_on: { yes: true } } }],
      ["hint out of range", { ...good, hints: [9] }],
      ["hint twice", { ...good, hints: [0, 0] }],
      ["hint not a number", { ...good, hints: ["0"] }],
    ];
    for (const [why, data] of bad) expect(restoreState(data, game), why).toBeUndefined();
  });

  it("give flags added since the save their initial values", () => {
    const saved = roundTrip(midGame());
    delete saved.flags.power_on;
    expect(restoreState(saved, game)!.flags.power_on).toBe(false);
  });
});
