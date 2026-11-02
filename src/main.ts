import "./ui/style.css";
import { loadGame } from "./content";
import { LANGUAGES, localeFromParam, type Language } from "./i18n";
import {
  buildVocabulary,
  createGameState,
  createInitialState,
  describeCamera,
  formatCountdown,
  HINT_UNLOCK_MS,
  parse,
  roomBrightness,
  stepGame,
  type Vocabulary,
  type GameDefinition,
  type GameEvent,
  type GameState,
  type RoomDefinition,
} from "./engine";
import { HELP_HOLD_MS, Renderer, wpmFromParam, type LineKind, type SubtitleLine } from "./ui/renderer";

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
  let aliases: Vocabulary;
  let aliasesFor = "";

  const currentRoom = () => game.rooms[state.roomId];
  /** "Next hint available in HH:MM:SS", recomputed so the seconds tick down on screen. */
  const countdown = (availableAt: number) =>
    language.engine.hintLocked(formatCountdown(availableAt - Date.now()));

  const render = () => {
    const room = currentRoom();
    if (aliasesFor !== room.id) {
      aliases = buildVocabulary(room, language.parser);
      aliasesFor = room.id;
    }
    const camera = room.cameras[state.camera];
    ui.setTitle(game.title, room.title, game.order.indexOf(room.id) + 1, game.order.length);
    ui.showCamera(state.camera, imageUrl(room, camera.image), describeCamera(state, room));
    ui.setBrightness(room.id, roomBrightness(state, room));
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
    const result = stepGame(state, parsed.command, game, language.engine, Date.now(), hintUnlockMs);
    state = result.state;
    // Everything one command produced becomes a single subtitle.
    const lines: SubtitleLine[] = result.events.flatMap((event) =>
      event.type === "hint_locked"
        ? [{ text: event.text, kind: "hint", live: () => countdown(event.availableAt) }]
        : "text" in event
          ? [{ text: event.text, kind: lineKind(event) }]
          : [],
    );
    const isHelp = parsed.command.words.length === 1 && parsed.command.words[0] === "help";
    ui.say(lines, isHelp ? HELP_HOLD_MS : undefined);
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

  state = startState(game);
  ui.say([
    { text: describeCamera(state, currentRoom()), kind: "response" },
    { text: language.ui.helpTip, kind: "hint" },
  ]);
  render();
  ui.focusInput();
}

const params = new URLSearchParams(location.search);

// ?wpm=N sets the subtitle typing speed in words per minute (works everywhere, production included).
ui.setTypingSpeed(wpmFromParam(params.get("wpm")));

// Testing aid, dev server only: ?hintTimer=off unlocks every hint immediately.
// import.meta.env.DEV is false in production builds, so the published game ignores it.
/**
 * Testing aid, dev server only: ?room=N starts at level N (1-based; a room id
 * such as ?room=cellar works too). Production builds ignore it.
 */
function startState(game: GameDefinition): GameState {
  const wanted = import.meta.env.DEV ? params.get("room") : null;
  const roomId = wanted && (game.order[Number(wanted) - 1] ?? (wanted in game.rooms ? wanted : undefined));
  return roomId ? createInitialState(game.rooms[roomId], Date.now()) : createGameState(game, Date.now());
}

const hintUnlockMs =
  import.meta.env.DEV && params.get("hintTimer") === "off" ? HINT_UNLOCK_MS.map(() => 0) : HINT_UNLOCK_MS;

try {
  // The language is chosen with ?lang=en-US | pt-BR | es (default: en-US).
  const locale = localeFromParam(params.get("lang"));
  start(loadGame(locale), LANGUAGES[locale]);
} catch (error) {
  ui.say([{ text: String(error instanceof Error ? error.message : error), kind: "error" }]);
  console.error(error);
}
