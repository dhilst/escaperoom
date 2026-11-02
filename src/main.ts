import "./ui/style.css";
import { loadGame } from "./content";
import { LANGUAGES, localeFromParam, type Language } from "./i18n";
import {
  buildAliasMap,
  createGameState,
  parse,
  stepGame,
  type AliasMap,
  type GameDefinition,
  type GameEvent,
  type GameState,
  type RoomDefinition,
} from "./engine";
import { Renderer, type LineKind, type SubtitleLine } from "./ui/renderer";

// Every image under rooms/<id>/ is bundled; room.json refers to them by file name.
const roomImages = import.meta.glob<string>("../rooms/*/*.{png,webp,jpg}", {
  eager: true,
  query: "?url",
  import: "default",
});

const ui = new Renderer();

function imageUrl(room: RoomDefinition, file: string): string {
  const url = roomImages[`../rooms/${room.id}/${file}`];
  if (!url) throw new Error(`Image "${file}" not found in rooms/${room.id}/`);
  return url;
}

function lineKind(event: GameEvent): LineKind {
  switch (event.type) {
    case "item_added":
    case "item_removed":
      return "item";
    case "room_entered":
    case "game_completed":
      return "success";
    case "hint_revealed":
      return "hint";
    default:
      return "response";
  }
}

function start(game: GameDefinition, language: Language): void {
  ui.setLanguage(language.locale, language.ui);
  const history: string[] = [];
  let historyIndex = 0;
  let state: GameState;
  let aliases: AliasMap;
  let aliasesFor = "";

  const currentRoom = () => game.rooms[state.roomId];

  const render = () => {
    const room = currentRoom();
    if (aliasesFor !== room.id) {
      aliases = buildAliasMap(room, language.parser);
      aliasesFor = room.id;
    }
    const camera = room.cameras[state.camera];
    ui.setTitle(game.title, room.title, game.order.indexOf(room.id) + 1, game.order.length);
    ui.showCamera(state.camera, imageUrl(room, camera.image), camera.description);
    ui.setInventory(state.inventory.map((id) => room.items[id]?.name ?? id));
    const hints = room.hints ?? [];
    ui.setHints(
      state.hints.map((i) => ({ number: i + 1, text: hints[i].text })),
      hints.length,
    );
    ui.setCompleted(state.completed);
  };

  const submit = (input: string) => {
    if (input.trim() === "") return;
    history.push(input);
    historyIndex = history.length;

    const parsed = parse(input, aliases, language.parser);
    if (!parsed.ok) {
      ui.say([{ text: parsed.error, kind: "error" }]);
      return;
    }
    const result = stepGame(state, parsed.command, game, language.engine);
    state = result.state;
    // Everything one command produced becomes a single subtitle.
    const lines: SubtitleLine[] = result.events.flatMap((event) =>
      "text" in event ? [{ text: event.text, kind: lineKind(event) }] : [],
    );
    ui.say(lines);
    render();
  };

  ui.form.addEventListener("submit", (e) => {
    e.preventDefault();
    submit(ui.input.value);
    ui.input.value = "";
    ui.focusInput();
  });

  // Up/Down recall previous commands.
  ui.input.addEventListener("keydown", (e) => {
    if (e.key !== "ArrowUp" && e.key !== "ArrowDown") return;
    e.preventDefault();
    historyIndex = Math.max(0, Math.min(history.length, historyIndex + (e.key === "ArrowUp" ? -1 : 1)));
    ui.input.value = history[historyIndex] ?? "";
  });

  state = createGameState(game);
  ui.say([{ text: currentRoom().cameras[state.camera].description, kind: "response" }]);
  render();
  ui.focusInput();
}

try {
  // The language is chosen with ?lang=en-US | pt-BR | es (default: en-US).
  const locale = localeFromParam(new URLSearchParams(location.search).get("lang"));
  start(loadGame(locale), LANGUAGES[locale]);
} catch (error) {
  ui.say([{ text: String(error instanceof Error ? error.message : error), kind: "error" }]);
  console.error(error);
}
