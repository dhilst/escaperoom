import manifest from "../rooms/game.json";
import { validateGame, type GameDefinition } from "./engine";

// Every rooms/<id>/room.json is bundled; rooms/game.json decides which are played and in what order.
const roomFiles = import.meta.glob<unknown>("../rooms/*/room.json", { eager: true, import: "default" });

export function loadGame(): GameDefinition {
  return validateGame(manifest, Object.values(roomFiles));
}
