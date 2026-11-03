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
