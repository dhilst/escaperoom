import { enUS } from "../i18n/locales/en-US";
import { createInitialState, step } from "./state";
import {
  HINT_UNLOCK_MS,
  type Command,
  type EngineMessages,
  type GameDefinition,
  type GameState,
  type RoomDefinition,
  type StepResult,
} from "./types";

/** `now` is the host clock (ms); the first level's hint timer starts there. */
export function createGameState(game: GameDefinition, now = 0): GameState {
  return createInitialState(game.rooms[game.order[0]], now);
}

/**
 * Start a level. Rooms are self-contained: the inventory is emptied and flags
 * are reset to the new room's initial values.
 */
export function enterRoom(state: GameState, room: RoomDefinition, now = 0): GameState {
  return { ...createInitialState(room, now), completed: state.completed };
}

/**
 * Like step(), but across a whole game: when a change_room effect fires, the
 * player is moved into the next room and a room_entered event describes it.
 */
export function stepGame(
  state: GameState,
  command: Command,
  game: GameDefinition,
  messages: EngineMessages = enUS.engine,
  now = 0,
  hintUnlockMs: readonly number[] = HINT_UNLOCK_MS,
): StepResult {
  // After winning, restart begins a new game from the first room.
  if (command.verb === "restart" && state.completed) {
    const first = game.rooms[game.order[0]];
    return {
      state: createGameState(game, now),
      events: [
        { type: "restarted", text: messages.restarted },
        { type: "room_entered", room: first.id, text: `— ${first.title} —\n${first.cameras.A.description}` },
      ],
    };
  }

  const room = game.rooms[state.roomId];
  if (!room) throw new Error(`Unknown room "${state.roomId}"`);

  const result = step(state, command, room, messages, now, hintUnlockMs);
  if (result.state.roomId === state.roomId) return result;

  const next = game.rooms[result.state.roomId];
  if (!next) throw new Error(`Unknown room "${result.state.roomId}"`);
  const entered = enterRoom(result.state, next, now);
  return {
    state: entered,
    events: [
      ...result.events,
      { type: "room_entered", room: next.id, text: `— ${next.title} —\n${next.cameras[entered.camera].description}` },
    ],
  };
}
