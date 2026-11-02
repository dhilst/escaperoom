import { describe, expect, it } from "vitest";
import { createInitialState, RoomValidationError, step, validateGame, validateRoom } from "../src/engine";
import type { GameEvent } from "../src/engine";
import { play, room, studyJson as roomJson, texts } from "./helpers";

const failure = (events: GameEvent[]) => events.find((e) => e.type === "failure");

describe("engine: cameras", () => {
  it("starts on camera A and look describes it", () => {
    const { state, last } = play(["look"]);
    expect(state.camera).toBe("A");
    expect(texts(last)).toEqual([room.cameras.A.description]);
  });

  it("turn toggles between A and C", () => {
    expect(play(["turn"]).state.camera).toBe("C");
    expect(play(["turn", "turn"]).state.camera).toBe("A");
    const { last } = play(["turn", "look"]);
    expect(texts(last)).toEqual([room.cameras.C.description]);
  });

  it("restricts interactions to objects of the active camera", () => {
    expect(texts(play(["inspect clock"]).last)).toEqual(["A dusty wall clock.\nThe hands are stopped at 03:15."]);
    const fromC = play(["turn", "inspect clock"]).last;
    expect(texts(fromC)).toEqual(["Nothing special."]);
    expect(failure(fromC)).toMatchObject({ reason: "not_visible" });

    expect(failure(play(["inspect door"]).last)).toMatchObject({ reason: "not_visible" });
    expect(failure(play(["turn", "inspect door"]).last)).toBeUndefined();
  });
});

describe("engine: generic failures", () => {
  it("unknown objects give the generic message", () => {
    const inspect = play(["inspect painting"]).last;
    expect(texts(inspect)).toEqual(["Nothing special."]);
    expect(failure(inspect)).toMatchObject({ reason: "unknown_object" });

    const open = play(["open painting"]).last;
    expect(texts(open)).toEqual(["Nothing happens."]);
  });

  it("known objects without a matching rule give the generic message", () => {
    const open = play(["open clock"]).last;
    expect(texts(open)).toEqual(["Nothing happens."]);
    expect(failure(open)).toMatchObject({ reason: "no_interaction" });
  });

  it("wrong codes and wrong targets do nothing", () => {
    expect(texts(play(["use 1234 drawer"]).last)).toEqual(["Nothing happens."]);
    expect(texts(play(["use 0315 desk"]).last)).toEqual(["Nothing happens."]);
  });

  it("using an item you do not hold does nothing", () => {
    const { last } = play(["turn", "use key door"]);
    expect(texts(last)).toEqual(["Nothing happens."]);
    expect(failure(last)).toMatchObject({ reason: "item_not_held" });
  });

  it("rules whose conditions fail report conditions_unmet", () => {
    const { last } = play(["use 0315 drawer", "use 0315 drawer"]);
    expect(texts(last)).toEqual(["Nothing happens."]);
    expect(failure(last)).toMatchObject({ reason: "conditions_unmet" });
  });
});

describe("engine: state changes", () => {
  it("correct code sets a flag and adds the key", () => {
    const { state, last } = play(["use 0315 drawer"]);
    expect(state.flags.drawer_open).toBe(true);
    expect(state.inventory).toEqual(["brass_key"]);
    expect(last).toContainEqual({ type: "item_added", item: "brass_key", text: "[Brass key added to inventory]" });
  });

  it("preconditions change which rule applies", () => {
    expect(texts(play(["inspect desk"]).last)[0]).toContain("combination lock");
    expect(texts(play(["use 0315 drawer", "inspect desk"]).last)[0]).toContain("hangs open");
  });

  it("never duplicates unique items", () => {
    const { state } = play(["use 0315 drawer", "use 0315 drawer", "open drawer", "inspect drawer"]);
    expect(state.inventory).toEqual(["brass_key"]);
  });

  it("remove_item takes an item out of the inventory once", () => {
    const custom = validateRoom({
      ...roomJson,
      interactions: [
        { verb: "open", object: "desk", effects: [{ type: "add_item", item: "brass_key" }] },
        { verb: "inspect", object: "desk", effects: [{ type: "remove_item", item: "brass_key" }] },
      ],
    });
    let state = step(createInitialState(custom), { verb: "open", object: "desk" }, custom).state;
    const removed = step(state, { verb: "inspect", object: "desk" }, custom);
    expect(removed.state.inventory).toEqual([]);
    expect(removed.events).toEqual([
      { type: "item_removed", item: "brass_key", text: "[Brass key removed from inventory]" },
    ]);
    state = removed.state;
    expect(step(state, { verb: "inspect", object: "desk" }, custom).events).toEqual([]);
  });

  it("add_item of a held item is a silent no-op", () => {
    const custom = validateRoom({
      ...roomJson,
      interactions: [{ verb: "inspect", object: "desk", effects: [{ type: "add_item", item: "brass_key" }] }],
    });
    let state = createInitialState(custom);
    state = step(state, { verb: "inspect", object: "desk" }, custom).state;
    const second = step(state, { verb: "inspect", object: "desk" }, custom);
    expect(second.state.inventory).toEqual(["brass_key"]);
    expect(second.events).toEqual([]);
  });

  it("inventory lists items by name", () => {
    expect(texts(play(["inventory"]).last)).toEqual(["You are carrying nothing."]);
    expect(texts(play(["use 0315 drawer", "inventory"]).last)).toEqual(["- Brass key"]);
  });

  it("held items can be inspected from either camera", () => {
    expect(texts(play(["use 0315 drawer", "turn", "inspect key"]).last)).toEqual([
      "A small brass key, cold to the touch.",
    ]);
    expect(texts(play(["inspect key"]).last)).toEqual(["Nothing special."]);
  });
});

