import { nextSave, resumeGame, type GameDefinition, type GameState } from "./engine";

/** One save slot per browser. Bump the version if the save format changes incompatibly. */
const SAVE_KEY = "hollow-house/save/v1";

/** The last save written or read, so the next one can carry its finished rooms forward. */
let previous: unknown;

/**
 * Where to pick up, if this browser has played before (see resumeGame): the
 * exact spot, or the first level not yet finished. Storage can be unavailable
 * (private mode, blocked site data): then there's simply no save.
 */
export function loadSave(game: GameDefinition, now: number): GameState | undefined {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    const data: unknown = raw ? JSON.parse(raw) : undefined;
    const resumed = resumeGame(data, game, now);
    // Starting over after finishing everything begins a fresh record.
    previous = resumed ? { roomId: resumed.state.roomId, cleared: resumed.cleared } : undefined;
    return resumed?.state;
  } catch {
    return undefined;
  }
}

/**
 * Save after every command. A won game is kept, marked finished, so that
 * levels added later resume where the player left off.
 */
export function writeSave(state: GameState, game: GameDefinition): void {
  try {
    previous = nextSave(previous, state, game);
    localStorage.setItem(SAVE_KEY, JSON.stringify(previous));
  } catch {
    // Storage full or blocked: the game goes on without saving.
  }
}
