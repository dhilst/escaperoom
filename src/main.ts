import "./ui/style.css";
import { loadGame } from "./content";
import { LANGUAGES, localeFromParam, type Language } from "./i18n";
import {
  buildAliasMap,
  createGameState,
  createInitialState,
  parse,
  stepGame,
  type AliasMap,
  type GameDefinition,
  type GameEvent,
  type GameState,
  type RoomDefinition,
} from "./engine";
import { Renderer, type LineKind } from "./ui/renderer";

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
    ui.setCompleted(state.completed);
  };

  /** Restart the current level, or the whole game once it has been won. */
  const restart = (fresh: GameState) => {
    state = fresh;
    ui.clearLog();
    ui.print(currentRoom().cameras[state.camera].description, "response");
    render();
    ui.focusInput();
  };

  const submit = (input: string) => {
    if (input.trim() === "") return;
    history.push(input);
    historyIndex = history.length;
    ui.print(input.trim(), "command");

    const parsed = parse(input, aliases, language.parser);
    if (!parsed.ok) {
      ui.print(parsed.error, "error");
      return;
    }
    const result = stepGame(state, parsed.command, game, language.engine);
    state = result.state;
    for (const event of result.events) {
      if ("text" in event) ui.print(event.text, lineKind(event));
    }
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

  ui.restartButton.addEventListener("click", () =>
    restart(state.completed ? createGameState(game) : createInitialState(currentRoom())),
  );
  restart(createGameState(game));
}

try {
  // The language is chosen with ?lang=en-US | pt-BR | es (default: en-US).
  const locale = localeFromParam(new URLSearchParams(location.search).get("lang"));
  start(loadGame(locale), LANGUAGES[locale]);
} catch (error) {
  ui.print(String(error instanceof Error ? error.message : error), "error");
  console.error(error);
}
