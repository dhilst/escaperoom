import { describe, expect, it } from "vitest";
import { loadGame } from "../src/content";
import { createGameState, createInitialState, nextSave, restoreState, resumeGame } from "../src/engine";
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

describe("finished levels", () => {
  /** Write saves the way the browser does, one per command, starting from `from`. */
  const playSaving = (lines: string[], from: unknown = undefined) => {
    let save = from;
    let state = resumeGame(from, game)?.state ?? createGameState(game);
    for (const line of lines) {
      state = playGame([line], state).state;
      save = roundTrip(nextSave(save, state, game));
    }
    return save as ReturnType<typeof nextSave>;
  };

  it("are recorded as the player moves on", () => {
    const save = playSaving([...solution("study"), ...solution("cellar")]);
    expect(save).toMatchObject({ roomId: "observatory", cleared: ["study", "cellar"] });
  });

  it("a mid-game save resumes exactly where it was", () => {
    const save = roundTrip(nextSave(undefined, midGame(), game));
    expect(resumeGame(save, game)!.state).toEqual(midGame());
  });

  it("a won game is kept, and starts over only when nothing new is left", () => {
    const won = playSaving(fullSolution());
    expect(won.completed).toBe(true);
    expect(won.cleared).toEqual(game.order);
    expect(resumeGame(won, game)).toBeUndefined();
  });

  it("levels added after a win are waiting for the player", () => {
    const won = playSaving(fullSolution());
    // An older game without the laundry and the dining hall:
    const older = { ...won, cleared: won.cleared.filter((id) => id !== "laundry" && id !== "dining") };
    const resumed = resumeGame(older, game, 123)!;
    expect(resumed.state).toMatchObject({ roomId: "laundry", inventory: [], completed: false, levelStartedAt: 123 });
    // ...and once they're played, the game ends again where it always did.
    const { state } = playGame(game.order.slice(game.order.indexOf("laundry")).flatMap((id) => solution(id)), resumed.state);
    expect(state).toMatchObject({ roomId: "foyer", completed: true });
  });

  it("saves from before finished levels were recorded count the earlier rooms as done", () => {
    const old = roundTrip(midGame()); // in the cellar, no `cleared`
    const inObservatory = playGame(solution("cellar"), createInitialState(game.rooms.cellar)).state;
    expect(nextSave(old, inObservatory, game).cleared).toEqual(["study", "cellar"]);
  });

  it("a room that changed shape restarts that room instead of the whole game", () => {
    const save = { ...roundTrip(nextSave(undefined, midGame(), game)), inventory: ["no_such_item"] };
    expect(resumeGame(save, game, 5)!.state).toMatchObject({ roomId: "cellar", inventory: [], levelStartedAt: 5 });
  });

  it("a room that no longer exists goes on at the first unfinished level", () => {
    const save = { ...roundTrip(nextSave(undefined, midGame(), game)), roomId: "ballroom", cleared: ["study", "cellar"] };
    expect(resumeGame(save, game)!.state.roomId).toBe("observatory");
  });

  it("nothing usable means a new game", () => {
    for (const data of [undefined, null, "x", [], 42]) expect(resumeGame(data, game)).toBeUndefined();
  });
});
