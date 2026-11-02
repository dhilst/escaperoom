import { createInitialState, step } from "./state";
import type { Command, GameDefinition, GameState, RoomDefinition, StepResult } from "./types";

export function createGameState(game: GameDefinition): GameState {
  return createInitialState(game.rooms[game.order[0]]);
}

/**
 * Start a level. Rooms are self-contained: the inventory is emptied and flags
 * are reset to the new room's initial values.
 */
export function enterRoom(state: GameState, room: RoomDefinition): GameState {
  return { ...createInitialState(room), completed: state.completed };
}

/**
 * Like step(), but across a whole game: when a change_room effect fires, the
 * player is moved into the next room and a room_entered event describes it.
 */
export function stepGame(state: GameState, command: Command, game: GameDefinition): StepResult {
  const room = game.rooms[state.roomId];
  if (!room) throw new Error(`Unknown room "${state.roomId}"`);

  const result = step(state, command, room);
  if (result.state.roomId === state.roomId) return result;

  const next = game.rooms[result.state.roomId];
  if (!next) throw new Error(`Unknown room "${result.state.roomId}"`);
  const entered = enterRoom(result.state, next);
  return {
    state: entered,
    events: [
      ...result.events,
      { type: "room_entered", room: next.id, text: `— ${next.title} —\n${next.cameras[entered.camera].description}` },
    ],
  };
}
