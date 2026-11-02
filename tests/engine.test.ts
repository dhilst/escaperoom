import { describe, expect, it } from "vitest";
import {
  buildVocabulary,
  createInitialState,
  parse,
  RoomValidationError,
  step,
  validateGame,
  validateRoom,
} from "../src/engine";
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
    expect(texts(play(["clock"]).last)[0]).toBe("A dusty wall clock.\nThe hands are stopped at 03:15.");
    const fromC = play(["turn", "clock"]).last;
    expect(texts(fromC)).toEqual(["You don't see any clock here."]);
    expect(failure(fromC)).toMatchObject({ reason: "not_visible" });

    expect(failure(play(["door"]).last)).toMatchObject({ reason: "not_visible" });
    expect(failure(play(["turn", "door"]).last)).toBeUndefined();
  });
});

describe("engine: generic failures", () => {
  it("a single unknown word is reported explicitly, in the player's words", () => {
    const inspect = play(["painting"]).last;
    expect(texts(inspect)).toEqual(["There is no such painting."]);
    expect(failure(inspect)).toMatchObject({ reason: "unknown_object" });
  });

  it("a single word for something on the other camera is reported as not here", () => {
    const { last } = play(["door"]);
    expect(texts(last)).toEqual(["You don't see any door here."]);
    expect(failure(last)).toMatchObject({ reason: "not_visible" });
  });

  it("a failed phrase of several words never says which word was wrong", () => {
    for (const line of ["open old painting", "key painting", "open door", "key door", "open clock", "0315 desk"]) {
      expect(texts(play([line]).last), line).toEqual(["Nothing happens."]);
    }
    expect(failure(play(["open door"]).last)).toMatchObject({ reason: "not_visible" });
  });

  it("verbs that no longer exist are just unknown words", () => {
    expect(texts(play(["inspect clock"]).last)).toEqual(["Nothing happens."]);
    expect(texts(play(["use key door"]).last)).toEqual(["Nothing happens."]);
  });

  it("wrong codes and items stay vague", () => {
    expect(texts(play(["9999 drawer"]).last)).toEqual(["Nothing happens."]);
    expect(texts(play(["banana drawer"]).last)).toEqual(["Nothing happens."]);
  });

  it("known objects without a matching rule give the generic message", () => {
    const open = play(["open clock"]).last;
    expect(texts(open)).toEqual(["Nothing happens."]);
    expect(failure(open)).toMatchObject({ reason: "no_interaction" });
  });

  it("wrong codes and wrong targets do nothing", () => {
    expect(texts(play(["1234 drawer"]).last)).toEqual(["Nothing happens."]);
    expect(texts(play(["0315 desk"]).last)).toEqual(["Nothing happens."]);
  });

  it("using an item you do not hold does nothing", () => {
    const { last } = play(["turn", "key door"]);
    expect(texts(last)).toEqual(["Nothing happens."]);
    expect(failure(last)).toMatchObject({ reason: "item_not_held" });
  });

  it("rules whose conditions fail report conditions_unmet", () => {
    const { last } = play(["0315 drawer", "0315 drawer"]);
    expect(texts(last)).toEqual(["Nothing happens."]);
    expect(failure(last)).toMatchObject({ reason: "conditions_unmet" });
  });
});

describe("engine: state changes", () => {
  it("correct code sets a flag and adds the key", () => {
    const { state, last } = play(["0315 drawer"]);
    expect(state.flags.drawer_open).toBe(true);
    expect(state.inventory).toEqual(["brass_key"]);
    expect(last).toContainEqual({ type: "item_added", item: "brass_key", text: "[Brass key added to inventory]" });
  });

  it("preconditions change which rule applies", () => {
    expect(texts(play(["desk"]).last)[0]).toContain("combination lock");
    expect(texts(play(["0315 drawer", "desk"]).last)[0]).toContain("hangs open");
  });

  it("never duplicates unique items", () => {
    const { state } = play(["0315 drawer", "0315 drawer", "open drawer", "drawer"]);
    expect(state.inventory).toEqual(["brass_key"]);
  });

  it("remove_item takes an item out of the inventory once", () => {
    const custom = validateRoom({
      ...roomJson,
      interactions: [
        { say: ["open", "desk"], effects: [{ type: "add_item", item: "brass_key" }] },
        { say: ["desk"], effects: [{ type: "remove_item", item: "brass_key" }] },
      ],
    });
    let state = step(createInitialState(custom), { words: ["open", "desk"] }, custom).state;
    const removed = step(state, { words: ["desk"] }, custom);
    expect(removed.state.inventory).toEqual([]);
    expect(removed.events).toEqual([
      { type: "item_removed", item: "brass_key", text: "[Brass key removed from inventory]" },
    ]);
    state = removed.state;
    expect(step(state, { words: ["desk"] }, custom).events).toEqual([]);
  });

  it("add_item of a held item is a silent no-op", () => {
    const custom = validateRoom({
      ...roomJson,
      interactions: [{ say: ["desk"], effects: [{ type: "add_item", item: "brass_key" }] }],
    });
    let state = createInitialState(custom);
    state = step(state, { words: ["desk"] }, custom).state;
    const second = step(state, { words: ["desk"] }, custom);
    expect(second.state.inventory).toEqual(["brass_key"]);
    expect(second.events).toEqual([]);
  });

  it("inventory lists items by name", () => {
    expect(texts(play(["inventory"]).last)).toEqual(["You are carrying nothing."]);
    expect(texts(play(["0315 drawer", "inventory"]).last)).toEqual(["- Brass key"]);
  });

  it("held items can be inspected from either camera", () => {
    expect(texts(play(["0315 drawer", "turn", "key"]).last)).toEqual([
      "A small brass key, cold to the touch.",
    ]);
    expect(texts(play(["key"]).last)).toEqual(["You don't see any key here."]);
  });
});

