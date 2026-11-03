import { createInitialState } from "./state";
import type { CameraId, FlagValue, GameDefinition, GameState } from "./types";

/**
 * Rebuild a GameState from saved data (e.g. JSON from localStorage), or
 * return undefined when it doesn't fit the current game: unknown room or
 * items, wrong types, out-of-range hints. Rooms may change between versions,
 * so a save is only trusted after this check. A finished game is not
 * restored: the next visit starts a new one.
 */
export function restoreState(data: unknown, game: GameDefinition): GameState | undefined {
  if (typeof data !== "object" || data === null || Array.isArray(data)) return undefined;
  const s = data as Record<string, unknown>;

  const room = typeof s.roomId === "string" ? game.rooms[s.roomId] : undefined;
  if (!room || !game.order.includes(room.id)) return undefined;
  if (s.camera !== "A" && s.camera !== "C") return undefined;
  if (s.completed !== false) return undefined;
  if (typeof s.levelStartedAt !== "number" || !Number.isFinite(s.levelStartedAt)) return undefined;

  const inventory = s.inventory;
  if (!Array.isArray(inventory) || !inventory.every((id) => typeof id === "string" && id in room.items)) {
    return undefined;
  }
  if (new Set(inventory).size !== inventory.length) return undefined;

  const flags = s.flags;
  if (typeof flags !== "object" || flags === null || Array.isArray(flags)) return undefined;
  if (!Object.values(flags).every((v) => ["boolean", "string", "number"].includes(typeof v))) return undefined;

  const hints = s.hints;
  const hintCount = room.hints?.length ?? 0;
  if (
    !Array.isArray(hints) ||
    !hints.every((i) => Number.isInteger(i) && i >= 0 && i < hintCount) ||
    new Set(hints).size !== hints.length
  ) {
    return undefined;
  }

  return {
    roomId: room.id,
    camera: s.camera as CameraId,
    inventory: [...(inventory as string[])],
    // Flags added to the room since the save start at their initial values.
    flags: { ...room.initialFlags, ...(flags as Record<string, FlagValue>) },
    completed: false,
    hints: [...(hints as number[])],
    levelStartedAt: s.levelStartedAt,
  };
}

/** What is stored: the game state plus the rooms the player has finished. */
export type SaveData = GameState & { cleared: string[] };

const isRecord = (v: unknown): v is Record<string, unknown> => typeof v === "object" && v !== null && !Array.isArray(v);

/**
 * The rooms a save has finished. Saves from before `cleared` existed count
 * every room before their current one (in today's level order).
 */
export function clearedRooms(data: unknown, game: GameDefinition): string[] {
  if (!isRecord(data)) return [];
  if (Array.isArray(data.cleared)) return data.cleared.filter((id): id is string => typeof id === "string");
  const index = typeof data.roomId === "string" ? game.order.indexOf(data.roomId) : -1;
  return index > 0 ? game.order.slice(0, index) : [];
}

/** The save to write after `state`, carrying over what the previous save had finished. */
export function nextSave(previous: unknown, state: GameState, game: GameDefinition): SaveData {
  const cleared = new Set(clearedRooms(previous, game));
  const before = isRecord(previous) ? previous.roomId : undefined;
  if (typeof before === "string" && before !== state.roomId) cleared.add(before);
  if (state.completed) cleared.add(state.roomId);
  return { ...state, cleared: [...cleared] };
}

/**
 * Where a returning player picks up. A save that still fits resumes exactly.
 * A finished game, or one whose room is gone, goes on at the first room not
 * yet finished, so levels added since are waiting for the player. A save
 * whose room changed shape restarts that room. With nothing left to play,
 * or nothing usable saved, it's undefined: a new game.
 */
export function resumeGame(
  data: unknown,
  game: GameDefinition,
  now = 0,
): { state: GameState; cleared: string[] } | undefined {
  if (!isRecord(data)) return undefined;
  const cleared = clearedRooms(data, game);
  const exact = restoreState(data, game);
  if (exact) return { state: exact, cleared };
  const roomId = typeof data.roomId === "string" ? data.roomId : undefined;
  const room = roomId !== undefined && game.order.includes(roomId) ? game.rooms[roomId] : undefined;
  if (room && data.completed === false) return { state: createInitialState(room, now), cleared };
  const next = game.order.find((id) => !cleared.includes(id));
  return next ? { state: createInitialState(game.rooms[next], now), cleared } : undefined;
}