describe("engine: purity, determinism and reset", () => {
  it("step does not mutate the input state", () => {
    const initial = createInitialState(room);
    const snapshot = structuredClone(initial);
    step(initial, { verb: "use", item: "0315", target: "drawer" }, room);
    step(initial, { verb: "turn" }, room);
    expect(initial).toEqual(snapshot);
  });

  it("same commands produce the same states and events", () => {
    const lines = ["look", "inspect clock", "open drawer", "use 0315 drawer", "turn", "inspect bookshelf", "use key door"];
    expect(play(lines)).toEqual(play(lines));
  });

  it("reset returns a fresh initial state", () => {
    const { state } = play(["use 0315 drawer", "turn"]);
    const fresh = createInitialState(room);
    expect(fresh).toEqual({
      roomId: "study",
      camera: "A",
      inventory: [],
      flags: { drawer_open: false, door_unlocked: false },
      completed: false,
    });
    expect(state.inventory).toEqual(["brass_key"]);
    // A new game must not share flags with the room definition.
    fresh.flags.drawer_open = true;
    expect(createInitialState(room).flags.drawer_open).toBe(false);
  });

  it("change_room moves to the new room's first camera", () => {
    const custom = validateRoom({
      ...roomJson,
      interactions: [{ verb: "open", object: "door", effects: [{ type: "change_room", room: "hallway" }] }],
    });
    const turned = step(createInitialState(custom), { verb: "turn" }, custom).state;
    const { state, events } = step(turned, { verb: "open", object: "door" }, custom);
    expect(state).toMatchObject({ roomId: "hallway", camera: "A" });
    expect(events).toContainEqual({ type: "room_changed", room: "hallway" });
  });
});

describe("room validation", () => {
  it("accepts the study", () => {
    expect(() => validateRoom(roomJson)).not.toThrow();
  });

  it("reports every problem clearly", () => {
    const bad = {
      id: "",
      title: "Broken",
      cameras: { A: { image: "a.png", description: "x" } },
      objects: { desk: { name: "desk", cameras: ["B"] } },
      items: {},
      interactions: [
        { verb: "kick", object: "desk", effects: [] },
        { verb: "use", object: "ghost", effects: [{ type: "add_item", item: "nope" }, { type: "explode" }] },
        { verb: "inspect", object: "desk", conditions: [{ type: "has_item", item: "nope" }], effects: [] },
      ],
    };
    try {
      validateRoom(bad);
      expect.unreachable();
    } catch (e) {
      expect(e).toBeInstanceOf(RoomValidationError);
      const problems = (e as RoomValidationError).problems;
      expect(problems).toEqual(
        expect.arrayContaining([
          "id must be a non-empty string",
          "cameras.C is missing",
          'objects.desk.cameras must be a non-empty array of "A" and/or "C"',
          "interactions[0].verb must be one of inspect, open, use",
          'interactions[1].object "ghost" is not a known object',
          'interactions[1].item is required for "use"',
          'interactions[1].effects[0].item "nope" is not a known item',
          'interactions[1].effects[1].type "explode" is not a known effect',
          'interactions[2].conditions[0].item "nope" is not a known item',
        ]),
      );
    }
  });

  it("rejects names shared by two objects", () => {
    const clash = structuredClone(roomJson) as any;
    clash.objects.clock.aliases = ["desk"];
    expect(() => validateRoom(clash)).toThrow(/"desk" is used by both/);
  });

  it("rejects non-objects", () => {
    expect(() => validateRoom(null)).toThrow(RoomValidationError);
  });

  it("checks the game manifest and links between rooms", () => {
    const study = structuredClone(roomJson) as any;
    expect(() => validateGame({ title: "T", rooms: ["study"] }, [study])).toThrow(
      /changes to room "cellar", which the game does not list/,
    );
    expect(() => validateGame({ title: "T", rooms: ["study", "nowhere"] }, [study])).toThrow(
      /game lists room "nowhere" but no such room exists/,
    );
    expect(() => validateGame({ title: "T", rooms: ["study"] }, [study, study])).toThrow(/defined twice/);
    study.title = "";
    expect(() => validateGame({ title: "T", rooms: ["study"] }, [study])).toThrow(/room "study": title/);
  });
});
