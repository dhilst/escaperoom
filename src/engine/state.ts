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
  };
}

function cloneState(state: GameState): GameState {
  return { ...state, inventory: [...state.inventory], flags: { ...state.flags } };
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
  const fail = (reason: FailureReason): GameEvent[] => [
    { type: "failure", reason, text: command.verb === "inspect" ? messages.nothingSpecial : messages.nothingHappens },
  ];

  const targetId = command.verb === "use" ? command.target : command.object;

  // Carried items can be inspected from anywhere.
  if (command.verb === "inspect" && state.inventory.includes(targetId)) {
    const description = room.items[targetId]?.description;
    return description ? [{ type: "message", text: description }] : fail("no_interaction");
  }

  const target = room.objects[targetId];
  if (!target) return fail("unknown_object");
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