describe("engine: purity, determinism and reset", () => {
  it("step does not mutate the input state", () => {
    const initial = createInitialState(room);
    const snapshot = structuredClone(initial);
    step(initial, { words: ["0315", "drawer"] }, room);
    step(initial, { words: ["turn"] }, room);
    expect(initial).toEqual(snapshot);
  });

  it("same commands produce the same states and events", () => {
    const lines = ["look", "clock", "open drawer", "0315 drawer", "turn", "bookshelf", "key door"];
    expect(play(lines)).toEqual(play(lines));
  });

  it("reset returns a fresh initial state", () => {
    const { state } = play(["0315 drawer", "turn"]);
    const fresh = createInitialState(room);
    expect(fresh).toEqual({
      roomId: "study",
      camera: "A",
      inventory: [],
      flags: { drawer_open: false, door_unlocked: false },
      completed: false,
      hints: [],
      levelStartedAt: 0,
    });
    expect(state.inventory).toEqual(["brass_key"]);
    // A new game must not share flags with the room definition.
    fresh.flags.drawer_open = true;
    expect(createInitialState(room).flags.drawer_open).toBe(false);
  });

  it("change_room moves to the new room's first camera", () => {
    const custom = validateRoom({
      ...roomJson,
      interactions: [{ say: ["open", "door"], effects: [{ type: "change_room", room: "hallway" }] }],
    });
    const turned = step(createInitialState(custom), { words: ["turn"] }, custom).state;
    const { state, events } = step(turned, { words: ["open", "door"] }, custom);
    expect(state).toMatchObject({ roomId: "hallway", camera: "A" });
    expect(events).toContainEqual({ type: "room_changed", room: "hallway" });
  });
});

describe("room verbs", () => {
  // A room can add its own words; here "pray" and a three-word phrase.
  const chapelish = () =>
    validateRoom({
      ...roomJson,
      verbs: { pray: { name: "pray", aliases: ["kneel"] } },
      interactions: [
        ...roomJson.interactions,
        { say: ["pray", "desk"], effects: [{ type: "display_message", text: "You pray at the desk." }] },
        { say: ["pray", "pray", "desk"], effects: [{ type: "set_flag", flag: "devout", value: true }] },
      ],
    });

  it("work in phrases, including longer ones", () => {
    const room = chapelish();
    const aliases = buildVocabulary(room);
    const run = (line: string, state = createInitialState(room)) => {
      const parsed = parse(line, aliases);
      if (!parsed.ok) throw new Error(parsed.error);
      return step(state, parsed.command, room);
    };
    expect(texts(run("pray desk").events)).toEqual(["You pray at the desk."]);
    expect(texts(run("kneel desk").events)).toEqual(["You pray at the desk."]);
    expect(run("pray pray desk").state.flags.devout).toBe(true);
    expect(texts(run("pray").events)).toEqual(["Nothing happens."]);
    expect(texts(run("desk pray").events)).toEqual(["Nothing happens."]);
  });

  it("must not clash with other words", () => {
    expect(() => validateRoom({ ...roomJson, verbs: { look: { name: "turn" } } })).toThrow(/"turn" means both/);
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
        { say: [], effects: [] },
        { say: ["ghost"], effects: [{ type: "add_item", item: "nope" }, { type: "explode" }] },
        { say: ["desk"], conditions: [{ type: "has_item", item: "nope" }], effects: [] },
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
          "interactions[0].say must be a non-empty array of words",
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
    expect(() => validateRoom(clash)).toThrow(/"desk" means both objects\.clock and objects\.desk|"desk" means both objects\.desk and objects\.clock/);
  });

  it("rejects room words that clash with global words", () => {
    const clash = structuredClone(roomJson) as any;
    clash.objects.clock.aliases = ["turn"];
    expect(() => validateRoom(clash)).toThrow(/"turn" means both global word and objects\.clock/);
  });

  it("rejects phrases that can't be typed", () => {
    const bad = structuredClone(roomJson) as any;
    bad.interactions.push({ say: ["Clock"], effects: [] }); // ids are lowercase; "Clock" would be a literal
    expect(() => validateRoom(bad)).toThrow(/say \["Clock"\] can't be typed/);
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
