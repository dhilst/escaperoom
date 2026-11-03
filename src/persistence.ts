import { restoreState, type GameDefinition, type GameState } from "./engine";

/** One save slot per browser. Bump the version if the save format changes incompatibly. */
const SAVE_KEY = "hollow-house/save/v1";

/**
 * The saved game, if there is one and it still fits the current rooms.
 * Storage can be unavailable (private mode, blocked site data): then there's
 * simply no save.
 */
export function loadSave(game: GameDefinition): GameState | undefined {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    return raw ? restoreState(JSON.parse(raw), game) : undefined;
  } catch {
    return undefined;
  }
}

/** Save after every command. A won game clears the save, so the next visit starts over. */
export function writeSave(state: GameState): void {
  try {
    if (state.completed) localStorage.removeItem(SAVE_KEY);
    else localStorage.setItem(SAVE_KEY, JSON.stringify(state));
  } catch {
    // Storage full or blocked: the game goes on without saving.
  }
}
