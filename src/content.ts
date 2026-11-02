import manifest from "../rooms/game.json";
import { RoomValidationError, validateGame, type GameDefinition } from "./engine";
import { LANGUAGES, localize, missingTranslations, type Locale } from "./i18n";

// Every rooms/<id>/room.json is bundled; rooms/game.json decides which are played and in what order.
const roomFiles = import.meta.glob<unknown>("../rooms/*/room.json", { eager: true, import: "default" });

/** Raw room files and manifest, with all translations. */
export const rawContent = { manifest: manifest as unknown, rooms: Object.values(roomFiles) };

const cache = new Map<Locale, GameDefinition>();

/** The game with every text resolved for `locale`, validated for that language's parser. */
export function loadGame(locale: Locale): GameDefinition {
  const cached = cache.get(locale);
  if (cached) return cached;

  const missing = [
    ...missingTranslations(rawContent.manifest, "game.json"),
    ...rawContent.rooms.flatMap((room, i) => {
      const id = (room as { id?: unknown }).id;
      return missingTranslations(room, `room "${typeof id === "string" ? id : i}"`);
    }),
  ];
  if (missing.length > 0) throw new RoomValidationError(missing);

  const game = validateGame(
    localize(rawContent.manifest, locale),
    rawContent.rooms.map((room) => localize(room, locale)),
    LANGUAGES[locale].parser,
  );
  cache.set(locale, game);
  return game;
}
