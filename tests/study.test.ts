import { describe, expect, it } from "vitest";
import { play, texts } from "./helpers";

describe("The Locked Study", () => {
  it("can be solved with the intended sequence", () => {
    const lines = [
      "look",
      "inspect clock",
      "inspect desk",
      "use 0315 drawer",
      "inventory",
      "turn",
      "use key door",
    ];
    const { state, log } = play(lines);
    expect(texts(log[3])).toEqual([
      "The dials click into place. The drawer opens.\nYou found a brass key!",
      "[Brass key added to inventory]",
    ]);
    expect(texts(log[4])).toEqual(["- Brass key"]);
    expect(texts(log[6])).toEqual(["The key turns with a groan. The door unlocks.", "You escaped!"]);
    expect(state.completed).toBe(true);
    expect(state.flags.door_unlocked).toBe(true);
  });

  it("cannot be escaped without the key", () => {
    const { state } = play(["turn", "open door", "use key door", "use 0315 door", "use brass key door"]);
    expect(state.completed).toBe(false);
    expect(state.inventory).toEqual([]);
  });

  it("the door does not open from the desk camera even with the key", () => {
    const { state } = play(["use 0315 drawer", "use key door"]);
    expect(state.completed).toBe(false);
  });

  it("ignores further commands after escaping", () => {
    const { state, last } = play(["use 0315 drawer", "turn", "use key door", "turn"]);
    expect(state.camera).toBe("C");
    expect(texts(last)).toEqual(["You have already escaped. Restart to play again."]);
  });
});
