import { describe, expect, it } from "vitest";
import { play, playGame, texts } from "./helpers";

describe("The Locked Study", () => {
  it("can be solved with the intended sequence and leads to the cellar", () => {
    const lines = [
      "look",
      "inspect clock",
      "inspect desk",
      "use 0315 drawer",
      "inventory",
      "turn",
      "use key door",
    ];
    const { state, log } = playGame(lines);
    expect(texts(log[3])).toEqual([
      "The dials click into place. The drawer opens.\nYou found a brass key!",
      "[Brass key added to inventory]",
    ]);
    expect(texts(log[1])).toEqual([
      "A dusty wall clock.\nThe hands are stopped at 03:15.",
      "[Clock: 03:15 added to inventory]",
    ]);
    expect(texts(log[4])).toEqual(["- Clock: 03:15\n- Brass key"]);
    expect(texts(log[6])[0]).toBe("The key turns with a groan. The door unlocks.\nStone steps lead down into the dark.");
    expect(log[6]).toContainEqual(expect.objectContaining({ type: "room_entered", room: "cellar" }));
    expect(state).toMatchObject({ roomId: "cellar", camera: "A", inventory: [], completed: false });
  });

  it("cannot be escaped without the key", () => {
    const { state } = play(["turn", "open door", "use key door", "use 0315 door", "use brass key door"]);
    expect(state.roomId).toBe("study");
    expect(state.inventory).toEqual([]);
  });

  it("the door does not open from the desk camera even with the key", () => {
    const { state } = play(["use 0315 drawer", "use key door"]);
    expect(state.roomId).toBe("study");
  });

});
