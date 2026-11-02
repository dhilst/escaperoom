import { enUS } from "../i18n/locales/en-US";
import { applyEffect, checkCondition } from "./rules";
import type {
  Command,
  EngineMessages,
  FailureReason,
  GameEvent,
  GameState,
  RoomDefinition,
  StepResult,
} from "./types";
import { GLOBAL_WORDS, HINT_UNLOCK_MS } from "./types";

/** `now` is the host clock (ms); the level's hint timer starts there. */
export function createInitialState(room: RoomDefinition, now = 0): GameState {
  return {
    roomId: room.id,
    camera: "A",
    inventory: [],
    flags: { ...room.initialFlags },
    completed: false,
    hints: [],
    levelStartedAt: now,
  };
}

/** The camera's description for the current state (first matching variant, else the default). */
export function describeCamera(state: GameState, room: RoomDefinition, camera = state.camera): string {
  const def = room.cameras[camera];
  const variant = def.variants?.find((v) => v.when.every((c) => checkCondition(state, c)));
  return variant?.description ?? def.description;
}

/** How bright the room is drawn in the current state (first matching lighting rule, else `brightness`). */
export function roomBrightness(state: GameState, room: RoomDefinition): number {
  const rule = room.lighting?.find((r) => r.when.every((c) => checkCondition(state, c)));
  return rule?.brightness ?? room.brightness ?? 1;
}

/** Format a duration as HH:MM:SS, rounding up to whole seconds. */
export function formatCountdown(ms: number): string {
  const total = Math.max(0, Math.ceil(ms / 1000));
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${pad(Math.floor(total / 3600))}:${pad(Math.floor(total / 60) % 60)}:${pad(total % 60)}`;
}

/** When the next hint of the current level unlocks (host clock, ms). */
export function hintAvailableAt(state: GameState, schedule: readonly number[] = HINT_UNLOCK_MS): number {
  return state.levelStartedAt + schedule[Math.min(state.hints.length, schedule.length - 1)];
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
 * `messages` only changes the wording of the engine's own responses. `now` is
 * the host clock (ms), used only for hint unlock times; the same state,
 * command and `now` always give the same result. `hintUnlockMs` replaces the
 * unlock schedule (e.g. all zeros to test without waiting).
 */
export function step(
  state: GameState,
  command: Command,
  room: RoomDefinition,
  messages: EngineMessages = enUS.engine,
  now = 0,
  hintUnlockMs: readonly number[] = HINT_UNLOCK_MS,
): StepResult {
  const next = cloneState(state);
  const events = run(next, command, room, messages, now, hintUnlockMs);
  return { state: next, events };
}

function run(
  state: GameState,
  command: Command,
  room: RoomDefinition,
  messages: EngineMessages,
  now: number,
  hintUnlockMs: readonly number[],
): GameEvent[] {
  if (state.completed) {
    return [{ type: "message", text: messages.alreadyEscaped }];
  }

  const [word] = command.words;
  if (command.words.length === 1) {
    switch (word) {
      case "look":
        return [{ type: "message", text: describeCamera(state, room) }];

      case "help":
        return [{ type: "message", text: messages.help }];

      case "turn": {
        state.camera = state.camera === "A" ? "C" : "A";
        return [
          { type: "camera_changed", camera: state.camera, text: messages.turned },
          { type: "message", text: describeCamera(state, room) },
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
        const availableAt = hintAvailableAt(state, hintUnlockMs);
        if (now < availableAt) {
          return [{ type: "hint_locked", availableAt, text: messages.hintLocked(formatCountdown(availableAt - now)) }];
        }
        state.hints.push(next);
        return [{ type: "hint_revealed", hint: next, text: messages.hint(next + 1, hints.length, hints[next].text) }];
      }
    }
  }

  return say(state, command, room, messages);
}

/**
 * Match a phrase against the room's rules.
 *
 * Single words are safe to try: an object is looked at, a carried item is
 * described, and unknown or out-of-view names say so. Longer phrases either
 * match a rule exactly or get the same "Nothing happens." whatever was wrong
 * with them, so a failed attempt never reveals which words were right.
 */
function say(state: GameState, command: Command, room: RoomDefinition, messages: EngineMessages): GameEvent[] {
  const { words } = command;
  const single = words.length === 1;
  const target = words[words.length - 1];
  const said = (i: number) =>
    command.typed?.[i] ?? room.objects[words[i]]?.name ?? room.items[words[i]]?.name ?? words[i];

  const fail = (reason: FailureReason): GameEvent[] => {
    const looking = single && (target in room.objects || target in room.items);
    const text = !single
      ? messages.nothingHappens
      : reason === "unknown_object"
        ? messages.noSuchObject(said(0))
        : reason === "not_visible"
          ? messages.notVisible(said(0))
          : looking
            ? messages.nothingSpecial
            : messages.nothingHappens;
    return [{ type: "failure", reason, text }];
  };

  const isKnown = (w: string) =>
    w in room.objects || w in room.items || (room.verbs !== undefined && w in room.verbs) || isGlobalWord(w);
  const carried = (w: string) => state.inventory.includes(w);

  // The target must be visible from this camera, or be a carried item.
  if (target in room.objects) {
    if (!room.objects[target].cameras.includes(state.camera)) return fail("not_visible");
  } else if (target in room.items) {
    if (!carried(target)) return fail("not_visible");
  } else if (single && !isKnown(target)) {
    return fail("unknown_object");
  }
  // Every item in the phrase must be carried.
  if (words.some((w) => w in room.items && !carried(w))) return fail("item_not_held");

  const candidates = room.interactions.filter(
    (rule) => rule.say.length === words.length && rule.say.every((w, i) => w === words[i]),
  );
  if (candidates.length === 0) {
    // A carried item on its own describes itself unless a rule says otherwise.
    const description = single ? room.items[target]?.description : undefined;
    return description ? [{ type: "message", text: description }] : fail("no_interaction");
  }

  const rule = candidates.find((r) => (r.conditions ?? []).every((c) => checkCondition(state, c)));
  if (!rule) return fail("conditions_unmet");

  return rule.effects.flatMap((effect) => applyEffect(state, effect, room, messages));
}

const GLOBALS = new Set<string>(GLOBAL_WORDS);
const isGlobalWord = (w: string) => GLOBALS.has(w);
