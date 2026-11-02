import { describe, expect, it } from "vitest";
import { createInitialState, enterRoom } from "../src/engine";
import { CELLAR_SOLUTION, game, OBSERVATORY_SOLUTION, playGame, STUDY_SOLUTION, texts } from "./helpers";

const at = (roomId: string) => createInitialState(game.rooms[roomId]);

describe("game manifest", () => {
  it("plays study, cellar, observatory in order", () => {
    expect(game.order).toEqual(["study", "cellar", "observatory"]);
  });
});

describe("The Flooded Cellar", () => {
  it("can be solved and leads to the observatory", () => {
    const { state, log } = playGame(CELLAR_SOLUTION, at("cellar"));
    expect(texts(log[0])).toContain("[Crowbar added to inventory]");
    expect(texts(log[2])).toEqual([
      "You lever the lid off. The crowbar slips into the water.\nYou found a fuse!",
      "[Crowbar removed from inventory]",
      "[Fuse added to inventory]",
    ]);
    expect(log[6]).toContainEqual(expect.objectContaining({ type: "room_entered", room: "observatory" }));
    expect(state).toMatchObject({ roomId: "observatory", inventory: [], completed: false });
  });

  it("the wall can only be read once the power is on", () => {
    expect(texts(playGame(["turn", "inspect wall"], at("cellar")).last)).toEqual(["Too dark to make anything out."]);
    const lit = playGame([...CELLAR_SOLUTION.slice(0, 5), "turn", "inspect writing"], at("cellar"));
    expect(texts(lit.last)).toEqual(["Numbers in dripping red paint:\n7 4 1 9"]);
  });

  it("the right code does nothing without power", () => {
    const { state, last } = playGame(["turn", "use 7419 door"], at("cellar"));
    expect(texts(last)).toEqual(["Nothing happens."]);
    expect(state.roomId).toBe("cellar");
  });

  it("the crate needs the crowbar", () => {
    const { state } = playGame(["turn", "open crate", "use crowbar crate"], at("cellar"));
    expect(state.flags.crate_open).toBe(false);
    expect(state.inventory).toEqual([]);
  });

  it("does not hand out a second crowbar or fuse", () => {
    const { state } = playGame(
      ["open toolbox", "open toolbox", "turn", "use crowbar crate", "use crowbar crate", "open crate"],
      at("cellar"),
    );
    expect(state.inventory).toEqual(["fuse"]);
  });
});

describe("The Observatory", () => {
  it("can be solved and wins the game", () => {
    const { state, last } = playGame(OBSERVATORY_SOLUTION, at("observatory"));
    expect(texts(last)).toEqual([
      "The padlock clicks open. You climb the ladder\nand push the hatch into the cold night air.",
      "You escaped!",
    ]);
    expect(state.completed).toBe(true);
  });

  it("the telescope shows the code only once the lens is fitted", () => {
    expect(texts(playGame(["inspect telescope"], at("observatory")).last)[0]).toContain("lens is missing");
    const fitted = playGame([...OBSERVATORY_SOLUTION.slice(0, 5), "inspect telescope"], at("observatory"));
    expect(texts(fitted.last)[0]).toContain("2, 6, 1, 8");
  });

  it("the music box cannot be opened without the crank", () => {
    const { state, last } = playGame(["turn", "open music box", "use crank box"], at("observatory"));
    expect(texts(last)).toEqual(["Nothing happens."]);
    expect(state.inventory).toEqual([]);
  });

  it("the hatch rejects wrong codes", () => {
    const { state } = playGame(["turn", "use 1234 hatch", "use 0315 hatch", "use 7419 hatch"], at("observatory"));
    expect(state.completed).toBe(false);
  });
});

describe("full game", () => {
  const all = [...STUDY_SOLUTION, ...CELLAR_SOLUTION, ...OBSERVATORY_SOLUTION];

  it("can be won from the first room", () => {
    const { state } = playGame(all);
    expect(state).toMatchObject({ roomId: "observatory", completed: true });
  });

  it("is deterministic", () => {
    expect(playGame(all)).toEqual(playGame(all));
  });

  it("each level starts fresh: camera A, empty inventory, the room's own flags", () => {
    const { state } = playGame(["use 0315 drawer", "turn", "use key door"]);
    expect(state).toEqual({
      roomId: "cellar",
      camera: "A",
      inventory: [],
      flags: { toolbox_open: false, crate_open: false, power_on: false },
      completed: false,
      hints: [],
    });
  });

  it("objects from earlier rooms are no longer reachable", () => {
    const { last } = playGame([...STUDY_SOLUTION, "inspect clock"]);
    expect(texts(last)).toEqual(["There is no such clock."]);
  });

  it("ignores further commands after winning", () => {
    const { state, last } = playGame([...all, "turn"]);
    expect(state.camera).toBe("C");
    expect(texts(last)).toEqual(["You have already escaped. Type restart to play again."]);
  });

  it("enterRoom keeps the completion status", () => {
    const won = { ...at("observatory"), completed: true };
    expect(enterRoom(won, game.rooms.study).completed).toBe(true);
  });
});
