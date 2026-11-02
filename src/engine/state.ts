import { enUS } from "../i18n/locales/en-US";
import { applyEffect, checkCondition, matchingInteractions } from "./rules";
import type {
  Command,
  EngineMessages,
  FailureReason,
  GameEvent,
  GameState,
  RoomDefinition,
  StepResult,
} from "./types";

export function createInitialState(room: RoomDefinition): GameState {
  return {
    roomId: room.id,
    camera: "A",
    inventory: [],
    flags: { ...room.initialFlags },
    completed: false,
    hints: [],
  };
}

function cloneState(state: GameState): GameState {
  return { ...state, inventory: [...state.inventory], flags: { ...state.flags }, hints: [...state.hints] };
}

/** The next hint to reveal: the first one not yet shown whose step isn't already done. */
export function nextHint(state: GameState, room: RoomDefinition): number | undefined {
  const index = (room.hints ?? []).findIndex(
    (hint, i) =>
      !state.hints.includes(i) && !(hint.skipIf?.length && hint.skipIf.every((c) => checkCondition(state, c))),
  );
  return index < 0 ? undefined : index;
}

/**
 * Pure, deterministic transition function. Never mutates `state`.
 * `messages` only changes the wording of the engine's own responses.
 */
export function step(
  state: GameState,
  command: Command,
  room: RoomDefinition,
  messages: EngineMessages = enUS.engine,
): StepResult {
  const next = cloneState(state);
  const events = run(next, command, room, messages);
  return { state: next, events };
}

function run(state: GameState, command: Command, room: RoomDefinition, messages: EngineMessages): GameEvent[] {
  if (command.verb === "restart") {
    // Restart the level. Hints already revealed here are kept.
    Object.assign(state, createInitialState(room), { hints: state.hints });
    return [
      { type: "restarted", text: messages.restarted },
      { type: "message", text: room.cameras[state.camera].description },
    ];
  }

  if (state.completed) {
    return [{ type: "message", text: messages.alreadyEscaped }];
  }

  switch (command.verb) {
    case "look":
      return [{ type: "message", text: room.cameras[state.camera].description }];

    case "turn": {
      state.camera = state.camera === "A" ? "C" : "A";
      return [
        { type: "camera_changed", camera: state.camera, text: messages.turned },
        { type: "message", text: room.cameras[state.camera].description },
      ];
    }

    case "inventory": {
      const names = state.inventory.map((id) => `- ${room.items[id]?.name ?? id}`);
      const text = names.length > 0 ? names.join("\n") : messages.emptyInventory;
      return [{ type: "inventory", items: [...state.inventory], text }];
    }

    case "hint": {
      const hints = room.hints ?? [];
      const next = nextHint(state, room);
      if (next === undefined) return [{ type: "message", text: messages.noMoreHints }];
      state.hints.push(next);
      return [{ type: "hint_revealed", hint: next, text: messages.hint(next + 1, hints.length, hints[next].text) }];
    }

    case "inspect":
    case "open":
    case "use":
      return interact(state, command, room, messages);
  }
}

function interact(
  state: GameState,
  command: Extract<Command, { verb: "inspect" | "open" | "use" }>,
  room: RoomDefinition,
  messages: EngineMessages,
): GameEvent[] {
  const targetId = command.verb === "use" ? command.target : command.object;
  const said = () => command.typed ?? room.objects[targetId]?.name ?? room.items[targetId]?.name ?? targetId;

  const fail = (reason: FailureReason): GameEvent[] => {
    const text =
      reason === "unknown_object"
        ? messages.noSuchObject(said())
        : reason === "not_visible"
          ? messages.notVisible(said())
          : command.verb === "inspect"
            ? messages.nothingSpecial
            : messages.nothingHappens;
    return [{ type: "failure", reason, text }];
  };

  // Carried items can be inspected from anywhere.
  if (command.verb === "inspect" && state.inventory.includes(targetId)) {
    const description = room.items[targetId]?.description;
    return description ? [{ type: "message", text: description }] : fail("no_interaction");
  }

  const target = room.objects[targetId];
  // An item that exists in this room but isn't carried is "not here", not unknown.
  if (!target) return fail(targetId in room.items ? "not_visible" : "unknown_object");
  if (!target.cameras.includes(state.camera)) return fail("not_visible");

  // Real items must be held to be used; anything else is treated as a literal code.
  if (command.verb === "use" && command.item in room.items && !state.inventory.includes(command.item)) {
    return fail("item_not_held");
  }

  const candidates = matchingInteractions(room, command);
  if (candidates.length === 0) return fail("no_interaction");

  const rule = candidates.find((r) => (r.conditions ?? []).every((c) => checkCondition(state, c)));
  if (!rule) return fail("conditions_unmet");

  return rule.effects.flatMap((effect) => applyEffect(state, effect, room, messages));
}
